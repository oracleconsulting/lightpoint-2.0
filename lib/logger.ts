/**
 * Production-ready logging utility
 * Replaces console.log statements with proper structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment && !this.isTest) {
      // eslint-disable-next-line no-console
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, ...args: unknown[]): void {
    if (!this.isTest) {
      // eslint-disable-next-line no-console
      console.info(`ℹ️  [INFO] ${message}`, ...args);
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.warn(`⚠️  [WARN] ${message}`, ...args);
  }

  /**
   * Log errors (accepts error object and/or additional context)
   */
  error(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.error(`❌ [ERROR] ${message}`, ...args);
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

