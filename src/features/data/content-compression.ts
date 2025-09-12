/**
 * Content compression service for note content
 */

import { compressionService } from './compression-service';
import {
  ContentCompressionOptions,
  CompressionResult,
  ContentType,
} from './schemas/compression';

export class ContentCompressionService {
  private readonly contentTypeThresholds: Record<ContentType, number> = {
    'text': 512,      // 512 bytes
    'html': 1024,     // 1KB
    'json': 1024,     // 1KB
    'markdown': 1024, // 1KB
    'rich-text': 2048, // 2KB
  };

  private readonly contentTypeAlgorithms: Record<ContentType, string> = {
    'text': 'gzip',
    'html': 'brotli',    // HTML compresses better with brotli
    'json': 'gzip',      // JSON compresses well with gzip
    'markdown': 'gzip',  // Markdown compresses well with gzip
    'rich-text': 'brotli', // Rich text with HTML tags benefits from brotli
  };

  /**
   * Compress note content
   */
  async compressContent(
    content: string,
    options: ContentCompressionOptions = {}
  ): Promise<CompressionResult> {
    try {
      // Detect content type if not specified
      const contentType = options.contentType || this.detectContentType(content);
      
      // Get compression options for this content type
      const compressionOptions = this.getCompressionOptions(contentType, options);
      
      // Compress the content
      const result = await compressionService.compress(content, compressionOptions);
      
      // Add content type information to result
      return {
        ...result,
        algorithm: `${result.algorithm}-${contentType}`,
      };
    } catch (error) {
      return {
        originalSize: new TextEncoder().encode(content).length,
        compressedSize: 0,
        ratio: 1,
        algorithm: 'none',
        compressionTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Content compression failed',
      };
    }
  }

  /**
   * Decompress note content
   */
  async decompressContent(
    compressedData: Uint8Array,
    algorithm: string
  ): Promise<string> {
    try {
      // Extract algorithm and content type from algorithm string
      const [compressionAlgorithm, contentType] = algorithm.split('-');
      
      // Decompress using the compression service
      const result = await compressionService.decompress(
        compressedData,
        compressionAlgorithm as any
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Decompression failed');
      }
      
      return result.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Content decompression failed'
      );
    }
  }

  /**
   * Detect content type from content
   */
  private detectContentType(content: string): ContentType {
    // Check for HTML tags
    if (/<[^>]+>/.test(content)) {
      // Check if it's rich text (contains formatting tags)
      if (/<(strong|em|u|h[1-6]|p|div|span|ul|ol|li|blockquote|pre|code)/i.test(content)) {
        return 'rich-text';
      }
      return 'html';
    }
    
    // Check for JSON
    if (this.isJSON(content)) {
      return 'json';
    }
    
    // Check for Markdown
    if (this.isMarkdown(content)) {
      return 'markdown';
    }
    
    // Default to text
    return 'text';
  }

  /**
   * Check if content is JSON
   */
  private isJSON(content: string): boolean {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if content is Markdown
   */
  private isMarkdown(content: string): boolean {
    const markdownPatterns = [
      /^#{1,6}\s+/m,           // Headers
      /^\*\s+/m,               // Bullet lists
      /^\d+\.\s+/m,           // Numbered lists
      /\[([^\]]+)\]\(([^)]+)\)/, // Links
      /!\[([^\]]*)\]\(([^)]+)\)/, // Images
      /`[^`]+`/,               // Inline code
      /```[\s\S]*?```/,        // Code blocks
      /^\s*>\s+/m,             // Blockquotes
      /^\s*[-*+]\s+/m,         // Lists
    ];
    
    return markdownPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Get compression options for content type
   */
  private getCompressionOptions(
    contentType: ContentType,
    options: ContentCompressionOptions
  ): any {
    const threshold = options.threshold || this.contentTypeThresholds[contentType];
    const algorithm = options.algorithm || this.contentTypeAlgorithms[contentType];
    
    return {
      algorithm,
      threshold,
      level: options.level || 6,
      useCache: options.useCache !== false,
      timeout: options.timeout || 5000,
    };
  }

  /**
   * Get compression statistics for content types
   */
  getContentTypeStats(): Record<ContentType, any> {
    const stats = compressionService.getStats();
    const metrics = compressionService.getMetrics();
    
    return {
      'text': {
        threshold: this.contentTypeThresholds.text,
        algorithm: this.contentTypeAlgorithms.text,
        ...stats,
        ...metrics,
      },
      'html': {
        threshold: this.contentTypeThresholds.html,
        algorithm: this.contentTypeAlgorithms.html,
        ...stats,
        ...metrics,
      },
      'json': {
        threshold: this.contentTypeThresholds.json,
        algorithm: this.contentTypeAlgorithms.json,
        ...stats,
        ...metrics,
      },
      'markdown': {
        threshold: this.contentTypeThresholds.markdown,
        algorithm: this.contentTypeAlgorithms.markdown,
        ...stats,
        ...metrics,
      },
      'rich-text': {
        threshold: this.contentTypeThresholds['rich-text'],
        algorithm: this.contentTypeAlgorithms['rich-text'],
        ...stats,
        ...metrics,
      },
    };
  }

  /**
   * Optimize content for compression
   */
  optimizeForCompression(content: string, contentType: ContentType): string {
    switch (contentType) {
      case 'html':
      case 'rich-text':
        return this.optimizeHTML(content);
      case 'json':
        return this.optimizeJSON(content);
      case 'markdown':
        return this.optimizeMarkdown(content);
      default:
        return content;
    }
  }

  /**
   * Optimize HTML content for compression
   */
  private optimizeHTML(content: string): string {
    return content
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/>\s+</g, '><')        // Remove spaces between tags
      .replace(/\s+>/g, '>')          // Remove spaces before closing tags
      .replace(/<\s+/g, '<')          // Remove spaces after opening tags
      .trim();
  }

  /**
   * Optimize JSON content for compression
   */
  private optimizeJSON(content: string): string {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed);
    } catch {
      return content;
    }
  }

  /**
   * Optimize Markdown content for compression
   */
  private optimizeMarkdown(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n')     // Normalize multiple newlines
      .replace(/[ \t]+$/gm, '')       // Remove trailing whitespace
      .trim();
  }

  /**
   * Get compression recommendations for content
   */
  getCompressionRecommendations(content: string): {
    contentType: ContentType;
    recommendedAlgorithm: string;
    estimatedSavings: number;
    shouldCompress: boolean;
  } {
    const contentType = this.detectContentType(content);
    const contentSize = new TextEncoder().encode(content).length;
    const threshold = this.contentTypeThresholds[contentType];
    const algorithm = this.contentTypeAlgorithms[contentType];
    
    // Estimate compression ratio based on content type
    const estimatedRatios: Record<ContentType, number> = {
      'text': 0.7,
      'html': 0.3,
      'json': 0.4,
      'markdown': 0.6,
      'rich-text': 0.4,
    };
    
    const estimatedRatio = estimatedRatios[contentType];
    const estimatedSavings = contentSize * (1 - estimatedRatio);
    
    return {
      contentType,
      recommendedAlgorithm: algorithm,
      estimatedSavings,
      shouldCompress: contentSize >= threshold,
    };
  }
}

// Singleton instance
export const contentCompressionService = new ContentCompressionService();
