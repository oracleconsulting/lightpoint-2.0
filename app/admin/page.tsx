'use client';

import Link from 'next/link';
import { 
  LayoutDashboard, 
  DollarSign, 
  Home, 
  FileText, 
  Award, 
  Video, 
  BookOpen, 
  Search, 
  Settings,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const sections = [
    {
      title: 'Subscription Management',
      description: 'Manage pricing tiers, features, and subscription limits',
      icon: DollarSign,
      href: '/admin/tiers',
      color: 'bg-blue-500',
    },
    {
      title: 'Page Content',
      description: 'Edit homepage sections and landing page content',
      icon: Home,
      href: '/admin/content',
      color: 'bg-green-500',
    },
    {
      title: 'Blog Posts',
      description: 'Create and manage blog articles',
      icon: FileText,
      href: '/admin/blog',
      color: 'bg-purple-500',
    },
    {
      title: 'CPD Articles',
      description: 'Manage professional development resources',
      icon: Award,
      href: '/admin/cpd',
      color: 'bg-yellow-500',
    },
    {
      title: 'Webinars',
      description: 'Schedule and manage webinar content',
      icon: Video,
      href: '/admin/webinars',
      color: 'bg-red-500',
    },
    {
      title: 'Worked Examples',
      description: 'Add case studies and example scenarios',
      icon: BookOpen,
      href: '/admin/examples',
      color: 'bg-indigo-500',
    },
    {
      title: 'SEO Settings',
      description: 'Manage meta tags, Open Graph, and structured data',
      icon: Search,
      href: '/admin/seo',
      color: 'bg-pink-500',
    },
    {
      title: 'Site Settings',
      description: 'Configure global site settings and preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your entire platform from one place
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-purple-200"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${section.color} bg-opacity-10`}>
                  <Icon className={`h-6 w-6 ${section.color.replace('bg-', 'text-')}`} />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
              
              <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                {section.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {section.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid gap-6 md:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Total Subscribers</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">-</div>
          <div className="mt-1 text-sm text-gray-500">Coming soon</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Active Complaints</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">-</div>
          <div className="mt-1 text-sm text-gray-500">Coming soon</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Published Posts</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">-</div>
          <div className="mt-1 text-sm text-gray-500">Coming soon</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Monthly Revenue</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">-</div>
          <div className="mt-1 text-sm text-gray-500">Coming soon</div>
        </div>
      </div>
    </div>
  );
}

