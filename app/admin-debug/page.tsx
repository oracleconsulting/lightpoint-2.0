'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDebugPage() {
  const { user } = useAuth();
  const [roleData, setRoleData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRoles = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      console.log('🔍 DEBUG: Checking roles for user:', user.id, user.email);

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      try {
        // Try to fetch roles
        const { data, error: fetchError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);

        console.log('📋 DEBUG: Roles query result:', { data, fetchError });

        if (fetchError) {
          setError(fetchError.message);
          console.error('❌ DEBUG: Error fetching roles:', fetchError);
        } else {
          setRoleData(data);
          console.log('✅ DEBUG: Roles found:', data);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('🔴 DEBUG: Exception:', err);
      } finally {
        setLoading(false);
      }
    };

    checkRoles();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full mx-auto p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Not Logged In</h1>
          <p>You must be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">🔍 Admin Access Debug</h1>

          {/* User Info */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">👤 User Information</h2>
            <div className="space-y-2 font-mono text-sm">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          </div>

          {/* Role Data */}
          <div className="mb-8 p-4 bg-purple-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">👑 Role Data from Database</h2>
            
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : error ? (
              <div className="p-4 bg-red-100 text-red-800 rounded">
                <p className="font-semibold">❌ Error:</p>
                <p className="font-mono text-sm mt-2">{error}</p>
              </div>
            ) : roleData && roleData.length > 0 ? (
              <div>
                <p className="text-green-600 font-semibold mb-2">✅ Roles Found: {roleData.length}</p>
                <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(roleData, null, 2)}
                </pre>
                <div className="mt-4 p-3 bg-green-100 rounded">
                  <p className="font-semibold text-green-800">
                    {roleData.some((r: any) => r.role === 'super_admin') 
                      ? '✅ YOU ARE A SUPER ADMIN!' 
                      : '❌ No super_admin role found'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
                <p className="font-semibold">⚠️ No Roles Found</p>
                <p className="mt-2">The user_roles table has no entries for your user ID.</p>
              </div>
            )}
          </div>

          {/* SQL to Run */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">🛠️ Grant Super Admin Access</h2>
            <p className="text-gray-700 mb-3">
              If no roles are showing above, run this SQL in Supabase:
            </p>
            <pre className="bg-gray-800 text-white p-4 rounded overflow-auto text-sm">
{`-- Delete any existing role
DELETE FROM user_roles 
WHERE user_id = '${user.id}';

-- Insert super_admin role
INSERT INTO user_roles (user_id, role, granted_by)
VALUES (
  '${user.id}',
  'super_admin',
  '${user.id}'
);

-- Verify it worked
SELECT * FROM user_roles 
WHERE user_id = '${user.id}';`}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`DELETE FROM user_roles WHERE user_id = '${user.id}';\nINSERT INTO user_roles (user_id, role, granted_by) VALUES ('${user.id}', 'super_admin', '${user.id}');\nSELECT * FROM user_roles WHERE user_id = '${user.id}';`);
                alert('SQL copied to clipboard!');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              📋 Copy SQL
            </button>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex gap-4">
            <a
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              ← Home
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

