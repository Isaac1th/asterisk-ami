const { createLogger, LOG_LEVELS } = require("../utils/logger");

describe("logger utility", () => {
  let consoleSpy;

  beforeEach(() => {
    // Spy on console methods
    consoleSpy = {
      log: jest.spyOn(console, "log").mockImplementation(),
      warn: jest.spyOn(console, "warn").mockImplementation(),
      error: jest.spyOn(console, "error").mockImplementation(),
    };
  });

  afterEach(() => {
    // Restore console methods
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe("LOG_LEVELS", () => {
    it("should define correct log level hierarchy", () => {
      expect(LOG_LEVELS.error).toBe(0);
      expect(LOG_LEVELS.warn).toBe(1);
      expect(LOG_LEVELS.info).toBe(2);
      expect(LOG_LEVELS.debug).toBe(3);
    });
  });

  describe("createLogger", () => {
    it("should create a logger with all methods", () => {
      const log = createLogger("TestModule");

      expect(typeof log.debug).toBe("function");
      expect(typeof log.info).toBe("function");
      expect(typeof log.warn).toBe("function");
      expect(typeof log.error).toBe("function");
    });

    it("should use default context when none provided", () => {
      const log = createLogger();

      // This just verifies the logger is created without error
      expect(log).toBeDefined();
    });
  });

  describe("log formatting", () => {
    it("should include timestamp, level, and context in output", () => {
      // Set LOG_LEVEL to debug to ensure all messages are logged
      const originalLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = "debug";

      // Need to re-require to pick up new env
      jest.resetModules();
      const { createLogger: freshCreateLogger } = require("../utils/logger");
      const log = freshCreateLogger("TestContext");

      log.info("Test message");

      // Restore
      process.env.LOG_LEVEL = originalLevel;

      // Check that console.log was called
      expect(consoleSpy.log).toHaveBeenCalled();

      // Get the first argument of the first call
      const loggedMessage = consoleSpy.log.mock.calls[0][0];

      // Verify format: [timestamp] [LEVEL] [context] message
      expect(loggedMessage).toMatch(/^\[.+\] \[INFO \] \[TestContext\] Test message$/);
    });

    it("should format objects as JSON", () => {
      const originalLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = "debug";

      jest.resetModules();
      const { createLogger: freshCreateLogger } = require("../utils/logger");
      const log = freshCreateLogger("Test");

      const testData = { key: "value", num: 123 };
      log.info("With data", testData);

      process.env.LOG_LEVEL = originalLevel;

      expect(consoleSpy.log).toHaveBeenCalled();
      // Second argument should be the formatted JSON
      const dataArg = consoleSpy.log.mock.calls[0][1];
      expect(dataArg).toContain('"key": "value"');
    });
  });

  describe("error logging", () => {
    it("should log Error instances with message", () => {
      const originalLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = "debug";

      jest.resetModules();
      const { createLogger: freshCreateLogger } = require("../utils/logger");
      const log = freshCreateLogger("Test");

      const testError = new Error("Test error message");
      log.error("An error occurred", testError);

      process.env.LOG_LEVEL = originalLevel;

      expect(consoleSpy.error).toHaveBeenCalled();
      // Second argument should be the error message
      const errorArg = consoleSpy.error.mock.calls[0][1];
      expect(errorArg).toBe("Test error message");
    });

    it("should log non-Error values directly", () => {
      const originalLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = "debug";

      jest.resetModules();
      const { createLogger: freshCreateLogger } = require("../utils/logger");
      const log = freshCreateLogger("Test");

      log.error("Error info", "plain string error");

      process.env.LOG_LEVEL = originalLevel;

      expect(consoleSpy.error).toHaveBeenCalled();
      const errorArg = consoleSpy.error.mock.calls[0][1];
      expect(errorArg).toBe("plain string error");
    });
  });

  describe("warn logging", () => {
    it("should use console.warn for warnings", () => {
      const originalLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = "debug";

      jest.resetModules();
      const { createLogger: freshCreateLogger } = require("../utils/logger");
      const log = freshCreateLogger("Test");

      log.warn("Warning message");

      process.env.LOG_LEVEL = originalLevel;

      expect(consoleSpy.warn).toHaveBeenCalled();
      const loggedMessage = consoleSpy.warn.mock.calls[0][0];
      expect(loggedMessage).toContain("[WARN ]");
    });
  });
});
