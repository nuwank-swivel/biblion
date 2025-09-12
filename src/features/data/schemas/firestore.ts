import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// User configuration data model
export const UserConfigSchema = z.object({
  selectedFolder: z.object({
    id: z.string(), // Drive folderId (canonical)
    name: z.string().optional(), // display-only
    breadcrumb: z.array(z.string()).optional(),
    updatedAt: z.instanceof(Timestamp),
  }),
});

export type UserConfig = z.infer<typeof UserConfigSchema>;

// Notebook data model
export const NotebookSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
  userId: z.string(),
  revisionId: z.string(),
  pinned: z.boolean().default(false),
});

export type Notebook = z.infer<typeof NotebookSchema>;

// Page data model
export const PageSchema = z.object({
  id: z.string(),
  notebookId: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
  userId: z.string(),
  revisionId: z.string(),
  pinned: z.boolean().default(false),
  parentPageId: z.string().optional(), // for hierarchical structure
});

export type Page = z.infer<typeof PageSchema>;

// Sync status model
export const SyncStatusSchema = z.object({
  state: z.enum(['idle', 'syncing', 'synced', 'error']),
  lastSync: z.date().optional(),
  error: z.string().optional(),
  pendingOperations: z.number().default(0),
});

export type SyncStatus = z.infer<typeof SyncStatusSchema>;

// Firestore document reference types
export const FirestoreDocumentSchema = z.object({
  id: z.string(),
  path: z.string(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});

export type FirestoreDocument = z.infer<typeof FirestoreDocumentSchema>;

// Query parameters for Firestore operations
export const FirestoreQuerySchema = z.object({
  limit: z.number().default(50),
  offset: z.number().default(0),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
  where: z.array(z.object({
    field: z.string(),
    operator: z.enum(['==', '!=', '<', '<=', '>', '>=', 'in', 'not-in', 'array-contains', 'array-contains-any']),
    value: z.any(),
  })).optional(),
});

export type FirestoreQuery = z.infer<typeof FirestoreQuerySchema>;

// Batch operation types
export const BatchOperationSchema = z.object({
  type: z.enum(['create', 'update', 'delete']),
  collection: z.string(),
  documentId: z.string(),
  data: z.any().optional(),
});

export type BatchOperation = z.infer<typeof BatchOperationSchema>;

// Error handling types
export const FirestoreErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.date(),
});

export type FirestoreError = z.infer<typeof FirestoreErrorSchema>;

// Offline queue item
export const OfflineQueueItemSchema = z.object({
  id: z.string(),
  operation: BatchOperationSchema,
  timestamp: z.date(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
});

export type OfflineQueueItem = z.infer<typeof OfflineQueueItemSchema>;

// Data validation result
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// Performance metrics
export const PerformanceMetricsSchema = z.object({
  operationType: z.string(),
  duration: z.number(),
  timestamp: z.date(),
  success: z.boolean(),
  error: z.string().optional(),
});

export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;

