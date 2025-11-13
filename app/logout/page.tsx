'use client';

import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LogoutPage() {
  const supabase = createClientComponentClient();

  useEffect(() => {
    const performLogout = async () => {
      console.log('🔴 Logout page: Starting forced logout');
      
      try {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Logout page: Cleared all storage');
        
        // Sign out from Supabase with 2-second timeout
        console.log('🔐 Logout page: Calling signOut (2s timeout)...');
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((resolve) => setTimeout(() => {
            console.log('⏰ Logout page: SignOut timeout - continuing anyway');
            resolve(null);
          }, 2000))
        ]);
        console.log('✅ Logout page: Supabase signOut complete (or timed out)');
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to login
        console.log('🚀 Logout page: Redirecting to login NOW');
        window.location.href = '/login';
        
      } catch (error) {
        console.error('❌ Logout page error:', error);
        // Redirect anyway
        console.log('🚀 Logout page: Forcing redirect despite error');
        window.location.href = '/login';
      }
    };
    
    performLogout();
  }, [supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Signing you out...</h2>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
}

