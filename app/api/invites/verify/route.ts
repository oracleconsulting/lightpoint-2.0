import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

// Type assertion for tables not yet in schema
const supabase = supabaseAdmin as any;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'No token provided' },
      { status: 400 }
    );
  }
  
  try {
    // Check organization invites
    const { data: orgInvite, error: orgError } = await supabase
      .from('organization_invites')
      .select('*')
      .eq('token', token)
      .single();
    
    if (orgInvite) {
      // Check if expired
      if (new Date(orgInvite.expires_at) < new Date()) {
        // Mark as expired
        await supabase
          .from('organization_invites')
          .update({ status: 'expired' })
          .eq('id', orgInvite.id);
        
        return NextResponse.json(
          { valid: false, error: 'This invite has expired' },
          { status: 400 }
        );
      }
      
      // Check if already accepted
      if (orgInvite.status === 'accepted') {
        return NextResponse.json(
          { valid: false, error: 'This invite has already been used' },
          { status: 400 }
        );
      }
      
      // Check if cancelled
      if (orgInvite.status === 'cancelled') {
        return NextResponse.json(
          { valid: false, error: 'This invite has been cancelled' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        valid: true,
        type: 'organization',
        invite: {
          id: orgInvite.id,
          email: orgInvite.email,
          organization_name: orgInvite.organization_name,
          contact_name: orgInvite.contact_name,
          trial_days: orgInvite.trial_days,
        },
      });
    }
    
    // Check team invites
    const { data: teamInvite, error: teamError } = await supabase
      .from('team_invites')
      .select(`
        *,
        organizations(name)
      `)
      .eq('token', token)
      .single();
    
    if (teamInvite) {
      // Check if expired
      if (new Date(teamInvite.expires_at) < new Date()) {
        await supabase
          .from('team_invites')
          .update({ status: 'expired' })
          .eq('id', teamInvite.id);
        
        return NextResponse.json(
          { valid: false, error: 'This invite has expired' },
          { status: 400 }
        );
      }
      
      if (teamInvite.status !== 'pending') {
        return NextResponse.json(
          { valid: false, error: 'This invite is no longer valid' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        valid: true,
        type: 'team',
        invite: {
          id: teamInvite.id,
          email: teamInvite.email,
          organization_id: teamInvite.organization_id,
          organization_name: teamInvite.organizations?.name,
          role: teamInvite.role,
        },
      });
    }
    
    return NextResponse.json(
      { valid: false, error: 'Invite not found' },
      { status: 404 }
    );
    
  } catch (error: any) {
    console.error('Error verifying invite:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to verify invite' },
      { status: 500 }
    );
  }
}
