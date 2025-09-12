/**
 * Core compression service with gzip and brotli algorithms
 */

import {
  CompressionConfig,
  CompressionResult,
  CompressionStats,
  CompressionCache,
  CompressionOptions,
  DecompressionResult,
  CompressionAlgorithm,
  CompressionMetrics,
} from './schemas/compression';

export class CompressionService {
  private config: CompressionConfig;
  private stats: CompressionStats;
  private cache: CompressionCache;
  private cacheMaxSize: number = 100; // Maximum cache entries

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = {
      algorithm: 'gzip',
      threshold: 1024, // 1KB minimum size
      level: 6,
      enabled: true,
      ...config,
    };

    this.stats = {
      totalCompressed: 0,
      totalOriginal: 0,
      averageRatio: 0,
      compressionCount: 0,
      failureCount: 0,
      averageCompressionTime: 0,
    };

    this.cache = {};
  }

  /**
   * Compress data using the specified algorithm
   */
  async compress(
    data: string,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const startTime = performance.now();
    
    try {
      // Check if compression is enabled
      if (!this.config.enabled) {
        return this.createNoCompressionResult(data, startTime);
      }

      // Check size threshold
      const dataSize = new TextEncoder().encode(data).length;
      if (dataSize < (options.threshold || this.config.threshold)) {
        return this.createNoCompressionResult(data, startTime);
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(data, options);
      if (options.useCache !== false && this.cache[cacheKey]) {
        const cached = this.cache[cacheKey];
        return {
          originalSize: cached.originalSize,
          compressedSize: cached.compressedSize,
          ratio: cached.compressedSize / cached.originalSize,
          algorithm: cached.algorithm,
          compressionTime: 0,
          success: true,
        };
      }

      // Determine algorithm
      const algorithm = options.algorithm || this.config.algorithm;
      const level = options.level || this.config.level;

      let compressed: Uint8Array;
      let algorithmUsed: string;

      switch (algorithm) {
        case 'gzip':
          compressed = await this.compressGzip(data, level);
          algorithmUsed = 'gzip';
          break;
        case 'brotli':
          compressed = await this.compressBrotli(data, level);
          algorithmUsed = 'brotli';
          break;
        case 'auto':
          // Try both algorithms and pick the best
          const gzipResult = await this.compressGzip(data, level);
          const brotliResult = await this.compressBrotli(data, level);
          
          if (brotliResult.length < gzipResult.length) {
            compressed = brotliResult;
            algorithmUsed = 'brotli';
          } else {
            compressed = gzipResult;
            algorithmUsed = 'gzip';
          }
          break;
        default:
          return this.createNoCompressionResult(data, startTime);
      }

      const compressionTime = performance.now() - startTime;
      const compressedSize = compressed.length;
      const ratio = compressedSize / dataSize;

      // Update cache
      if (options.useCache !== false) {
        this.updateCache(cacheKey, compressed, dataSize, compressedSize, algorithmUsed);
      }

      // Update statistics
      this.updateStats(dataSize, compressedSize, compressionTime, true);

      return {
        originalSize: dataSize,
        compressedSize,
        ratio,
        algorithm: algorithmUsed,
        compressionTime,
        success: true,
      };
    } catch (error) {
      const compressionTime = performance.now() - startTime;
      this.updateStats(0, 0, compressionTime, false);
      
      return {
        originalSize: new TextEncoder().encode(data).length,
        compressedSize: 0,
        ratio: 1,
        algorithm: 'none',
        compressionTime,
        success: false,
        error: error instanceof Error ? error.message : 'Compression failed',
      };
    }
  }

  /**
   * Decompress data
   */
  async decompress(
    compressedData: Uint8Array,
    algorithm: CompressionAlgorithm = 'gzip'
  ): Promise<DecompressionResult> {
    const startTime = performance.now();
    
    try {
      let decompressed: string;

      switch (algorithm) {
        case 'gzip':
          decompressed = await this.decompressGzip(compressedData);
          break;
        case 'brotli':
          decompressed = await this.decompressBrotli(compressedData);
          break;
        default:
          throw new Error(`Unsupported decompression algorithm: ${algorithm}`);
      }

      const decompressionTime = performance.now() - startTime;
      const originalSize = new TextEncoder().encode(decompressed).length;

      return {
        data: decompressed,
        originalSize,
        decompressionTime,
        success: true,
      };
    } catch (error) {
      const decompressionTime = performance.now() - startTime;
      
      return {
        data: '',
        originalSize: 0,
        decompressionTime,
        success: false,
        error: error instanceof Error ? error.message : 'Decompression failed',
      };
    }
  }

  /**
   * Compress using gzip
   */
  private async compressGzip(data: string, level: number): Promise<Uint8Array> {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write data
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(data));
    await writer.close();

    // Read compressed data
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  /**
   * Decompress gzip data
   */
  private async decompressGzip(compressedData: Uint8Array): Promise<string> {
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write compressed data
    await writer.write(compressedData);
    await writer.close();

    // Read decompressed data
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    // Combine chunks and decode
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder().decode(result);
  }

  /**
   * Compress using brotli (if available)
   */
  private async compressBrotli(data: string, level: number): Promise<Uint8Array> {
    // Check if brotli is supported
    if (!('CompressionStream' in window) || !('brotli' in CompressionStream)) {
      throw new Error('Brotli compression not supported in this browser');
    }

    const stream = new CompressionStream('brotli');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write data
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(data));
    await writer.close();

    // Read compressed data
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  /**
   * Decompress brotli data
   */
  private async decompressBrotli(compressedData: Uint8Array): Promise<string> {
    // Check if brotli is supported
    if (!('DecompressionStream' in window) || !('brotli' in DecompressionStream)) {
      throw new Error('Brotli decompression not supported in this browser');
    }

    const stream = new DecompressionStream('brotli');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write compressed data
    await writer.write(compressedData);
    await writer.close();

    // Read decompressed data
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    // Combine chunks and decode
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder().decode(result);
  }

  /**
   * Generate cache key for data
   */
  private generateCacheKey(data: string, options: CompressionOptions): string {
    const algorithm = options.algorithm || this.config.algorithm;
    const level = options.level || this.config.level;
    return `${algorithm}-${level}-${this.hashString(data)}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Update cache with new entry
   */
  private updateCache(
    key: string,
    compressed: Uint8Array,
    originalSize: number,
    compressedSize: number,
    algorithm: string
  ): void {
    // Remove oldest entries if cache is full
    const keys = Object.keys(this.cache);
    if (keys.length >= this.cacheMaxSize) {
      const oldestKey = keys.reduce((oldest, current) => 
        this.cache[current].timestamp < this.cache[oldest].timestamp ? current : oldest
      );
      delete this.cache[oldestKey];
    }

    this.cache[key] = {
      compressed,
      originalSize,
      compressedSize,
      timestamp: Date.now(),
      algorithm,
    };
  }

  /**
   * Update compression statistics
   */
  private updateStats(
    originalSize: number,
    compressedSize: number,
    compressionTime: number,
    success: boolean
  ): void {
    if (success) {
      this.stats.compressionCount++;
      this.stats.totalOriginal += originalSize;
      this.stats.totalCompressed += compressedSize;
      this.stats.averageRatio = this.stats.totalCompressed / this.stats.totalOriginal;
      this.stats.averageCompressionTime = 
        (this.stats.averageCompressionTime * (this.stats.compressionCount - 1) + compressionTime) / 
        this.stats.compressionCount;
      this.stats.lastCompression = new Date();
    } else {
      this.stats.failureCount++;
    }
  }

  /**
   * Create result for no compression
   */
  private createNoCompressionResult(data: string, startTime: number): CompressionResult {
    const dataSize = new TextEncoder().encode(data).length;
    const compressionTime = performance.now() - startTime;
    
    return {
      originalSize: dataSize,
      compressedSize: dataSize,
      ratio: 1,
      algorithm: 'none',
      compressionTime,
      success: true,
    };
  }

  /**
   * Get current compression statistics
   */
  getStats(): CompressionStats {
    return { ...this.stats };
  }

  /**
   * Get compression metrics
   */
  getMetrics(): CompressionMetrics {
    const totalOperations = this.stats.compressionCount + this.stats.failureCount;
    const cacheHits = Object.keys(this.cache).length;
    
    return {
      compressionRatio: this.stats.averageRatio,
      compressionTime: this.stats.averageCompressionTime,
      memoryUsage: this.getMemoryUsage(),
      cacheHitRate: totalOperations > 0 ? cacheHits / totalOperations : 0,
      errorRate: totalOperations > 0 ? this.stats.failureCount / totalOperations : 0,
    };
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Clear compression cache
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Update compression configuration
   */
  updateConfig(config: Partial<CompressionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): CompressionConfig {
    return { ...this.config };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalCompressed: 0,
      totalOriginal: 0,
      averageRatio: 0,
      compressionCount: 0,
      failureCount: 0,
      averageCompressionTime: 0,
    };
  }
}

// Singleton instance
export const compressionService = new CompressionService();
