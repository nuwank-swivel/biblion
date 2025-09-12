import { 
  ConflictData, 
  ConflictDetectionResult, 
  ContentDiff, 
  ConflictState,
  ConflictResolutionStrategy 
} from '../data/schemas/conflict';
import { Page } from '../data/schemas/firestore';
import { VersionData } from '../data/schemas/version';
import { firestoreService } from '../data/firestore-service';
import { versionManager } from './version-manager';
import { noteService } from '../../services/notebookService';

export class ConflictDetector {
  private activeConflicts: Map<string, ConflictData> = new Map();
  private conflictStates: Map<string, ConflictState> = new Map();
  private editingUsers: Map<string, Set<string>> = new Map();
  private conflictListeners: Map<string, Set<(conflict: ConflictData) => void>> = new Map();
  private strategies: ConflictResolutionStrategy[] = [];

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize conflict resolution strategies
   */
  private initializeStrategies(): void {
    this.strategies = [
      {
        name: 'last_writer_wins',
        description: 'Keep the most recent changes',
        canAutoResolve: true,
        requiresUserInput: false,
        priority: 1,
        conditions: ['timestamp_difference > 1000ms', 'no_structural_conflicts']
      },
      {
        name: 'content_merge',
        description: 'Merge compatible content changes',
        canAutoResolve: true,
        requiresUserInput: false,
        priority: 2,
        conditions: ['different_paragraphs', 'no_overlapping_changes']
      },
      {
        name: 'manual_resolution',
        description: 'Require user to choose resolution',
        canAutoResolve: false,
        requiresUserInput: true,
        priority: 3,
        conditions: ['overlapping_changes', 'structural_conflicts']
      }
    ];
  }

  /**
   * Start monitoring a note for conflicts
   */
  startConflictMonitoring(noteId: string, userId: string): void {
    // Add user to editing users
    if (!this.editingUsers.has(noteId)) {
      this.editingUsers.set(noteId, new Set());
    }
    this.editingUsers.get(noteId)!.add(userId);

    // Update conflict state
    this.updateConflictState(noteId);

    // Set up Firestore listener for real-time changes
    this.setupRealtimeListener(noteId);
  }

  /**
   * Stop monitoring a note for conflicts
   */
  stopConflictMonitoring(noteId: string, userId: string): void {
    // Remove user from editing users
    const users = this.editingUsers.get(noteId);
    if (users) {
      users.delete(userId);
      if (users.size === 0) {
        this.editingUsers.delete(noteId);
        this.conflictStates.delete(noteId);
      }
    }

    // Clean up listeners
    this.cleanupListeners(noteId);
  }

  /**
   * Detect conflicts when content changes
   */
  async detectConflict(
    noteId: string, 
    newContent: string, 
    userId: string, 
    timestamp: Date
  ): Promise<ConflictDetectionResult> {
    try {
      // Get current note data using noteService
      const currentNote = await noteService.getNote(noteId);
      if (!currentNote) {
        return {
          hasConflict: false,
          conflictingUsers: [],
          conflictType: 'content',
          severity: 'low',
          detectedAt: new Date(),
        };
      }

      // Check if there are other users editing
      const editingUsers = this.editingUsers.get(noteId);
      if (!editingUsers || editingUsers.size <= 1) {
        return {
          hasConflict: false,
          conflictingUsers: [],
          conflictType: 'content',
          severity: 'low',
          detectedAt: new Date(),
        };
      }

      // Compare with current content
      const contentDiff = this.calculateContentDiff(currentNote.content, newContent);
      
      // Check for significant changes
      if (contentDiff.diffPercentage < 0.05) {
        return {
          hasConflict: false,
          conflictingUsers: [],
          conflictType: 'content',
          severity: 'low',
          detectedAt: new Date(),
        };
      }

      // Check if there's already an active conflict
      const existingConflict = this.activeConflicts.get(noteId);
      if (existingConflict && existingConflict.resolution === 'pending') {
        return {
          hasConflict: true,
          conflictId: existingConflict.id,
          conflictingUsers: [existingConflict.user1Id, existingConflict.user2Id],
          conflictType: 'content',
          severity: this.calculateConflictSeverity(contentDiff),
          detectedAt: new Date(),
          details: 'Conflict already exists for this note'
        };
      }

      // Create new conflict
      const conflict = await this.createConflict(
        noteId,
        currentNote.content,
        newContent,
        currentNote.userId,
        userId,
        currentNote.updatedAt,
        timestamp
      );

      return {
        hasConflict: true,
        conflictId: conflict.id,
        conflictingUsers: [conflict.user1Id, conflict.user2Id],
        conflictType: 'content',
        severity: this.calculateConflictSeverity(contentDiff),
        detectedAt: new Date(),
        details: `Content conflict detected between users ${conflict.user1Id} and ${conflict.user2Id}`
      };

    } catch (error) {
      console.error('Error detecting conflict:', error);
      return {
        hasConflict: false,
        conflictingUsers: [],
        conflictType: 'content',
        severity: 'low',
        detectedAt: new Date(),
        details: `Error during conflict detection: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a new conflict record
   */
  private async createConflict(
    noteId: string,
    user1Content: string,
    user2Content: string,
    user1Id: string,
    user2Id: string,
    user1Timestamp: Date,
    user2Timestamp: Date
  ): Promise<ConflictData> {
    const conflictId = this.generateConflictId();
    
    const conflict: ConflictData = {
      id: conflictId,
      noteId,
      user1Id,
      user2Id,
      user1Content,
      user2Content,
      user1Timestamp,
      user2Timestamp,
      resolution: 'pending',
      resolutionMethod: 'last_writer_wins',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store conflict locally
    this.activeConflicts.set(noteId, conflict);

    // Save to Firestore
    await this.saveConflictToFirestore(conflict);

    // Notify listeners
    this.notifyConflictListeners(noteId, conflict);

    return conflict;
  }

  /**
   * Calculate content diff between two versions
   */
  private calculateContentDiff(oldContent: string, newContent: string): ContentDiff {
    const oldWords = oldContent.split(/\s+/);
    const newWords = newContent.split(/\s+/);
    
    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];
    const unchanged: string[] = [];
    const conflictSegments: ContentDiff['conflictSegments'] = [];

    // Simple word-level diff
    const maxLength = Math.max(oldWords.length, newWords.length);
    let conflictStart = -1;
    
    for (let i = 0; i < maxLength; i++) {
      const oldWord = oldWords[i];
      const newWord = newWords[i];

      if (!oldWord && newWord) {
        added.push(newWord);
        if (conflictStart === -1) conflictStart = i;
      } else if (oldWord && !newWord) {
        removed.push(oldWord);
        if (conflictStart === -1) conflictStart = i;
      } else if (oldWord !== newWord) {
        modified.push(`${oldWord} → ${newWord}`);
        if (conflictStart === -1) conflictStart = i;
      } else {
        unchanged.push(oldWord);
        if (conflictStart !== -1) {
          conflictSegments.push({
            start: conflictStart,
            end: i - 1,
            type: 'modification',
            content: newWords.slice(conflictStart, i).join(' ')
          });
          conflictStart = -1;
        }
      }
    }

    // Handle remaining conflict segment
    if (conflictStart !== -1) {
      conflictSegments.push({
        start: conflictStart,
        end: maxLength - 1,
        type: 'modification',
        content: newWords.slice(conflictStart).join(' ')
      });
    }

    const totalChanges = added.length + removed.length + modified.length;
    const diffPercentage = totalChanges / Math.max(oldWords.length, newWords.length);

    return {
      added,
      removed,
      modified,
      unchanged,
      diffPercentage,
      conflictSegments
    };
  }

  /**
   * Calculate conflict severity based on content diff
   */
  private calculateConflictSeverity(diff: ContentDiff): 'low' | 'medium' | 'high' | 'critical' {
    if (diff.diffPercentage < 0.1) return 'low';
    if (diff.diffPercentage < 0.3) return 'medium';
    if (diff.diffPercentage < 0.7) return 'high';
    return 'critical';
  }

  /**
   * Set up real-time listener for note changes
   */
  private setupRealtimeListener(noteId: string): void {
    // Set up Firestore real-time listener for note changes
    const unsubscribe = firestoreService.subscribeToNote(noteId, (note) => {
      // Handle real-time updates
      this.handleRealtimeUpdate(noteId, note);
    }, (error) => {
      console.error('Error in real-time listener:', error);
    });

    // Store unsubscribe function for cleanup
    this.conflictStates.set(noteId, {
      noteId,
      activeConflicts: [],
      editingUsers: Array.from(this.editingUsers.get(noteId) || []),
      lastActivity: new Date(),
      conflictCount: 0,
      isResolving: false
    });
  }

  /**
   * Handle real-time updates from Firestore
   */
  private async handleRealtimeUpdate(noteId: string, note: any): Promise<void> {
    // Update conflict state with latest activity
    this.updateConflictState(noteId);
    
    // Check if there are any changes that might indicate conflicts
    if (note) {
      // Check if this update came from a different user
      const editingUsers = this.editingUsers.get(noteId);
      if (editingUsers && editingUsers.size > 1) {
        // Multiple users are editing, check for potential conflicts
        await this.checkForPotentialConflicts(noteId, note);
      }
    }
  }

  /**
   * Check for potential conflicts when multiple users are editing
   */
  private async checkForPotentialConflicts(noteId: string, noteData: any): Promise<void> {
    try {
      // This would implement more sophisticated conflict detection
      // For now, we'll just update the conflict state
      this.updateConflictState(noteId);
    } catch (error) {
      console.error('Error checking for potential conflicts:', error);
    }
  }

  /**
   * Check for conflicts in a note
   */
  private async checkForConflicts(noteId: string): Promise<void> {
    // This method is kept for backward compatibility
    // Real conflict checking is now handled by handleRealtimeUpdate
  }

  /**
   * Update conflict state for a note
   */
  private updateConflictState(noteId: string): void {
    const editingUsers = this.editingUsers.get(noteId);
    const activeConflicts = this.activeConflicts.get(noteId);
    
    this.conflictStates.set(noteId, {
      noteId,
      activeConflicts: activeConflicts ? [activeConflicts.id] : [],
      editingUsers: Array.from(editingUsers || []),
      lastActivity: new Date(),
      conflictCount: activeConflicts ? 1 : 0,
      isResolving: false
    });
  }

  /**
   * Save conflict to Firestore
   */
  private async saveConflictToFirestore(conflict: ConflictData): Promise<void> {
    try {
      await firestoreService.saveConflict(conflict);
      console.log('Conflict saved to Firestore:', conflict.id);
    } catch (error) {
      console.error('Error saving conflict to Firestore:', error);
    }
  }

  /**
   * Notify conflict listeners
   */
  private notifyConflictListeners(noteId: string, conflict: ConflictData): void {
    const listeners = this.conflictListeners.get(noteId);
    if (listeners) {
      listeners.forEach(callback => callback(conflict));
    }
  }

  /**
   * Subscribe to conflict events for a note
   */
  subscribeToConflicts(noteId: string, callback: (conflict: ConflictData) => void): () => void {
    if (!this.conflictListeners.has(noteId)) {
      this.conflictListeners.set(noteId, new Set());
    }
    
    this.conflictListeners.get(noteId)!.add(callback);

    return () => {
      const listeners = this.conflictListeners.get(noteId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.conflictListeners.delete(noteId);
        }
      }
    };
  }

  /**
   * Get active conflicts for a note
   */
  getActiveConflicts(noteId: string): ConflictData[] {
    const conflict = this.activeConflicts.get(noteId);
    return conflict ? [conflict] : [];
  }

  /**
   * Get conflict state for a note
   */
  getConflictState(noteId: string): ConflictState | undefined {
    return this.conflictStates.get(noteId);
  }

  /**
   * Get available resolution strategies
   */
  getResolutionStrategies(): ConflictResolutionStrategy[] {
    return [...this.strategies];
  }

  /**
   * Clean up listeners for a note
   */
  private cleanupListeners(noteId: string): void {
    this.conflictListeners.delete(noteId);
  }

  /**
   * Generate unique conflict ID
   */
  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    this.activeConflicts.clear();
    this.conflictStates.clear();
    this.editingUsers.clear();
    this.conflictListeners.clear();
  }
}

// Singleton instance
export const conflictDetector = new ConflictDetector();
