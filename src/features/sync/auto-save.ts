import { VersionData, SaveStatus, AutoSaveConfig } from '../data/schemas/version';
import { noteService } from '../../services/notebookService';

export class AutoSaveService {
  private config: AutoSaveConfig;
  private saveQueue: Map<string, { content: string; title: string; timestamp: number }> = new Map();
  private saveTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private saveStatus: Map<string, SaveStatus> = new Map();
  private listeners: Map<string, Set<(status: SaveStatus) => void>> = new Map();

  constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = {
      intervalMs: 2000,
      maxRetries: 3,
      debounceMs: 500,
      ...config,
    };
  }

  /**
   * Start auto-save for a note
   */
  startAutoSave(noteId: string, content: string, title: string): void {
    // Clear existing timeout
    this.clearAutoSave(noteId);

    // Add to save queue
    this.saveQueue.set(noteId, {
      content,
      title,
      timestamp: Date.now(),
    });

    // Set up debounced save
    const timeoutId = setTimeout(() => {
      this.performSave(noteId);
    }, this.config.debounceMs);

    this.saveTimeouts.set(noteId, timeoutId);
    this.updateSaveStatus(noteId, { state: 'idle', retryCount: 0 });
  }

  /**
   * Stop auto-save for a note
   */
  stopAutoSave(noteId: string): void {
    this.clearAutoSave(noteId);
    this.saveQueue.delete(noteId);
    this.saveStatus.delete(noteId);
  }

  /**
   * Clear auto-save timeout
   */
  private clearAutoSave(noteId: string): void {
    const timeoutId = this.saveTimeouts.get(noteId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.saveTimeouts.delete(noteId);
    }
  }

  /**
   * Perform the actual save operation
   */
  private async performSave(noteId: string): Promise<void> {
    const queuedSave = this.saveQueue.get(noteId);
    if (!queuedSave) return;

    this.updateSaveStatus(noteId, { state: 'saving', retryCount: 0 });

    try {
      await noteService.updateNote(noteId, {
        title: queuedSave.title,
        content: queuedSave.content,
      });

      this.updateSaveStatus(noteId, {
        state: 'saved',
        lastSaved: new Date(),
        retryCount: 0,
      });

      // Remove from queue after successful save
      this.saveQueue.delete(noteId);
    } catch (error) {
      const currentStatus = this.saveStatus.get(noteId);
      const retryCount = (currentStatus?.retryCount || 0) + 1;

      if (retryCount < this.config.maxRetries) {
        // Retry after a delay
        setTimeout(() => {
          this.performSave(noteId);
        }, this.config.intervalMs);
      }

      this.updateSaveStatus(noteId, {
        state: 'error',
        error: error instanceof Error ? error.message : 'Save failed',
        retryCount,
      });
    }
  }

  /**
   * Manual save trigger
   */
  async manualSave(noteId: string, content: string, title: string): Promise<void> {
    // Clear any pending auto-save
    this.clearAutoSave(noteId);

    this.updateSaveStatus(noteId, { state: 'saving', retryCount: 0 });

    try {
      await noteService.updateNote(noteId, {
        title,
        content,
      });

      this.updateSaveStatus(noteId, {
        state: 'saved',
        lastSaved: new Date(),
        retryCount: 0,
      });

      // Remove from queue
      this.saveQueue.delete(noteId);
    } catch (error) {
      this.updateSaveStatus(noteId, {
        state: 'error',
        error: error instanceof Error ? error.message : 'Manual save failed',
        retryCount: 0,
      });
      throw error;
    }
  }

  /**
   * Update save status and notify listeners
   */
  private updateSaveStatus(noteId: string, status: Partial<SaveStatus>): void {
    const currentStatus = this.saveStatus.get(noteId) || { state: 'idle', retryCount: 0 };
    const newStatus = { ...currentStatus, ...status };
    
    this.saveStatus.set(noteId, newStatus);
    this.notifyListeners(noteId, newStatus);
  }

  /**
   * Get current save status for a note
   */
  getSaveStatus(noteId: string): SaveStatus | undefined {
    return this.saveStatus.get(noteId);
  }

  /**
   * Subscribe to save status changes
   */
  subscribeToSaveStatus(noteId: string, callback: (status: SaveStatus) => void): () => void {
    if (!this.listeners.has(noteId)) {
      this.listeners.set(noteId, new Set());
    }
    
    this.listeners.get(noteId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(noteId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(noteId);
        }
      }
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(noteId: string, status: SaveStatus): void {
    const listeners = this.listeners.get(noteId);
    if (listeners) {
      listeners.forEach(callback => callback(status));
    }
  }

  /**
   * Get all pending saves
   */
  getPendingSaves(): string[] {
    return Array.from(this.saveQueue.keys());
  }

  /**
   * Force save all pending changes
   */
  async saveAllPending(): Promise<void> {
    const pendingNoteIds = this.getPendingSaves();
    const savePromises = pendingNoteIds.map(noteId => {
      const queuedSave = this.saveQueue.get(noteId);
      if (queuedSave) {
        return this.performSave(noteId);
      }
      return Promise.resolve();
    });

    await Promise.allSettled(savePromises);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all timeouts
    this.saveTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.saveTimeouts.clear();
    
    // Clear all data
    this.saveQueue.clear();
    this.saveStatus.clear();
    this.listeners.clear();
  }
}

// Singleton instance
export const autoSaveService = new AutoSaveService();
