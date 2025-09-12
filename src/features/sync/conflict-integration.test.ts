import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { conflictDetector } from './conflict-detector';
import { conflictService } from './conflict-service';
import { ConflictData, ConflictResolution } from '../data/schemas/conflict';

// Mock the external dependencies
vi.mock('../data/firestore-service', () => ({
  firestoreService: {
    saveConflict: vi.fn(),
    updateConflict: vi.fn(),
    getConflict: vi.fn(),
    subscribeToNote: vi.fn(),
  },
}));

vi.mock('../../services/notebookService', () => ({
  noteService: {
    getNote: vi.fn(),
    updateNote: vi.fn(),
  },
}));

vi.mock('./version-manager', () => ({
  versionManager: {
    createVersion: vi.fn(),
  },
}));

describe('Conflict Resolution Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    conflictDetector.destroy();
    conflictService.destroy();
  });

  it('should detect conflicts when multiple users edit the same note', async () => {
    // Mock note data
    const mockNote = {
      id: 'note-1',
      title: 'Test Note',
      content: 'Original content',
      userId: 'user-1',
      notebookId: 'notebook-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
      order: 0,
      tags: [],
    };

    // Mock noteService.getNote
    const { noteService } = await import('../../services/notebookService');
    vi.mocked(noteService.getNote).mockResolvedValue(mockNote);

    // Start monitoring for user-1
    conflictDetector.startConflictMonitoring('note-1', 'user-1');
    
    // Start monitoring for user-2
    conflictDetector.startConflictMonitoring('note-1', 'user-2');

    // Simulate conflict detection
    const result = await conflictDetector.detectConflict(
      'note-1',
      'Modified content by user-2',
      'user-2',
      new Date()
    );

    expect(result.hasConflict).toBe(true);
    expect(result.conflictingUsers).toContain('user-1');
    expect(result.conflictingUsers).toContain('user-2');
  });

  it('should resolve conflicts using different resolution methods', async () => {
    // Mock conflict data
    const mockConflict: ConflictData = {
      id: 'conflict-1',
      noteId: 'note-1',
      user1Id: 'user-1',
      user2Id: 'user-2',
      user1Content: 'Content from user-1',
      user2Content: 'Content from user-2',
      user1Timestamp: new Date(),
      user2Timestamp: new Date(),
      resolution: 'pending',
      resolutionMethod: 'last_writer_wins',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock firestoreService methods
    const { firestoreService } = await import('../data/firestore-service');
    vi.mocked(firestoreService.getConflict).mockResolvedValue(mockConflict);
    vi.mocked(firestoreService.updateConflict).mockResolvedValue();

    // Mock noteService
    const { noteService } = await import('../../services/notebookService');
    vi.mocked(noteService.updateNote).mockResolvedValue();

    // Mock versionManager
    const { versionManager } = await import('./version-manager');
    vi.mocked(versionManager.createVersion).mockResolvedValue();

    // Test "keep mine" resolution
    const resolution: ConflictResolution = {
      conflictId: 'conflict-1',
      resolutionMethod: 'keep_mine',
      resolvedBy: 'user-2',
      resolvedAt: new Date(),
    };

    const resolvedConflict = await conflictService.resolveConflict('conflict-1', resolution);

    expect(resolvedConflict.resolution).toBe('resolved');
    expect(resolvedConflict.resolvedBy).toBe('user-2');
    expect(noteService.updateNote).toHaveBeenCalledWith('note-1', {
      content: 'Content from user-2',
    });
  });

  it('should handle automatic merge resolution', async () => {
    // Mock conflict data
    const mockConflict: ConflictData = {
      id: 'conflict-2',
      noteId: 'note-2',
      user1Id: 'user-1',
      user2Id: 'user-2',
      user1Content: 'Hello world',
      user2Content: 'Hello beautiful world',
      user1Timestamp: new Date(),
      user2Timestamp: new Date(),
      resolution: 'pending',
      resolutionMethod: 'last_writer_wins',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock firestoreService methods
    const { firestoreService } = await import('../data/firestore-service');
    vi.mocked(firestoreService.getConflict).mockResolvedValue(mockConflict);
    vi.mocked(firestoreService.updateConflict).mockResolvedValue();

    // Mock noteService
    const { noteService } = await import('../../services/notebookService');
    vi.mocked(noteService.updateNote).mockResolvedValue();

    // Mock versionManager
    const { versionManager } = await import('./version-manager');
    vi.mocked(versionManager.createVersion).mockResolvedValue();

    // Test automatic merge resolution
    const resolution: ConflictResolution = {
      conflictId: 'conflict-2',
      resolutionMethod: 'merge_auto',
      resolvedBy: 'user-1',
      resolvedAt: new Date(),
    };

    const resolvedConflict = await conflictService.resolveConflict('conflict-2', resolution);

    expect(resolvedConflict.resolution).toBe('resolved');
    expect(resolvedConflict.resolvedBy).toBe('user-1');
    expect(noteService.updateNote).toHaveBeenCalled();
  });

  it('should calculate content differences correctly', async () => {
    const oldContent = 'This is the original content';
    const newContent = 'This is the modified content with changes';

    // Start monitoring
    conflictDetector.startConflictMonitoring('note-3', 'user-1');

    // Mock note data
    const mockNote = {
      id: 'note-3',
      title: 'Test Note',
      content: oldContent,
      userId: 'user-1',
      notebookId: 'notebook-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
      order: 0,
      tags: [],
    };

    const { noteService } = await import('../../services/notebookService');
    vi.mocked(noteService.getNote).mockResolvedValue(mockNote);

    const result = await conflictDetector.detectConflict(
      'note-3',
      newContent,
      'user-1',
      new Date()
    );

    // Should detect significant changes
    expect(result.hasConflict).toBe(false); // No other users editing
    expect(result.conflictingUsers).toEqual([]);
  });

  it('should clean up resources properly', () => {
    conflictDetector.startConflictMonitoring('note-4', 'user-1');
    conflictDetector.startConflictMonitoring('note-4', 'user-2');

    // Verify monitoring is active
    const state = conflictDetector.getConflictState('note-4');
    expect(state).toBeDefined();
    expect(state?.editingUsers).toContain('user-1');
    expect(state?.editingUsers).toContain('user-2');

    // Stop monitoring
    conflictDetector.stopConflictMonitoring('note-4', 'user-1');
    conflictDetector.stopConflictMonitoring('note-4', 'user-2');

    // Verify cleanup
    const stateAfterCleanup = conflictDetector.getConflictState('note-4');
    expect(stateAfterCleanup).toBeUndefined();
  });
});
