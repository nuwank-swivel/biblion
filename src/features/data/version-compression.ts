/**
 * Version compression service with delta compression
 */

import { compressionService } from './compression-service';
import {
  VersionCompressionOptions,
  CompressionResult,
} from './schemas/compression';

export interface VersionDelta {
  baseVersion: string;
  currentVersion: string;
  delta: string;
  deltaSize: number;
  originalSize: number;
  compressionRatio: number;
}

export interface VersionCompressionResult extends CompressionResult {
  deltaCompression?: boolean;
  baseVersion?: string;
  deltaSize?: number;
}

export class VersionCompressionService {
  private readonly deltaThreshold = 0.5; // Use delta compression if delta is < 50% of original
  private readonly maxDeltaSize = 1024 * 1024; // 1MB max delta size

  /**
   * Compress version data with optional delta compression
   */
  async compressVersion(
    versionData: string,
    baseVersionData?: string,
    options: VersionCompressionOptions = {}
  ): Promise<VersionCompressionResult> {
    try {
      // Check if delta compression should be used
      if (options.useDeltaCompression !== false && baseVersionData) {
        const deltaResult = await this.compressWithDelta(
          versionData,
          baseVersionData,
          options
        );
        
        if (deltaResult.deltaSize < versionData.length * this.deltaThreshold) {
          return deltaResult;
        }
      }

      // Use regular compression
      const result = await compressionService.compress(versionData, {
        algorithm: options.algorithm || 'gzip',
        level: options.level || 6,
        threshold: options.threshold || 512,
        useCache: options.useCache !== false,
        timeout: options.timeout || 5000,
      });

      return {
        ...result,
        deltaCompression: false,
      };
    } catch (error) {
      return {
        originalSize: new TextEncoder().encode(versionData).length,
        compressedSize: 0,
        ratio: 1,
        algorithm: 'none',
        compressionTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Version compression failed',
        deltaCompression: false,
      };
    }
  }

  /**
   * Decompress version data
   */
  async decompressVersion(
    compressedData: Uint8Array,
    algorithm: string,
    baseVersionData?: string,
    isDeltaCompressed?: boolean
  ): Promise<string> {
    try {
      if (isDeltaCompressed && baseVersionData) {
        // Decompress delta and apply to base version
        const deltaResult = await compressionService.decompress(
          compressedData,
          algorithm as any
        );
        
        if (!deltaResult.success) {
          throw new Error(deltaResult.error || 'Delta decompression failed');
        }
        
        return this.applyDelta(baseVersionData, deltaResult.data);
      } else {
        // Regular decompression
        const result = await compressionService.decompress(
          compressedData,
          algorithm as any
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Version decompression failed');
        }
        
        return result.data;
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Version decompression failed'
      );
    }
  }

  /**
   * Compress with delta compression
   */
  private async compressWithDelta(
    currentData: string,
    baseData: string,
    options: VersionCompressionOptions
  ): Promise<VersionCompressionResult> {
    const startTime = performance.now();
    
    try {
      // Generate delta
      const delta = this.generateDelta(baseData, currentData);
      
      // Check if delta is too large
      if (delta.length > this.maxDeltaSize) {
        throw new Error('Delta too large for compression');
      }
      
      // Compress the delta
      const compressionResult = await compressionService.compress(delta, {
        algorithm: options.algorithm || 'gzip',
        level: options.level || 6,
        threshold: options.threshold || 256,
        useCache: options.useCache !== false,
        timeout: options.timeout || 5000,
      });
      
      const compressionTime = performance.now() - startTime;
      
      return {
        ...compressionResult,
        deltaCompression: true,
        baseVersion: options.baseVersion,
        deltaSize: delta.length,
        compressionTime,
      };
    } catch (error) {
      const compressionTime = performance.now() - startTime;
      
      return {
        originalSize: new TextEncoder().encode(currentData).length,
        compressedSize: 0,
        ratio: 1,
        algorithm: 'none',
        compressionTime,
        success: false,
        error: error instanceof Error ? error.message : 'Delta compression failed',
        deltaCompression: true,
        baseVersion: options.baseVersion,
        deltaSize: 0,
      };
    }
  }

  /**
   * Generate delta between two versions
   */
  private generateDelta(baseData: string, currentData: string): string {
    // Simple delta generation using diff algorithm
    // In a real implementation, you might want to use a more sophisticated diff algorithm
    
    const baseLines = baseData.split('\n');
    const currentLines = currentData.split('\n');
    
    const delta: string[] = [];
    let baseIndex = 0;
    let currentIndex = 0;
    
    while (baseIndex < baseLines.length || currentIndex < currentLines.length) {
      if (baseIndex >= baseLines.length) {
        // Add remaining current lines
        delta.push(`+${currentLines[currentIndex]}`);
        currentIndex++;
      } else if (currentIndex >= currentLines.length) {
        // Remove remaining base lines
        delta.push(`-${baseLines[baseIndex]}`);
        baseIndex++;
      } else if (baseLines[baseIndex] === currentLines[currentIndex]) {
        // Lines are the same, skip
        baseIndex++;
        currentIndex++;
      } else {
        // Lines are different, check if it's a modification or insertion/deletion
        const nextMatch = this.findNextMatch(baseLines, currentLines, baseIndex, currentIndex);
        
        if (nextMatch.baseIndex === baseIndex + 1 && nextMatch.currentIndex === currentIndex + 1) {
          // Single line modification
          delta.push(`-${baseLines[baseIndex]}`);
          delta.push(`+${currentLines[currentIndex]}`);
          baseIndex++;
          currentIndex++;
        } else {
          // Multiple line changes
          const baseChanges = nextMatch.baseIndex - baseIndex;
          const currentChanges = nextMatch.currentIndex - currentIndex;
          
          // Add deletions
          for (let i = 0; i < baseChanges; i++) {
            delta.push(`-${baseLines[baseIndex + i]}`);
          }
          
          // Add insertions
          for (let i = 0; i < currentChanges; i++) {
            delta.push(`+${currentLines[currentIndex + i]}`);
          }
          
          baseIndex = nextMatch.baseIndex;
          currentIndex = nextMatch.currentIndex;
        }
      }
    }
    
    return delta.join('\n');
  }

