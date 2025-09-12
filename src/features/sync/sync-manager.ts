import { firestoreService } from '../data/firestore-service';
import { dataValidator } from '../data/validation/data-validator';
import { autoSaveService } from './auto-save';
import { versionManager } from './version-manager';
import { auth } from '../auth/firebase';
import {
  Notebook,
  Page,
  SyncStatus,
  FirestoreError,
  OfflineQueueItem,
  BatchOperation,
} from '../data/schemas/firestore';
import { VersionData } from '../data/schemas/version';

export class SyncManager {
  private syncStatus: Map<string, SyncStatus> = new Map();
  private offlineQueue: OfflineQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncListeners: Map<string, Set<(status: SyncStatus) => void>> = new Map();
  private realTimeListeners: Map<string, () => void> = new Map();

  constructor() {
    this.setupNetworkListeners();
    this.setupAuthListeners();
  }

  /**
   * Initialize sync for a user
   */
  async initializeSync(userId: string): Promise<void> {
    try {
      // Set up real-time listeners for notebooks and pages
      await this.setupRealTimeListeners(userId);
      
      // Process any pending offline operations
      await this.processOfflineQueue();
      
      // Update sync status
      this.updateSyncStatus(userId, {
        state: 'synced',
        lastSync: new Date(),
        pendingOperations: this.offlineQueue.length,
      });
    } catch (error) {
      this.updateSyncStatus(userId, {
        state: 'error',
        error: error instanceof Error ? error.message : 'Sync initialization failed',
        pendingOperations: this.offlineQueue.length,
      });
      throw error;
    }
  }

  /**
   * Set up real-time listeners for notebooks and pages
   */
  private async setupRealTimeListeners(userId: string): Promise<void> {
    // Listen to notebooks
    const notebooksListener = firestoreService.subscribeToNotebooks(
      userId,
      (notebooks: Notebook[]) => {
        this.handleNotebooksUpdate(notebooks);
      },
      (error: FirestoreError) => {
        this.handleSyncError(userId, error);
      }
    );

    this.realTimeListeners.set(`notebooks_${userId}`, notebooksListener);

    // Listen to pages for each notebook
    const notebooks = await firestoreService.getNotebooks(userId);
    for (const notebook of notebooks) {
      const pagesListener = firestoreService.subscribeToPages(
        notebook.id,
        (pages: Page[]) => {
          this.handlePagesUpdate(notebook.id, pages);
        },
        (error: FirestoreError) => {
          this.handleSyncError(userId, error);
        }
      );

      this.realTimeListeners.set(`pages_${notebook.id}`, pagesListener);
    }
  }

  /**
   * Handle notebooks update from real-time listener
   */
  private handleNotebooksUpdate(notebooks: Notebook[]): void {
    // Validate all notebooks
    const validationResults = notebooks.map(notebook => 
      dataValidator.validateNotebook(notebook)
    );

    const invalidNotebooks = validationResults.filter(result => !result.isValid);
    if (invalidNotebooks.length > 0) {
      console.warn('Received invalid notebooks from Firestore:', invalidNotebooks);
      return;
    }

    // Update local state (this would integrate with your state management)
    // For now, we'll just log the update
    console.log('Notebooks updated:', notebooks.length);
  }

  /**
   * Handle pages update from real-time listener
   */
  private handlePagesUpdate(notebookId: string, pages: Page[]): void {
    // Validate all pages
    const validationResults = pages.map(page => 
      dataValidator.validatePage(page)
    );

    const invalidPages = validationResults.filter(result => !result.isValid);
    if (invalidPages.length > 0) {
      console.warn('Received invalid pages from Firestore:', invalidPages);
      return;
    }

    // Update local state (this would integrate with your state management)
    // For now, we'll just log the update
    console.log(`Pages updated for notebook ${notebookId}:`, pages.length);
  }

