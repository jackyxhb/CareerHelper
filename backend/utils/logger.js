/**
 * Structured logging utility for CareerHelper Lambda functions
 */
class Logger {
  constructor(context = {}) {
    this.context = {
      service: 'CareerHelper',
      version: '0.0.1',
      ...context,
    };
  }

  _formatLog(level, message, data = {}, error = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return logEntry;
  }

  info(message, data = {}) {
    const logEntry = this._formatLog('INFO', message, data);
    console.log(JSON.stringify(logEntry));
  }

  warn(message, data = {}, error = null) {
    const logEntry = this._formatLog('WARN', message, data, error);
    console.warn(JSON.stringify(logEntry));
  }

  error(message, data = {}, error = null) {
    const logEntry = this._formatLog('ERROR', message, data, error);
    console.error(JSON.stringify(logEntry));
  }

  debug(message, data = {}) {
    const logEntry = this._formatLog('DEBUG', message, data);
    console.debug(JSON.stringify(logEntry));
  }
}

module.exports = Logger;
