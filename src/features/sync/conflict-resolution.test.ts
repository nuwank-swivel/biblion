import { ConflictDetector } from './conflict-detector';
import { ConflictService } from './conflict-service';
import { ConflictData, ConflictResolution } from '../data/schemas/conflict';

// Mock dependencies
jest.mock('../data/firestore-service', () => ({
  firestoreService: {
    getPage: jest.fn(),
    updatePage: jest.fn(),
    addDoc: jest.fn(),
  },
}));

jest.mock('./version-manager', () => ({
  versionManager: {
    createVersion: jest.fn(),
  },
}));

describe('Conflict Resolution Integration', () => {
  let conflictDetector: ConflictDetector;
  let conflictService: ConflictService;

  beforeEach(() => {
    conflictDetector = new ConflictDetector();
    conflictService = new ConflictService();
  });

  afterEach(() => {
    conflictDetector.destroy();
    conflictService.destroy();
  });

  describe('End-to-End Conflict Resolution Flow', () => {
    it('should handle complete conflict resolution workflow', async () => {
      const noteId = 'test-note-1';
      const user1Id = 'user-1';
      const user2Id = 'user-2';
      const originalContent = 'Original content';
      const user1Content = 'User 1 modified content';
      const user2Content = 'User 2 modified content';

      // Mock Firestore service
      const { firestoreService } = require('../data/firestore-service');
      firestoreService.getPage.mockResolvedValue({
        id: noteId,
        content: originalContent,
        userId: user1Id,
        updatedAt: { toDate: () => new Date() },
      });
      firestoreService.updatePage.mockResolvedValue(undefined);
      firestoreService.addDoc.mockResolvedValue(undefined);

      // Start monitoring for both users
      conflictDetector.startConflictMonitoring(noteId, user1Id);
      conflictDetector.startConflictMonitoring(noteId, user2Id);

      // User 2 makes changes, triggering conflict detection
      const conflictResult = await conflictDetector.detectConflict(
        noteId,
        user2Content,
        user2Id,
        new Date()
      );

      expect(conflictResult.hasConflict).toBe(true);
      expect(conflictResult.conflictingUsers).toContain(user1Id);
      expect(conflictResult.conflictingUsers).toContain(user2Id);

      // Get the created conflict
      const activeConflicts = conflictDetector.getActiveConflicts(noteId);
      expect(activeConflicts).toHaveLength(1);

      const conflict = activeConflicts[0];
      expect(conflict.resolution).toBe('pending');

      // Resolve the conflict
      const resolution: ConflictResolution = {
        conflictId: conflict.id,
        resolutionMethod: 'keep_mine',
        resolvedBy: user2Id,
        resolvedAt: new Date(),
      };

      const resolvedConflict = await conflictService.resolveConflict(conflict.id, resolution);

      expect(resolvedConflict.resolution).toBe('resolved');
      expect(resolvedConflict.resolvedBy).toBe(user2Id);
      expect(firestoreService.updatePage).toHaveBeenCalledWith(noteId, {
        content: user2Content,
        updatedAt: expect.any(Date),
      });
    });

    it('should handle manual merge resolution', async () => {
      const noteId = 'test-note-2';
      const user1Id = 'user-1';
      const user2Id = 'user-2';
      const originalContent = 'Original content';
      const user1Content = 'User 1 changes';
      const user2Content = 'User 2 changes';
      const mergedContent = 'Merged: User 1 changes + User 2 changes';

      // Mock Firestore service
      const { firestoreService } = require('../data/firestore-service');
      firestoreService.getPage.mockResolvedValue({
        id: noteId,
        content: originalContent,
        userId: user1Id,
        updatedAt: { toDate: () => new Date() },
      });
      firestoreService.updatePage.mockResolvedValue(undefined);

      // Start monitoring
      conflictDetector.startConflictMonitoring(noteId, user1Id);
      conflictDetector.startConflictMonitoring(noteId, user2Id);

      // Detect conflict
      const conflictResult = await conflictDetector.detectConflict(
        noteId,
        user2Content,
        user2Id,
        new Date()
      );

      expect(conflictResult.hasConflict).toBe(true);

      // Get conflict
      const activeConflicts = conflictDetector.getActiveConflicts(noteId);
      const conflict = activeConflicts[0];

      // Resolve with manual merge
      const resolution: ConflictResolution = {
        conflictId: conflict.id,
        resolutionMethod: 'merge_manual',
        mergedContent,
        resolvedBy: user2Id,
        resolvedAt: new Date(),
      };

      const resolvedConflict = await conflictService.resolveConflict(conflict.id, resolution);

      expect(resolvedConflict.resolution).toBe('resolved');
      expect(resolvedConflict.resolutionMethod).toBe('manual_merge');
      expect(firestoreService.updatePage).toHaveBeenCalledWith(noteId, {
        content: mergedContent,
        updatedAt: expect.any(Date),
      });
    });

    it('should handle automatic merge resolution', async () => {
      const noteId = 'test-note-3';
      const user1Id = 'user-1';
      const user2Id = 'user-2';
      const originalContent = 'Line 1\nLine 2\nLine 3';
      const user1Content = 'Line 1\nLine 2 Modified\nLine 3';
      const user2Content = 'Line 1\nLine 2\nLine 3 Modified';

      // Mock Firestore service
      const { firestoreService } = require('../data/firestore-service');
      firestoreService.getPage.mockResolvedValue({
        id: noteId,
        content: originalContent,
        userId: user1Id,
        updatedAt: { toDate: () => new Date() },
      });
      firestoreService.updatePage.mockResolvedValue(undefined);

      // Mock conflict detector's calculateContentDiff
      const { conflictDetector: mockDetector } = require('./conflict-detector');
      mockDetector.calculateContentDiff.mockReturnValue({
        added: ['Modified'],
        removed: [],
        modified: [],
        unchanged: ['Line', '1', 'Line', '2', 'Line', '3'],
        diffPercentage: 0.1,
        conflictSegments: [],
      });

      // Start monitoring
      conflictDetector.startConflictMonitoring(noteId, user1Id);
      conflictDetector.startConflictMonitoring(noteId, user2Id);

      // Detect conflict
      const conflictResult = await conflictDetector.detectConflict(
        noteId,
        user2Content,
        user2Id,
        new Date()
      );

      expect(conflictResult.hasConflict).toBe(true);

      // Get conflict
      const activeConflicts = conflictDetector.getActiveConflicts(noteId);
      const conflict = activeConflicts[0];

      // Resolve with automatic merge
      const resolution: ConflictResolution = {
        conflictId: conflict.id,
        resolutionMethod: 'merge_auto',
        resolvedBy: user2Id,
        resolvedAt: new Date(),
      };

      const resolvedConflict = await conflictService.resolveConflict(conflict.id, resolution);

      expect(resolvedConflict.resolution).toBe('resolved');
      expect(resolvedConflict.resolutionMethod).toBe('manual_merge');
      expect(firestoreService.updatePage).toHaveBeenCalled();
    });
  });

  describe('Multi-User Conflict Scenarios', () => {
    it('should handle multiple simultaneous conflicts', async () => {
      const noteId = 'test-note-4';
      const user1Id = 'user-1';
      const user2Id = 'user-2';
      const user3Id = 'user-3';

      // Mock Firestore service
      const { firestoreService } = require('../data/firestore-service');
      firestoreService.getPage.mockResolvedValue({
        id: noteId,
        content: 'Original content',
        userId: user1Id,
        updatedAt: { toDate: () => new Date() },
      });
      firestoreService.updatePage.mockResolvedValue(undefined);

      // Start monitoring for all users
      conflictDetector.startConflictMonitoring(noteId, user1Id);
      conflictDetector.startConflictMonitoring(noteId, user2Id);
      conflictDetector.startConflictMonitoring(noteId, user3Id);

      // User 2 makes changes
      const conflict1Result = await conflictDetector.detectConflict(
        noteId,
        'User 2 content',
        user2Id,
        new Date()
      );

      expect(conflict1Result.hasConflict).toBe(true);

      // User 3 makes changes (should create another conflict)
      const conflict2Result = await conflictDetector.detectConflict(
        noteId,
        'User 3 content',
        user3Id,
        new Date()
      );

      expect(conflict2Result.hasConflict).toBe(true);

      // Should have multiple active conflicts
      const activeConflicts = conflictDetector.getActiveConflicts(noteId);
      expect(activeConflicts.length).toBeGreaterThan(0);
    });

    it('should handle conflict resolution with notifications', async () => {
      const noteId = 'test-note-5';
      const user1Id = 'user-1';
      const user2Id = 'user-2';

      // Mock Firestore service
      const { firestoreService } = require('../data/firestore-service');
      firestoreService.getPage.mockResolvedValue({
        id: noteId,
        content: 'Original content',
        userId: user1Id,
        updatedAt: { toDate: () => new Date() },
      });
      firestoreService.updatePage.mockResolvedValue(undefined);
      firestoreService.addDoc.mockResolvedValue(undefined);

      // Start monitoring
      conflictDetector.startConflictMonitoring(noteId, user1Id);
      conflictDetector.startConflictMonitoring(noteId, user2Id);

      // Detect conflict
      const conflictResult = await conflictDetector.detectConflict(
        noteId,
        'User 2 content',
        user2Id,
        new Date()
      );

      expect(conflictResult.hasConflict).toBe(true);

      // Get conflict
      const activeConflicts = conflictDetector.getActiveConflicts(noteId);
      const conflict = activeConflicts[0];

      // Resolve conflict
      const resolution: ConflictResolution = {
        conflictId: conflict.id,
        resolutionMethod: 'keep_mine',
        resolvedBy: user2Id,
        resolvedAt: new Date(),
      };

      await conflictService.resolveConflict(conflict.id, resolution);

      // Check that notifications were sent
      const notifications = await conflictService.getUserNotifications(user1Id);
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].type).toBe('conflict_resolved');
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      const noteId = 'test-note-6';
      const user1Id = 'user-1';
      const user2Id = 'user-2';

      // Mock Firestore service to throw error
      const { firestoreService } = require('../data/firestore-service');
      firestoreService.getPage.mockRejectedValue(new Error('Firestore error'));

      // Start monitoring
      conflictDetector.startConflictMonitoring(noteId, user1Id);
      conflictDetector.startConflictMonitoring(noteId, user2Id);

      // Detect conflict should handle error gracefully
      const conflictResult = await conflictDetector.detectConflict(
        noteId,
        'User 2 content',
        user2Id,
        new Date()
      );

      expect(conflictResult.hasConflict).toBe(false);
      expect(conflictResult.details).toContain('Error during conflict detection');
    });

    it('should handle conflict resolution errors', async () => {
      const conflictId = 'non-existent-conflict';
      const resolution: ConflictResolution = {
        conflictId,
        resolutionMethod: 'keep_mine',
        resolvedBy: 'user-1',
        resolvedAt: new Date(),
      };

      await expect(conflictService.resolveConflict(conflictId, resolution))
        .rejects.toThrow('Conflict non-existent-conflict not found');
    });
  });

  describe('Performance', () => {
    it('should handle large content efficiently', async () => {
      const noteId = 'test-note-7';
      const user1Id = 'user-1';
      const user2Id = 'user-2';
      
      // Create large content
      const largeContent = 'Line '.repeat(1000) + 'End';
      const modifiedContent = 'Line '.repeat(1000) + 'Modified End';

      // Mock Firestore service
      const { firestoreService } = require('../data/firestore-service');
      firestoreService.getPage.mockResolvedValue({
        id: noteId,
        content: largeContent,
        userId: user1Id,
        updatedAt: { toDate: () => new Date() },
      });

      // Start monitoring
      conflictDetector.startConflictMonitoring(noteId, user1Id);
      conflictDetector.startConflictMonitoring(noteId, user2Id);

      const startTime = Date.now();

      // Detect conflict with large content
      const conflictResult = await conflictDetector.detectConflict(
        noteId,
        modifiedContent,
        user2Id,
        new Date()
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 2 seconds)
      expect(duration).toBeLessThan(2000);
      expect(conflictResult.hasConflict).toBe(true);
    });
  });
});
