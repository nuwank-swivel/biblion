import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../auth/firebase';
import {
  Notebook,
  Page,
  UserConfig,
  SyncStatus,
  FirestoreQuery,
  BatchOperation,
  FirestoreError,
  ValidationResult,
  PerformanceMetrics,
} from './schemas/firestore';
import { VersionData } from './schemas/version';

export class FirestoreService {
  private performanceMetrics: PerformanceMetrics[] = [];
  private listeners: Map<string, Unsubscribe> = new Map();

  /**
   * Create a new notebook
   */
  async createNotebook(notebook: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt' | 'revisionId'>): Promise<Notebook> {
    const startTime = Date.now();
    
    try {
      const notebookData = {
        ...notebook,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        revisionId: this.generateRevisionId(),
      };

      const docRef = await addDoc(collection(db, 'notebooks'), notebookData);
      
      const createdNotebook: Notebook = {
        id: docRef.id,
        ...notebookData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      this.recordPerformanceMetrics('createNotebook', Date.now() - startTime, true);
      return createdNotebook;
    } catch (error) {
      this.recordPerformanceMetrics('createNotebook', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Get a notebook by ID
   */
  async getNotebook(notebookId: string): Promise<Notebook | null> {
    const startTime = Date.now();
    
    try {
      const docRef = doc(db, 'notebooks', notebookId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const notebook = { id: docSnap.id, ...docSnap.data() } as Notebook;
        this.recordPerformanceMetrics('getNotebook', Date.now() - startTime, true);
        return notebook;
      }
      
      this.recordPerformanceMetrics('getNotebook', Date.now() - startTime, true);
      return null;
    } catch (error) {
      this.recordPerformanceMetrics('getNotebook', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Get all notebooks for a user
   */
  async getNotebooks(userId: string, queryParams?: Partial<FirestoreQuery>): Promise<Notebook[]> {
    const startTime = Date.now();
    
    try {
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
      ];

      if (queryParams?.limit) {
        constraints.push(limit(queryParams.limit));
      }

      const q = query(collection(db, 'notebooks'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const notebooks: Notebook[] = [];
      querySnapshot.forEach((doc) => {
        notebooks.push({ id: doc.id, ...doc.data() } as Notebook);
      });

      this.recordPerformanceMetrics('getNotebooks', Date.now() - startTime, true);
      return notebooks;
    } catch (error) {
      this.recordPerformanceMetrics('getNotebooks', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Update a notebook
   */
  async updateNotebook(notebookId: string, updates: Partial<Omit<Notebook, 'id' | 'createdAt' | 'userId'>>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const docRef = doc(db, 'notebooks', notebookId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        revisionId: this.generateRevisionId(),
      };

      await updateDoc(docRef, updateData);
      this.recordPerformanceMetrics('updateNotebook', Date.now() - startTime, true);
    } catch (error) {
      this.recordPerformanceMetrics('updateNotebook', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Delete a notebook
   */
  async deleteNotebook(notebookId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      const docRef = doc(db, 'notebooks', notebookId);
      await deleteDoc(docRef);
      this.recordPerformanceMetrics('deleteNotebook', Date.now() - startTime, true);
    } catch (error) {
      this.recordPerformanceMetrics('deleteNotebook', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Create a new page
   */
  async createPage(page: Omit<Page, 'id' | 'createdAt' | 'updatedAt' | 'revisionId'>): Promise<Page> {
    const startTime = Date.now();
    
    try {
      const pageData = {
        ...page,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        revisionId: this.generateRevisionId(),
      };

      const docRef = await addDoc(collection(db, 'pages'), pageData);
      
      const createdPage: Page = {
        id: docRef.id,
        ...pageData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      this.recordPerformanceMetrics('createPage', Date.now() - startTime, true);
      return createdPage;
    } catch (error) {
      this.recordPerformanceMetrics('createPage', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Get a page by ID
   */
  async getPage(pageId: string): Promise<Page | null> {
    const startTime = Date.now();
    
    try {
      const docRef = doc(db, 'pages', pageId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const page = { id: docSnap.id, ...docSnap.data() } as Page;
        this.recordPerformanceMetrics('getPage', Date.now() - startTime, true);
        return page;
      }
      
      this.recordPerformanceMetrics('getPage', Date.now() - startTime, true);
      return null;
    } catch (error) {
      this.recordPerformanceMetrics('getPage', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Get all pages for a notebook
   */
  async getPages(notebookId: string, queryParams?: Partial<FirestoreQuery>): Promise<Page[]> {
    const startTime = Date.now();
    
    try {
      const constraints: QueryConstraint[] = [
        where('notebookId', '==', notebookId),
        orderBy('updatedAt', 'desc'),
      ];

      if (queryParams?.limit) {
        constraints.push(limit(queryParams.limit));
      }

      const q = query(collection(db, 'pages'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const pages: Page[] = [];
      querySnapshot.forEach((doc) => {
        pages.push({ id: doc.id, ...doc.data() } as Page);
      });

      this.recordPerformanceMetrics('getPages', Date.now() - startTime, true);
      return pages;
    } catch (error) {
      this.recordPerformanceMetrics('getPages', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Update a page
   */
  async updatePage(pageId: string, updates: Partial<Omit<Page, 'id' | 'createdAt' | 'userId' | 'notebookId'>>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const docRef = doc(db, 'pages', pageId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        revisionId: this.generateRevisionId(),
      };

      await updateDoc(docRef, updateData);
      this.recordPerformanceMetrics('updatePage', Date.now() - startTime, true);
    } catch (error) {
      this.recordPerformanceMetrics('updatePage', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Delete a page
   */
  async deletePage(pageId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      const docRef = doc(db, 'pages', pageId);
      await deleteDoc(docRef);
      this.recordPerformanceMetrics('deletePage', Date.now() - startTime, true);
    } catch (error) {
      this.recordPerformanceMetrics('deletePage', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Set up real-time listener for notebooks
   */
  subscribeToNotebooks(
    userId: string,
    callback: (notebooks: Notebook[]) => void,
    onError?: (error: FirestoreError) => void
  ): () => void {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
    ];

    const q = query(collection(db, 'notebooks'), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const notebooks: Notebook[] = [];
        querySnapshot.forEach((doc) => {
          notebooks.push({ id: doc.id, ...doc.data() } as Notebook);
        });
        callback(notebooks);
      },
      (error) => {
        if (onError) {
          onError(this.handleFirestoreError(error));
        }
      }
    );

    const listenerId = `notebooks_${userId}`;
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Set up real-time listener for pages
   */
  subscribeToPages(
    notebookId: string,
    callback: (pages: Page[]) => void,
    onError?: (error: FirestoreError) => void
  ): () => void {
    const constraints: QueryConstraint[] = [
      where('notebookId', '==', notebookId),
      orderBy('updatedAt', 'desc'),
    ];

    const q = query(collection(db, 'pages'), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const pages: Page[] = [];
        querySnapshot.forEach((doc) => {
          pages.push({ id: doc.id, ...doc.data() } as Page);
        });
        callback(pages);
      },
      (error) => {
        if (onError) {
          onError(this.handleFirestoreError(error));
        }
      }
    );

    const listenerId = `pages_${notebookId}`;
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Execute batch operations
   */
  async executeBatch(operations: BatchOperation[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      const batch = writeBatch(db);
      
      operations.forEach((operation) => {
        const docRef = doc(db, operation.collection, operation.documentId);
        
        switch (operation.type) {
          case 'create':
            batch.set(docRef, operation.data);
            break;
          case 'update':
            batch.update(docRef, operation.data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
      this.recordPerformanceMetrics('executeBatch', Date.now() - startTime, true);
    } catch (error) {
      this.recordPerformanceMetrics('executeBatch', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Get user configuration
   */
  async getUserConfig(userId: string): Promise<UserConfig | null> {
    const startTime = Date.now();
    
    try {
      const docRef = doc(db, 'userConfigs', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const config = docSnap.data() as UserConfig;
        this.recordPerformanceMetrics('getUserConfig', Date.now() - startTime, true);
        return config;
      }
      
      this.recordPerformanceMetrics('getUserConfig', Date.now() - startTime, true);
      return null;
    } catch (error) {
      this.recordPerformanceMetrics('getUserConfig', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Update user configuration
   */
  async updateUserConfig(userId: string, config: Partial<UserConfig>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const docRef = doc(db, 'userConfigs', userId);
      await updateDoc(docRef, config);
      this.recordPerformanceMetrics('updateUserConfig', Date.now() - startTime, true);
    } catch (error) {
      this.recordPerformanceMetrics('updateUserConfig', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Save version data
   */
  async saveVersion(version: VersionData): Promise<void> {
    const startTime = Date.now();
    
    try {
      const versionData = {
        ...version,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, 'versions'), versionData);
      this.recordPerformanceMetrics('saveVersion', Date.now() - startTime, true);
    } catch (error) {
      this.recordPerformanceMetrics('saveVersion', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Get version history for a page
   */
  async getVersionHistory(pageId: string, limitCount: number = 50): Promise<VersionData[]> {
    const startTime = Date.now();
    
    try {
      const constraints: QueryConstraint[] = [
        where('pageId', '==', pageId),
        orderBy('timestamp', 'desc'),
        limit(limitCount),
      ];

      const q = query(collection(db, 'versions'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const versions: VersionData[] = [];
      querySnapshot.forEach((doc) => {
        versions.push({ id: doc.id, ...doc.data() } as VersionData);
      });

      this.recordPerformanceMetrics('getVersionHistory', Date.now() - startTime, true);
      return versions;
    } catch (error) {
      this.recordPerformanceMetrics('getVersionHistory', Date.now() - startTime, false, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
  }

  /**
   * Cleanup all listeners
   */
  cleanup(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
  }

  /**
   * Generate unique revision ID
   */
  private generateRevisionId(): string {
    return `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(
    operationType: string,
    duration: number,
    success: boolean,
    error?: any
  ): void {
    const metric: PerformanceMetrics = {
      operationType,
      duration,
      timestamp: new Date(),
      success,
      error: error ? (error instanceof Error ? error.message : String(error)) : undefined,
    };

    this.performanceMetrics.push(metric);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  /**
   * Handle Firestore errors
   */
  private handleFirestoreError(error: any): FirestoreError {
    return {
      code: error.code || 'unknown',
      message: error.message || 'Unknown Firestore error',
      details: error,
      timestamp: new Date(),
    };
  }
}

// Singleton instance
export const firestoreService = new FirestoreService();

