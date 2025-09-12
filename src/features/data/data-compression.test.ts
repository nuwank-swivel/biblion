/**
 * Integration tests for data compression functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { compressionService } from './compression-service';
import { contentCompressionService } from './content-compression';
import { versionCompressionService } from './version-compression';
import { localStorageCompressionService } from './local-storage-compression';
import { compressionMonitor } from './monitoring/compression-monitor';
import { CompressionUtils } from '../../utils/compression-utils';

// Mock IndexedDB for local storage compression tests
const mockIndexedDB = {
  open: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

describe('Data Compression Integration', () => {
  beforeEach(() => {
    // Reset compression service state
    compressionService.resetStats();
    compressionService.clearCache();
    compressionMonitor.clearData();
  });

  describe('CompressionService', () => {
    it('should compress text data with gzip', async () => {
      const testData = 'This is a test string that should compress well. '.repeat(10);
      
      const result = await compressionService.compress(testData, {
        algorithm: 'gzip',
        level: 6,
      });

      expect(result.success).toBe(true);
      expect(result.algorithm).toBe('gzip');
      expect(result.compressedSize).toBeLessThan(result.originalSize);
      expect(result.ratio).toBeLessThan(1);
      expect(result.compressionTime).toBeGreaterThan(0);
    });

    it('should decompress gzip data correctly', async () => {
      const testData = 'This is a test string for decompression. '.repeat(10);
      
      const compressionResult = await compressionService.compress(testData, {
        algorithm: 'gzip',
      });

      expect(compressionResult.success).toBe(true);

      const decompressionResult = await compressionService.decompress(
        compressionResult.compressedData!,
        'gzip'
      );

      expect(decompressionResult.success).toBe(true);
      expect(decompressionResult.data).toBe(testData);
    });

    it('should not compress data below threshold', async () => {
      const smallData = 'small';
      
      const result = await compressionService.compress(smallData, {
        algorithm: 'gzip',
        threshold: 1000,
      });

      expect(result.success).toBe(true);
      expect(result.algorithm).toBe('none');
      expect(result.compressedSize).toBe(result.originalSize);
      expect(result.ratio).toBe(1);
    });

    it('should handle compression errors gracefully', async () => {
      // Mock compression to fail
      vi.spyOn(compressionService, 'compress').mockRejectedValue(new Error('Compression failed'));
      
      const result = await compressionService.compress('test data');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should update statistics correctly', async () => {
      const testData = 'Test data for statistics. '.repeat(20);
      
      await compressionService.compress(testData);
      await compressionService.compress(testData);
      
      const stats = compressionService.getStats();
      
      expect(stats.compressionCount).toBe(2);
      expect(stats.totalOriginal).toBeGreaterThan(0);
      expect(stats.totalCompressed).toBeGreaterThan(0);
      expect(stats.averageRatio).toBeLessThan(1);
    });
  });

  describe('ContentCompressionService', () => {
    it('should detect HTML content type', () => {
      const htmlContent = '<div><p>Hello <strong>world</strong></p></div>';
      
      const result = contentCompressionService.compressContent(htmlContent);
      
      // The service should detect this as HTML content
      expect(result).toBeDefined();
    });

    it('should detect JSON content type', () => {
      const jsonContent = '{"name": "test", "value": 123}';
      
      const result = contentCompressionService.compressContent(jsonContent);
      
      expect(result).toBeDefined();
    });

    it('should detect Markdown content type', () => {
      const markdownContent = '# Header\n\nThis is **bold** text.\n\n- List item 1\n- List item 2';
      
      const result = contentCompressionService.compressContent(markdownContent);
      
      expect(result).toBeDefined();
    });

    it('should optimize HTML content for compression', () => {
      const htmlContent = '<div>   <p>  Hello world  </p>   </div>';
      const optimized = contentCompressionService.optimizeForCompression(htmlContent, 'html');
      
      expect(optimized).not.toContain('   ');
      expect(optimized).toContain('<div><p>Hello world</p></div>');
    });

    it('should provide compression recommendations', () => {
      const content = 'This is a test content that should be compressed. '.repeat(10);
      
      const recommendations = contentCompressionService.getCompressionRecommendations(content);
      
      expect(recommendations.shouldCompress).toBe(true);
      expect(recommendations.recommendedAlgorithm).toBeDefined();
      expect(recommendations.estimatedSavings).toBeGreaterThan(0);
    });
  });

  describe('VersionCompressionService', () => {
    it('should compress version data with delta compression', async () => {
      const baseVersion = 'Line 1\nLine 2\nLine 3\nLine 4';
      const currentVersion = 'Line 1\nLine 2 Modified\nLine 3\nLine 4\nLine 5';
      
      const result = await versionCompressionService.compressVersion(
        currentVersion,
        baseVersion,
        { useDeltaCompression: true }
      );

      expect(result.success).toBe(true);
      expect(result.deltaCompression).toBe(true);
      expect(result.deltaSize).toBeLessThan(currentVersion.length);
    });

    it('should decompress delta compressed version data', async () => {
      const baseVersion = 'Line 1\nLine 2\nLine 3';
      const currentVersion = 'Line 1\nLine 2 Modified\nLine 3\nLine 4';
      
      const compressionResult = await versionCompressionService.compressVersion(
        currentVersion,
        baseVersion,
        { useDeltaCompression: true }
      );

      expect(compressionResult.success).toBe(true);

      const decompressionResult = await versionCompressionService.decompressVersion(
        compressionResult.compressedData!,
        compressionResult.algorithm,
        baseVersion,
        true
      );

      expect(decompressionResult).toBe(currentVersion);
    });

    it('should validate version integrity', () => {
      const originalData = 'Test data\nLine 2\nLine 3';
      const decompressedData = 'Test data\nLine 2\nLine 3';
      
      const validation = versionCompressionService.validateVersionIntegrity(
        originalData,
        decompressedData
      );

      expect(validation.isValid).toBe(true);
      expect(validation.similarity).toBe(1);
      expect(validation.differences).toHaveLength(0);
    });

    it('should optimize version data', () => {
      const versionData = 'Line 1\r\nLine 2\r\n\r\n\r\nLine 3   \r\n';
      const optimized = versionCompressionService.optimizeVersionData(versionData);
      
      expect(optimized).not.toContain('\r\n');
      expect(optimized).not.toContain('   ');
      expect(optimized).toBe('Line 1\nLine 2\n\nLine 3');
    });
  });

  describe('LocalStorageCompressionService', () => {
    beforeEach(() => {
      // Mock IndexedDB operations
      mockIndexedDB.open.mockResolvedValue({
        result: {
          transaction: vi.fn().mockReturnValue({
            objectStore: vi.fn().mockReturnValue({
              put: vi.fn().mockReturnValue({
                onsuccess: null,
                onerror: null,
              }),
              get: vi.fn().mockReturnValue({
                onsuccess: null,
                onerror: null,
              }),
              delete: vi.fn().mockReturnValue({
                onsuccess: null,
                onerror: null,
              }),
              clear: vi.fn().mockReturnValue({
                onsuccess: null,
                onerror: null,
              }),
              getAll: vi.fn().mockReturnValue({
                onsuccess: null,
                onerror: null,
              }),
            }),
          }),
        },
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      });
    });

    it('should store data with compression', async () => {
      const testData = { message: 'This is test data that should be compressed. '.repeat(10) };
      
      const result = await localStorageCompressionService.store('test-key', testData, {
        algorithm: 'gzip',
        compressionThreshold: 100,
      });

      expect(result.key).toBe('test-key');
      expect(result.compressed).toBe(true);
      expect(result.compressedSize).toBeLessThan(result.originalSize);
    });

    it('should retrieve and decompress data', async () => {
      const testData = { message: 'Test data for retrieval' };
      
      // Mock successful storage and retrieval
      const mockStore = {
        key: 'test-key',
        value: 'compressed-data',
        compressed: true,
        originalSize: 100,
        compressedSize: 50,
        compressionRatio: 0.5,
        timestamp: Date.now(),
        algorithm: 'gzip',
      };

      // Mock decompression
      vi.spyOn(compressionService, 'decompress').mockResolvedValue({
        data: JSON.stringify(testData),
        originalSize: 100,
        decompressionTime: 10,
        success: true,
      });

      const result = await localStorageCompressionService.retrieve('test-key');
      
      expect(result).toEqual(testData);
    });

    it('should get storage statistics', async () => {
      const stats = await localStorageCompressionService.getStats();
      
      expect(stats).toHaveProperty('totalItems');
      expect(stats).toHaveProperty('compressedItems');
      expect(stats).toHaveProperty('totalOriginalSize');
      expect(stats).toHaveProperty('totalCompressedSize');
      expect(stats).toHaveProperty('averageCompressionRatio');
    });
  });

  describe('CompressionMonitor', () => {
    it('should record compression events', () => {
      compressionMonitor.recordEvent({
        type: 'compression',
        algorithm: 'gzip',
        originalSize: 1000,
        compressedSize: 300,
        compressionTime: 50,
        success: true,
      });

      const events = compressionMonitor.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('compression');
      expect(events[0].success).toBe(true);
    });

    it('should generate performance alerts', () => {
      // Record slow compression event
      compressionMonitor.recordEvent({
        type: 'compression',
        algorithm: 'gzip',
        originalSize: 1000,
        compressedSize: 300,
        compressionTime: 6000, // 6 seconds - exceeds threshold
        success: true,
      });

      const alerts = compressionMonitor.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('performance');
      expect(alerts[0].severity).toBe('medium');
    });

    it('should calculate performance metrics', () => {
      compressionMonitor.recordEvent({
        type: 'compression',
        algorithm: 'gzip',
        originalSize: 1000,
        compressedSize: 300,
        compressionTime: 100,
        success: true,
      });

      const metrics = compressionMonitor.getPerformanceMetrics();
      
      expect(metrics.averageCompressionTime).toBe(100);
      expect(metrics.averageCompressionRatio).toBe(0.3);
      expect(metrics.errorRate).toBe(0);
    });
  });

  describe('CompressionUtils', () => {
    it('should format bytes correctly', () => {
      expect(CompressionUtils.formatBytes(0)).toBe('0 Bytes');
      expect(CompressionUtils.formatBytes(1024)).toBe('1 KB');
      expect(CompressionUtils.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(CompressionUtils.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format compression ratio correctly', () => {
      expect(CompressionUtils.formatCompressionRatio(0.3)).toBe('70.0%');
      expect(CompressionUtils.formatCompressionRatio(0.5)).toBe('50.0%');
      expect(CompressionUtils.formatCompressionRatio(1)).toBe('0.0%');
    });

    it('should format duration correctly', () => {
      expect(CompressionUtils.formatDuration(500)).toBe('500ms');
      expect(CompressionUtils.formatDuration(1500)).toBe('1.5s');
      expect(CompressionUtils.formatDuration(90000)).toBe('1.5m');
    });

    it('should calculate efficiency score', () => {
      const result = {
        success: true,
        ratio: 0.3,
        compressionTime: 100,
        originalSize: 1000,
        compressedSize: 300,
        algorithm: 'gzip',
      };

      const score = CompressionUtils.calculateEfficiencyScore(result);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should validate compression results', () => {
      const validResult = {
        success: true,
        ratio: 0.3,
        compressionTime: 100,
        originalSize: 1000,
        compressedSize: 300,
        algorithm: 'gzip',
      };

      const validation = CompressionUtils.validateCompressionResult(validResult);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should provide compression recommendations', () => {
      const content = 'This is test content that should be compressed. '.repeat(10);
      
      const recommendations = CompressionUtils.getCompressionRecommendations(content);
      
      expect(recommendations.shouldCompress).toBe(true);
      expect(recommendations.recommendedAlgorithm).toBeDefined();
      expect(recommendations.expectedSavings).toBeDefined();
      expect(recommendations.estimatedTime).toBeDefined();
      expect(recommendations.reason).toBeDefined();
    });
  });

  describe('End-to-End Compression Workflow', () => {
    it('should compress, store, retrieve, and decompress data', async () => {
      const originalData = {
        title: 'Test Note',
        content: 'This is a test note with content that should be compressed. '.repeat(20),
        metadata: {
          created: new Date().toISOString(),
          tags: ['test', 'compression'],
        },
      };

      // Step 1: Compress content
      const compressionResult = await contentCompressionService.compressContent(
        originalData.content,
        { contentType: 'text' }
      );

      expect(compressionResult.success).toBe(true);
      expect(compressionResult.compressedSize).toBeLessThan(compressionResult.originalSize);

      // Step 2: Record compression event
      compressionMonitor.recordEvent({
        type: 'compression',
        algorithm: compressionResult.algorithm,
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionTime: compressionResult.compressionTime,
        success: compressionResult.success,
        context: 'note-content',
      });

      // Step 3: Store compressed data (mocked)
      const storageResult = await localStorageCompressionService.store(
        'test-note',
        originalData,
        { algorithm: 'gzip', compressionThreshold: 100 }
      );

      expect(storageResult.compressed).toBe(true);

      // Step 4: Get performance metrics
      const metrics = compressionMonitor.getPerformanceMetrics();
      expect(metrics.averageCompressionRatio).toBeLessThan(1);

      // Step 5: Get compression statistics
      const stats = compressionService.getStats();
      expect(stats.compressionCount).toBeGreaterThan(0);

      // Verify end-to-end workflow completed successfully
      expect(compressionResult.success).toBe(true);
      expect(storageResult.compressed).toBe(true);
      expect(metrics.averageCompressionRatio).toBeLessThan(1);
    });
  });
});
