import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// Type assertion for tables not yet in schema
const supabase = supabaseAdmin as any;

export async function POST(request: NextRequest) {
  try {
    const { token, userId, fullName } = await request.json();
    
    if (!token || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Try organization invite first
    const { data: orgInvite } = await supabase
      .from('organization_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();
    
    if (orgInvite) {
      // Accept organization invite
      return await acceptOrganizationInvite(orgInvite, userId, fullName);
    }
    
    // Try team invite
    const { data: teamInvite } = await supabase
      .from('team_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();
    
    if (teamInvite) {
      // Accept team invite
      return await acceptTeamInvite(teamInvite, userId, fullName);
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid or expired invite' },
      { status: 400 }
    );
    
  } catch (error: any) {
    logger.error('Error accepting invite:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to accept invite' },
      { status: 500 }
    );
  }
}

async function acceptOrganizationInvite(invite: any, userId: string, fullName: string) {
  // 1. Create the organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: invite.organization_name,
      settings: {
        created_from_invite: invite.id,
        trial_ends_at: new Date(Date.now() + invite.trial_days * 24 * 60 * 60 * 1000).toISOString(),
      },
    })
    .select()
    .single();
  
  if (orgError) {
    logger.error('Failed to create organization:', orgError);
    throw new Error('Failed to create organization');
  }
  
  logger.info(`✅ Organization created: ${org.name} (${org.id})`);
  
  // 2. Create or update the user in lightpoint_users
  const { error: userError } = await supabase
    .from('lightpoint_users')
    .upsert({
      id: userId,
      email: invite.email,
      full_name: fullName || invite.contact_name,
      organization_id: org.id,
      role: 'admin', // First user is always admin
    }, {
      onConflict: 'id',
    });
  
  if (userError) {
    logger.error('Failed to create/update user:', userError);
    throw new Error('Failed to set up user account');
  }
  
  logger.info(`✅ User linked to organization: ${invite.email} -> ${org.name}`);
  
  // 3. Create subscription if tier specified
  if (invite.tier_id) {
    const trialEndsAt = new Date(Date.now() + invite.trial_days * 24 * 60 * 60 * 1000);
    
    const { error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        organization_id: org.id,
        tier_id: invite.tier_id,
        status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
      });
    
    if (subError) {
      logger.warn('Failed to create subscription:', subError);
      // Don't fail the whole process for this
    } else {
      logger.info(`✅ Trial subscription created (ends: ${trialEndsAt.toISOString()})`);
    }
  }
  
  // 4. Mark invite as accepted
  const { error: updateError } = await supabase
    .from('organization_invites')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invite.id);
  
  if (updateError) {
    logger.warn('Failed to update invite status:', updateError);
  }
  
  logger.info(`🎉 Organization invite accepted: ${invite.organization_name}`);
  
  return NextResponse.json({
    success: true,
    organization_id: org.id,
    organization_name: org.name,
  });
}

async function acceptTeamInvite(invite: any, userId: string, fullName: string) {
  // 1. Create or update the user in lightpoint_users
  const { error: userError } = await supabase
    .from('lightpoint_users')
    .upsert({
      id: userId,
      email: invite.email,
      full_name: fullName,
      organization_id: invite.organization_id,
      role: invite.role || 'user',
    }, {
      onConflict: 'id',
    });
  
  if (userError) {
    logger.error('Failed to create/update user:', userError);
    throw new Error('Failed to set up user account');
  }
  
  logger.info(`✅ Team member added: ${invite.email} (${invite.role})`);
  
  // 2. Mark invite as accepted
  const { error: updateError } = await supabase
    .from('team_invites')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invite.id);
  
  if (updateError) {
    logger.warn('Failed to update invite status:', updateError);
  }
  
  logger.info(`🎉 Team invite accepted for org: ${invite.organization_id}`);
  
  return NextResponse.json({
    success: true,
    organization_id: invite.organization_id,
    role: invite.role,
  });
}
