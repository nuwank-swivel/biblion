/**
 * Compression data schemas and types
 */

export interface CompressionConfig {
  algorithm: 'gzip' | 'brotli' | 'none';
  threshold: number; // Minimum size to compress (bytes)
  level: number; // Compression level (1-9)
  enabled: boolean;
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  ratio: number;
  algorithm: string;
  compressionTime: number;
  success: boolean;
  error?: string;
}

export interface CompressionStats {
  totalCompressed: number;
  totalOriginal: number;
  averageRatio: number;
  compressionCount: number;
  failureCount: number;
  lastCompression?: Date;
  averageCompressionTime: number;
}

export interface CompressionCache {
  [key: string]: {
    compressed: Uint8Array;
    originalSize: number;
    compressedSize: number;
    timestamp: number;
    algorithm: string;
  };
}

export interface CompressionOptions {
  algorithm?: 'gzip' | 'brotli' | 'auto';
  level?: number;
  threshold?: number;
  useCache?: boolean;
  timeout?: number;
}

export interface DecompressionResult {
  data: string;
  originalSize: number;
  decompressionTime: number;
  success: boolean;
  error?: string;
}

export interface CompressionMetrics {
  compressionRatio: number;
  compressionTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  errorRate: number;
}

export type CompressionAlgorithm = 'gzip' | 'brotli' | 'none';

export type ContentType = 'text' | 'html' | 'json' | 'markdown' | 'rich-text';

export interface ContentCompressionOptions extends CompressionOptions {
  contentType?: ContentType;
  preserveFormatting?: boolean;
}

export interface VersionCompressionOptions extends CompressionOptions {
  useDeltaCompression?: boolean;
  baseVersion?: string;
}

export interface LocalStorageCompressionOptions extends CompressionOptions {
  maxCacheSize?: number;
  compressionThreshold?: number;
  enableSelectiveCompression?: boolean;
}
