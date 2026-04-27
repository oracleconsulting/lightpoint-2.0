import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function ensureCaseAccess(caseId: string, organizationId: string) {
  const { data, error } = await (supabaseAdmin as any)
    .from('cases')
    .select('id, organization_id')
    .eq('id', caseId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Case not found or access denied',
    });
  }

  return data;
}

export function requireOrg(organizationId: string | null): string {
  if (!organizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'User must belong to an organisation',
    });
  }
  return organizationId;
}
