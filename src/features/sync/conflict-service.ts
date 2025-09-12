import { 
  ConflictData, 
  ConflictResolution, 
  ConflictNotification,
  ConflictResolutionPreferences,
  ConflictAuditLog,
  ContentDiff
} from '../data/schemas/conflict';
import { firestoreService } from '../data/firestore-service';
import { versionManager } from './version-manager';
import { conflictDetector } from './conflict-detector';
import { noteService } from '../../services/notebookService';

export class ConflictService {
  private resolutionPreferences: Map<string, ConflictResolutionPreferences> = new Map();
  private auditLogs: ConflictAuditLog[] = [];
  private notifications: Map<string, ConflictNotification[]> = new Map();

  /**
   * Resolve a conflict using the specified method
   */
  async resolveConflict(
    conflictId: string, 
    resolution: ConflictResolution
  ): Promise<ConflictData> {
    try {
      // Get the conflict
      const conflict = await this.getConflict(conflictId);
      if (!conflict) {
        throw new Error(`Conflict ${conflictId} not found`);
      }

      if (conflict.resolution !== 'pending') {
        throw new Error(`Conflict ${conflictId} has already been resolved`);
      }

      // Apply resolution
      const resolvedConflict = await this.applyResolution(conflict, resolution);

      // Update conflict in storage
      await this.updateConflict(resolvedConflict);

      // Create audit log
      await this.logConflictAction(conflictId, 'resolved', resolution.resolvedBy, 
        `Conflict resolved using ${resolution.resolutionMethod}`);

      // Send notifications
      await this.sendResolutionNotifications(resolvedConflict, resolution);

      // Update version history
      await this.updateVersionHistory(resolvedConflict, resolution);

      return resolvedConflict;

    } catch (error) {
      console.error('Error resolving conflict:', error);
      await this.logConflictAction(conflictId, 'escalated', 'system', 
        `Error resolving conflict: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Apply resolution to a conflict
   */
  private async applyResolution(
    conflict: ConflictData, 
    resolution: ConflictResolution
  ): Promise<ConflictData> {
    let resolvedContent: string;
    let resolutionMethod: ConflictData['resolutionMethod'];

    switch (resolution.resolutionMethod) {
      case 'keep_mine':
        resolvedContent = conflict.user2Content; // Current user's content
        resolutionMethod = 'user_choice';
        break;
      
      case 'keep_theirs':
        resolvedContent = conflict.user1Content; // Other user's content
        resolutionMethod = 'user_choice';
        break;
      
      case 'merge_manual':
        resolvedContent = resolution.mergedContent || conflict.user2Content;
        resolutionMethod = 'manual_merge';
        break;
      
      case 'merge_auto':
        resolvedContent = await this.performAutomaticMerge(conflict);
        resolutionMethod = 'manual_merge';
        break;
      
      default:
        throw new Error(`Unknown resolution method: ${resolution.resolutionMethod}`);
    }

    // Update the note with resolved content
    await noteService.updateNote(conflict.noteId, {
      content: resolvedContent,
    });

    return {
      ...conflict,
      resolution: 'resolved',
      resolvedBy: resolution.resolvedBy,
      resolvedAt: resolution.resolvedAt,
      resolutionMethod,
      updatedAt: new Date(),
    };
  }

  /**
   * Perform automatic merge of conflicting content
   */
  private async performAutomaticMerge(conflict: ConflictData): Promise<string> {
    const diff = conflictDetector['calculateContentDiff'](conflict.user1Content, conflict.user2Content);
    
    // Simple merge strategy: keep both versions with clear separation
    const mergedContent = this.mergeContentStrategically(conflict.user1Content, conflict.user2Content, diff);
    
    return mergedContent;
  }

  /**
   * Merge content strategically based on diff analysis
   */
  private mergeContentStrategically(
    content1: string, 
    content2: string, 
    diff: ContentDiff
  ): string {
    // For now, implement a simple merge that combines both versions
    // In a real implementation, this would be more sophisticated
    
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    
    // Simple line-by-line merge
    const mergedLines: string[] = [];
    const maxLines = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 === line2) {
        mergedLines.push(line1);
      } else if (line1 && line2) {
        // Both lines exist but are different - keep both with markers
        mergedLines.push(`<!-- CONFLICT START -->`);
        mergedLines.push(`<!-- VERSION 1: ${line1} -->`);
        mergedLines.push(`<!-- VERSION 2: ${line2} -->`);
        mergedLines.push(`<!-- CONFLICT END -->`);
        mergedLines.push(line2); // Default to version 2
      } else {
        // Only one line exists
        mergedLines.push(line1 || line2);
      }
    }
    
    return mergedLines.join('\n');
  }

  /**
   * Get conflict by ID
   */
  private async getConflict(conflictId: string): Promise<ConflictData | null> {
    try {
      const conflict = await firestoreService.getConflict(conflictId);
      return conflict as ConflictData;
    } catch (error) {
      console.error('Error getting conflict from Firestore:', error);
      // Fallback to local cache
      for (const conflict of conflictDetector['activeConflicts'].values()) {
        if (conflict.id === conflictId) {
          return conflict;
        }
      }
      return null;
    }
  }

  /**
   * Update conflict in storage
   */
  private async updateConflict(conflict: ConflictData): Promise<void> {
    try {
      // Update in Firestore
      await firestoreService.updateConflict(conflict.id, conflict);
      
      // Update local cache
      conflictDetector['activeConflicts'].set(conflict.noteId, conflict);
      
      console.log('Conflict updated:', conflict.id);
    } catch (error) {
      console.error('Error updating conflict:', error);
      throw error;
    }
  }

  /**
   * Log conflict action for audit trail
   */
  private async logConflictAction(
    conflictId: string,
    action: ConflictAuditLog['action'],
    userId: string,
    details: string
  ): Promise<void> {
    const auditLog: ConflictAuditLog = {
      id: this.generateId(),
      conflictId,
      action,
      userId,
      timestamp: new Date(),
      details,
    };

    this.auditLogs.push(auditLog);

    // Save to Firestore
    try {
      // await firestoreService.addDoc('conflictAuditLogs', auditLog);
      console.log('Audit log created:', auditLog.id);
    } catch (error) {
      console.error('Error saving audit log:', error);
    }
  }

  /**
   * Send resolution notifications
   */
  private async sendResolutionNotifications(
    conflict: ConflictData,
    resolution: ConflictResolution
  ): Promise<void> {
    const notification: ConflictNotification = {
      id: this.generateId(),
      conflictId: conflict.id,
      userId: conflict.user1Id === resolution.resolvedBy ? conflict.user2Id : conflict.user1Id,
      type: 'conflict_resolved',
      message: `Conflict in note has been resolved using ${resolution.resolutionMethod}`,
      isRead: false,
      createdAt: new Date(),
      data: {
        resolutionMethod: resolution.resolutionMethod,
        resolvedBy: resolution.resolvedBy,
        noteId: conflict.noteId,
      }
    };

    // Add to notifications
    const userId = notification.userId;
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)!.push(notification);

    // Save to Firestore
    try {
      // await firestoreService.addDoc('notifications', notification);
      console.log('Resolution notification sent:', notification.id);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Update version history after conflict resolution
   */
  private async updateVersionHistory(
    conflict: ConflictData,
    resolution: ConflictResolution
  ): Promise<void> {
    try {
      // Create a new version for the resolved content
      await versionManager.createVersion(
        conflict.noteId,
        resolution.mergedContent || conflict.user2Content,
        resolution.resolvedBy,
        `Conflict resolved: ${resolution.resolutionMethod}`
      );
    } catch (error) {
      console.error('Error updating version history:', error);
    }
  }

  /**
   * Get user's conflict resolution preferences
   */
  async getUserPreferences(userId: string): Promise<ConflictResolutionPreferences> {
    if (this.resolutionPreferences.has(userId)) {
      return this.resolutionPreferences.get(userId)!;
    }

    // Default preferences
    const defaultPreferences: ConflictResolutionPreferences = {
      userId,
      defaultResolutionMethod: 'ask_user',
      autoResolveThreshold: 5000,
      enableNotifications: true,
      enableSoundNotifications: false,
      conflictHistoryRetentionDays: 30,
    };

    this.resolutionPreferences.set(userId, defaultPreferences);
    return defaultPreferences;
  }

  /**
   * Update user's conflict resolution preferences
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<ConflictResolutionPreferences>
  ): Promise<void> {
    const currentPreferences = await this.getUserPreferences(userId);
    const updatedPreferences = { ...currentPreferences, ...preferences };
    
    this.resolutionPreferences.set(userId, updatedPreferences);

    // Save to Firestore
    try {
      // await firestoreService.setDoc('conflictPreferences', userId, updatedPreferences);
      console.log('User preferences updated:', userId);
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string): Promise<ConflictNotification[]> {
    return this.notifications.get(userId) || [];
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
      }
    }
  }

  /**
   * Get conflict audit logs
   */
  async getAuditLogs(conflictId?: string): Promise<ConflictAuditLog[]> {
    if (conflictId) {
      return this.auditLogs.filter(log => log.conflictId === conflictId);
    }
    return [...this.auditLogs];
  }

  /**
   * Clean up old audit logs and notifications
   */
  async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

    // Clean up audit logs
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoffDate);

    // Clean up notifications
    for (const [userId, notifications] of this.notifications.entries()) {
      const filteredNotifications = notifications.filter(notification => 
        notification.createdAt > cutoffDate
      );
      this.notifications.set(userId, filteredNotifications);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.resolutionPreferences.clear();
    this.auditLogs = [];
    this.notifications.clear();
  }
}

// Singleton instance
export const conflictService = new ConflictService();
