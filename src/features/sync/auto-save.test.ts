import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AutoSaveService } from './auto-save';
import { noteService } from '../../services/notebookService';

// Mock the note service
vi.mock('../../services/notebookService', () => ({
  noteService: {
    updateNote: vi.fn(),
  },
}));

describe('AutoSaveService', () => {
  let autoSaveService: AutoSaveService;
  const mockUpdateNote = vi.mocked(noteService.updateNote);

  beforeEach(() => {
    autoSaveService = new AutoSaveService({
      intervalMs: 100, // Faster for testing
      debounceMs: 50,
      maxRetries: 2,
    });
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    autoSaveService.destroy();
    vi.useRealTimers();
  });

  describe('startAutoSave', () => {
    it('should start auto-save with debounced mechanism', async () => {
      const noteId = 'test-note-1';
      const content = 'Test content';
      const title = 'Test title';

      autoSaveService.startAutoSave(noteId, content, title);

      // Should not save immediately due to debounce
      expect(mockUpdateNote).not.toHaveBeenCalled();

      // Fast-forward past debounce time
      vi.advanceTimersByTime(50);

      // Should now trigger save
      expect(mockUpdateNote).toHaveBeenCalledWith(noteId, {
        title,
        content,
      });
    });

    it('should update save status to saving then saved on success', async () => {
      const noteId = 'test-note-1';
      const content = 'Test content';
      const title = 'Test title';

      mockUpdateNote.mockResolvedValue(undefined);

      const statusCallback = vi.fn();
      autoSaveService.subscribeToSaveStatus(noteId, statusCallback);

      autoSaveService.startAutoSave(noteId, content, title);
      vi.advanceTimersByTime(50);

      // Wait for async operations
      await vi.runAllTimersAsync();

      expect(statusCallback).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'saving' })
      );
      expect(statusCallback).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'saved' })
      );
    });

    it('should handle save errors and retry', async () => {
      const noteId = 'test-note-1';
      const content = 'Test content';
      const title = 'Test title';

      mockUpdateNote.mockRejectedValue(new Error('Save failed'));

      const statusCallback = vi.fn();
      autoSaveService.subscribeToSaveStatus(noteId, statusCallback);

      autoSaveService.startAutoSave(noteId, content, title);
      vi.advanceTimersByTime(50);

      // Wait for retry attempts
      await vi.runAllTimersAsync();

      expect(statusCallback).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'error' })
      );
      expect(mockUpdateNote).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('manualSave', () => {
    it('should perform immediate save', async () => {
      const noteId = 'test-note-1';
      const content = 'Test content';
      const title = 'Test title';

      mockUpdateNote.mockResolvedValue(undefined);

      await autoSaveService.manualSave(noteId, content, title);

      expect(mockUpdateNote).toHaveBeenCalledWith(noteId, {
        title,
        content,
      });
    });

    it('should throw error on manual save failure', async () => {
      const noteId = 'test-note-1';
      const content = 'Test content';
      const title = 'Test title';

      mockUpdateNote.mockRejectedValue(new Error('Manual save failed'));

      await expect(
        autoSaveService.manualSave(noteId, content, title)
      ).rejects.toThrow('Manual save failed');
    });
  });

  describe('stopAutoSave', () => {
    it('should stop auto-save and clear timeouts', () => {
      const noteId = 'test-note-1';
      const content = 'Test content';
      const title = 'Test title';

      autoSaveService.startAutoSave(noteId, content, title);
      autoSaveService.stopAutoSave(noteId);

      vi.advanceTimersByTime(100);

      expect(mockUpdateNote).not.toHaveBeenCalled();
    });
  });

  describe('saveAllPending', () => {
    it('should save all pending changes', async () => {
      const noteId1 = 'test-note-1';
      const noteId2 = 'test-note-2';

      mockUpdateNote.mockResolvedValue(undefined);

      autoSaveService.startAutoSave(noteId1, 'content1', 'title1');
      autoSaveService.startAutoSave(noteId2, 'content2', 'title2');

      await autoSaveService.saveAllPending();

      expect(mockUpdateNote).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPendingSaves', () => {
    it('should return list of pending saves', () => {
      const noteId1 = 'test-note-1';
      const noteId2 = 'test-note-2';

      autoSaveService.startAutoSave(noteId1, 'content1', 'title1');
      autoSaveService.startAutoSave(noteId2, 'content2', 'title2');

      const pendingSaves = autoSaveService.getPendingSaves();
      expect(pendingSaves).toContain(noteId1);
      expect(pendingSaves).toContain(noteId2);
    });
  });

  describe('getSaveStatus', () => {
    it('should return current save status', () => {
      const noteId = 'test-note-1';
      const content = 'Test content';
      const title = 'Test title';

      autoSaveService.startAutoSave(noteId, content, title);

      const status = autoSaveService.getSaveStatus(noteId);
      expect(status).toEqual(
        expect.objectContaining({
          state: 'idle',
          retryCount: 0,
        })
      );
    });
  });
});
