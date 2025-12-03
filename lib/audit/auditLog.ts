/**
 * SOC 2 Compliant Audit Logging
 * 
 * Tracks all significant actions for compliance and security.
 * Logs are immutable and retained for 7 years.
 * 
 * Categories:
 * - auth: Login, logout, password changes
 * - data: Create, update, delete of sensitive data
 * - access: Resource access attempts
 * - admin: Administrative actions
 * - security: Security-related events
 */

import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '../logger';

export type AuditCategory = 'auth' | 'data' | 'access' | 'admin' | 'security';

export type AuditAction = 
  // Auth
  | 'login' | 'logout' | 'login_failed' | 'password_change' | 'mfa_enabled' | 'mfa_disabled'
  // Data
  | 'create' | 'update' | 'delete' | 'export' | 'import'
  // Access
  | 'view' | 'download' | 'access_denied'
  // Admin
  | 'user_create' | 'user_update' | 'user_delete' | 'role_change' | 'permission_change'
  // Security
  | 'rate_limit' | 'suspicious_activity' | 'api_key_create' | 'api_key_revoke';

export interface AuditEntry {
  category: AuditCategory;
  action: AuditAction;
  userId?: string;
  organizationId?: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Log an audit event
 * 
 * @param entry The audit entry to log
 * @returns The created audit log ID
 */
export async function logAuditEvent(entry: AuditEntry): Promise<string | null> {
  try {
    const auditLog = {
      category: entry.category,
      action: entry.action,
      user_id: entry.userId,
      organization_id: entry.organizationId,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      details: entry.details,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      success: entry.success,
      error_message: entry.errorMessage,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await (supabaseAdmin as any)
      .from('audit_logs')
      .insert(auditLog)
      .select('id')
      .single();

    if (error) {
      // Log to console as fallback - never lose audit data
      logger.error('❌ Failed to write audit log to DB, logging to console:', error);
      logger.warn('📝 AUDIT LOG (FALLBACK):', JSON.stringify(auditLog));
      return null;
    }

    return data.id;
  } catch (error) {
    logger.error('❌ Audit logging error:', error);
    // Always log to console as fallback
    logger.warn('📝 AUDIT LOG (ERROR FALLBACK):', JSON.stringify(entry));
    return null;
  }
}

/**
 * Helper functions for common audit events
 */
export const audit = {
  // Authentication events
  login: (userId: string, orgId: string, ip?: string, userAgent?: string) =>
    logAuditEvent({
      category: 'auth',
      action: 'login',
      userId,
      organizationId: orgId,
      ipAddress: ip,
      userAgent,
      success: true,
    }),

  loginFailed: (email: string, ip?: string, reason?: string) =>
    logAuditEvent({
      category: 'auth',
      action: 'login_failed',
      details: { email },
      ipAddress: ip,
      success: false,
      errorMessage: reason,
    }),

  logout: (userId: string, orgId: string) =>
    logAuditEvent({
      category: 'auth',
      action: 'logout',
      userId,
      organizationId: orgId,
      success: true,
    }),

  // Data events
  dataCreate: (userId: string, orgId: string, resourceType: string, resourceId: string, details?: Record<string, any>) =>
    logAuditEvent({
      category: 'data',
      action: 'create',
      userId,
      organizationId: orgId,
      resourceType,
      resourceId,
      details,
      success: true,
    }),

  dataUpdate: (userId: string, orgId: string, resourceType: string, resourceId: string, changes?: Record<string, any>) =>
    logAuditEvent({
      category: 'data',
      action: 'update',
      userId,
      organizationId: orgId,
      resourceType,
      resourceId,
      details: { changes },
      success: true,
    }),

  dataDelete: (userId: string, orgId: string, resourceType: string, resourceId: string) =>
    logAuditEvent({
      category: 'data',
      action: 'delete',
      userId,
      organizationId: orgId,
      resourceType,
      resourceId,
      success: true,
    }),

  dataExport: (userId: string, orgId: string, resourceType: string, recordCount: number) =>
    logAuditEvent({
      category: 'data',
      action: 'export',
      userId,
      organizationId: orgId,
      resourceType,
      details: { recordCount },
      success: true,
    }),

  // Access events
  accessView: (userId: string, orgId: string, resourceType: string, resourceId: string) =>
    logAuditEvent({
      category: 'access',
      action: 'view',
      userId,
      organizationId: orgId,
      resourceType,
      resourceId,
      success: true,
    }),

  accessDenied: (userId: string | undefined, orgId: string | undefined, resourceType: string, resourceId: string, reason: string) =>
    logAuditEvent({
      category: 'access',
      action: 'access_denied',
      userId,
      organizationId: orgId,
      resourceType,
      resourceId,
      success: false,
      errorMessage: reason,
    }),

  // Admin events
  userCreate: (adminId: string, orgId: string, newUserId: string, newUserEmail: string, role: string) =>
    logAuditEvent({
      category: 'admin',
      action: 'user_create',
      userId: adminId,
      organizationId: orgId,
      resourceType: 'user',
      resourceId: newUserId,
      details: { email: newUserEmail, role },
      success: true,
    }),

  userUpdate: (adminId: string, orgId: string, targetUserId: string, changes: Record<string, any>) =>
    logAuditEvent({
      category: 'admin',
      action: 'user_update',
      userId: adminId,
      organizationId: orgId,
      resourceType: 'user',
      resourceId: targetUserId,
      details: { changes },
      success: true,
    }),

  roleChange: (adminId: string, orgId: string, targetUserId: string, oldRole: string, newRole: string) =>
    logAuditEvent({
      category: 'admin',
      action: 'role_change',
      userId: adminId,
      organizationId: orgId,
      resourceType: 'user',
      resourceId: targetUserId,
      details: { oldRole, newRole },
      success: true,
    }),

  // Security events
  rateLimit: (ip: string, endpoint: string) =>
    logAuditEvent({
      category: 'security',
      action: 'rate_limit',
      ipAddress: ip,
      details: { endpoint },
      success: false,
      errorMessage: 'Rate limit exceeded',
    }),

  suspiciousActivity: (userId: string | undefined, ip: string, description: string, details?: Record<string, any>) =>
    logAuditEvent({
      category: 'security',
      action: 'suspicious_activity',
      userId,
      ipAddress: ip,
      details: { description, ...details },
      success: false,
    }),
};

/**
 * Query audit logs (admin only)
 */
export async function queryAuditLogs(options: {
  userId?: string;
  organizationId?: string;
  category?: AuditCategory;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  let query = (supabaseAdmin as any)
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (options.userId) query = query.eq('user_id', options.userId);
  if (options.organizationId) query = query.eq('organization_id', options.organizationId);
  if (options.category) query = query.eq('category', options.category);
  if (options.action) query = query.eq('action', options.action);
  if (options.startDate) query = query.gte('created_at', options.startDate.toISOString());
  if (options.endDate) query = query.lte('created_at', options.endDate.toISOString());
  if (options.limit) query = query.limit(options.limit);
  if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 100) - 1);

  const { data, error } = await query;
  
  if (error) {
    logger.error('❌ Failed to query audit logs:', error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Get audit summary for dashboard
 */
export async function getAuditSummary(organizationId: string, days: number = 30): Promise<{
  totalEvents: number;
  byCategory: Record<string, number>;
  byAction: Record<string, number>;
  failedEvents: number;
  recentEvents: any[];
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await (supabaseAdmin as any)
    .from('audit_logs')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('❌ Failed to get audit summary:', error);
    throw new Error(error.message);
  }

  const logs = data || [];

  const byCategory: Record<string, number> = {};
  const byAction: Record<string, number> = {};
  let failedEvents = 0;

  logs.forEach((log: any) => {
    byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    byAction[log.action] = (byAction[log.action] || 0) + 1;
    if (!log.success) failedEvents++;
  });

  return {
    totalEvents: logs.length,
    byCategory,
    byAction,
    failedEvents,
    recentEvents: logs.slice(0, 10),
  };
}

