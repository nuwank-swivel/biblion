import { z } from 'zod';

// Version data model
export const VersionDataSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  content: z.string(),
  timestamp: z.date(),
  author: z.string(),
  changeSummary: z.string().optional(),
  fileSize: z.number(),
  revisionId: z.string(),
});

export type VersionData = z.infer<typeof VersionDataSchema>;

// Save status model
export const SaveStatusSchema = z.object({
  state: z.enum(['idle', 'saving', 'saved', 'error']),
  lastSaved: z.date().optional(),
  error: z.string().optional(),
  retryCount: z.number(),
});

export type SaveStatus = z.infer<typeof SaveStatusSchema>;

// Auto-save configuration
export const AutoSaveConfigSchema = z.object({
  intervalMs: z.number().default(2000), // 2 seconds
  maxRetries: z.number().default(3),
  debounceMs: z.number().default(500),
});

export type AutoSaveConfig = z.infer<typeof AutoSaveConfigSchema>;

// Version history query parameters
export const VersionHistoryQuerySchema = z.object({
  pageId: z.string(),
  limit: z.number().default(50),
  offset: z.number().default(0),
});

export type VersionHistoryQuery = z.infer<typeof VersionHistoryQuerySchema>;
