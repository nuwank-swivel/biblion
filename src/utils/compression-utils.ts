/**
 * Compression utilities and helpers
 */

import { compressionService } from '../features/data/compression-service';
import { contentCompressionService } from '../features/data/content-compression';
import { versionCompressionService } from '../features/data/version-compression';
import {
  CompressionResult,
  CompressionStats,
  CompressionMetrics,
  ContentType,
} from '../features/data/schemas/compression';

/**
 * Utility functions for compression operations
 */
export class CompressionUtils {
  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format compression ratio as percentage
   */
  static formatCompressionRatio(ratio: number): string {
    const percentage = (1 - ratio) * 100;
    return `${percentage.toFixed(1)}%`;
  }

  /**
   * Format time duration
   */
  static formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds.toFixed(0)}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      return `${(milliseconds / 60000).toFixed(1)}m`;
    }
  }

  /**
   * Calculate compression efficiency score
   */
  static calculateEfficiencyScore(result: CompressionResult): number {
    if (!result.success) return 0;
    
    const compressionRatio = result.ratio;
    const timeScore = Math.max(0, 1 - (result.compressionTime / 1000)); // Penalty for slow compression
    const sizeScore = Math.max(0, 1 - compressionRatio); // Better compression = higher score
    
    return (sizeScore * 0.7 + timeScore * 0.3) * 100;
  }

  /**
   * Get compression algorithm recommendation
   */
  static getAlgorithmRecommendation(content: string, contentType?: ContentType): {
    algorithm: string;
    reason: string;
    expectedRatio: number;
  } {
    const size = new TextEncoder().encode(content).length;
    
    if (size < 1024) {
      return {
        algorithm: 'none',
        reason: 'Content too small for compression',
        expectedRatio: 1,
      };
    }
    
    if (contentType === 'html' || contentType === 'rich-text') {
      return {
        algorithm: 'brotli',
        reason: 'HTML content compresses better with brotli',
        expectedRatio: 0.3,
      };
    }
    
    if (contentType === 'json') {
      return {
        algorithm: 'gzip',
        reason: 'JSON content compresses well with gzip',
        expectedRatio: 0.4,
      };
    }
    
    return {
      algorithm: 'gzip',
      reason: 'General purpose compression',
      expectedRatio: 0.6,
    };
  }

  /**
   * Validate compression result
   */
  static validateCompressionResult(result: CompressionResult): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    if (!result.success) {
      issues.push('Compression failed');
    }
    
    if (result.ratio > 1) {
      issues.push('Compression ratio greater than 1 (no compression achieved)');
    }
    
    if (result.compressionTime > 5000) {
      issues.push('Compression took too long (>5 seconds)');
    }
    
    if (result.compressedSize > result.originalSize) {
      issues.push('Compressed size larger than original');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get compression statistics summary
   */
  static getCompressionSummary(stats: CompressionStats): {
    totalSavings: string;
    averageRatio: string;
    efficiency: string;
    totalOperations: number;
    successRate: string;
  } {
    const totalSavings = stats.totalOriginal - stats.totalCompressed;
    const totalOperations = stats.compressionCount + stats.failureCount;
    const successRate = totalOperations > 0 ? (stats.compressionCount / totalOperations) * 100 : 100;
    
    return {
      totalSavings: this.formatBytes(totalSavings),
      averageRatio: this.formatCompressionRatio(stats.averageRatio),
      efficiency: this.getEfficiencyLabel(stats.averageRatio),
      totalOperations,
      successRate: `${successRate.toFixed(1)}%`,
    };
  }

  /**
   * Get efficiency label based on compression ratio
   */
  private static getEfficiencyLabel(ratio: number): string {
    if (ratio <= 0.2) return 'Excellent';
    if (ratio <= 0.4) return 'Good';
    if (ratio <= 0.6) return 'Fair';
    return 'Poor';
  }

  /**
   * Estimate compression time based on content size
   */
  static estimateCompressionTime(contentSize: number, algorithm: string): number {
    const baseTime = 10; // Base time in ms
    const sizeFactor = contentSize / 1024; // Factor based on size in KB
    const algorithmFactor = algorithm === 'brotli' ? 1.5 : 1; // Brotli is slower
    
    return baseTime + (sizeFactor * algorithmFactor);
  }

  /**
   * Check if compression is beneficial
   */
  static isCompressionBeneficial(
    originalSize: number,
    compressedSize: number,
    compressionTime: number
  ): boolean {
    const sizeSavings = originalSize - compressedSize;
    const timeCost = compressionTime;
    
    // Compression is beneficial if size savings > time cost (in bytes per ms)
    return sizeSavings > timeCost * 0.1; // 0.1 bytes per ms threshold
  }

  /**
   * Get compression recommendations for content
   */
  static getCompressionRecommendations(content: string): {
    shouldCompress: boolean;
    recommendedAlgorithm: string;
    expectedSavings: string;
    estimatedTime: string;
    reason: string;
  } {
    const size = new TextEncoder().encode(content).length;
    const contentType = contentCompressionService['detectContentType'](content);
    const recommendation = contentCompressionService.getCompressionRecommendations(content);
    
    const shouldCompress = recommendation.shouldCompress;
    const algorithm = recommendation.recommendedAlgorithm;
    const estimatedTime = this.estimateCompressionTime(size, algorithm);
    
    let reason = '';
    if (!shouldCompress) {
      reason = 'Content too small for compression';
    } else if (contentType === 'html' || contentType === 'rich-text') {
      reason = 'HTML content compresses very well';
    } else if (contentType === 'json') {
      reason = 'JSON content compresses well';
    } else {
      reason = 'Text content benefits from compression';
    }
    
    return {
      shouldCompress,
      recommendedAlgorithm: algorithm,
      expectedSavings: this.formatBytes(recommendation.estimatedSavings),
      estimatedTime: this.formatDuration(estimatedTime),
      reason,
    };
  }

  /**
   * Create compression report
   */
  static createCompressionReport(results: CompressionResult[]): {
    totalOriginal: string;
    totalCompressed: string;
    totalSavings: string;
    averageRatio: string;
    totalTime: string;
    successRate: string;
    efficiency: string;
  } {
    const successfulResults = results.filter(r => r.success);
    const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressed = successfulResults.reduce((sum, r) => sum + r.compressedSize, 0);
    const totalSavings = totalOriginal - totalCompressed;
    const averageRatio = successfulResults.length > 0 
      ? successfulResults.reduce((sum, r) => sum + r.ratio, 0) / successfulResults.length 
      : 1;
    const totalTime = results.reduce((sum, r) => sum + r.compressionTime, 0);
    const successRate = (successfulResults.length / results.length) * 100;
    
    return {
      totalOriginal: this.formatBytes(totalOriginal),
      totalCompressed: this.formatBytes(totalCompressed),
      totalSavings: this.formatBytes(totalSavings),
      averageRatio: this.formatCompressionRatio(averageRatio),
      totalTime: this.formatDuration(totalTime),
      successRate: `${successRate.toFixed(1)}%`,
      efficiency: this.getEfficiencyLabel(averageRatio),
    };
  }

  /**
   * Monitor compression performance
   */
  static async monitorCompressionPerformance(
    content: string,
    iterations: number = 10
  ): Promise<{
    averageTime: number;
    averageRatio: number;
    consistency: number;
    recommendations: string[];
  }> {
    const results: CompressionResult[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const result = await compressionService.compress(content);
      results.push(result);
    }
    
    const successfulResults = results.filter(r => r.success);
    const averageTime = successfulResults.reduce((sum, r) => sum + r.compressionTime, 0) / successfulResults.length;
    const averageRatio = successfulResults.reduce((sum, r) => sum + r.ratio, 0) / successfulResults.length;
    
    // Calculate consistency (lower standard deviation = more consistent)
    const timeVariance = successfulResults.reduce((sum, r) => sum + Math.pow(r.compressionTime - averageTime, 2), 0) / successfulResults.length;
    const consistency = Math.max(0, 100 - Math.sqrt(timeVariance));
    
    const recommendations: string[] = [];
    if (averageTime > 1000) {
      recommendations.push('Consider using a faster compression algorithm');
    }
    if (averageRatio > 0.8) {
      recommendations.push('Compression ratio is poor, consider optimizing content');
    }
    if (consistency < 80) {
      recommendations.push('Compression performance is inconsistent');
    }
    
    return {
      averageTime,
      averageRatio,
      consistency,
      recommendations,
    };
  }
}

/**
 * Compression constants
 */
export const COMPRESSION_CONSTANTS = {
  MIN_COMPRESSION_SIZE: 1024, // 1KB
  MAX_COMPRESSION_SIZE: 10 * 1024 * 1024, // 10MB
  COMPRESSION_TIMEOUT: 5000, // 5 seconds
  CACHE_MAX_SIZE: 100,
  DELTA_THRESHOLD: 0.5,
  EFFICIENCY_THRESHOLD: 0.6,
} as const;

/**
 * Compression algorithms
 */
export const COMPRESSION_ALGORITHMS = {
  GZIP: 'gzip',
  BROTLI: 'brotli',
  NONE: 'none',
  AUTO: 'auto',
} as const;

/**
 * Content types
 */
export const CONTENT_TYPES = {
  TEXT: 'text',
  HTML: 'html',
  JSON: 'json',
  MARKDOWN: 'markdown',
  RICH_TEXT: 'rich-text',
} as const;
