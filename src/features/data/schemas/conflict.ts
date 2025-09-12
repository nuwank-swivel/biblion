import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Conflict data model
export const ConflictDataSchema = z.object({
  id: z.string(),
  noteId: z.string(),
  user1Id: z.string(),
  user2Id: z.string(),
  user1Content: z.string(),
  user2Content: z.string(),
  user1Timestamp: z.date(),
  user2Timestamp: z.date(),
  resolution: z.enum(['pending', 'resolved', 'merged']),
  resolvedBy: z.string().optional(),
  resolvedAt: z.date().optional(),
  resolutionMethod: z.enum(['last_writer_wins', 'manual_merge', 'user_choice']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ConflictData = z.infer<typeof ConflictDataSchema>;

// Conflict resolution options
export const ConflictResolutionSchema = z.object({
  conflictId: z.string(),
  resolutionMethod: z.enum(['keep_mine', 'keep_theirs', 'merge_manual', 'merge_auto']),
  mergedContent: z.string().optional(),
  resolvedBy: z.string(),
  resolvedAt: z.date(),
  notes: z.string().optional(),
});

export type ConflictResolution = z.infer<typeof ConflictResolutionSchema>;

// Conflict detection result
export const ConflictDetectionResultSchema = z.object({
  hasConflict: z.boolean(),
  conflictId: z.string().optional(),
  conflictingUsers: z.array(z.string()),
  conflictType: z.enum(['content', 'structure', 'metadata']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  detectedAt: z.date(),
  details: z.string().optional(),
});

export type ConflictDetectionResult = z.infer<typeof ConflictDetectionResultSchema>;

// Conflict notification
export const ConflictNotificationSchema = z.object({
  id: z.string(),
  conflictId: z.string(),
  userId: z.string(),
  type: z.enum(['conflict_detected', 'conflict_resolved', 'manual_resolution_required']),
  message: z.string(),
  isRead: z.boolean().default(false),
  createdAt: z.date(),
  data: z.any().optional(),
});

export type ConflictNotification = z.infer<typeof ConflictNotificationSchema>;

// Conflict resolution preferences
export const ConflictResolutionPreferencesSchema = z.object({
  userId: z.string(),
  defaultResolutionMethod: z.enum(['last_writer_wins', 'manual_merge', 'ask_user']),
  autoResolveThreshold: z.number().default(5000), // milliseconds
  enableNotifications: z.boolean().default(true),
  enableSoundNotifications: z.boolean().default(false),
  conflictHistoryRetentionDays: z.number().default(30),
});

export type ConflictResolutionPreferences = z.infer<typeof ConflictResolutionPreferencesSchema>;

// Conflict audit log
export const ConflictAuditLogSchema = z.object({
  id: z.string(),
  conflictId: z.string(),
  action: z.enum(['detected', 'resolved', 'escalated', 'ignored']),
  userId: z.string(),
  timestamp: z.date(),
  details: z.string(),
  metadata: z.any().optional(),
});

export type ConflictAuditLog = z.infer<typeof ConflictAuditLogSchema>;

// Content diff result
export const ContentDiffSchema = z.object({
  added: z.array(z.string()),
  removed: z.array(z.string()),
  modified: z.array(z.string()),
  unchanged: z.array(z.string()),
  diffPercentage: z.number(),
  conflictSegments: z.array(z.object({
    start: z.number(),
    end: z.number(),
    type: z.enum(['addition', 'deletion', 'modification']),
    content: z.string(),
  })),
});

export type ContentDiff = z.infer<typeof ContentDiffSchema>;

// Conflict resolution strategy
export const ConflictResolutionStrategySchema = z.object({
  name: z.string(),
  description: z.string(),
  canAutoResolve: z.boolean(),
  requiresUserInput: z.boolean(),
  priority: z.number(),
  conditions: z.array(z.string()),
});

export type ConflictResolutionStrategy = z.infer<typeof ConflictResolutionStrategySchema>;

// Real-time conflict state
export const ConflictStateSchema = z.object({
  noteId: z.string(),
  activeConflicts: z.array(z.string()),
  editingUsers: z.array(z.string()),
  lastActivity: z.date(),
  conflictCount: z.number(),
  isResolving: z.boolean(),
});

export type ConflictState = z.infer<typeof ConflictStateSchema>;
