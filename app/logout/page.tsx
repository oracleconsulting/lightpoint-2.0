'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      console.log('🔴 LOGOUT: Starting complete logout process');
      
      try {
        // Create Supabase client
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // 1. Sign out from Supabase first
        console.log('🔐 LOGOUT: Calling Supabase signOut...');
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('❌ LOGOUT: Supabase signOut error:', error);
        } else {
          console.log('✅ LOGOUT: Supabase signOut successful');
        }
        
        // 2. Clear ALL storage (nuclear option)
        console.log('🧹 LOGOUT: Clearing all storage...');
        localStorage.clear();
        sessionStorage.clear();
        
        // 3. Clear ALL cookies
        console.log('🍪 LOGOUT: Clearing all cookies...');
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        console.log('✅ LOGOUT: All storage and cookies cleared');
        
        // 4. Hard redirect to homepage IMMEDIATELY
        console.log('🚀 LOGOUT: Redirecting to homepage NOW...');
        window.location.replace('/'); // Use replace instead of href for immediate redirect
        
      } catch (error) {
        console.error('❌ LOGOUT: Fatal error:', error);
        // Force redirect anyway
        window.location.href = '/';
      }
    };
    
    performLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Signing you out...</h2>
        <p className="text-gray-600">Clearing your session</p>
      </div>
    </div>
  );
}

