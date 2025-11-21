import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger, logger } from '../../lib/logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
      const testLogger = new Logger();
      
      testLogger.debug('Test debug message', { key: 'value' });
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Test debug message'),
        expect.objectContaining({ key: 'value' })
      );
    });

    it('should not log debug messages in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      const testLogger = new Logger();
      
      testLogger.debug('Test debug message');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test info message', { userId: '123' });
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test info message'),
        expect.objectContaining({ userId: '123' })
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning', { reason: 'test' });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Test warning'),
        expect.objectContaining({ reason: 'test' })
      );
    });
  });

  describe('error', () => {
    it('should log error messages with Error object', () => {
      const testError = new Error('Test error');
      
      logger.error('Something went wrong', testError, { component: 'test' });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Something went wrong'),
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Test error',
            name: 'Error',
          }),
          component: 'test',
        })
      );
    });

    it('should log error messages without Error object', () => {
      logger.error('Generic error', undefined, { code: 500 });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Generic error'),
        expect.objectContaining({ code: 500 })
      );
    });
  });

  describe('log', () => {
    it('should route to appropriate log level', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
      const testLogger = new Logger();
      
      testLogger.log('debug', 'Debug via log');
      testLogger.log('info', 'Info via log');
      testLogger.log('warn', 'Warn via log');
      testLogger.log('error', 'Error via log');
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});

