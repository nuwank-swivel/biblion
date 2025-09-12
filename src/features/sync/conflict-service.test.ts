import { ConflictService } from './conflict-service';
import { ConflictData, ConflictResolution, ConflictResolutionPreferences } from '../data/schemas/conflict';

// Mock Firestore service
jest.mock('../data/firestore-service', () => ({
  firestoreService: {
    updatePage: jest.fn(),
  },
}));

// Mock version manager
jest.mock('./version-manager', () => ({
  versionManager: {
    createVersion: jest.fn(),
  },
}));

// Mock conflict detector
jest.mock('./conflict-detector', () => ({
  conflictDetector: {
    activeConflicts: new Map(),
    calculateContentDiff: jest.fn(),
  },
}));

describe('ConflictService', () => {
  let conflictService: ConflictService;

  beforeEach(() => {
    conflictService = new ConflictService();
  });

  afterEach(() => {
    conflictService.destroy();
  });

  describe('resolveConflict', () => {
    const mockConflict: ConflictData = {
      id: 'conflict-1',
      noteId: 'note-1',
      user1Id: 'user-1',
      user2Id: 'user-2',
      user1Content: 'Original content',
      user2Content: 'Modified content',
      user1Timestamp: new Date('2023-01-01'),
      user2Timestamp: new Date('2023-01-02'),
      resolution: 'pending',
      resolutionMethod: 'last_writer_wins',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      // Mock conflict detector
      const { conflictDetector } = require('./conflict-detector');
      conflictDetector.activeConflicts.set('note-1', mockConflict);
    });

    it('should resolve conflict with keep_mine resolution', async () => {
      const resolution: ConflictResolution = {
        conflictId: 'conflict-1',
        resolutionMethod: 'keep_mine',
        resolvedBy: 'user-2',
        resolvedAt: new Date(),
      };

      const { firestoreService } = require('../data/firestore-service');
      firestoreService.updatePage.mockResolvedValue(undefined);

      const result = await conflictService.resolveConflict('conflict-1', resolution);

      expect(result.resolution).toBe('resolved');
      expect(result.resolvedBy).toBe('user-2');
      expect(result.resolutionMethod).toBe('user_choice');
      expect(firestoreService.updatePage).toHaveBeenCalledWith('note-1', {
        content: 'Modified content',
        updatedAt: expect.any(Date),
      });
    });

    it('should resolve conflict with keep_theirs resolution', async () => {
      const resolution: ConflictResolution = {
        conflictId: 'conflict-1',
        resolutionMethod: 'keep_theirs',
        resolvedBy: 'user-2',
        resolvedAt: new Date(),
      };

      const { firestoreService } = require('../data/firestore-service');
      firestoreService.updatePage.mockResolvedValue(undefined);

      const result = await conflictService.resolveConflict('conflict-1', resolution);

      expect(result.resolution).toBe('resolved');
      expect(result.resolvedBy).toBe('user-2');
      expect(result.resolutionMethod).toBe('user_choice');
      expect(firestoreService.updatePage).toHaveBeenCalledWith('note-1', {
        content: 'Original content',
        updatedAt: expect.any(Date),
      });
    });

    it('should resolve conflict with merge_manual resolution', async () => {
      const mergedContent = 'Merged content';
      const resolution: ConflictResolution = {
        conflictId: 'conflict-1',
        resolutionMethod: 'merge_manual',
        mergedContent,
        resolvedBy: 'user-2',
        resolvedAt: new Date(),
      };

      const { firestoreService } = require('../data/firestore-service');
      firestoreService.updatePage.mockResolvedValue(undefined);

      const result = await conflictService.resolveConflict('conflict-1', resolution);

      expect(result.resolution).toBe('resolved');
      expect(result.resolvedBy).toBe('user-2');
      expect(result.resolutionMethod).toBe('manual_merge');
      expect(firestoreService.updatePage).toHaveBeenCalledWith('note-1', {
        content: mergedContent,
        updatedAt: expect.any(Date),
      });
    });

    it('should throw error for non-existent conflict', async () => {
      const resolution: ConflictResolution = {
        conflictId: 'non-existent',
        resolutionMethod: 'keep_mine',
        resolvedBy: 'user-2',
        resolvedAt: new Date(),
      };

      await expect(conflictService.resolveConflict('non-existent', resolution))
        .rejects.toThrow('Conflict non-existent not found');
    });

    it('should throw error for already resolved conflict', async () => {
      const resolvedConflict = { ...mockConflict, resolution: 'resolved' as const };
      const { conflictDetector } = require('./conflict-detector');
      conflictDetector.activeConflicts.set('note-1', resolvedConflict);

      const resolution: ConflictResolution = {
        conflictId: 'conflict-1',
        resolutionMethod: 'keep_mine',
        resolvedBy: 'user-2',
        resolvedAt: new Date(),
      };

      await expect(conflictService.resolveConflict('conflict-1', resolution))
        .rejects.toThrow('Conflict conflict-1 has already been resolved');
    });
  });

  describe('performAutomaticMerge', () => {
    it('should perform automatic merge of conflicting content', async () => {
      const conflict: ConflictData = {
        id: 'conflict-1',
        noteId: 'note-1',
        user1Id: 'user-1',
        user2Id: 'user-2',
        user1Content: 'Line 1\nLine 2',
        user2Content: 'Line 1\nLine 2 Modified',
        user1Timestamp: new Date(),
        user2Timestamp: new Date(),
        resolution: 'pending',
        resolutionMethod: 'last_writer_wins',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { conflictDetector } = require('./conflict-detector');
      conflictDetector.calculateContentDiff.mockReturnValue({
        added: ['Modified'],
        removed: [],
        modified: [],
        unchanged: ['Line', '1', 'Line', '2'],
        diffPercentage: 0.2,
        conflictSegments: [],
      });

      const mergedContent = await (conflictService as any).performAutomaticMerge(conflict);

      expect(typeof mergedContent).toBe('string');
      expect(mergedContent).toContain('Line 1');
    });
  });

  describe('getUserPreferences', () => {
    it('should return default preferences for new user', async () => {
      const userId = 'new-user';
      const preferences = await conflictService.getUserPreferences(userId);

      expect(preferences.userId).toBe(userId);
      expect(preferences.defaultResolutionMethod).toBe('ask_user');
      expect(preferences.enableNotifications).toBe(true);
    });

    it('should return cached preferences for existing user', async () => {
      const userId = 'existing-user';
      const customPreferences: ConflictResolutionPreferences = {
        userId,
        defaultResolutionMethod: 'last_writer_wins',
        autoResolveThreshold: 3000,
        enableNotifications: false,
        enableSoundNotifications: true,
        conflictHistoryRetentionDays: 60,
      };

      await conflictService.updateUserPreferences(userId, customPreferences);
      const preferences = await conflictService.getUserPreferences(userId);

      expect(preferences.defaultResolutionMethod).toBe('last_writer_wins');
      expect(preferences.enableNotifications).toBe(false);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences', async () => {
      const userId = 'user-1';
      const updates = {
        defaultResolutionMethod: 'last_writer_wins' as const,
        enableNotifications: false,
      };

      await conflictService.updateUserPreferences(userId, updates);
      const preferences = await conflictService.getUserPreferences(userId);

      expect(preferences.defaultResolutionMethod).toBe('last_writer_wins');
      expect(preferences.enableNotifications).toBe(false);
    });
  });

  describe('getUserNotifications', () => {
    it('should return empty array for user with no notifications', async () => {
      const userId = 'user-1';
      const notifications = await conflictService.getUserNotifications(userId);

      expect(notifications).toEqual([]);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      const userId = 'user-1';
      const notificationId = 'notification-1';

      // This would typically be set up through the notification system
      await conflictService.markNotificationAsRead(notificationId, userId);

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs', async () => {
      const logs = await conflictService.getAuditLogs();

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter audit logs by conflict ID', async () => {
      const conflictId = 'conflict-1';
      const logs = await conflictService.getAuditLogs(conflictId);

      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe('cleanupOldData', () => {
    it('should cleanup old audit logs and notifications', async () => {
      await conflictService.cleanupOldData();

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should cleanup all resources', () => {
      conflictService.destroy();

      // Should not throw error
      expect(true).toBe(true);
    });
  });
});
