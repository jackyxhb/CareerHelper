/* eslint-disable no-console */

export interface LogContext {
  service: string;
  version: string;
  [key: string]: any;
}

export interface LogEntry extends LogContext {
  timestamp: string;
  level: string;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Structured logging utility for CareerHelper Lambda functions
 */
export default class Logger {
  private context: LogContext;

  constructor(context: Record<string, any> = {}) {
    this.context = {
      service: 'CareerHelper',
      version: '0.0.1',
      ...context,
    };
  }

  private _formatLog(
    level: string,
    message: string,
    data: Record<string, any> = {},
    error: Error | null = null
  ): LogEntry {
    const logEntry: LogEntry = {
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

  info(message: string, data: Record<string, any> = {}): void {
    const logEntry = this._formatLog('INFO', message, data);
    console.log(JSON.stringify(logEntry));
  }

  warn(message: string, data: Record<string, any> = {}, error: Error | null = null): void {
    const logEntry = this._formatLog('WARN', message, data, error);
    console.warn(JSON.stringify(logEntry));
  }

  error(message: string, data: Record<string, any> = {}, error: Error | null = null): void {
    const logEntry = this._formatLog('ERROR', message, data, error);
    console.error(JSON.stringify(logEntry));
  }

  debug(message: string, data: Record<string, any> = {}): void {
    const logEntry = this._formatLog('DEBUG', message, data);
    console.debug(JSON.stringify(logEntry));
  }
}
