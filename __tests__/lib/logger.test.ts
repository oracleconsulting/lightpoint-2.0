import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '@/lib/logger';

describe('Logger', () => {
  let consoleSpy: { log: any; info: any; warn: any; error: any };
  
  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('in development mode', () => {
    it('should log debug messages', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const logger = new Logger();
      logger.debug('test debug message');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should log info messages', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const logger = new Logger();
      logger.info('test info message');
      
      expect(consoleSpy.info).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('in production mode', () => {
    it('should NOT log debug messages', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const logger = new Logger();
      logger.debug('test debug message');
      
      expect(consoleSpy.log).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should NOT log info messages', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const logger = new Logger();
      logger.info('test info message');
      
      expect(consoleSpy.info).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should log warnings in JSON format', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const logger = new Logger();
      logger.warn('test warning');
      
      expect(consoleSpy.warn).toHaveBeenCalled();
      const call = consoleSpy.warn.mock.calls[0][0];
      const parsed = JSON.parse(call);
      expect(parsed.level).toBe('warn');
      expect(parsed.message).toBe('test warning');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should log errors in JSON format', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const logger = new Logger();
      logger.error('test error');
      
      expect(consoleSpy.error).toHaveBeenCalled();
      const call = consoleSpy.error.mock.calls[0][0];
      const parsed = JSON.parse(call);
      expect(parsed.level).toBe('error');
      expect(parsed.message).toBe('test error');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('always (except test mode)', () => {
    it('should log warnings in non-test environments', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const logger = new Logger();
      logger.warn('test warning');
      expect(consoleSpy.warn).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should log errors in non-test environments', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const logger = new Logger();
      logger.error('test error');
      expect(consoleSpy.error).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});

