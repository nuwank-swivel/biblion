import { firestoreService } from '../firestore-service';
import { PerformanceMetrics } from '../schemas/firestore';

export interface PerformanceReport {
  totalOperations: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  slowestOperations: PerformanceMetrics[];
  mostCommonErrors: { error: string; count: number }[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface PerformanceThresholds {
  slowOperationThreshold: number; // milliseconds
  errorRateThreshold: number; // percentage
  responseTimeThreshold: number; // milliseconds
}

export class PerformanceMonitor {
  private thresholds: PerformanceThresholds = {
    slowOperationThreshold: 1000, // 1 second
    errorRateThreshold: 5, // 5%
    responseTimeThreshold: 500, // 500ms
  };

  private alerts: Array<{
    type: 'slow_operation' | 'high_error_rate' | 'slow_response';
    message: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
  }> = [];

  /**
   * Get performance report for a time range
   */
  getPerformanceReport(startDate?: Date, endDate?: Date): PerformanceReport {
    const metrics = firestoreService.getPerformanceMetrics();
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    const end = endDate || now;

    // Filter metrics by time range
    const filteredMetrics = metrics.filter(metric => 
      metric.timestamp >= start && metric.timestamp <= end
    );

    if (filteredMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0,
        slowestOperations: [],
        mostCommonErrors: [],
        timeRange: { start, end },
      };
    }

    // Calculate statistics
    const totalOperations = filteredMetrics.length;
    const successfulOperations = filteredMetrics.filter(m => m.success);
    const failedOperations = filteredMetrics.filter(m => !m.success);
    
    const averageResponseTime = filteredMetrics.reduce((sum, metric) => 
      sum + metric.duration, 0
    ) / totalOperations;

    const successRate = (successfulOperations.length / totalOperations) * 100;
    const errorRate = (failedOperations.length / totalOperations) * 100;

    // Get slowest operations
    const slowestOperations = filteredMetrics
      .filter(m => m.duration >= this.thresholds.slowOperationThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Get most common errors
    const errorCounts = new Map<string, number>();
    failedOperations.forEach(metric => {
      if (metric.error) {
        const count = errorCounts.get(metric.error) || 0;
        errorCounts.set(metric.error, count + 1);
      }
    });

    const mostCommonErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalOperations,
      averageResponseTime,
      successRate,
      errorRate,
      slowestOperations,
      mostCommonErrors,
      timeRange: { start, end },
    };
  }

  /**
   * Check for performance issues and generate alerts
   */
  checkPerformanceIssues(): void {
    const report = this.getPerformanceReport();
    
    // Check for slow operations
    if (report.slowestOperations.length > 0) {
      const slowest = report.slowestOperations[0];
      this.addAlert(
        'slow_operation',
        `Slow operation detected: ${slowest.operationType} took ${slowest.duration}ms`,
        slowest.duration > this.thresholds.slowOperationThreshold * 2 ? 'high' : 'medium'
      );
    }

    // Check for high error rate
    if (report.errorRate > this.thresholds.errorRateThreshold) {
      this.addAlert(
        'high_error_rate',
        `High error rate detected: ${report.errorRate.toFixed(2)}%`,
        report.errorRate > this.thresholds.errorRateThreshold * 2 ? 'high' : 'medium'
      );
    }

    // Check for slow average response time
    if (report.averageResponseTime > this.thresholds.responseTimeThreshold) {
      this.addAlert(
        'slow_response',
        `Slow average response time: ${report.averageResponseTime.toFixed(2)}ms`,
        report.averageResponseTime > this.thresholds.responseTimeThreshold * 2 ? 'high' : 'medium'
      );
    }
  }

  /**
   * Get performance metrics by operation type
   */
  getMetricsByOperationType(operationType: string, startDate?: Date, endDate?: Date): PerformanceMetrics[] {
    const metrics = firestoreService.getPerformanceMetrics();
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const end = endDate || now;

    return metrics.filter(metric => 
      metric.operationType === operationType &&
      metric.timestamp >= start &&
      metric.timestamp <= end
    );
  }

  /**
   * Get performance trends over time
   */
  getPerformanceTrends(hours: number = 24): {
    timeSlots: Array<{
      start: Date;
      end: Date;
      metrics: PerformanceMetrics[];
    }>;
  } {
    const metrics = firestoreService.getPerformanceMetrics();
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    
    // Create time slots (1 hour each)
    const timeSlots = [];
    const slotDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    
    for (let i = 0; i < hours; i++) {
      const slotStart = new Date(startTime.getTime() + i * slotDuration);
      const slotEnd = new Date(slotStart.getTime() + slotDuration);
      
      const slotMetrics = metrics.filter(metric => 
        metric.timestamp >= slotStart && metric.timestamp < slotEnd
      );
      
      timeSlots.push({
        start: slotStart,
        end: slotEnd,
        metrics: slotMetrics,
      });
    }

    return { timeSlots };
  }

  /**
   * Get alerts
   */
  getAlerts(severity?: 'low' | 'medium' | 'high'): Array<{
    type: string;
    message: string;
    timestamp: Date;
    severity: string;
  }> {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Set performance thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * Export performance data
   */
  exportPerformanceData(startDate?: Date, endDate?: Date): {
    metrics: PerformanceMetrics[];
    report: PerformanceReport;
    alerts: typeof this.alerts;
    exportDate: Date;
  } {
    const metrics = firestoreService.getPerformanceMetrics();
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const end = endDate || now;

    const filteredMetrics = metrics.filter(metric => 
      metric.timestamp >= start && metric.timestamp <= end
    );

    const report = this.getPerformanceReport(start, end);

    return {
      metrics: filteredMetrics,
      report,
      alerts: [...this.alerts],
      exportDate: new Date(),
    };
  }

  /**
   * Monitor real-time performance
   */
  startRealTimeMonitoring(intervalMs: number = 60000): () => void {
    const interval = setInterval(() => {
      this.checkPerformanceIssues();
    }, intervalMs);

    return () => clearInterval(interval);
  }

  /**
   * Add performance alert
   */
  private addAlert(
    type: 'slow_operation' | 'high_error_rate' | 'slow_response',
    message: string,
    severity: 'low' | 'medium' | 'high'
  ): void {
    this.alerts.push({
      type,
      message,
      timestamp: new Date(),
      severity,
    });

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage(): {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  /**
   * Get network information
   */
  getNetworkInfo(): {
    effectiveType: string;
    downlink: number;
    rtt: number;
  } | null {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      };
    }
    return null;
  }

  /**
   * Get comprehensive system information
   */
  getSystemInfo(): {
    userAgent: string;
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
    memory?: ReturnType<typeof this.getMemoryUsage>;
    network?: ReturnType<typeof this.getNetworkInfo>;
  } {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      memory: this.getMemoryUsage(),
      network: this.getNetworkInfo(),
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
