import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firestoreService } from './firestore-service';
import { syncManager } from '../sync/sync-manager';
import { dataValidator } from './validation/data-validator';
import { dataMigrator } from './migration/data-migrator';
import { performanceMonitor } from './monitoring/performance-monitor';
import { Notebook, Page, UserConfig } from './schemas/firestore';
import { VersionData } from './schemas/version';

// Mock Firebase
vi.mock('../auth/firebase', () => ({
  db: {},
  auth: {
    onAuthStateChanged: vi.fn((callback) => {
      // Simulate authenticated user
      callback({ uid: 'test-user-123' });
      return () => {}; // unsubscribe function
    }),
  },
}));

// Mock Firestore functions
const mockAddDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockOnSnapshot = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockWriteBatch = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ id: 'test-collection' })),
  doc: vi.fn(() => ({ id: 'test-doc' })),
  addDoc: mockAddDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  onSnapshot: mockOnSnapshot,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  writeBatch: mockWriteBatch,
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  },
}));

describe('Firestore Integration Tests', () => {
  const testUserId = 'test-user-123';
  const testNotebookId = 'test-notebook-123';
  const testPageId = 'test-page-123';

  beforeEach(() => {
    vi.clearAllMocks();
    firestoreService.clearPerformanceMetrics();
    performanceMonitor.clearAlerts();
  });

  afterEach(() => {
    firestoreService.cleanup();
    syncManager.cleanup();
  });

  describe('End-to-End Notebook Operations', () => {
    it('should create, read, update, and delete a notebook', async () => {
      // Create notebook
      const mockDocRef = { id: testNotebookId };
      mockAddDoc.mockResolvedValue(mockDocRef);

      const notebookData = {
        title: 'Test Notebook',
        description: 'Test Description',
        userId: testUserId,
        isPinned: false,
      };

      const createdNotebook = await firestoreService.createNotebook(notebookData);
      expect(createdNotebook.id).toBe(testNotebookId);
      expect(createdNotebook.title).toBe('Test Notebook');

      // Read notebook
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          title: 'Test Notebook',
          description: 'Test Description',
          userId: testUserId,
          isPinned: false,
          createdAt: { seconds: 1000, nanoseconds: 0 },
          updatedAt: { seconds: 1000, nanoseconds: 0 },
          revisionId: 'rev-123',
        }),
      };
      mockGetDoc.mockResolvedValue(mockDocSnap);

      const retrievedNotebook = await firestoreService.getNotebook(testNotebookId);
      expect(retrievedNotebook).toBeTruthy();
      expect(retrievedNotebook?.title).toBe('Test Notebook');

      // Update notebook
      mockUpdateDoc.mockResolvedValue(undefined);
      await firestoreService.updateNotebook(testNotebookId, {
        title: 'Updated Notebook',
        description: 'Updated Description',
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Updated Notebook',
          description: 'Updated Description',
          revisionId: expect.any(String),
        })
      );

      // Delete notebook
      mockDeleteDoc.mockResolvedValue(undefined);
      await firestoreService.deleteNotebook(testNotebookId);
      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('End-to-End Page Operations', () => {
    it('should create, read, update, and delete a page', async () => {
      // Create page
      const mockDocRef = { id: testPageId };
      mockAddDoc.mockResolvedValue(mockDocRef);

      const pageData = {
        title: 'Test Page',
        content: 'Test Content',
        notebookId: testNotebookId,
        userId: testUserId,
        isPinned: false,
      };

      const createdPage = await firestoreService.createPage(pageData);
      expect(createdPage.id).toBe(testPageId);
      expect(createdPage.title).toBe('Test Page');

      // Read page
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          title: 'Test Page',
          content: 'Test Content',
          notebookId: testNotebookId,
          userId: testUserId,
          isPinned: false,
          createdAt: { seconds: 1000, nanoseconds: 0 },
          updatedAt: { seconds: 1000, nanoseconds: 0 },
          revisionId: 'rev-123',
        }),
      };
      mockGetDoc.mockResolvedValue(mockDocSnap);

      const retrievedPage = await firestoreService.getPage(testPageId);
      expect(retrievedPage).toBeTruthy();
      expect(retrievedPage?.title).toBe('Test Page');

      // Update page
      mockUpdateDoc.mockResolvedValue(undefined);
      await firestoreService.updatePage(testPageId, {
        title: 'Updated Page',
        content: 'Updated Content',
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Updated Page',
          content: 'Updated Content',
          revisionId: expect.any(String),
        })
      );

      // Delete page
      mockDeleteDoc.mockResolvedValue(undefined);
      await firestoreService.deletePage(testPageId);
      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('Real-time Synchronization', () => {
    it('should handle real-time updates for notebooks and pages', async () => {
      const notebookCallback = vi.fn();
      const pageCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      // Mock real-time listeners
      mockOnSnapshot.mockImplementation((query, onNext, onError) => {
        const mockSnapshot = {
          forEach: vi.fn((forEachCallback) => {
            forEachCallback({
              id: 'notebook-1',
              data: () => ({
                title: 'Real-time Notebook',
                userId: testUserId,
                isPinned: false,
                createdAt: { seconds: 1000, nanoseconds: 0 },
                updatedAt: { seconds: 1000, nanoseconds: 0 },
                revisionId: 'rev-1',
              }),
            });
          }),
        };
        onNext(mockSnapshot);
        return mockUnsubscribe;
      });

      mockQuery.mockReturnValue({});
      mockWhere.mockReturnValue({});
      mockOrderBy.mockReturnValue({});

      // Set up listeners
      const unsubscribeNotebooks = firestoreService.subscribeToNotebooks(
        testUserId,
        notebookCallback
      );

      expect(notebookCallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'notebook-1',
            title: 'Real-time Notebook',
            userId: testUserId,
          }),
        ])
      );

      // Clean up
      unsubscribeNotebooks();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate data before and after operations', async () => {
      const validNotebook: Notebook = {
        id: testNotebookId,
        title: 'Valid Notebook',
        description: 'Valid Description',
        createdAt: { seconds: 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        userId: testUserId,
        revisionId: 'rev-123',
        isPinned: false,
      };

      const invalidNotebook = {
        id: testNotebookId,
        title: '', // Invalid: empty title
        userId: testUserId,
        isPinned: 'invalid', // Invalid: should be boolean
      };

      // Validate valid notebook
      const validResult = dataValidator.validateNotebook(validNotebook);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Validate invalid notebook
      const invalidResult = dataValidator.validateNotebook(invalidNotebook);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);

      // Test sanitization
      const sanitized = dataValidator.sanitizeNotebook({
        title: '  Test Title  ',
        description: '  Test Description  ',
        userId: '  user-123  ',
        isPinned: true,
      });

      expect(sanitized.title).toBe('Test Title');
      expect(sanitized.description).toBe('Test Description');
      expect(sanitized.userId).toBe('user-123');
      expect(sanitized.isPinned).toBe(true);
    });
  });

  describe('Sync Manager Integration', () => {
    it('should handle sync operations with error handling', async () => {
      const mockNotebook: Notebook = {
        id: testNotebookId,
        title: 'Sync Test Notebook',
        createdAt: { seconds: 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        userId: testUserId,
        revisionId: 'rev-123',
        isPinned: false,
      };

      // Mock successful sync
      mockUpdateDoc.mockResolvedValue(undefined);

      await syncManager.syncNotebook(mockNotebook);

      // Check sync status
      const syncStatus = syncManager.getSyncStatus(testUserId);
      expect(syncStatus).toBeTruthy();
      expect(syncStatus?.state).toBe('synced');
    });

    it('should handle offline queue operations', () => {
      const operation = {
        type: 'create' as const,
        collection: 'notebooks',
        documentId: 'test-notebook',
        data: { title: 'Offline Notebook' },
      };

      syncManager.queueOfflineOperation(operation);

      const queueStatus = syncManager.getOfflineQueueStatus();
      expect(queueStatus.totalOperations).toBe(1);
    });
  });

  describe('Data Migration Integration', () => {
    it('should migrate user data successfully', async () => {
      // Mock existing data
      const mockNotebooks = [
        {
          id: 'notebook-1',
          title: '  Test Notebook  ', // Needs sanitization
          userId: testUserId,
          isPinned: false,
          createdAt: { seconds: 1000, nanoseconds: 0 },
          updatedAt: { seconds: 1000, nanoseconds: 0 },
          revisionId: 'rev-1',
        },
      ];

      const mockPages = [
        {
          id: 'page-1',
          notebookId: 'notebook-1',
          title: '  Test Page  ', // Needs sanitization
          content: 'Test Content',
          userId: testUserId,
          isPinned: false,
          createdAt: { seconds: 1000, nanoseconds: 0 },
          updatedAt: { seconds: 1000, nanoseconds: 0 },
          revisionId: 'rev-1',
        },
      ];

      // Mock Firestore service methods
      mockGetDocs.mockResolvedValue({
        forEach: vi.fn((callback) => {
          mockNotebooks.forEach(notebook => {
            callback({
              id: notebook.id,
              data: () => notebook,
            });
          });
        }),
      });

      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await dataMigrator.migrateUserData(testUserId);

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBeGreaterThan(0);
    });

    it('should validate data integrity', async () => {
      const notebooks: Notebook[] = [
        {
          id: 'notebook-1',
          title: 'Notebook 1',
          createdAt: { seconds: 1000, nanoseconds: 0 } as any,
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
          userId: testUserId,
          revisionId: 'rev-1',
          isPinned: false,
        },
      ];

      const pages: Page[] = [
        {
          id: 'page-1',
          notebookId: 'notebook-1',
          title: 'Page 1',
          content: 'Content 1',
          createdAt: { seconds: 1000, nanoseconds: 0 } as any,
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
          userId: testUserId,
          revisionId: 'rev-1',
          isPinned: false,
        },
      ];

      const result = dataValidator.validateDataIntegrity(notebooks, pages);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should monitor Firestore operations', async () => {
      const mockDocRef = { id: 'test-doc' };
      mockAddDoc.mockResolvedValue(mockDocRef);

      // Perform operations to generate metrics
      await firestoreService.createNotebook({
        title: 'Performance Test Notebook',
        userId: testUserId,
        isPinned: false,
      });

      const metrics = firestoreService.getPerformanceMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      const report = performanceMonitor.getPerformanceReport();
      expect(report.totalOperations).toBeGreaterThan(0);
      expect(report.averageResponseTime).toBeGreaterThan(0);
    });

    it('should detect performance issues', () => {
      // Simulate slow operation
      const slowMetric = {
        operationType: 'slowOperation',
        duration: 2000, // 2 seconds
        timestamp: new Date(),
        success: true,
      };

      firestoreService['performanceMetrics'].push(slowMetric);
      performanceMonitor.checkPerformanceIssues();

      const alerts = performanceMonitor.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('slow_operation');
    });
  });

  describe('Version History Integration', () => {
    it('should save and retrieve version history', async () => {
      const version: VersionData = {
        id: 'version-123',
        pageId: testPageId,
        content: 'Version content',
        timestamp: new Date(),
        author: testUserId,
        changeSummary: 'Test change',
        fileSize: 100,
        revisionId: 'rev-123',
      };

      mockAddDoc.mockResolvedValue({ id: 'version-123' });
      await firestoreService.saveVersion(version);

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: 'version-123',
          pageId: testPageId,
          content: 'Version content',
          author: testUserId,
          changeSummary: 'Test change',
          fileSize: 100,
          revisionId: 'rev-123',
        })
      );

      // Test version history retrieval
      const mockQuerySnapshot = {
        forEach: vi.fn((callback) => {
          callback({
            id: 'version-123',
            data: () => ({
              pageId: testPageId,
              content: 'Version content',
              timestamp: { seconds: 1000, nanoseconds: 0 },
              author: testUserId,
              changeSummary: 'Test change',
              fileSize: 100,
              revisionId: 'rev-123',
            }),
          });
        }),
      };
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);
      mockQuery.mockReturnValue({});
      mockWhere.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockLimit.mockReturnValue({});

      const versions = await firestoreService.getVersionHistory(testPageId);
      expect(versions).toHaveLength(1);
      expect(versions[0].id).toBe('version-123');
    });
  });

  describe('Batch Operations Integration', () => {
    it('should execute batch operations successfully', async () => {
      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      mockWriteBatch.mockReturnValue(mockBatch);

      const operations = [
        {
          type: 'create' as const,
          collection: 'notebooks',
          documentId: 'notebook-1',
          data: { title: 'Batch Notebook 1' },
        },
        {
          type: 'create' as const,
          collection: 'notebooks',
          documentId: 'notebook-2',
          data: { title: 'Batch Notebook 2' },
        },
        {
          type: 'update' as const,
          collection: 'pages',
          documentId: 'page-1',
          data: { title: 'Updated Page' },
        },
      ];

      await firestoreService.executeBatch(operations);

      expect(mockBatch.set).toHaveBeenCalledTimes(2);
      expect(mockBatch.update).toHaveBeenCalledTimes(1);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Configuration Integration', () => {
    it('should handle user configuration operations', async () => {
      const config: UserConfig = {
        selectedFolder: {
          id: 'folder-123',
          name: 'My Folder',
          breadcrumb: ['Root', 'Documents'],
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        },
      };

      // Test get user config
      const mockDocSnap = {
        exists: () => true,
        data: () => config,
      };
      mockGetDoc.mockResolvedValue(mockDocSnap);

      const retrievedConfig = await firestoreService.getUserConfig(testUserId);
      expect(retrievedConfig).toEqual(config);

      // Test update user config
      mockUpdateDoc.mockResolvedValue(undefined);
      await firestoreService.updateUserConfig(testUserId, {
        selectedFolder: {
          id: 'folder-456',
          name: 'Updated Folder',
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        },
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          selectedFolder: {
            id: 'folder-456',
            name: 'Updated Folder',
            updatedAt: expect.anything(),
          },
        })
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle Firestore errors gracefully', async () => {
      mockAddDoc.mockRejectedValue(new Error('Firestore connection error'));

      await expect(
        firestoreService.createNotebook({
          title: 'Error Test Notebook',
          userId: testUserId,
          isPinned: false,
        })
      ).rejects.toThrow();

      const metrics = firestoreService.getPerformanceMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].error).toContain('Firestore connection error');
    });
  });
});

