// src/utils/logger.js
// Centralized logging utility

const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

const createLogger = (namespace) => {
  const log = (level, ...args) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${namespace}]`;

    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.log(prefix, '[DEBUG]', ...args);
        break;
      case LOG_LEVELS.INFO:
        console.log(prefix, '[INFO]', ...args);
        break;
      case LOG_LEVELS.WARN:
        console.warn(prefix, '[WARN]', ...args);
        break;
      case LOG_LEVELS.ERROR:
        console.error(prefix, '[ERROR]', ...args);
        break;
      default:
        console.log(prefix, ...args);
    }
  };

  return {
    debug: (...args) => log(LOG_LEVELS.DEBUG, ...args),
    info: (...args) => log(LOG_LEVELS.INFO, ...args),
    warn: (...args) => log(LOG_LEVELS.WARN, ...args),
    error: (...args) => log(LOG_LEVELS.ERROR, ...args),
  };
};

// Export default logger instance
export default createLogger;

// Named export for creating namespaced loggers
export { createLogger, LOG_LEVELS };