/**
 * User Management API Route
 *
 * Handles:
 * - DELETE /api/users/manage  → Hard delete user from auth + lightpoint_users
 * - POST   /api/users/manage  → Set a new temporary password and return it
 *
 * Both operations require admin-level auth and use the Supabase service role key.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Verify the calling user is an admin in the same org as the target user.
 */
async function verifyAdminCaller(targetUserId: string): Promise<{
  ok: boolean;
  error?: string;
  callerOrgId?: string;
}> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { ok: false, error: 'Unauthenticated' };

  // Get caller's profile
  const { data: caller } = await (supabaseAdmin as any)
    .from('lightpoint_users')
    .select('id, role, organization_id')
    .eq('id', session.user.id)
    .single();

  if (!caller) return { ok: false, error: 'Caller profile not found' };
  if (caller.role !== 'admin') return { ok: false, error: 'Admin role required' };

  // Get target's profile - must be in same org
  const { data: target } = await (supabaseAdmin as any)
    .from('lightpoint_users')
    .select('id, organization_id')
    .eq('id', targetUserId)
    .single();

  if (!target) return { ok: false, error: 'Target user not found' };
  if (target.organization_id !== caller.organization_id) {
    return { ok: false, error: 'Cannot manage users in a different organisation' };
  }

  // Prevent self-deletion / self-password-reset via this endpoint
  if (caller.id === targetUserId) {
    return { ok: false, error: 'Cannot perform this action on your own account' };
  }

  return { ok: true, callerOrgId: caller.organization_id };
}

/**
 * DELETE → Remove user entirely.
 * Body: { userId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const auth = await verifyAdminCaller(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

    // 1. Remove from lightpoint_users (soft-deletes related FK data stays intact)
    const { error: profileError } = await (supabaseAdmin as any)
      .from('lightpoint_users')
      .delete()
      .eq('id', userId);

    if (profileError) {
      logger.error('Failed to delete lightpoint_users row:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 2. Remove from Supabase auth (hard delete)
    const { error: authError } = await (supabaseAdmin as any).auth.admin.deleteUser(userId);

    if (authError) {
      // Profile is already gone - log but don't fail the request
      logger.warn('Auth user delete warning (profile already removed):', authError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    logger.error('DELETE /api/users/manage error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST → Generate and set a temporary password.
 * Body: { userId: string }
 * Returns: { temporaryPassword: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const auth = await verifyAdminCaller(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

    // Generate a readable temporary password: 3 words + 4 digits
    const temporaryPassword = generateTemporaryPassword();

    const { error } = await (supabaseAdmin as any).auth.admin.updateUserById(userId, {
      password: temporaryPassword,
    });

    if (error) {
      logger.error('Failed to set temporary password:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, temporaryPassword });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    logger.error('POST /api/users/manage error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const WORDS = [
  'Amber', 'Bridge', 'Cloud', 'Delta', 'Eagle', 'Flint', 'Grove', 'Haven',
  'Ivory', 'Jasper', 'Kite', 'Lance', 'Maple', 'Noble', 'Onyx', 'Pearl',
  'Quest', 'Ridge', 'Stone', 'Tiger', 'Ultra', 'Vault', 'Whisper', 'Xenon',
  'Yield', 'Zephyr',
];

function generateTemporaryPassword(): string {
  const w1 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const w2 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const w3 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${w1}${w2}${w3}${digits}`;
}