  /**
   * Find next matching line
   */
  private findNextMatch(
    baseLines: string[],
    currentLines: string[],
    baseIndex: number,
    currentIndex: number
  ): { baseIndex: number; currentIndex: number } {
    // Look for the next matching line within a reasonable window
    const windowSize = 10;
    
    for (let i = 1; i <= windowSize; i++) {
      for (let j = 1; j <= windowSize; j++) {
        if (baseIndex + i < baseLines.length && 
            currentIndex + j < currentLines.length &&
            baseLines[baseIndex + i] === currentLines[currentIndex + j]) {
          return { baseIndex: baseIndex + i, currentIndex: currentIndex + j };
        }
      }
    }
    
    // No match found, return end of arrays
    return { baseIndex: baseLines.length, currentIndex: currentLines.length };
  }

  /**
   * Apply delta to base data
   */
  private applyDelta(baseData: string, deltaData: string): string {
    const baseLines = baseData.split('\n');
    const deltaLines = deltaData.split('\n');
    
    const result: string[] = [];
    let baseIndex = 0;
    
    for (const deltaLine of deltaLines) {
      if (deltaLine.startsWith('+')) {
        // Add line
        result.push(deltaLine.substring(1));
      } else if (deltaLine.startsWith('-')) {
        // Skip line from base
        baseIndex++;
      } else {
        // Keep line from base
        if (baseIndex < baseLines.length) {
          result.push(baseLines[baseIndex]);
          baseIndex++;
        }
      }
    }
    
    // Add remaining base lines
    while (baseIndex < baseLines.length) {
      result.push(baseLines[baseIndex]);
      baseIndex++;
    }
    
    return result.join('\n');
  }

  /**
   * Calculate compression efficiency for version data
   */
  calculateCompressionEfficiency(
    originalSize: number,
    compressedSize: number,
    deltaSize?: number
  ): {
    compressionRatio: number;
    spaceSavings: number;
    efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const compressionRatio = compressedSize / originalSize;
    const spaceSavings = (originalSize - compressedSize) / originalSize;
    
    let efficiency: 'excellent' | 'good' | 'fair' | 'poor';
    if (compressionRatio <= 0.2) {
      efficiency = 'excellent';
    } else if (compressionRatio <= 0.4) {
      efficiency = 'good';
    } else if (compressionRatio <= 0.6) {
      efficiency = 'fair';
    } else {
      efficiency = 'poor';
    }
    
    return {
      compressionRatio,
      spaceSavings,
      efficiency,
    };
  }

  /**
   * Get version compression statistics
   */
  getVersionCompressionStats(): {
    totalVersions: number;
    deltaCompressedVersions: number;
    averageCompressionRatio: number;
    averageDeltaSize: number;
    spaceSavings: number;
  } {
    const stats = compressionService.getStats();
    
    return {
      totalVersions: stats.compressionCount,
      deltaCompressedVersions: Math.floor(stats.compressionCount * 0.3), // Estimate
      averageCompressionRatio: stats.averageRatio,
      averageDeltaSize: stats.totalOriginal * 0.1, // Estimate
      spaceSavings: (stats.totalOriginal - stats.totalCompressed) / stats.totalOriginal,
    };
  }

  /**
   * Optimize version data for compression
   */
  optimizeVersionData(versionData: string): string {
    // Remove unnecessary whitespace and normalize formatting
    return versionData
      .replace(/\r\n/g, '\n')           // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')        // Normalize multiple newlines
      .replace(/[ \t]+$/gm, '')         // Remove trailing whitespace
      .trim();
  }

  /**
   * Validate version data integrity after compression/decompression
   */
  validateVersionIntegrity(
    originalData: string,
    decompressedData: string
  ): {
    isValid: boolean;
    differences: string[];
    similarity: number;
  } {
    const differences: string[] = [];
    
    // Compare line by line
    const originalLines = originalData.split('\n');
    const decompressedLines = decompressedData.split('\n');
    
    const maxLines = Math.max(originalLines.length, decompressedLines.length);
    let matchingLines = 0;
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const decompressedLine = decompressedLines[i] || '';
      
      if (originalLine === decompressedLine) {
        matchingLines++;
      } else {
        differences.push(`Line ${i + 1}: "${originalLine}" != "${decompressedLine}"`);
      }
    }
    
    const similarity = maxLines > 0 ? matchingLines / maxLines : 1;
    const isValid = similarity >= 0.99; // 99% similarity threshold
    
    return {
      isValid,
      differences,
      similarity,
    };
  }
}

// Singleton instance
export const versionCompressionService = new VersionCompressionService();
