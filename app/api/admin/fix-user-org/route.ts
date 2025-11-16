import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * ADMIN-ONLY: Fix user organization
 * GET /api/admin/fix-user-org?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Create admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check current state
    const { data: before, error: fetchError } = await supabase
      .from('lightpoint_users')
      .select('id, email, organization_id, role')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json({ 
        error: 'User not found', 
        details: fetchError.message 
      }, { status: 404 });
    }

    // Update organization_id
    const { data: after, error: updateError } = await supabase
      .from('lightpoint_users')
      .update({ organization_id: '00000000-0000-0000-0000-000000000001' })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ 
        error: 'Update failed', 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      before,
      after,
      message: 'Organization updated successfully'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal error', 
      details: error.message 
    }, { status: 500 });
  }
}

