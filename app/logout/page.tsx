'use client';

import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { logger } from '../../lib/logger';


export default function LogoutPage() {
  const supabase = createClientComponentClient();

  useEffect(() => {
    const performLogout = async () => {
      logger.info('🔴 Logout page: Starting forced logout');
      
      try {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        logger.info('✅ Logout page: Cleared all storage');
        
        // Sign out from Supabase with 2-second timeout
        logger.info('🔐 Logout page: Calling signOut (2s timeout)...');
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((resolve) => setTimeout(() => {
            logger.info('⏰ Logout page: SignOut timeout - continuing anyway');
            resolve(null);
          }, 2000))
        ]);
        logger.info('✅ Logout page: Supabase signOut complete (or timed out)');
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to login
        logger.info('🚀 Logout page: Redirecting to login NOW');
        window.location.href = '/login';
        
      } catch (error) {
        logger.error('❌ Logout page error:', error);
        // Redirect anyway
        logger.info('🚀 Logout page: Forcing redirect despite error');
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

