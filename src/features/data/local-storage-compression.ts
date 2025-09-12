/**
 * Local storage compression service for IndexedDB
 */

import { compressionService } from './compression-service';
import { CompressionResult, LocalStorageCompressionOptions } from './schemas/compression';

export interface LocalStorageItem {
  key: string;
  value: any;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  timestamp: number;
  algorithm: string;
}

export interface LocalStorageStats {
  totalItems: number;
  compressedItems: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  cacheHitRate: number;
  lastCompression?: Date;
}

export class LocalStorageCompressionService {
  private dbName = 'BiblionCompressionDB';
  private dbVersion = 1;
  private storeName = 'compressedData';
  private db: IDBDatabase | null = null;
  private cache: Map<string, LocalStorageItem> = new Map();
  private maxCacheSize: number = 1000;

  constructor() {
    this.initializeDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('compressed', 'compressed', { unique: false });
        }
      };
    });
  }

  /**
   * Store data with optional compression
   */
  async store(
    key: string,
    data: any,
    options: LocalStorageCompressionOptions = {}
  ): Promise<LocalStorageItem> {
    try {
      const serializedData = JSON.stringify(data);
      const originalSize = new TextEncoder().encode(serializedData).length;
      
      // Check if compression should be applied
      const shouldCompress = this.shouldCompress(originalSize, options);
      
      let compressedData: string;
      let compressedSize: number;
      let compressionRatio: number;
      let algorithm: string;
      let compressed: boolean;

      if (shouldCompress) {
        const compressionResult = await compressionService.compress(serializedData, {
          algorithm: options.algorithm || 'gzip',
          level: options.level || 6,
          threshold: options.compressionThreshold || 1024,
          useCache: options.useCache !== false,
          timeout: options.timeout || 5000,
        });

        if (compressionResult.success) {
          compressedData = this.arrayBufferToBase64(compressionResult.compressedData || new Uint8Array());
          compressedSize = compressionResult.compressedSize;
          compressionRatio = compressionResult.ratio;
          algorithm = compressionResult.algorithm;
          compressed = true;
        } else {
          // Fallback to uncompressed
          compressedData = serializedData;
          compressedSize = originalSize;
          compressionRatio = 1;
          algorithm = 'none';
          compressed = false;
        }
      } else {
        compressedData = serializedData;
        compressedSize = originalSize;
        compressionRatio = 1;
        algorithm = 'none';
        compressed = false;
      }

      const item: LocalStorageItem = {
        key,
        value: compressedData,
        compressed,
        originalSize,
        compressedSize,
        compressionRatio,
        timestamp: Date.now(),
        algorithm,
      };

      // Store in IndexedDB
      await this.storeInIndexedDB(item);

      // Update cache
      this.updateCache(key, item);

      return item;
    } catch (error) {
      throw new Error(
        `Failed to store data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Retrieve data with automatic decompression
   */
  async retrieve(key: string): Promise<any> {
    try {
      // Check cache first
      if (this.cache.has(key)) {
        const cachedItem = this.cache.get(key)!;
        return this.deserializeItem(cachedItem);
      }

      // Retrieve from IndexedDB
      const item = await this.retrieveFromIndexedDB(key);
      if (!item) {
        return null;
      }

      // Update cache
      this.updateCache(key, item);

      return this.deserializeItem(item);
    } catch (error) {
      throw new Error(
        `Failed to retrieve data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Remove data
   */
  async remove(key: string): Promise<void> {
    try {
      // Remove from IndexedDB
      await this.removeFromIndexedDB(key);

      // Remove from cache
      this.cache.delete(key);
    } catch (error) {
      throw new Error(
        `Failed to remove data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    try {
      // Clear IndexedDB
      await this.clearIndexedDB();

      // Clear cache
      this.cache.clear();
    } catch (error) {
      throw new Error(
        `Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<LocalStorageStats> {
    try {
      const items = await this.getAllItems();
      
      const totalItems = items.length;
      const compressedItems = items.filter(item => item.compressed).length;
      const totalOriginalSize = items.reduce((sum, item) => sum + item.originalSize, 0);
      const totalCompressedSize = items.reduce((sum, item) => sum + item.compressedSize, 0);
      const averageCompressionRatio = totalItems > 0 
        ? items.reduce((sum, item) => sum + item.compressionRatio, 0) / totalItems 
        : 1;
      
      const lastCompression = items
        .filter(item => item.compressed)
        .sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp;

      return {
        totalItems,
        compressedItems,
        totalOriginalSize,
        totalCompressedSize,
        averageCompressionRatio,
        cacheHitRate: this.cache.size / Math.max(totalItems, 1),
        lastCompression: lastCompression ? new Date(lastCompression) : undefined,
      };
    } catch (error) {
      throw new Error(
        `Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if data should be compressed
   */
  private shouldCompress(
    size: number,
    options: LocalStorageCompressionOptions
  ): boolean {
    const threshold = options.compressionThreshold || 1024;
    const enableSelective = options.enableSelectiveCompression !== false;
    
    return enableSelective && size >= threshold;
  }

  /**
   * Store item in IndexedDB
   */
  private async storeInIndexedDB(item: LocalStorageItem): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Retrieve item from IndexedDB
   */
  private async retrieveFromIndexedDB(key: string): Promise<LocalStorageItem | null> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Remove item from IndexedDB
   */
  private async removeFromIndexedDB(key: string): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all items from IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get all items from IndexedDB
   */
  private async getAllItems(): Promise<LocalStorageItem[]> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Update cache
   */
  private updateCache(key: string, item: LocalStorageItem): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, item);
  }

  /**
   * Deserialize item (decompress if needed)
   */
  private async deserializeItem(item: LocalStorageItem): Promise<any> {
    try {
      let data: string;

      if (item.compressed) {
        // Decompress data
        const compressedData = this.base64ToArrayBuffer(item.value);
        const decompressionResult = await compressionService.decompress(
          compressedData,
          item.algorithm as any
        );

        if (!decompressionResult.success) {
          throw new Error(decompressionResult.error || 'Decompression failed');
        }

        data = decompressionResult.data;
      } else {
        data = item.value;
      }

      return JSON.parse(data);
    } catch (error) {
      throw new Error(
        `Failed to deserialize item: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Optimize storage by recompressing old items
   */
  async optimizeStorage(): Promise<{
    optimizedItems: number;
    spaceSaved: number;
    averageCompressionRatio: number;
  }> {
    try {
      const items = await this.getAllItems();
      const oldItems = items.filter(item => 
        Date.now() - item.timestamp > 7 * 24 * 60 * 60 * 1000 // Older than 7 days
      );

      let optimizedItems = 0;
      let spaceSaved = 0;
      let totalCompressionRatio = 0;

      for (const item of oldItems) {
        if (!item.compressed) {
          // Recompress uncompressed items
          const data = await this.deserializeItem(item);
          const newItem = await this.store(item.key, data, {
            algorithm: 'gzip',
            level: 9, // Maximum compression
            compressionThreshold: 512,
          });

          spaceSaved += item.originalSize - newItem.compressedSize;
          totalCompressionRatio += newItem.compressionRatio;
          optimizedItems++;
        }
      }

      return {
        optimizedItems,
        spaceSaved,
        averageCompressionRatio: optimizedItems > 0 ? totalCompressionRatio / optimizedItems : 1,
      };
    } catch (error) {
      throw new Error(
        `Failed to optimize storage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clean up old cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const localStorageCompressionService = new LocalStorageCompressionService();