  /**
   * Sync a notebook to Firestore
   */
  async syncNotebook(notebook: Notebook): Promise<void> {
    const userId = notebook.userId;
    
    try {
      this.updateSyncStatus(userId, { state: 'syncing' });

      // Validate notebook data
      const validation = dataValidator.validateNotebook(notebook);
      if (!validation.isValid) {
        throw new Error(`Invalid notebook data: ${validation.errors.join(', ')}`);
      }

      // Check if notebook exists
      const existingNotebook = await firestoreService.getNotebook(notebook.id);
      
      if (existingNotebook) {
        // Update existing notebook
        await firestoreService.updateNotebook(notebook.id, {
          name: notebook.name,
          description: notebook.description,
          pinned: notebook.pinned,
        });
      } else {
        // Create new notebook
        await firestoreService.createNotebook({
          name: notebook.name,
          description: notebook.description,
          userId: notebook.userId,
          pinned: notebook.pinned,
        });
      }

      this.updateSyncStatus(userId, {
        state: 'synced',
        lastSync: new Date(),
      });
    } catch (error) {
      this.handleSyncError(userId, {
        code: 'sync_error',
        message: error instanceof Error ? error.message : 'Unknown sync error',
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Sync a page to Firestore
   */
  async syncPage(page: Page): Promise<void> {
    const userId = page.userId;
    
    try {
      this.updateSyncStatus(userId, { state: 'syncing' });

      // Validate page data
      const validation = dataValidator.validatePage(page);
      if (!validation.isValid) {
        throw new Error(`Invalid page data: ${validation.errors.join(', ')}`);
      }

      // Check if page exists
      const existingPage = await firestoreService.getPage(page.id);
      
      if (existingPage) {
        // Update existing page
        await firestoreService.updatePage(page.id, {
          title: page.title,
          content: page.content,
          isPinned: page.isPinned,
          parentPageId: page.parentPageId,
        });
      } else {
        // Create new page
        await firestoreService.createPage({
          title: page.title,
          content: page.content,
          notebookId: page.notebookId,
          userId: page.userId,
          isPinned: page.isPinned,
          parentPageId: page.parentPageId,
        });
      }

      // Create version if content changed
      if (existingPage && existingPage.content !== page.content) {
        await this.createVersionForPage(page);
      }

      this.updateSyncStatus(userId, {
        state: 'synced',
        lastSync: new Date(),
      });
    } catch (error) {
      this.handleSyncError(userId, {
        code: 'sync_error',
        message: error instanceof Error ? error.message : 'Unknown sync error',
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Create version for page content change
   */
  private async createVersionForPage(page: Page): Promise<void> {
    try {
      const version: VersionData = {
        id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pageId: page.id,
        content: page.content,
        timestamp: new Date(),
        author: page.userId,
        changeSummary: 'Content updated',
        fileSize: new Blob([page.content]).size,
        revisionId: page.revisionId,
      };

      await firestoreService.saveVersion(version);
    } catch (error) {
      console.warn('Failed to create version for page:', error);
    }
  }

  /**
   * Queue operation for offline sync
   */
  queueOfflineOperation(operation: BatchOperation): void {
    const queueItem: OfflineQueueItem = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
    };

    this.offlineQueue.push(queueItem);
    
    // Update sync status for all users
    this.syncStatus.forEach((status, userId) => {
      this.updateSyncStatus(userId, {
        pendingOperations: this.offlineQueue.length,
      });
    });
  }

  /**
   * Process offline queue when back online
   */
  async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    const operations: BatchOperation[] = [];
    const failedOperations: OfflineQueueItem[] = [];

    for (const queueItem of this.offlineQueue) {
      try {
        operations.push(queueItem.operation);
      } catch (error) {
        queueItem.retryCount++;
        if (queueItem.retryCount < queueItem.maxRetries) {
          failedOperations.push(queueItem);
        } else {
          console.error('Operation failed after max retries:', queueItem);
        }
      }
    }

    if (operations.length > 0) {
      try {
        await firestoreService.executeBatch(operations);
        this.offlineQueue = failedOperations; // Keep only failed operations
      } catch (error) {
        console.error('Batch operation failed:', error);
        // Increment retry count for all operations
        this.offlineQueue.forEach(item => item.retryCount++);
      }
    }

    // Update sync status
    this.syncStatus.forEach((status, userId) => {
      this.updateSyncStatus(userId, {
        pendingOperations: this.offlineQueue.length,
      });
    });
  }

  /**
   * Get sync status for a user
   */
  getSyncStatus(userId: string): SyncStatus | undefined {
    return this.syncStatus.get(userId);
  }

  /**
   * Subscribe to sync status changes
   */
  subscribeToSyncStatus(userId: string, callback: (status: SyncStatus) => void): () => void {
    if (!this.syncListeners.has(userId)) {
      this.syncListeners.set(userId, new Set());
    }
    
    this.syncListeners.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.syncListeners.get(userId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.syncListeners.delete(userId);
        }
      }
    };
  }

  /**
   * Update sync status and notify listeners
   */
  private updateSyncStatus(userId: string, status: Partial<SyncStatus>): void {
    const currentStatus = this.syncStatus.get(userId) || {
      state: 'idle',
      pendingOperations: 0,
    };
    
    const newStatus: SyncStatus = { ...currentStatus, ...status };
    this.syncStatus.set(userId, newStatus);
    
    // Notify listeners
    const listeners = this.syncListeners.get(userId);
    if (listeners) {
      listeners.forEach(callback => callback(newStatus));
    }
  }

  /**
   * Handle sync errors
   */
  private handleSyncError(userId: string, error: FirestoreError): void {
    this.updateSyncStatus(userId, {
      state: 'error',
      error: error.message,
    });
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.syncStatus.forEach((status, userId) => {
        this.updateSyncStatus(userId, {
          state: 'idle',
        });
      });
    });
  }

  /**
   * Setup authentication listeners
   */
  private setupAuthListeners(): void {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.initializeSync(user.uid);
      } else {
        // Clean up listeners and status when user logs out
        this.cleanup();
      }
    });
  }

  /**
   * Force sync all pending changes
   */
  async forceSync(userId: string): Promise<void> {
    try {
      this.updateSyncStatus(userId, { state: 'syncing' });
      
      // Process offline queue
      await this.processOfflineQueue();
      
      // Force save all pending auto-saves
      await autoSaveService.saveAllPending();
      
      this.updateSyncStatus(userId, {
        state: 'synced',
        lastSync: new Date(),
      });
    } catch (error) {
      this.handleSyncError(userId, {
        code: 'force_sync_error',
        message: error instanceof Error ? error.message : 'Force sync failed',
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus(): {
    totalOperations: number;
    failedOperations: number;
    oldestOperation?: Date;
  } {
    const failedOperations = this.offlineQueue.filter(item => item.retryCount > 0);
    const oldestOperation = this.offlineQueue.length > 0 
      ? this.offlineQueue.reduce((oldest, current) => 
          current.timestamp < oldest.timestamp ? current : oldest
        ).timestamp
      : undefined;

    return {
      totalOperations: this.offlineQueue.length,
      failedOperations: failedOperations.length,
      oldestOperation,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clean up real-time listeners
    this.realTimeListeners.forEach(unsubscribe => unsubscribe());
    this.realTimeListeners.clear();
    
    // Clear sync status
    this.syncStatus.clear();
    
    // Clear listeners
    this.syncListeners.clear();
  }
}

// Singleton instance
export const syncManager = new SyncManager();

