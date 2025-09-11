import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VersionManager } from './version-manager';
import { noteService } from '../../services/notebookService';

// Mock the note service
vi.mock('../../services/notebookService', () => ({
  noteService: {
    updateNote: vi.fn(),
  },
}));

describe('VersionManager', () => {
  let versionManager: VersionManager;
  const mockUpdateNote = vi.mocked(noteService.updateNote);

  beforeEach(() => {
    versionManager = new VersionManager();
    vi.clearAllMocks();
  });

  describe('createVersion', () => {
    it('should create a new version with all required fields', async () => {
      const pageId = 'test-page-1';
      const content = 'Test content';
      const author = 'test@example.com';
      const changeSummary = 'Test change';

      const version = await versionManager.createVersion(
        pageId,
        content,
        author,
        changeSummary
      );

      expect(version).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          pageId,
          content,
          author,
          changeSummary,
          timestamp: expect.any(Date),
          fileSize: expect.any(Number),
          revisionId: expect.any(String),
        })
      );
    });

    it('should generate unique IDs for each version', async () => {
      const pageId = 'test-page-1';
      const content = 'Test content';
      const author = 'test@example.com';

      const version1 = await versionManager.createVersion(pageId, content, author);
      const version2 = await versionManager.createVersion(pageId, content, author);

      expect(version1.id).not.toBe(version2.id);
      expect(version1.revisionId).not.toBe(version2.revisionId);
    });

    it('should calculate correct file size', async () => {
      const pageId = 'test-page-1';
      const content = 'Test content with some length';
      const author = 'test@example.com';

      const version = await versionManager.createVersion(pageId, content, author);

      expect(version.fileSize).toBeGreaterThan(0);
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history for a page', async () => {
      const pageId = 'test-page-1';
      const author = 'test@example.com';

      // Create multiple versions
      await versionManager.createVersion(pageId, 'content1', author);
      await versionManager.createVersion(pageId, 'content2', author);
      await versionManager.createVersion(pageId, 'content3', author);

      const history = await versionManager.getVersionHistory({
        pageId,
        limit: 10,
        offset: 0,
      });

      expect(history).toHaveLength(3);
      expect(history[0].content).toBe('content3'); // Most recent first
    });

    it('should respect limit and offset parameters', async () => {
      const pageId = 'test-page-1';
      const author = 'test@example.com';

      // Create 5 versions
      for (let i = 1; i <= 5; i++) {
        await versionManager.createVersion(pageId, `content${i}`, author);
      }

      const history = await versionManager.getVersionHistory({
        pageId,
        limit: 2,
        offset: 1,
      });

      expect(history).toHaveLength(2);
      expect(history[0].content).toBe('content4'); // Offset 1, so skip first
    });
  });

  describe('getVersion', () => {
    it('should return specific version by ID', async () => {
      const pageId = 'test-page-1';
      const author = 'test@example.com';

      const version = await versionManager.createVersion(pageId, 'content', author);
      const retrievedVersion = await versionManager.getVersion(version.id);

      expect(retrievedVersion).toEqual(version);
    });

    it('should return null for non-existent version', async () => {
      const version = await versionManager.getVersion('non-existent-id');
      expect(version).toBeNull();
    });
  });

  describe('restoreVersion', () => {
    it('should restore a version and create new version', async () => {
      const pageId = 'test-page-1';
      const author = 'test@example.com';
      const originalContent = 'Original content';

      mockUpdateNote.mockResolvedValue(undefined);

      const version = await versionManager.createVersion(
        pageId,
        originalContent,
        author
      );

      await versionManager.restoreVersion(version.id);

      expect(mockUpdateNote).toHaveBeenCalledWith(pageId, {
        title: '',
        content: originalContent,
      });
    });

    it('should throw error for non-existent version', async () => {
      await expect(
        versionManager.restoreVersion('non-existent-id')
      ).rejects.toThrow('Version non-existent-id not found');
    });
  });

  describe('compareVersions', () => {
    it('should compare two versions and return diff', async () => {
      const pageId = 'test-page-1';
      const author = 'test@example.com';

      const version1 = await versionManager.createVersion(
        pageId,
        'Hello world',
        author
      );
      const version2 = await versionManager.createVersion(
        pageId,
        'Hello universe',
        author
      );

      const comparison = versionManager.compareVersions(version1.id, version2.id);

      expect(comparison).toEqual(
        expect.objectContaining({
          version1,
          version2,
          diff: expect.objectContaining({
            added: expect.any(Array),
            removed: expect.any(Array),
            modified: expect.any(Array),
          }),
        })
      );
    });

    it('should return null for non-existent versions', () => {
      const comparison = versionManager.compareVersions(
        'non-existent-1',
        'non-existent-2'
      );
      expect(comparison).toBeNull();
    });
  });

  describe('getVersionStats', () => {
    it('should return version statistics', async () => {
      const pageId = 'test-page-1';
      const author = 'test@example.com';

      await versionManager.createVersion(pageId, 'content1', author);
      await versionManager.createVersion(pageId, 'content2', author);

      const stats = versionManager.getVersionStats(pageId);

      expect(stats).toEqual(
        expect.objectContaining({
          totalVersions: 2,
          totalSize: expect.any(Number),
          oldestVersion: expect.any(Date),
          newestVersion: expect.any(Date),
        })
      );
    });

    it('should return zero stats for page with no versions', () => {
      const stats = versionManager.getVersionStats('non-existent-page');
      expect(stats).toEqual({
        totalVersions: 0,
        totalSize: 0,
      });
    });
  });

  describe('cleanupOldVersions', () => {
    it('should limit versions to maxVersionsPerPage', async () => {
      const pageId = 'test-page-1';
      const author = 'test@example.com';

      // Create more versions than the limit (50)
      for (let i = 1; i <= 55; i++) {
        await versionManager.createVersion(pageId, `content${i}`, author);
      }

      const history = await versionManager.getVersionHistory({
        pageId,
        limit: 100,
        offset: 0,
      });

      expect(history).toHaveLength(50);
    });
  });

  describe('clearVersions', () => {
    it('should clear all versions for a page', async () => {
      const pageId = 'test-page-1';
      const author = 'test@example.com';

      await versionManager.createVersion(pageId, 'content', author);
      versionManager.clearVersions(pageId);

      const history = await versionManager.getVersionHistory({
        pageId,
        limit: 10,
        offset: 0,
      });

      expect(history).toHaveLength(0);
    });
  });
});
