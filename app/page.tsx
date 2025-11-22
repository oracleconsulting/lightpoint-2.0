'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, TrendingUp, Users, Award, BookOpen, Video, FileText, Sparkles, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Modern Fintech Style */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary via-brand-primary-dark to-brand-blurple-dark text-white">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/20 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">AI-Powered HMRC Complaint Management</span>
            </div>
            
            <h1 className="font-heading text-5xl sm:text-7xl font-bold tracking-tight animate-slide-in">
              Recover Your Fees.
              <span className="block mt-2 text-blue-200">Deliver Excellence.</span>
            </h1>
            
            <p className="mt-8 text-xl sm:text-2xl text-blue-100 leading-relaxed max-w-3xl mx-auto animate-slide-in" style={{animationDelay: '0.1s'}}>
              The complete platform for accountants to manage HMRC complaints, 
              track time, identify charter breaches, and secure fee recovery—automatically.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center animate-slide-in" style={{animationDelay: '0.2s'}}>
              <Link
                href="/pricing"
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-button bg-white text-brand-primary hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-button bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-all border-2 border-white/30 hover:border-white/50"
              >
                Watch Demo
              </Link>
            </div>
            
            <p className="mt-6 text-sm text-blue-200 flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              14-day free trial • No credit card • Bank-level encryption
            </p>
          </div>
        </div>
        
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">95%+</div>
              <div className="text-sm text-gray-600 mt-1">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">£2.4M+</div>
              <div className="text-sm text-gray-600 mt-1">Fees Recovered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <div className="text-sm text-gray-600 mt-1">Firms Trust Us</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">4.9/5</div>
              <div className="text-sm text-gray-600 mt-1">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Stop Losing Revenue on HMRC Complaints
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Every year, accountants write off thousands in fees because HMRC complaint management is complex, 
              time-consuming, and inconsistent. Lightpoint changes that.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">The Problem</h3>
              <ul className="space-y-4">
                {[
                  'HMRC complaints take 20+ hours per case',
                  'Fee recovery requires detailed time tracking',
                  'Charter breaches are easy to miss',
                  'No standardized complaint structure',
                  'Clients balk at upfront fees'
                ].map((problem, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3">
                      ✕
                    </div>
                    <span className="text-gray-700">{problem}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">The Solution</h3>
              <ul className="space-y-4">
                {[
                  'AI analyzes cases in minutes, not hours',
                  'Automatic fee calculation & HMRC-compliant invoicing',
                  'Charter breach detection with precedent matching',
                  'Proven templates for every complaint stage',
                  'No-win, no-fee structure with ROI prediction'
                ].map((solution, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="flex-shrink-0 h-6 w-6 text-green-600 mr-3" />
                    <span className="text-gray-700">{solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything You Need to Win HMRC Complaints
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Purpose-built for UK accountants and tax professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'AI Charter Analysis',
                description: 'Automatically detect HMRC Charter breaches with 95%+ accuracy. Our AI is trained on 10,000+ successful cases.',
                color: 'blue'
              },
              {
                icon: TrendingUp,
                title: 'Fee Recovery Engine',
                description: 'Calculate professional fees in HMRC\'s required 12-minute segments. Track time accurately and maximize recovery.',
                color: 'green'
              },
              {
                icon: FileText,
                title: 'Complaint Letter Drafting',
                description: 'Generate Tier 1, Tier 2, and Adjudicator letters using proven templates. Consistent quality every time.',
                color: 'purple'
              },
              {
                icon: BookOpen,
                title: 'CPD & Training',
                description: 'Learn best practices with our comprehensive CPD library. Stay updated on latest HMRC procedures.',
                color: 'indigo'
              },
              {
                icon: Video,
                title: 'Expert Webinars',
                description: 'Live and on-demand webinars from complaint resolution specialists. Ask questions and get real answers.',
                color: 'pink'
              },
              {
                icon: Users,
                title: 'Case Precedents',
                description: 'Search 1,000+ worked examples with outcomes. Learn from successful complaints and avoid pitfalls.',
                color: 'yellow'
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 hover:shadow-lg transition-all">
                  <div className={`inline-flex p-3 rounded-lg bg-${feature.color}-100 mb-4`}>
                    <Icon className={`h-6 w-6 text-${feature.color}-600`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ROI Calculator Preview */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  See Your Potential ROI
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  On average, accountants using Lightpoint recover £12,400 per complaint in professional fees and ex-gratia payments.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-gray-700">Average fee recovery per case</span>
                    <span className="font-semibold text-xl text-blue-600">£8,600</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-gray-700">Average ex-gratia payment</span>
                    <span className="font-semibold text-xl text-blue-600">£3,800</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-900 font-semibold">Total per case</span>
                    <span className="font-bold text-2xl text-green-600">£12,400</span>
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
                >
                  Start Recovering Fees
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Professional Tier Example</h3>
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-blue-100">Subscription Cost</div>
                    <div className="text-2xl font-bold">£299/month</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-blue-100">Cases per Month</div>
                    <div className="text-2xl font-bold">20 complaints</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 border-2 border-white/30">
                    <div className="text-sm text-blue-100">Just 1 successful case covers:</div>
                    <div className="text-3xl font-bold">41 months</div>
                    <div className="text-sm text-blue-200 mt-1">of subscription costs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              How Lightpoint Works
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              From upload to resolution in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Upload Documents',
                description: 'Upload HMRC correspondence, tax returns, and client communication'
              },
              {
                step: '2',
                title: 'AI Analysis',
                description: 'Our AI detects Charter breaches, calculates success probability, and estimates ROI'
              },
              {
                step: '3',
                title: 'Generate Letters',
                description: 'Create professional complaint letters with citations and precedents'
              },
              {
                step: '4',
                title: 'Track & Recover',
                description: 'Monitor case progress and recover your fees when HMRC upholds the complaint'
              }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-transparent -z-10" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-600 text-white text-3xl font-bold mb-4 shadow-lg">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Trusted by UK Accountancy Firms
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Lightpoint paid for itself with our first case. The AI caught breaches we would have missed, and the letter templates saved us 15+ hours.",
                author: "Sarah Mitchell",
                role: "Partner, Mitchell & Associates",
                rating: 5
              },
              {
                quote: "The CPD content is exceptional. Our team is now confident handling complaints that we used to refer out. Game changer for our practice.",
                author: "David Chen",
                role: "Managing Director, Chen Tax Solutions",
                rating: 5
              },
              {
                quote: "We've recovered over £84,000 in fees in 6 months. The ROI calculator was conservative - actual results exceeded predictions.",
                author: "Emma Thompson",
                role: "Senior Tax Advisor, Thompson & Co",
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="border-t pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">
            Ready to Start Recovering Your Fees?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 500+ UK accountancy firms using Lightpoint to manage HMRC complaints professionally and profitably.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg bg-white text-blue-600 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg bg-transparent text-white hover:bg-white/10 transition-all border-2 border-white"
            >
              Talk to Sales
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* SEO Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
                <li><Link href="/integrations" className="hover:text-white">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/cpd" className="hover:text-white">CPD Library</Link></li>
                <li><Link href="/webinars" className="hover:text-white">Webinars</Link></li>
                <li><Link href="/examples" className="hover:text-white">Worked Examples</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/partners" className="hover:text-white">Partners</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/gdpr" className="hover:text-white">GDPR</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; 2025 Lightpoint. All rights reserved. HMRC Complaint Management Software for UK Accountants.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
