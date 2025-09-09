import { describe, it, expect, vi, beforeEach } from "vitest";
import { Logger, LogLevel, logger } from "./logger";

// Mock fetch for external service tests
global.fetch = vi.fn();

describe("Logger Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("Logger Configuration", () => {
    it("should create logger with default configuration", () => {
      const testLogger = new Logger();

      expect(testLogger.getSessionId()).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it("should create logger with custom configuration", () => {
      const config = {
        level: LogLevel.DEBUG,
        enableConsole: false,
        enableExternalService: true,
        externalServiceUrl: "https://api.example.com/logs",
        externalServiceKey: "test-key",
      };

      const testLogger = new Logger(config);
      testLogger.setConfig(config);

      expect(testLogger.getSessionId()).toBeDefined();
    });
  });

  describe("Log Level Filtering", () => {
    it("should respect log level configuration", () => {
      const testLogger = new Logger({ level: LogLevel.WARN });

      testLogger.debug("Debug message");
      testLogger.info("Info message");
      testLogger.warn("Warning message");
      testLogger.error("Error message");

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it("should log all levels when set to DEBUG", () => {
      const testLogger = new Logger({ level: LogLevel.DEBUG });

      testLogger.debug("Debug message");
      testLogger.info("Info message");
      testLogger.warn("Warning message");
      testLogger.error("Error message");

      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Console Logging", () => {
    it("should log to console when enabled", () => {
      const testLogger = new Logger({ enableConsole: true });

      testLogger.info("Test message");

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("INFO: Test message")
      );
    });

    it("should not log to console when disabled", () => {
      const testLogger = new Logger({ enableConsole: false });

      testLogger.info("Test message");

      expect(console.info).not.toHaveBeenCalled();
    });

    it("should format log messages correctly", () => {
      const testLogger = new Logger();

      testLogger.info("Test message", { userId: "123", action: "login" });

      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test message {"userId":"123","action":"login"}$/
        )
      );
    });
  });

  describe("Error Logging", () => {
    it("should log errors with proper formatting", () => {
      const testLogger = new Logger();
      const error = new Error("Test error");

      testLogger.logError(error, { context: "test" });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("ERROR: Application error: Test error")
      );
    });

    it("should handle non-Error objects", () => {
      const testLogger = new Logger();

      testLogger.error("Non-error message", undefined, { value: "test" });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("ERROR: Non-error message")
      );
    });
  });

  describe("Specialized Logging Methods", () => {
    it("should log user actions", () => {
      const testLogger = new Logger();

      testLogger.logUserAction("login", { method: "google" });

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("INFO: User action: login")
      );
    });

    it("should log performance metrics", () => {
      const testLogger = new Logger();

      testLogger.logPerformance("api_call", 150, { endpoint: "/users" });

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("INFO: Performance: api_call took 150ms")
      );
    });
  });

  describe("External Service Integration", () => {
    it("should send logs to external service when enabled", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response("OK", { status: 200 }));

      const testLogger = new Logger({
        enableExternalService: true,
        externalServiceUrl: "https://api.example.com/logs",
        externalServiceKey: "test-key",
      });

      testLogger.info("Test message", { context: "test" });

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/logs",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-key",
          }),
          body: expect.stringContaining("Test message"),
        })
      );
    });

    it("should handle external service failures gracefully", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error("Network error"));

      const testLogger = new Logger({
        enableExternalService: true,
        externalServiceUrl: "https://api.example.com/logs",
      });

      testLogger.info("Test message");

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not throw, but log error to console
      expect(console.error).toHaveBeenCalledWith(
        "Failed to send log to external service:",
        expect.any(Error)
      );
    });
  });

  describe("Default Logger Instance", () => {
    it("should export a default logger instance", () => {
      expect(logger).toBeInstanceOf(Logger);
      expect(logger.getSessionId()).toBeDefined();
    });

    it("should allow configuration updates", () => {
      const originalLevel = LogLevel.INFO;

      logger.setConfig({ level: LogLevel.DEBUG });

      logger.debug("Debug message");
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe("Session Management", () => {
    it("should generate unique session IDs", () => {
      const logger1 = new Logger();
      const logger2 = new Logger();

      expect(logger1.getSessionId()).not.toBe(logger2.getSessionId());
    });

    it("should maintain consistent session ID", () => {
      const testLogger = new Logger();
      const sessionId1 = testLogger.getSessionId();
      const sessionId2 = testLogger.getSessionId();

      expect(sessionId1).toBe(sessionId2);
    });
  });
});
