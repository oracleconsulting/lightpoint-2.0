'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Settings, 
  Search, 
  BookOpen, 
  Video, 
  FileText, 
  Award,
  Home,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Menu,
  X,
  Users,
  AlertCircle,
  Loader2,
  Rocket,
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSuperAdmin, isLoading } = useUser();

  // Show loading while checking permissions
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blurple" />
          <p className="text-gray-500">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Only super admins can access admin pages
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              The Lightpoint Admin panel is restricted to super administrators only.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Contact info@lightpoint.uk if you need access.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/pilots', label: 'Pilot Users', icon: Rocket },
    { href: '/admin/waitlist', label: 'Waitlist', icon: Users },
    { href: '/admin/tiers', label: 'Subscription Tiers', icon: DollarSign },
    { href: '/admin/content', label: 'Page Content', icon: Home },
    { href: '/admin/blog', label: 'Blog Posts', icon: FileText },
    { href: '/admin/cpd', label: 'CPD Articles', icon: Award },
    { href: '/admin/webinars', label: 'Webinars', icon: Video },
    { href: '/admin/examples', label: 'Worked Examples', icon: BookOpen },
    { href: '/admin/seo', label: 'SEO Settings', icon: Search },
    { href: '/admin/settings', label: 'Site Settings', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-700" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-700" />
                )}
              </button>

              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-blurple rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-xl font-bold text-gray-900">Lightpoint</span>
                  <span className="text-sm font-medium text-brand-blurple">Admin</span>
                </div>
              </Link>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Site</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 lg:hidden overflow-y-auto"
            >
              <nav className="p-4 space-y-1">
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        active
                          ? 'bg-gradient-to-r from-brand-blurple/10 to-brand-primary/10 text-brand-blurple font-semibold border-l-4 border-brand-blurple'
                          : 'text-gray-700 hover:bg-gray-50 hover:scale-105'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-brand-blurple' : 'text-gray-500'}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex pt-16">
        {/* Desktop Sidebar - Collapsible */}
        <motion.aside
          animate={{ width: isCollapsed ? 80 : 256 }}
          className="hidden lg:block fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 overflow-hidden"
        >
          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-brand-primary transition-all"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3 text-gray-600" />
            ) : (
              <ChevronLeft className="h-3 w-3 text-gray-600" />
            )}
          </button>

          <nav className="p-4 space-y-1">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                    active
                      ? 'bg-gradient-to-r from-brand-blurple/10 to-brand-primary/10 text-brand-blurple font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 hover:scale-105'
                  }`}
                  title={isCollapsed ? link.label : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-brand-blurple' : 'text-gray-500 group-hover:text-brand-primary'}`} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="whitespace-nowrap"
                      >
                        {link.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </nav>
        </motion.aside>

        {/* Main Content */}
        <motion.main
          animate={{ marginLeft: isCollapsed ? 80 : 256 }}
          className="hidden lg:block flex-1 p-8"
        >
          {children}
        </motion.main>

        {/* Mobile Main Content */}
        <main className="lg:hidden flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

