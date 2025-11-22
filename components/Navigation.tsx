'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, BookOpen, Video, FileText, Award, LogIn, User } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const pathname = usePathname();

  const { data: subscription } = trpc.subscription.getUserSubscription.useQuery();
  const isLoggedIn = !!subscription;

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
    if (active && isScrolled) return 'text-blue-600';
    if (active && !isScrolled) return 'text-white font-semibold';
    if (!active && isScrolled) return 'text-gray-700 hover:text-blue-600';
    return 'text-white/90 hover:text-white';
  };

  const getResourcesClassName = () => {
    return isScrolled
      ? 'text-gray-700 hover:text-blue-600'
      : 'text-white/90 hover:text-white';
  };

  return (
    <>
      {/* Main Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-lg shadow-lg py-3'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className={`p-2 rounded-xl transition-all ${
                isScrolled
                  ? 'bg-blue-600'
                  : 'bg-white/10 backdrop-blur-md group-hover:bg-white/20'
              }`}>
                <Award className="h-6 w-6 text-white" />
              </div>
              <span className={`text-xl font-bold transition-colors ${
                isScrolled ? 'text-gray-900' : 'text-white'
              }`}>
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
              <div className="relative">
                <button
                  onMouseEnter={() => setIsResourcesOpen(true)}
                  onMouseLeave={() => setIsResourcesOpen(false)}
                  className={`flex items-center gap-1 font-medium transition-all ${getResourcesClassName()}`}
                >
                  Resources
                  <ChevronDown className={`h-4 w-4 transition-transform ${isResourcesOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isResourcesOpen && (
                  <div
                    onMouseEnter={() => setIsResourcesOpen(true)}
                    onMouseLeave={() => setIsResourcesOpen(false)}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200"
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
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {isLoggedIn ? (
                <Link
                  href="/user/dashboard"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    isScrolled
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                      : 'bg-white text-blue-600 hover:bg-white/90 shadow-lg'
                  }`}
                >
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                      isScrolled
                        ? 'text-gray-700 hover:text-blue-600'
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                  <Link
                    href="/pricing"
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 ${
                      isScrolled
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-blue-600 hover:bg-white/90'
                    }`}
                  >
                    Start Free Trial
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isScrolled
                  ? 'text-gray-900 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
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
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
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
                  <Link
                    href="/user/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    Dashboard
                  </Link>
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

