/**
 * Admin API Route: HMRC Manual Ingestion
 * 
 * POST /api/admin/ingest-hmrc-manuals
 *   Trigger ingestion of HMRC manuals
 *   Body: { manualCode?: string } - if provided, ingest only that manual
 * 
 * GET /api/admin/ingest-hmrc-manuals
 *   Get available manuals and ingestion status
 * 
 * Security: Requires admin authorization (service role key or admin session)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  ingestAllHMRCManuals, 
  ingestManualByCode,
  checkManualsNeedingUpdate,
  getIngestionStats,
} from '@/lib/ingestion/hmrcIngestionService';
import { HMRC_MANUAL_CONFIGS } from '@/lib/ingestion/types';
import { createClient } from '@supabase/supabase-js';

/**
 * Verify admin authorization
 * 
 * Accepts:
 * - Service role key in Authorization header (for scripts)
 * - Admin session cookie (for UI)
 */
async function verifyAdminAuth(request: NextRequest): Promise<{ authorized: boolean; error?: string }> {
  const authHeader = request.headers.get('authorization');
  
  // Check for service role key (for scripts/automation)
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (token === serviceRoleKey) {
      return { authorized: true };
    }
    
    // Also accept a custom admin API key if set
    const adminApiKey = process.env.ADMIN_API_KEY;
    if (adminApiKey && token === adminApiKey) {
      return { authorized: true };
    }
  }
  
  // Check for admin session via Supabase auth
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get session from cookie
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      // Try to verify user has admin role
      // This would need proper session handling based on your auth setup
      // For now, we rely on the service role key for security
    }
  }
  
  return { 
    authorized: false, 
    error: 'Unauthorized. Provide service role key or admin API key in Authorization header.' 
  };
}

/**
 * POST: Trigger manual ingestion
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const { authorized, error } = await verifyAdminAuth(request);
    if (!authorized) {
      return NextResponse.json({ error }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { manualCode, checkUpdates } = body as { 
      manualCode?: string; 
      checkUpdates?: boolean;
    };
    
    // If checkUpdates is true, just return which manuals need updating
    if (checkUpdates) {
      const needsUpdate = await checkManualsNeedingUpdate(30);
      return NextResponse.json({ 
        needsUpdate,
        message: `${needsUpdate.length} manuals have stale content`,
      });
    }
    
    // If specific manual requested, ingest only that one
    if (manualCode) {
      // Validate manual code
      const validCodes = HMRC_MANUAL_CONFIGS.map(c => c.code);
      if (!validCodes.includes(manualCode)) {
        return NextResponse.json({ 
          error: `Unknown manual code: ${manualCode}`,
          availableCodes: validCodes,
        }, { status: 400 });
      }
      
      console.log(`Starting ingestion for ${manualCode}...`);
      const summary = await ingestManualByCode(manualCode);
      
      return NextResponse.json({ 
        summaries: [summary],
        message: `Ingestion complete for ${manualCode}`,
      });
    }
    
    // Ingest all manuals
    console.log('Starting full HMRC manual ingestion...');
    const summaries = await ingestAllHMRCManuals();
    
    const totalAdded = summaries.reduce((sum, s) => sum + s.sectionsAdded, 0);
    const totalErrors = summaries.reduce((sum, s) => sum + s.errors.length, 0);
    
    return NextResponse.json({ 
      summaries,
      message: `Ingestion complete: ${totalAdded} chunks added, ${totalErrors} errors`,
    });
    
  } catch (err) {
    console.error('Ingestion error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET: Get available manuals and ingestion status
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const { authorized, error } = await verifyAdminAuth(request);
    if (!authorized) {
      return NextResponse.json({ error }, { status: 401 });
    }
    
    // Get URL params
    const { searchParams } = new URL(request.url);
    const manualCode = searchParams.get('manualCode');
    
    // If specific manual requested, return its stats
    if (manualCode) {
      const validCodes = HMRC_MANUAL_CONFIGS.map(c => c.code);
      if (!validCodes.includes(manualCode)) {
        return NextResponse.json({ 
          error: `Unknown manual code: ${manualCode}`,
          availableCodes: validCodes,
        }, { status: 400 });
      }
      
      const stats = await getIngestionStats(manualCode);
      const config = HMRC_MANUAL_CONFIGS.find(c => c.code === manualCode);
      
      return NextResponse.json({
        manual: {
          code: manualCode,
          name: config?.name,
          ...stats,
        },
      });
    }
    
    // Return all available manuals with basic stats
    const manualsWithStats = await Promise.all(
      HMRC_MANUAL_CONFIGS.map(async (config) => {
        const stats = await getIngestionStats(config.code);
        return {
          code: config.code,
          name: config.name,
          priority: config.priority,
          ...stats,
        };
      })
    );
    
    // Check which need updates
    const needsUpdate = await checkManualsNeedingUpdate(30);
    
    return NextResponse.json({
      availableManuals: manualsWithStats,
      needsUpdate,
      usage: {
        triggerAll: 'POST /api/admin/ingest-hmrc-manuals with {}',
        triggerOne: 'POST /api/admin/ingest-hmrc-manuals with { manualCode: "DMBM" }',
        checkUpdates: 'POST /api/admin/ingest-hmrc-manuals with { checkUpdates: true }',
        getStats: 'GET /api/admin/ingest-hmrc-manuals?manualCode=DMBM',
      },
    });
    
  } catch (err) {
    console.error('GET error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

