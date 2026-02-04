/**
 * Centralized logging utility with log levels and structured output
 * Replaces scattered console.log statements throughout the codebase
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Get log level from environment, default to 'info' in production, 'debug' in development
const DEFAULT_LEVEL =
  process.env.NODE_ENV === "production" ? "info" : "debug";
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS[DEFAULT_LEVEL];

/**
 * Formats a log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} context - Context/module name
 * @param {string} message - Log message
 * @returns {string} Formatted log string
 */
function formatMessage(level, context, message) {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase().padEnd(5);
  return `[${timestamp}] [${levelUpper}] [${context}] ${message}`;
}

/**
 * Creates a logger instance with optional context prefix
 * @param {string} context - Context name for this logger instance
 * @returns {Object} Logger object with debug, info, warn, error methods
 */
function createLogger(context = "App") {
  return {
    /**
     * Debug level - verbose information for development
     */
    debug: (message, data) => {
      if (currentLevel >= LOG_LEVELS.debug) {
        const formatted = formatMessage("debug", context, message);
        if (data !== undefined) {
          console.log(formatted, typeof data === "object" ? JSON.stringify(data, null, 2) : data);
        } else {
          console.log(formatted);
        }
      }
    },

    /**
     * Info level - general operational information
     */
    info: (message, data) => {
      if (currentLevel >= LOG_LEVELS.info) {
        const formatted = formatMessage("info", context, message);
        if (data !== undefined) {
          console.log(formatted, typeof data === "object" ? JSON.stringify(data, null, 2) : data);
        } else {
          console.log(formatted);
        }
      }
    },

    /**
     * Warn level - potentially problematic situations
     */
    warn: (message, data) => {
      if (currentLevel >= LOG_LEVELS.warn) {
        const formatted = formatMessage("warn", context, message);
        if (data !== undefined) {
          console.warn(formatted, typeof data === "object" ? JSON.stringify(data, null, 2) : data);
        } else {
          console.warn(formatted);
        }
      }
    },

    /**
     * Error level - error conditions
     */
    error: (message, err) => {
      if (currentLevel >= LOG_LEVELS.error) {
        const formatted = formatMessage("error", context, message);
        if (err !== undefined) {
          console.error(formatted, err instanceof Error ? err.message : err);
          if (err instanceof Error && err.stack && currentLevel >= LOG_LEVELS.debug) {
            console.error(err.stack);
          }
        } else {
          console.error(formatted);
        }
      }
    },
  };
}

// Default logger instance
const logger = createLogger();

module.exports = {
  createLogger,
  logger,
  LOG_LEVELS,
};
