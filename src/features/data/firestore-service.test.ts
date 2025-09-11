import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { firestoreService } from './firestore-service';
import { Notebook, Page, UserConfig } from './schemas/firestore';
import { VersionData } from './schemas/version';

// Mock Firebase
vi.mock('../auth/firebase', () => ({
  db: {},
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

describe('FirestoreService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestoreService.clearPerformanceMetrics();
  });

  afterEach(() => {
    firestoreService.cleanup();
  });

  describe('createNotebook', () => {
    it('should create a new notebook successfully', async () => {
      const mockDocRef = { id: 'notebook-123' };
      mockAddDoc.mockResolvedValue(mockDocRef);

      const notebookData = {
        title: 'Test Notebook',
        description: 'Test Description',
        userId: 'user-123',
        isPinned: false,
      };

      const result = await firestoreService.createNotebook(notebookData);

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Test Notebook',
          description: 'Test Description',
          userId: 'user-123',
          isPinned: false,
          revisionId: expect.any(String),
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: 'notebook-123',
          title: 'Test Notebook',
          description: 'Test Description',
          userId: 'user-123',
          isPinned: false,
        })
      );
    });

    it('should handle creation errors', async () => {
      mockAddDoc.mockRejectedValue(new Error('Firestore error'));

      const notebookData = {
        title: 'Test Notebook',
        userId: 'user-123',
        isPinned: false,
      };

      await expect(firestoreService.createNotebook(notebookData)).rejects.toThrow();
    });
  });

  describe('getNotebook', () => {
    it('should get an existing notebook', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          title: 'Test Notebook',
          description: 'Test Description',
          userId: 'user-123',
          isPinned: false,
          createdAt: { seconds: 1000, nanoseconds: 0 },
          updatedAt: { seconds: 1000, nanoseconds: 0 },
          revisionId: 'rev-123',
        }),
      };
      mockGetDoc.mockResolvedValue(mockDocSnap);

      const result = await firestoreService.getNotebook('notebook-123');

      expect(mockGetDoc).toHaveBeenCalledWith(expect.anything());
      expect(result).toEqual(
        expect.objectContaining({
          id: 'notebook-123',
          title: 'Test Notebook',
          description: 'Test Description',
          userId: 'user-123',
          isPinned: false,
        })
      );
    });

    it('should return null for non-existent notebook', async () => {
      const mockDocSnap = {
        exists: () => false,
      };
      mockGetDoc.mockResolvedValue(mockDocSnap);

      const result = await firestoreService.getNotebook('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getNotebooks', () => {
    it('should get all notebooks for a user', async () => {
      const mockQuerySnapshot = {
        forEach: vi.fn((callback) => {
          callback({
            id: 'notebook-1',
            data: () => ({
              title: 'Notebook 1',
              userId: 'user-123',
              isPinned: false,
              createdAt: { seconds: 1000, nanoseconds: 0 },
              updatedAt: { seconds: 1000, nanoseconds: 0 },
              revisionId: 'rev-1',
            }),
          });
          callback({
            id: 'notebook-2',
            data: () => ({
              title: 'Notebook 2',
              userId: 'user-123',
              isPinned: true,
              createdAt: { seconds: 1000, nanoseconds: 0 },
              updatedAt: { seconds: 1000, nanoseconds: 0 },
              revisionId: 'rev-2',
            }),
          });
        }),
      };
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);
      mockQuery.mockReturnValue({});
      mockWhere.mockReturnValue({});
      mockOrderBy.mockReturnValue({});

      const result = await firestoreService.getNotebooks('user-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'notebook-1',
          title: 'Notebook 1',
          userId: 'user-123',
        })
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          id: 'notebook-2',
          title: 'Notebook 2',
          userId: 'user-123',
          isPinned: true,
        })
      );
    });
  });

  describe('updateNotebook', () => {
    it('should update a notebook successfully', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const updates = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      await firestoreService.updateNotebook('notebook-123', updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated Description',
          revisionId: expect.any(String),
        })
      );
    });
  });

  describe('deleteNotebook', () => {
    it('should delete a notebook successfully', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);

      await firestoreService.deleteNotebook('notebook-123');

      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('createPage', () => {
    it('should create a new page successfully', async () => {
      const mockDocRef = { id: 'page-123' };
      mockAddDoc.mockResolvedValue(mockDocRef);

      const pageData = {
        title: 'Test Page',
        content: 'Test Content',
        notebookId: 'notebook-123',
        userId: 'user-123',
        isPinned: false,
      };

      const result = await firestoreService.createPage(pageData);

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Test Page',
          content: 'Test Content',
          notebookId: 'notebook-123',
          userId: 'user-123',
          isPinned: false,
          revisionId: expect.any(String),
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: 'page-123',
          title: 'Test Page',
          content: 'Test Content',
          notebookId: 'notebook-123',
          userId: 'user-123',
          isPinned: false,
        })
      );
    });
  });

  describe('getPage', () => {
    it('should get an existing page', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          title: 'Test Page',
          content: 'Test Content',
          notebookId: 'notebook-123',
          userId: 'user-123',
          isPinned: false,
          createdAt: { seconds: 1000, nanoseconds: 0 },
          updatedAt: { seconds: 1000, nanoseconds: 0 },
          revisionId: 'rev-123',
        }),
      };
      mockGetDoc.mockResolvedValue(mockDocSnap);

      const result = await firestoreService.getPage('page-123');

      expect(result).toEqual(
        expect.objectContaining({
          id: 'page-123',
          title: 'Test Page',
          content: 'Test Content',
          notebookId: 'notebook-123',
          userId: 'user-123',
          isPinned: false,
        })
      );
    });
  });

  describe('getPages', () => {
    it('should get all pages for a notebook', async () => {
      const mockQuerySnapshot = {
        forEach: vi.fn((callback) => {
          callback({
            id: 'page-1',
            data: () => ({
              title: 'Page 1',
              content: 'Content 1',
              notebookId: 'notebook-123',
              userId: 'user-123',
              isPinned: false,
              createdAt: { seconds: 1000, nanoseconds: 0 },
              updatedAt: { seconds: 1000, nanoseconds: 0 },
              revisionId: 'rev-1',
            }),
          });
        }),
      };
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);
      mockQuery.mockReturnValue({});
      mockWhere.mockReturnValue({});
      mockOrderBy.mockReturnValue({});

      const result = await firestoreService.getPages('notebook-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'page-1',
          title: 'Page 1',
          content: 'Content 1',
          notebookId: 'notebook-123',
          userId: 'user-123',
        })
      );
    });
  });

  describe('updatePage', () => {
    it('should update a page successfully', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const updates = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      await firestoreService.updatePage('page-123', updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Updated Title',
          content: 'Updated Content',
          revisionId: expect.any(String),
        })
      );
    });
  });

  describe('deletePage', () => {
    it('should delete a page successfully', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);

      await firestoreService.deletePage('page-123');

      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('subscribeToNotebooks', () => {
    it('should set up real-time listener for notebooks', () => {
      const callback = vi.fn();
      const onError = vi.fn();
      const mockUnsubscribe = vi.fn();

      mockOnSnapshot.mockImplementation((query, onNext, onErrorCallback) => {
        // Simulate data
        const mockSnapshot = {
          forEach: vi.fn((forEachCallback) => {
            forEachCallback({
              id: 'notebook-1',
              data: () => ({
                title: 'Notebook 1',
                userId: 'user-123',
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

      const unsubscribe = firestoreService.subscribeToNotebooks('user-123', callback, onError);

      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'notebook-1',
            title: 'Notebook 1',
            userId: 'user-123',
          }),
        ])
      );

      // Test unsubscribe
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('subscribeToPages', () => {
    it('should set up real-time listener for pages', () => {
      const callback = vi.fn();
      const onError = vi.fn();
      const mockUnsubscribe = vi.fn();

      mockOnSnapshot.mockImplementation((query, onNext, onErrorCallback) => {
        // Simulate data
        const mockSnapshot = {
          forEach: vi.fn((forEachCallback) => {
            forEachCallback({
              id: 'page-1',
              data: () => ({
                title: 'Page 1',
                content: 'Content 1',
                notebookId: 'notebook-123',
                userId: 'user-123',
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

      const unsubscribe = firestoreService.subscribeToPages('notebook-123', callback, onError);

      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'page-1',
            title: 'Page 1',
            content: 'Content 1',
            notebookId: 'notebook-123',
            userId: 'user-123',
          }),
        ])
      );

      // Test unsubscribe
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('executeBatch', () => {
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
          data: { title: 'New Notebook' },
        },
        {
          type: 'update' as const,
          collection: 'pages',
          documentId: 'page-1',
          data: { title: 'Updated Page' },
        },
        {
          type: 'delete' as const,
          collection: 'notebooks',
          documentId: 'notebook-2',
        },
      ];

      await firestoreService.executeBatch(operations);

      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.delete).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('getUserConfig', () => {
    it('should get user configuration', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          selectedFolder: {
            id: 'folder-123',
            name: 'My Folder',
            breadcrumb: ['Root', 'Documents'],
            updatedAt: { seconds: 1000, nanoseconds: 0 },
          },
        }),
      };
      mockGetDoc.mockResolvedValue(mockDocSnap);

      const result = await firestoreService.getUserConfig('user-123');

      expect(result).toEqual(
        expect.objectContaining({
          selectedFolder: {
            id: 'folder-123',
            name: 'My Folder',
            breadcrumb: ['Root', 'Documents'],
            updatedAt: expect.anything(),
          },
        })
      );
    });
  });

  describe('updateUserConfig', () => {
    it('should update user configuration', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const config = {
        selectedFolder: {
          id: 'folder-123',
          name: 'Updated Folder',
          updatedAt: { seconds: 1000, nanoseconds: 0 },
        },
      };

      await firestoreService.updateUserConfig('user-123', config);

      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), config);
    });
  });

  describe('saveVersion', () => {
    it('should save version data', async () => {
      mockAddDoc.mockResolvedValue({ id: 'version-123' });

      const version: VersionData = {
        id: 'version-123',
        pageId: 'page-123',
        content: 'Version content',
        timestamp: new Date(),
        author: 'user-123',
        changeSummary: 'Test change',
        fileSize: 100,
        revisionId: 'rev-123',
      };

      await firestoreService.saveVersion(version);

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: 'version-123',
          pageId: 'page-123',
          content: 'Version content',
          author: 'user-123',
          changeSummary: 'Test change',
          fileSize: 100,
          revisionId: 'rev-123',
        })
      );
    });
  });

  describe('getVersionHistory', () => {
    it('should get version history for a page', async () => {
      const mockQuerySnapshot = {
        forEach: vi.fn((callback) => {
          callback({
            id: 'version-1',
            data: () => ({
              pageId: 'page-123',
              content: 'Version 1 content',
              timestamp: { seconds: 1000, nanoseconds: 0 },
              author: 'user-123',
              changeSummary: 'Initial version',
              fileSize: 100,
              revisionId: 'rev-1',
            }),
          });
        }),
      };
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);
      mockQuery.mockReturnValue({});
      mockWhere.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockLimit.mockReturnValue({});

      const result = await firestoreService.getVersionHistory('page-123', 10);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'version-1',
          pageId: 'page-123',
          content: 'Version 1 content',
          author: 'user-123',
          changeSummary: 'Initial version',
          fileSize: 100,
          revisionId: 'rev-1',
        })
      );
    });
  });

  describe('performance metrics', () => {
    it('should record performance metrics', async () => {
      const mockDocRef = { id: 'notebook-123' };
      mockAddDoc.mockResolvedValue(mockDocRef);

      const notebookData = {
        title: 'Test Notebook',
        userId: 'user-123',
        isPinned: false,
      };

      await firestoreService.createNotebook(notebookData);

      const metrics = firestoreService.getPerformanceMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual(
        expect.objectContaining({
          operationType: 'createNotebook',
          success: true,
          duration: expect.any(Number),
          timestamp: expect.any(Date),
        })
      );
    });

    it('should clear performance metrics', () => {
      firestoreService.clearPerformanceMetrics();
      const metrics = firestoreService.getPerformanceMetrics();
      expect(metrics).toHaveLength(0);
    });
  });

  describe('cleanup', () => {
    it('should cleanup all listeners', () => {
      const mockUnsubscribe = vi.fn();
      firestoreService['listeners'].set('test-listener', mockUnsubscribe);

      firestoreService.cleanup();

      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(firestoreService['listeners'].size).toBe(0);
    });
  });
});
