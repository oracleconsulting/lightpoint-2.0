'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, BookOpen, Video, FileText, Award, LogIn, User, Shield, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@supabase/ssr';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true); // Add loading state
  const pathname = usePathname();

  const { user, signOut } = useAuth();
  const isLoggedIn = !!user;

  // Check if user is super admin
  useEffect(() => {
    let isMounted = true;
    
    const checkSuperAdmin = async () => {
      if (!user?.id) {
        console.log('⚠️ No user or user.id, setting super admin to false');
        setIsSuperAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      console.log('🔍 Checking super admin status for:', user.email, 'ID:', user.id);
      
      // TEMPORARY: Hardcode your user ID as super admin
      const SUPER_ADMIN_USER_ID = '19583c08-6993-4113-b46a-bd30e3375f54';
      if (user.id === SUPER_ADMIN_USER_ID) {
        console.log('👑 HARDCODED: User is super admin!');
        setIsSuperAdmin(true);
        setIsCheckingAdmin(false);
        return;
      }

      setIsCheckingAdmin(true);

      console.log('🔧 Creating Supabase client...');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      console.log('✅ Supabase client created');

      try {
        console.log('📡 Checking super admin using RPC function...');
        
        // Try using the RPC function first (bypasses RLS)
        const { data: isSuperAdminRpc, error: rpcError } = await supabase
          .rpc('is_super_admin', { user_uuid: user.id });
        
        console.log('🔧 RPC result:', { isSuperAdminRpc, rpcError });
        
        if (!rpcError && isSuperAdminRpc !== null) {
          console.log('✅ RPC succeeded! Is super admin:', isSuperAdminRpc);
          setIsSuperAdmin(isSuperAdminRpc);
          setIsCheckingAdmin(false);
          return;
        }
        
        console.log('⚠️ RPC failed or returned null, falling back to direct query');
        console.log('📡 Starting user_roles query for user_id:', user.id);
        
        // Fallback to direct query with timeout
        const queryPromise = supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) => 
          setTimeout(() => {
            console.log('⏰ Query timeout after 5 seconds');
            resolve({ data: null, error: { message: 'Query timeout' } });
          }, 5000)
        );
        
        const { data: roles, error } = await Promise.race([queryPromise, timeoutPromise]);

        console.log('✅ Query completed!');
        console.log('📋 User roles query result:', { roles, error });
        console.log('🔍 Raw roles data:', roles);
        console.log('🔍 Is array?', Array.isArray(roles));
        console.log('🔍 Roles length?', roles?.length);

        // Only update state if component is still mounted
        if (!isMounted) {
          console.log('⏭️ Component unmounted, skipping state update');
          return;
        }

        if (error) {
          console.error('❌ Roles query error:', error);
          // If it's just a timeout and no data, assume not admin
          if (error.message === 'Query timeout' && !roles) {
            console.log('⏰ Timeout with no data - assuming not admin');
            setIsSuperAdmin(false);
            setIsCheckingAdmin(false);
            return;
          }
        }

        // Check if roles is null, undefined, or empty array
        if (!roles || !Array.isArray(roles) || roles.length === 0) {
          console.log('⚠️ No roles found (null, not array, or empty)');
          setIsSuperAdmin(false);
          setIsCheckingAdmin(false);
          return;
        }

        const hasSuper = roles.some(r => r.role === 'super_admin');
        console.log('👑 Is super admin?', hasSuper, 'Roles:', roles);
        
        setIsSuperAdmin(hasSuper || false);
        setIsCheckingAdmin(false);
      } catch (error) {
        console.error('🔴 Exception checking super admin:', error);
        if (isMounted) {
          setIsSuperAdmin(false);
          setIsCheckingAdmin(false);
        }
      }
    };

    checkSuperAdmin();

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only depend on user.id, not entire user object

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/blog', label: 'Blog' },
  ];

  const resourceLinks = [
    { href: '/cpd', label: 'CPD Library', icon: BookOpen, description: 'Professional development' },
    { href: '/webinars', label: 'Webinars', icon: Video, description: 'Expert training sessions' },
    { href: '/examples', label: 'Worked Examples', icon: FileText, description: 'Real case studies' },
  ];

  const isActive = (href: string) => pathname === href;

  const getLinkClassName = (href: string) => {
    const active = isActive(href);
    if (active) return 'relative text-brand-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-primary after:rounded-full';
    return 'relative text-gray-700 hover:text-brand-primary hover:scale-105 transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-primary after:rounded-full after:scale-x-0 hover:after:scale-x-100 after:transition-transform';
  };

  const getResourcesClassName = () => {
    return 'text-gray-700 hover:text-brand-primary hover:scale-105 transition-all duration-200';
  };

  return (
    <>
      {/* Main Navigation - Modernized with backdrop blur */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo with three ascending dots (blue→gold) */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Image 
                  src="/logo-icon.svg" 
                  alt="Lightpoint Logo" 
                  width={60} 
                  height={40}
                  className="transform group-hover:scale-105 transition-transform"
                  priority
                />
                {isLoggedIn && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-gold rounded-full border-2 border-white animate-pulse" 
                       title="Online"
                  />
                )}
              </div>
              <span className="font-heading text-xl font-bold text-gray-900 group-hover:text-brand-primary transition-colors">
                Lightpoint
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {/* Main Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-medium transition-all ${getLinkClassName(link.href)}`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Resources Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setIsResourcesOpen(true)}
                onMouseLeave={() => setIsResourcesOpen(false)}
              >
                <button
                  className={`flex items-center gap-1 font-medium transition-all ${getResourcesClassName()}`}
                >
                  Resources
                  <ChevronDown className={`h-4 w-4 transition-transform ${isResourcesOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isResourcesOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-64">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    {resourceLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group"
                        >
                          <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 mb-0.5">{link.label}</div>
                            <div className="text-sm text-gray-600">{link.description}</div>
                          </div>
                        </Link>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  {!isCheckingAdmin && isSuperAdmin && (
                    <Link
                      href="/admin"
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-button font-medium transition-all text-brand-blurple hover:text-brand-blurple-dark border-2 border-brand-blurple/30 hover:border-brand-blurple hover:bg-brand-blurple/5 hover:scale-105 active:scale-95"
                    >
                      <Shield className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      Admin
                    </Link>
                  )}
                  
                  {/* User Dropdown Menu */}
                  <div 
                    className="relative"
                    onMouseEnter={() => setIsUserMenuOpen(true)}
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-button font-medium transition-all bg-gradient-to-r from-brand-primary to-brand-blurple text-white hover:shadow-lg hover:scale-105 active:scale-95"
                    >
                      <User className="h-4 w-4" />
                      {user?.email?.split('@')[0] || 'Account'}
                      <ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute top-full right-0 pt-2 w-64">
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {isSuperAdmin ? '👑 Super Admin' : 'User'}
                          </p>
                        </div>
                        
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                          <User className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                          <span className="font-medium text-gray-900">Dashboard</span>
                        </Link>
                        
                        <button
                          onClick={() => signOut()}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors group"
                        >
                          <LogOut className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
                          <span className="font-medium text-gray-900 group-hover:text-red-600">Logout</span>
                        </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-button font-medium transition-all text-gray-700 hover:text-brand-primary hover:scale-105"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                  <Link
                    href="/pricing"
                    className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-button font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 bg-gradient-to-r from-brand-gold to-amber-500 text-white"
                  >
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm w-full h-full"
            onClick={() => setIsMobileMenuOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                setIsMobileMenuOpen(false);
              }
            }}
            aria-label="Close menu"
          />

          {/* Menu Panel */}
          <div className="absolute top-20 left-4 right-4 bg-white rounded-2xl shadow-2xl p-6 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-4">
              {/* Main Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Resources Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm font-semibold text-gray-500 mb-3 px-4">Resources</div>
                {resourceLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{link.label}</div>
                        <div className="text-sm text-gray-600">{link.description}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* CTA Buttons */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {isLoggedIn ? (
                  <>
                    <div className="px-4 py-2 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500">Logged in as</p>
                      <p className="text-sm text-gray-900 truncate">{user?.email}</p>
                      {isSuperAdmin && (
                        <p className="text-xs text-purple-600 font-semibold mt-1">👑 Super Admin</p>
                      )}
                    </div>
                    
                    {!isCheckingAdmin && isSuperAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 border-2 border-purple-200 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
                      >
                        <Shield className="h-5 w-5" />
                        Admin Panel
                      </Link>
                    )}
                    
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <User className="h-5 w-5" />
                      Dashboard
                    </Link>
                    
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut();
                      }}
                      className="flex items-center justify-center gap-2 w-full px-6 py-3 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      <LogIn className="h-5 w-5" />
                      Login
                    </Link>
                    <Link
                      href="/pricing"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      Start Free Trial
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from going under fixed nav */}
      <div className="h-20" />
    </>
  );
}

