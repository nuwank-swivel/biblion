import { ConflictDetector } from './conflict-detector';
import { ConflictData, ConflictDetectionResult } from '../data/schemas/conflict';

// Mock Firestore service
jest.mock('../data/firestore-service', () => ({
  firestoreService: {
    getPage: jest.fn(),
    updatePage: jest.fn(),
  },
}));

// Mock version manager
jest.mock('./version-manager', () => ({
  versionManager: {
    createVersion: jest.fn(),
  },
}));

describe('ConflictDetector', () => {
  let conflictDetector: ConflictDetector;

  beforeEach(() => {
    conflictDetector = new ConflictDetector();
  });

  afterEach(() => {
    conflictDetector.destroy();
  });

  describe('startConflictMonitoring', () => {
    it('should start monitoring a note for conflicts', () => {
      const noteId = 'test-note-1';
      const userId = 'user-1';

      conflictDetector.startConflictMonitoring(noteId, userId);

      const conflictState = conflictDetector.getConflictState(noteId);
      expect(conflictState).toBeDefined();
      expect(conflictState?.editingUsers).toContain(userId);
    });

    it('should add multiple users to editing users', () => {
      const noteId = 'test-note-1';
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      conflictDetector.startConflictMonitoring(noteId, userId1);
      conflictDetector.startConflictMonitoring(noteId, userId2);

      const conflictState = conflictDetector.getConflictState(noteId);
      expect(conflictState?.editingUsers).toContain(userId1);
      expect(conflictState?.editingUsers).toContain(userId2);
    });
  });

  describe('stopConflictMonitoring', () => {
    it('should stop monitoring a note for conflicts', () => {
      const noteId = 'test-note-1';
      const userId = 'user-1';

      conflictDetector.startConflictMonitoring(noteId, userId);
      conflictDetector.stopConflictMonitoring(noteId, userId);

      const conflictState = conflictDetector.getConflictState(noteId);
      expect(conflictState).toBeUndefined();
    });

    it('should remove only the specified user', () => {
      const noteId = 'test-note-1';
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      conflictDetector.startConflictMonitoring(noteId, userId1);
      conflictDetector.startConflictMonitoring(noteId, userId2);
      conflictDetector.stopConflictMonitoring(noteId, userId1);

      const conflictState = conflictDetector.getConflictState(noteId);
      expect(conflictState?.editingUsers).not.toContain(userId1);
      expect(conflictState?.editingUsers).toContain(userId2);
    });
  });

  describe('detectConflict', () => {
    it('should not detect conflict when no other users are editing', async () => {
      const noteId = 'test-note-1';
      const userId = 'user-1';
      const content = 'Test content';

      const result = await conflictDetector.detectConflict(
        noteId,
        content,
        userId,
        new Date()
      );

      expect(result.hasConflict).toBe(false);
    });

    it('should not detect conflict for minor changes', async () => {
      const noteId = 'test-note-1';
      const userId = 'user-1';
      const content1 = 'Test content';
      const content2 = 'Test content.'; // Minor change

      // Mock Firestore service to return a page
      const { firestoreService } = require('../data/firestore-service');
      firestoreService.getPage.mockResolvedValue({
        id: noteId,
        content: content1,
        userId: 'user-2',
        updatedAt: { toDate: () => new Date() },
      });

      const result = await conflictDetector.detectConflict(
        noteId,
        content2,
        userId,
        new Date()
      );

      expect(result.hasConflict).toBe(false);
    });

    it('should detect conflict for significant changes with multiple users', async () => {
      const noteId = 'test-note-1';
      const userId1 = 'user-1';
      const userId2 = 'user-2';
      const content1 = 'Original content';
      const content2 = 'Completely different content';

      // Start monitoring with both users
      conflictDetector.startConflictMonitoring(noteId, userId1);
      conflictDetector.startConflictMonitoring(noteId, userId2);

      // Mock Firestore service
      const { firestoreService } = require('../data/firestore-service');
      firestoreService.getPage.mockResolvedValue({
        id: noteId,
        content: content1,
        userId: userId1,
        updatedAt: { toDate: () => new Date() },
      });

      const result = await conflictDetector.detectConflict(
        noteId,
        content2,
        userId2,
        new Date()
      );

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingUsers).toContain(userId1);
      expect(result.conflictingUsers).toContain(userId2);
    });
  });

  describe('calculateContentDiff', () => {
    it('should calculate diff between two content versions', () => {
      const oldContent = 'Hello world';
      const newContent = 'Hello beautiful world';

      // Access private method for testing
      const diff = (conflictDetector as any).calculateContentDiff(oldContent, newContent);

      expect(diff.added).toContain('beautiful');
      expect(diff.unchanged).toContain('Hello');
      expect(diff.unchanged).toContain('world');
      expect(diff.diffPercentage).toBeGreaterThan(0);
    });

    it('should handle identical content', () => {
      const content = 'Identical content';

      const diff = (conflictDetector as any).calculateContentDiff(content, content);

      expect(diff.added).toHaveLength(0);
      expect(diff.removed).toHaveLength(0);
      expect(diff.modified).toHaveLength(0);
      expect(diff.diffPercentage).toBe(0);
    });
  });

  describe('calculateConflictSeverity', () => {
    it('should calculate correct severity levels', () => {
      const lowDiff = { diffPercentage: 0.05 } as any;
      const mediumDiff = { diffPercentage: 0.2 } as any;
      const highDiff = { diffPercentage: 0.5 } as any;
      const criticalDiff = { diffPercentage: 0.8 } as any;

      expect((conflictDetector as any).calculateConflictSeverity(lowDiff)).toBe('low');
      expect((conflictDetector as any).calculateConflictSeverity(mediumDiff)).toBe('medium');
      expect((conflictDetector as any).calculateConflictSeverity(highDiff)).toBe('high');
      expect((conflictDetector as any).calculateConflictSeverity(criticalDiff)).toBe('critical');
    });
  });

  describe('subscribeToConflicts', () => {
    it('should subscribe to conflict events', () => {
      const noteId = 'test-note-1';
      const callback = jest.fn();

      const unsubscribe = conflictDetector.subscribeToConflicts(noteId, callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe from conflict events', () => {
      const noteId = 'test-note-1';
      const callback = jest.fn();

      const unsubscribe = conflictDetector.subscribeToConflicts(noteId, callback);
      unsubscribe();

      // Should not throw error when unsubscribing
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('getActiveConflicts', () => {
    it('should return active conflicts for a note', () => {
      const noteId = 'test-note-1';
      const conflicts = conflictDetector.getActiveConflicts(noteId);

      expect(Array.isArray(conflicts)).toBe(true);
    });
  });

  describe('getResolutionStrategies', () => {
    it('should return available resolution strategies', () => {
      const strategies = conflictDetector.getResolutionStrategies();

      expect(Array.isArray(strategies)).toBe(true);
      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies[0]).toHaveProperty('name');
      expect(strategies[0]).toHaveProperty('description');
      expect(strategies[0]).toHaveProperty('canAutoResolve');
    });
  });

  describe('destroy', () => {
    it('should cleanup all resources', () => {
      const noteId = 'test-note-1';
      const userId = 'user-1';

      conflictDetector.startConflictMonitoring(noteId, userId);
      conflictDetector.destroy();

      const conflictState = conflictDetector.getConflictState(noteId);
      expect(conflictState).toBeUndefined();
    });
  });
});
