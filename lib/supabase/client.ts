import { createClient } from '@supabase/supabase-js';

// Client-side supabase client (lazy initialization)
let _supabase: ReturnType<typeof createClient> | null = null;
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return (_supabase as any)[prop];
  }
});

// Server-side client with service key for admin operations
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!url || !serviceKey) {
    // During build time, return a mock client
    if (process.env.NODE_ENV === 'production' && !serviceKey) {
      console.warn('Supabase admin client not available during build');
      return null as any;
    }
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Backward compatibility - lazy initialization
let _supabaseAdmin: any = null;
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createServerClient();
    }
    return _supabaseAdmin[prop];
  }
});

