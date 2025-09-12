/**
 * Compression performance monitoring service
 */

import { compressionService } from '../compression-service';
import { CompressionResult, CompressionStats, CompressionMetrics } from '../schemas/compression';

export interface CompressionEvent {
  id: string;
  timestamp: Date;
  type: 'compression' | 'decompression' | 'error';
  algorithm: string;
  originalSize: number;
  compressedSize: number;
  compressionTime: number;
  success: boolean;
  error?: string;
  context?: string;
}

export interface PerformanceMetrics {
  averageCompressionTime: number;
  averageDecompressionTime: number;
  averageCompressionRatio: number;
  errorRate: number;
  throughput: number; // bytes per second
  memoryUsage: number;
  cacheHitRate: number;
}

export interface CompressionAlert {
  id: string;
  type: 'performance' | 'error' | 'threshold';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  data?: any;
}

export class CompressionMonitor {
  private events: CompressionEvent[] = [];
  private alerts: CompressionAlert[] = [];
  private maxEvents: number = 1000;
  private maxAlerts: number = 100;
  private performanceThresholds = {
    maxCompressionTime: 5000, // 5 seconds
    minCompressionRatio: 0.2, // 20% compression
    maxErrorRate: 0.05, // 5% error rate
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  };

  /**
   * Record compression event
   */
  recordEvent(event: Omit<CompressionEvent, 'id' | 'timestamp'>): void {
    const fullEvent: CompressionEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event,
    };

    this.events.push(fullEvent);

    // Remove old events if limit exceeded
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Check for alerts
    this.checkForAlerts(fullEvent);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Compression Event:', fullEvent);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const recentEvents = this.getRecentEvents(24 * 60 * 60 * 1000); // Last 24 hours
    const compressionEvents = recentEvents.filter(e => e.type === 'compression' && e.success);
    const decompressionEvents = recentEvents.filter(e => e.type === 'decompression' && e.success);
    const errorEvents = recentEvents.filter(e => !e.success);

    const averageCompressionTime = compressionEvents.length > 0
      ? compressionEvents.reduce((sum, e) => sum + e.compressionTime, 0) / compressionEvents.length
      : 0;

    const averageDecompressionTime = decompressionEvents.length > 0
      ? decompressionEvents.reduce((sum, e) => sum + e.compressionTime, 0) / decompressionEvents.length
      : 0;

    const averageCompressionRatio = compressionEvents.length > 0
      ? compressionEvents.reduce((sum, e) => sum + (e.compressedSize / e.originalSize), 0) / compressionEvents.length
      : 1;

    const errorRate = recentEvents.length > 0
      ? errorEvents.length / recentEvents.length
      : 0;

    const totalBytes = compressionEvents.reduce((sum, e) => sum + e.originalSize, 0);
    const totalTime = compressionEvents.reduce((sum, e) => sum + e.compressionTime, 0);
    const throughput = totalTime > 0 ? totalBytes / (totalTime / 1000) : 0;

    const memoryUsage = this.getCurrentMemoryUsage();
    const cacheHitRate = this.calculateCacheHitRate();

    return {
      averageCompressionTime,
      averageDecompressionTime,
      averageCompressionRatio,
      errorRate,
      throughput,
      memoryUsage,
      cacheHitRate,
    };
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(): CompressionStats {
    return compressionService.getStats();
  }

  /**
   * Get compression metrics
   */
  getCompressionMetrics(): CompressionMetrics {
    return compressionService.getMetrics();
  }

  /**
   * Get recent events
   */
  getRecentEvents(timeWindow: number = 60 * 60 * 1000): CompressionEvent[] {
    const cutoff = Date.now() - timeWindow;
    return this.events.filter(e => e.timestamp.getTime() > cutoff);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): CompressionAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): CompressionAlert[] {
    return [...this.alerts];
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter(a => !a.resolved);
  }

  /**
   * Check for alerts based on event
   */
  private checkForAlerts(event: CompressionEvent): void {
    // Performance alerts
    if (event.compressionTime > this.performanceThresholds.maxCompressionTime) {
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `Compression took ${event.compressionTime}ms, exceeding threshold`,
        data: { event },
      });
    }

    // Compression ratio alerts
    if (event.success && event.type === 'compression') {
      const ratio = event.compressedSize / event.originalSize;
      if (ratio > this.performanceThresholds.minCompressionRatio) {
        this.createAlert({
          type: 'threshold',
          severity: 'low',
          message: `Poor compression ratio: ${(ratio * 100).toFixed(1)}%`,
          data: { event, ratio },
        });
      }
    }

    // Error alerts
    if (!event.success) {
      this.createAlert({
        type: 'error',
        severity: 'high',
        message: `Compression error: ${event.error}`,
        data: { event },
      });
    }

    // Memory usage alerts
    const memoryUsage = this.getCurrentMemoryUsage();
    if (memoryUsage > this.performanceThresholds.maxMemoryUsage) {
      this.createAlert({
        type: 'performance',
        severity: 'critical',
        message: `High memory usage: ${this.formatBytes(memoryUsage)}`,
        data: { memoryUsage },
      });
    }
  }

  /**
   * Create alert
   */
  private createAlert(alert: Omit<CompressionAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const fullAlert: CompressionAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      resolved: false,
      ...alert,
    };

    this.alerts.push(fullAlert);

    // Remove old alerts if limit exceeded
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Compression Alert:', fullAlert);
    }
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    const recentEvents = this.getRecentEvents(60 * 60 * 1000); // Last hour
    const cacheHits = recentEvents.filter(e => e.compressionTime === 0).length;
    return recentEvents.length > 0 ? cacheHits / recentEvents.length : 0;
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Export monitoring data
   */
  exportData(): {
    events: CompressionEvent[];
    alerts: CompressionAlert[];
    metrics: PerformanceMetrics;
    stats: CompressionStats;
  } {
    return {
      events: [...this.events],
      alerts: [...this.alerts],
      metrics: this.getPerformanceMetrics(),
      stats: this.getCompressionStats(),
    };
  }

  /**
   * Clear all monitoring data
   */
  clearData(): void {
    this.events = [];
    this.alerts = [];
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(thresholds: Partial<typeof this.performanceThresholds>): void {
    this.performanceThresholds = { ...this.performanceThresholds, ...thresholds };
  }

  /**
   * Get performance thresholds
   */
  getThresholds(): typeof this.performanceThresholds {
    return { ...this.performanceThresholds };
  }

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    // Set up periodic monitoring
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    const metrics = this.getPerformanceMetrics();
    
    // Check error rate
    if (metrics.errorRate > this.performanceThresholds.maxErrorRate) {
      this.createAlert({
        type: 'performance',
        severity: 'high',
        message: `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
        data: { metrics },
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > this.performanceThresholds.maxMemoryUsage) {
      this.createAlert({
        type: 'performance',
        severity: 'critical',
        message: `High memory usage: ${this.formatBytes(metrics.memoryUsage)}`,
        data: { metrics },
      });
    }
  }
}

// Singleton instance
export const compressionMonitor = new CompressionMonitor();
