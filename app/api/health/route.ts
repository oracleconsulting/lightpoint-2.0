import { NextResponse } from 'next/server';
import { logger } from '../../../lib/logger';


export async function GET() {
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    // Show partial values for debugging (first 10 chars only)
    supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) || 'MISSING',
    nodeVersion: process.version,
  };

  logger.info('🏥 Health check:', envCheck);

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envCheck,
    allVariablesPresent: Object.values(envCheck).slice(0, 4).every(v => v === true)
  });
}
