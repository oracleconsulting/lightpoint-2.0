'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  Settings, 
  Search, 
  BookOpen, 
  Video, 
  FileText, 
  Award,
  Home,
  DollarSign
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
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
      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex items-center px-2 text-gray-900 font-semibold">
                <span className="text-xl">⚡️ Lightpoint</span>
                <span className="ml-2 text-sm text-purple-600">Admin</span>
              </Link>
            </div>
            <div className="flex items-center">
              <Link
                href="/"
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                ← Back to Site
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

