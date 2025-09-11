import { describe, it, expect } from 'vitest';
import { dataValidator } from './data-validator';
import { Notebook, Page, UserConfig, SyncStatus } from '../schemas/firestore';
import { VersionData } from '../schemas/version';

describe('DataValidator', () => {
  describe('validateNotebook', () => {
    it('should validate a valid notebook', () => {
      const notebook: Notebook = {
        id: 'notebook-123',
        title: 'Test Notebook',
        description: 'Test Description',
        createdAt: { seconds: 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        userId: 'user-123',
        revisionId: 'rev-123',
        isPinned: false,
      };

      const result = dataValidator.validateNotebook(notebook);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject notebook with missing required fields', () => {
      const invalidNotebook = {
        id: 'notebook-123',
        // Missing title, userId, etc.
      };

      const result = dataValidator.validateNotebook(invalidNotebook);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject notebook with invalid field types', () => {
      const invalidNotebook = {
        id: 'notebook-123',
        title: 123, // Should be string
        description: 'Test Description',
        createdAt: { seconds: 1000, nanoseconds: 0 },
        updatedAt: { seconds: 1000, nanoseconds: 0 },
        userId: 'user-123',
        revisionId: 'rev-123',
        isPinned: 'true', // Should be boolean
      };

      const result = dataValidator.validateNotebook(invalidNotebook);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate warnings for long titles', () => {
      const notebook: Notebook = {
        id: 'notebook-123',
        title: 'A'.repeat(150), // Very long title
        description: 'Test Description',
        createdAt: { seconds: 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        userId: 'user-123',
        revisionId: 'rev-123',
        isPinned: false,
      };

      const result = dataValidator.validateNotebook(notebook);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('title is quite long');
    });
  });

  describe('validatePage', () => {
    it('should validate a valid page', () => {
      const page: Page = {
        id: 'page-123',
        notebookId: 'notebook-123',
        title: 'Test Page',
        content: 'Test Content',
        createdAt: { seconds: 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        userId: 'user-123',
        revisionId: 'rev-123',
        isPinned: false,
      };

      const result = dataValidator.validatePage(page);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject page with missing required fields', () => {
      const invalidPage = {
        id: 'page-123',
        // Missing notebookId, title, content, etc.
      };

      const result = dataValidator.validatePage(invalidPage);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate warnings for empty content', () => {
      const page: Page = {
        id: 'page-123',
        notebookId: 'notebook-123',
        title: 'Test Page',
        content: '', // Empty content
        createdAt: { seconds: 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        userId: 'user-123',
        revisionId: 'rev-123',
        isPinned: false,
      };

      const result = dataValidator.validatePage(page);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('content is empty');
    });

    it('should generate warnings for large content', () => {
      const page: Page = {
        id: 'page-123',
        notebookId: 'notebook-123',
        title: 'Test Page',
        content: 'A'.repeat(150000), // Very large content
        createdAt: { seconds: 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        userId: 'user-123',
        revisionId: 'rev-123',
        isPinned: false,
      };

      const result = dataValidator.validatePage(page);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('content is very large');
    });
  });

  describe('validateUserConfig', () => {
    it('should validate a valid user config', () => {
      const config: UserConfig = {
        selectedFolder: {
          id: 'folder-123',
          name: 'My Folder',
          breadcrumb: ['Root', 'Documents'],
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        },
      };

      const result = dataValidator.validateUserConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject config with missing required fields', () => {
      const invalidConfig = {
        selectedFolder: {
          // Missing id
          name: 'My Folder',
        },
      };

      const result = dataValidator.validateUserConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate warnings for deep breadcrumb', () => {
      const config: UserConfig = {
        selectedFolder: {
          id: 'folder-123',
          name: 'My Folder',
          breadcrumb: ['Root', 'Level1', 'Level2', 'Level3', 'Level4', 'Level5', 'Level6'], // Deep breadcrumb
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        },
      };

      const result = dataValidator.validateUserConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Breadcrumb path is quite deep');
    });
  });

  describe('validateSyncStatus', () => {
    it('should validate a valid sync status', () => {
      const status: SyncStatus = {
        state: 'synced',
        lastSync: new Date(),
        pendingOperations: 0,
      };

      const result = dataValidator.validateSyncStatus(status);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid sync state', () => {
      const invalidStatus = {
        state: 'invalid_state', // Invalid state
        pendingOperations: 0,
      };

      const result = dataValidator.validateSyncStatus(invalidStatus);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate warnings for high pending operations', () => {
      const status: SyncStatus = {
        state: 'syncing',
        pendingOperations: 15, // High number
      };

      const result = dataValidator.validateSyncStatus(status);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('High number of pending operations');
    });

    it('should generate warnings for error state without error message', () => {
      const status: SyncStatus = {
        state: 'error',
        pendingOperations: 0,
        // Missing error message
      };

      const result = dataValidator.validateSyncStatus(status);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('no error message provided');
    });
  });

  describe('validateVersion', () => {
    it('should validate a valid version', () => {
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

      const result = dataValidator.validateVersion(version);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject version with missing required fields', () => {
      const invalidVersion = {
        id: 'version-123',
        // Missing pageId, content, author, etc.
      };

      const result = dataValidator.validateVersion(invalidVersion);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate warnings for large file size', () => {
      const version: VersionData = {
        id: 'version-123',
        pageId: 'page-123',
        content: 'Version content',
        timestamp: new Date(),
        author: 'user-123',
        changeSummary: 'Test change',
        fileSize: 2000000, // Large file size
        revisionId: 'rev-123',
      };

      const result = dataValidator.validateVersion(version);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('file size is quite large');
    });

    it('should generate warnings for empty content', () => {
      const version: VersionData = {
        id: 'version-123',
        pageId: 'page-123',
        content: '', // Empty content
        timestamp: new Date(),
        author: 'user-123',
        changeSummary: 'Test change',
        fileSize: 0,
        revisionId: 'rev-123',
      };

      const result = dataValidator.validateVersion(version);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('content is empty');
    });

    it('should generate warnings for missing change summary', () => {
      const version: VersionData = {
        id: 'version-123',
        pageId: 'page-123',
        content: 'Version content',
        timestamp: new Date(),
        author: 'user-123',
        // Missing changeSummary
        fileSize: 100,
        revisionId: 'rev-123',
      };

      const result = dataValidator.validateVersion(version);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('No change summary provided');
    });
  });

  describe('validateMultiple', () => {
    it('should validate multiple data types', () => {
      const notebook: Notebook = {
        id: 'notebook-123',
        title: 'Test Notebook',
        createdAt: { seconds: 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        userId: 'user-123',
        revisionId: 'rev-123',
        isPinned: false,
      };

      const page: Page = {
        id: 'page-123',
        notebookId: 'notebook-123',
        title: 'Test Page',
        content: 'Test Content',
        createdAt: { seconds: 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
        userId: 'user-123',
        revisionId: 'rev-123',
        isPinned: false,
      };

      const data = [
        { type: 'notebook', data: notebook },
        { type: 'page', data: page },
      ];

      const results = dataValidator.validateMultiple(data);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
    });

    it('should handle unknown data types', () => {
      const data = [
        { type: 'unknown', data: {} },
      ];

      const results = dataValidator.validateMultiple(data);

      expect(results).toHaveLength(1);
      expect(results[0].isValid).toBe(false);
      expect(results[0].errors[0]).toContain('Unknown data type: unknown');
    });
  });

  describe('sanitizeNotebook', () => {
    it('should sanitize notebook data', () => {
      const data = {
        title: '  Test Notebook  ',
        description: '  Test Description  ',
        userId: '  user-123  ',
        isPinned: true,
        invalidField: 'should be removed',
      };

      const sanitized = dataValidator.sanitizeNotebook(data);

      expect(sanitized.title).toBe('Test Notebook');
      expect(sanitized.description).toBe('Test Description');
      expect(sanitized.userId).toBe('user-123');
      expect(sanitized.isPinned).toBe(true);
      expect(sanitized.invalidField).toBeUndefined();
    });

    it('should truncate long titles', () => {
      const data = {
        title: 'A'.repeat(250), // Very long title
      };

      const sanitized = dataValidator.sanitizeNotebook(data);

      expect(sanitized.title).toHaveLength(200);
    });
  });

  describe('sanitizePage', () => {
    it('should sanitize page data', () => {
      const data = {
        title: '  Test Page  ',
        content: '  Test Content  ',
        notebookId: '  notebook-123  ',
        userId: '  user-123  ',
        isPinned: true,
        parentPageId: '  parent-123  ',
        invalidField: 'should be removed',
      };

      const sanitized = dataValidator.sanitizePage(data);

      expect(sanitized.title).toBe('Test Page');
      expect(sanitized.content).toBe('Test Content');
      expect(sanitized.notebookId).toBe('notebook-123');
      expect(sanitized.userId).toBe('user-123');
      expect(sanitized.isPinned).toBe(true);
      expect(sanitized.parentPageId).toBe('parent-123');
      expect(sanitized.invalidField).toBeUndefined();
    });
  });

  describe('sanitizeUserConfig', () => {
    it('should sanitize user config data', () => {
      const data = {
        selectedFolder: {
          id: '  folder-123  ',
          name: '  My Folder  ',
          breadcrumb: ['  Root  ', '  Documents  ', '  Subfolder  '],
        },
      };

      const sanitized = dataValidator.sanitizeUserConfig(data);

      expect(sanitized.selectedFolder?.id).toBe('folder-123');
      expect(sanitized.selectedFolder?.name).toBe('My Folder');
      expect(sanitized.selectedFolder?.breadcrumb).toEqual(['Root', 'Documents', 'Subfolder']);
    });

    it('should limit breadcrumb items', () => {
      const data = {
        selectedFolder: {
          id: 'folder-123',
          breadcrumb: Array.from({ length: 15 }, (_, i) => `Level${i}`), // 15 items
        },
      };

      const sanitized = dataValidator.sanitizeUserConfig(data);

      expect(sanitized.selectedFolder?.breadcrumb).toHaveLength(10);
    });
  });

  describe('validateDataIntegrity', () => {
    it('should validate data integrity successfully', () => {
      const notebooks: Notebook[] = [
        {
          id: 'notebook-1',
          title: 'Notebook 1',
          createdAt: { seconds: 1000, nanoseconds: 0 } as any,
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
          userId: 'user-123',
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
          userId: 'user-123',
          revisionId: 'rev-1',
          isPinned: false,
        },
      ];

      const result = dataValidator.validateDataIntegrity(notebooks, pages);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect orphaned pages', () => {
      const notebooks: Notebook[] = [
        {
          id: 'notebook-1',
          title: 'Notebook 1',
          createdAt: { seconds: 1000, nanoseconds: 0 } as any,
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
          userId: 'user-123',
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
          userId: 'user-123',
          revisionId: 'rev-1',
          isPinned: false,
        },
        {
          id: 'page-2',
          notebookId: 'non-existent-notebook', // Orphaned page
          title: 'Page 2',
          content: 'Content 2',
          createdAt: { seconds: 1000, nanoseconds: 0 } as any,
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
          userId: 'user-123',
          revisionId: 'rev-2',
          isPinned: false,
        },
      ];

      const result = dataValidator.validateDataIntegrity(notebooks, pages);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('orphaned pages');
    });

    it('should detect invalid parent page references', () => {
      const notebooks: Notebook[] = [
        {
          id: 'notebook-1',
          title: 'Notebook 1',
          createdAt: { seconds: 1000, nanoseconds: 0 } as any,
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
          userId: 'user-123',
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
          userId: 'user-123',
          revisionId: 'rev-1',
          isPinned: false,
        },
        {
          id: 'page-2',
          notebookId: 'notebook-1',
          title: 'Page 2',
          content: 'Content 2',
          createdAt: { seconds: 1000, nanoseconds: 0 } as any,
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
          userId: 'user-123',
          revisionId: 'rev-2',
          isPinned: false,
          parentPageId: 'non-existent-page', // Invalid parent reference
        },
      ];

      const result = dataValidator.validateDataIntegrity(notebooks, pages);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('invalid parent page references');
    });

    it('should detect circular parent page references', () => {
      const notebooks: Notebook[] = [
        {
          id: 'notebook-1',
          title: 'Notebook 1',
          createdAt: { seconds: 1000, nanoseconds: 0 } as any,
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
          userId: 'user-123',
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
          userId: 'user-123',
          revisionId: 'rev-1',
          isPinned: false,
          parentPageId: 'page-2', // Circular reference
        },
        {
          id: 'page-2',
          notebookId: 'notebook-1',
          title: 'Page 2',
          content: 'Content 2',
          createdAt: { seconds: 1000, nanoseconds: 0 } as any,
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
          userId: 'user-123',
          revisionId: 'rev-2',
          isPinned: false,
          parentPageId: 'page-1', // Circular reference
        },
      ];

      const result = dataValidator.validateDataIntegrity(notebooks, pages);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('circular parent page references');
    });

    it('should detect duplicate revision IDs', () => {
      const notebooks: Notebook[] = [
        {
          id: 'notebook-1',
          title: 'Notebook 1',
          createdAt: { seconds: 1000, nanoseconds: 0 } as any,
          updatedAt: { seconds: 1000, nanoseconds: 0 } as any,
          userId: 'user-123',
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
          userId: 'user-123',
          revisionId: 'rev-1', // Duplicate revision ID
          isPinned: false,
        },
      ];

      const result = dataValidator.validateDataIntegrity(notebooks, pages);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('duplicate revision IDs');
    });
  });
});
