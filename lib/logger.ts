/**
 * Production-ready logging utility
 * - Debug/Info: Only in development (prevents information leakage)
 * - Warn/Error: Always logged (critical for debugging production issues)
 * 
 * TODO: Integrate with external logging service (Axiom, Logtail, DataDog) for production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';
  private isTest = process.env.NODE_ENV === 'test';

  /**
   * Format log entry for structured logging
   */
  private formatEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  /**
   * Log debug messages (ONLY in development - never in production)
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment && !this.isTest) {
      // eslint-disable-next-line no-console
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
    // In production: completely silent (prevents information leakage)
  }

  /**
   * Log informational messages (ONLY in development - never in production)
   */
  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment && !this.isTest) {
      // eslint-disable-next-line no-console
      console.info(`ℹ️  [INFO] ${message}`, ...args);
    }
    // In production: silent (prevents information leakage)
    // TODO: Send to logging service for production monitoring
  }

  /**
   * Log warnings (always logged - important for debugging)
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.isTest) return;
    
    if (this.isProduction) {
      // In production: structured JSON for log aggregation
      // eslint-disable-next-line no-console
      console.warn(JSON.stringify(this.formatEntry('warn', message, args.length ? args : undefined)));
    } else {
      // eslint-disable-next-line no-console
      console.warn(`⚠️  [WARN] ${message}`, ...args);
    }
  }

  /**
   * Log errors (always logged - critical for debugging)
   */
  error(message: string, ...args: unknown[]): void {
    if (this.isTest) return;
    
    if (this.isProduction) {
      // In production: structured JSON for log aggregation
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(this.formatEntry('error', message, args.length ? args : undefined)));
    } else {
      // eslint-disable-next-line no-console
      console.error(`❌ [ERROR] ${message}`, ...args);
    }
  }

  /**
   * Log with custom level
   */
  log(level: LogLevel, message: string, ...args: unknown[]): void {
    switch (level) {
      case 'debug':
        this.debug(message, ...args);
        break;
      case 'info':
        this.info(message, ...args);
        break;
      case 'warn':
        this.warn(message, ...args);
        break;
      case 'error':
        this.error(message, ...args);
        break;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };

