/**
 * Logger service for Biblion application
 * Provides structured logging with different levels and optional external service integration
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableExternalService: boolean;
  externalServiceUrl?: string;
  externalServiceKey?: string;
}

class Logger {
  private config: LoggerConfig;
  private sessionId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableExternalService: false,
      ...config,
    };
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    const errorStr = entry.error ? ` Error: ${entry.error.message}` : "";

    return `[${timestamp}] ${levelName}: ${entry.message}${contextStr}${errorStr}`;
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    if (!this.config.enableExternalService || !this.config.externalServiceUrl) {
      return;
    }

    try {
      const payload = {
        ...entry,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: entry.timestamp.toISOString(),
      };

      await fetch(this.config.externalServiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.externalServiceKey && {
            Authorization: `Bearer ${this.config.externalServiceKey}`,
          }),
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      // Fallback to console if external service fails
      console.error("Failed to send log to external service:", error);
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      sessionId: this.sessionId,
    };

    // Console logging
    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(entry);

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
      }
    }

    // External service logging (async, don't await)
    this.sendToExternalService(entry).catch(() => {
      // Error already handled in sendToExternalService
    });
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Specialized methods for common use cases
  logUserAction(action: string, context?: Record<string, unknown>): void {
    this.info(`User action: ${action}`, context);
  }

  logError(error: Error, context?: Record<string, unknown>): void {
    this.error(`Application error: ${error.message}`, error, context);
  }

  logPerformance(
    operation: string,
    duration: number,
    context?: Record<string, unknown>
  ): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      ...context,
      duration,
    });
  }

  // Configuration methods
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setUserId(userId: string): void {
    // This would be used to associate logs with a specific user
    // Implementation depends on authentication system
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

// Create and export a default logger instance
export const logger = new Logger({
  level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableExternalService: import.meta.env.PROD,
  // In production, these would be set via environment variables
  externalServiceUrl: import.meta.env.VITE_LOGGING_SERVICE_URL,
  externalServiceKey: import.meta.env.VITE_LOGGING_SERVICE_KEY,
});

// Export the Logger class for custom instances
export { Logger };
