'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function LogoutPage() {
  useEffect(() => {
    // Force redirect after 1 second no matter what
    const forceRedirectTimeout = setTimeout(() => {
      console.log('⏰ LOGOUT: Force redirect timeout - redirecting NOW');
      window.location.replace('/');
    }, 1000);

    const performLogout = async () => {
      console.log('🔴 LOGOUT: Starting complete logout process');
      
      try {
        // Create Supabase client
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // 1. Sign out from Supabase first (with timeout)
        console.log('🔐 LOGOUT: Calling Supabase signOut...');
        
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 500));
        
        await Promise.race([signOutPromise, timeoutPromise]);
        console.log('✅ LOGOUT: Supabase signOut complete (or timed out)');
        
        // 2. Clear ALL storage (nuclear option)
        console.log('🧹 LOGOUT: Clearing all storage...');
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.log('⚠️ Storage clear failed (might be blocked):', e);
        }
        
        // 3. Clear ALL cookies
        console.log('🍪 LOGOUT: Clearing all cookies...');
        try {
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        } catch (e) {
          console.log('⚠️ Cookie clear failed:', e);
        }
        
        console.log('✅ LOGOUT: All cleared');
        
        // 4. Hard redirect to homepage IMMEDIATELY
        console.log('🚀 LOGOUT: Redirecting to homepage NOW...');
        clearTimeout(forceRedirectTimeout);
        window.location.replace('/');
        
      } catch (error) {
        console.error('❌ LOGOUT: Fatal error:', error);
        // Force redirect anyway
        clearTimeout(forceRedirectTimeout);
        window.location.replace('/');
      }
    };
    
    performLogout();

    return () => {
      clearTimeout(forceRedirectTimeout);
    };
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
