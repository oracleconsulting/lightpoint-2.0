'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function AdminCheckPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Get current user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus({ error: `Session error: ${sessionError.message}` });
          setLoading(false);
          return;
        }
        
        if (!session) {
          setStatus({ error: 'Not logged in' });
          setLoading(false);
          return;
        }

        console.log('User session found:', session.user.email);

        // Check roles - wrap in try/catch in case table doesn't exist or RLS blocks
        let roles = [];
        let rolesError = null;
        try {
          const result = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', session.user.id);
          
          roles = result.data || [];
          rolesError = result.error;
          
          if (result.error) {
            console.error('Roles query error:', result.error);
          } else {
            console.log('Roles found:', roles);
          }
        } catch (err) {
          console.error('Roles query exception:', err);
          rolesError = err;
        }

        // Check subscription - also wrap in try/catch
        let subscription = null;
        let subError = null;
        try {
          const result = await supabase
            .from('user_subscriptions')
            .select('*, subscription_tiers(*)')
            .eq('user_id', session.user.id)
            .single();
          
          subscription = result.data;
          subError = result.error;
          
          if (result.error && result.error.code !== 'PGRST116') {
            console.error('Subscription query error:', result.error);
          }
        } catch (err) {
          console.error('Subscription query exception:', err);
          subError = err;
        }

        setStatus({
          user: {
            id: session.user.id,
            email: session.user.email,
          },
          roles: roles || [],
          rolesError,
          subscription,
          subError,
          isSuperAdmin: roles?.some((r: any) => r.role === 'super_admin'),
          isAdmin: roles?.some((r: any) => r.role === 'admin'),
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Check admin error:', error);
        setStatus({ 
          error: `Failed to check admin status: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking admin status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Status Check</h1>

        {status?.error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">❌ Error</h2>
            <p className="text-red-700">{status.error}</p>
            <a href="/login" className="inline-block mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Go to Login
            </a>
          </div>
        )}

        {status?.user && (
          <>
            {/* User Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">👤 User Information</h2>
              <div className="space-y-2">
                <p><span className="font-semibold">ID:</span> <code className="bg-gray-100 px-2 py-1 rounded text-sm">{status.user.id}</code></p>
                <p><span className="font-semibold">Email:</span> {status.user.email}</p>
              </div>
            </div>

            {/* Roles */}
            <div className={`rounded-xl shadow-lg p-6 mb-6 ${
              status.isSuperAdmin ? 'bg-green-50 border-2 border-green-500' :
              status.isAdmin ? 'bg-blue-50 border-2 border-blue-500' :
              'bg-yellow-50 border-2 border-yellow-500'
            }`}>
              <h2 className="text-xl font-bold mb-4">
                {status.isSuperAdmin ? '✅ Super Admin Access' :
                 status.isAdmin ? '🔵 Admin Access' :
                 '⚠️ No Admin Access'}
              </h2>
              
              {status.roles.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-semibold mb-2">Your Roles:</p>
                  {status.roles.map((role: any) => (
                    <div key={role.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <p><span className="font-semibold">Role:</span> <span className="uppercase font-bold text-blue-600">{role.role}</span></p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Granted:</span> {new Date(role.granted_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-6 border-2 border-orange-200">
                  <p className="text-orange-900 font-semibold mb-4">❌ No admin roles found</p>
                  <div className="bg-orange-50 p-4 rounded-lg mb-4">
                    <p className="font-semibold text-orange-900 mb-2">To grant yourself super admin access:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-orange-800">
                      <li>Go to Supabase Dashboard</li>
                      <li>SQL Editor</li>
                      <li>Run this query:</li>
                    </ol>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg mt-4 text-xs overflow-x-auto">
{`INSERT INTO user_roles (user_id, role, granted_by)
VALUES (
  '${status.user.id}',
  'super_admin',
  '${status.user.id}'
)
ON CONFLICT (user_id, role) 
DO UPDATE SET granted_at = NOW();`}
                    </pre>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`INSERT INTO user_roles (user_id, role, granted_by) VALUES ('${status.user.id}', 'super_admin', '${status.user.id}') ON CONFLICT (user_id, role) DO UPDATE SET granted_at = NOW();`);
                      alert('SQL copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    📋 Copy SQL to Clipboard
                  </button>
                </div>
              )}
              
              {status.rolesError && (
                <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-4">
                  <p className="text-red-900 font-semibold">Error fetching roles:</p>
                  <pre className="text-sm text-red-800 mt-2">{JSON.stringify(status.rolesError, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Subscription */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💳 Subscription Status</h2>
              {status.subscription ? (
                <div className="space-y-2">
                  <p><span className="font-semibold">Tier:</span> {status.subscription.subscription_tiers?.name || 'Unknown'}</p>
                  <p><span className="font-semibold">Status:</span> <span className="uppercase font-semibold text-green-600">{status.subscription.status}</span></p>
                  <p><span className="font-semibold">Started:</span> {new Date(status.subscription.start_date).toLocaleDateString()}</p>
                  {status.subscription.end_date && (
                    <p><span className="font-semibold">Ends:</span> {new Date(status.subscription.end_date).toLocaleDateString()}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No active subscription</p>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 Quick Actions</h2>
              <div className="flex flex-wrap gap-4">
                <a
                  href="/dashboard"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Go to Dashboard
                </a>
                {status.isSuperAdmin && (
                  <>
                    <a
                      href="/admin/tiers"
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                    >
                      Manage Tiers
                    </a>
                    <a
                      href="/users"
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                    >
                      Manage Users
                    </a>
                  </>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
                >
                  🔄 Refresh Status
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

