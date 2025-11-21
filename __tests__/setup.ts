/**
 * Test setup file
 * Runs before all tests
 */

// Set test environment (read-only property workaround)
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
process.env.VOYAGE_API_KEY = 'test-voyage-key';
process.env.COHERE_API_KEY = 'test-cohere-key';
process.env.REDIS_URL = 'redis://localhost:6379';

