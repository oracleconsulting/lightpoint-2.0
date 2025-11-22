'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, TrendingUp, Users, Award, BookOpen, Video, FileText, Sparkles, Lock, Clock, PoundSterling, Target } from 'lucide-react';
import { CountUp } from '@/components/CountUp';
import { trpc } from '@/lib/trpc/Provider';

// Icon mapping
const iconMap: Record<string, any> = {
  Shield, TrendingUp, Users, Award, BookOpen, Video, FileText, Target, PoundSterling, Clock
};

export default function HomePage() {
  // Fetch all homepage sections from CMS
  const { data: sections } = trpc.cms.getPageSections.useQuery({ pageName: 'homepage' });

  // Helper to get section by key
  const getSection = (key: string): any => {
    return sections?.find((s: any) => s.section_key === key);
  };

  // Loading state
  if (!sections) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const hero = getSection('hero')?.content;
  const trustMetrics = getSection('trust_metrics')?.content;
  const problemSolution = getSection('problem_solution')?.content;
  const features = getSection('features')?.content;
  const roi = getSection('roi_calculator')?.content;
  const howItWorks = getSection('how_it_works')?.content;
  const testimonials = getSection('testimonials')?.content;
  const finalCta = getSection('final_cta')?.content;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      {hero && (
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary via-brand-primary-dark to-brand-blurple-dark text-white">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/20 to-transparent" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
            <div className="text-center max-w-4xl mx-auto">
              {hero.badge_text && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 animate-fade-in">
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  <span className="text-sm font-medium">{hero.badge_text}</span>
                </div>
              )}
              
              <h1 className="font-heading text-5xl sm:text-7xl font-bold tracking-tight animate-slide-in">
                {hero.heading_line1}
                {hero.heading_line2 && (
                  <span className="block mt-2 text-blue-200">{hero.heading_line2}</span>
                )}
              </h1>
              
              {hero.subheading && (
                <p className="mt-8 text-xl sm:text-2xl text-blue-100 leading-relaxed max-w-3xl mx-auto animate-slide-in" style={{animationDelay: '0.1s'}}>
                  {hero.subheading}
                </p>
              )}
              
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center animate-slide-in" style={{animationDelay: '0.2s'}}>
                {hero.cta_primary_text && (
                  <Link
                    href={hero.cta_primary_link || '/subscription/checkout'}
                    className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-button bg-gradient-to-r from-brand-gold to-amber-500 text-white hover:from-brand-gold-dark hover:to-amber-600 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {hero.cta_primary_text}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                {hero.cta_secondary_text && (
                  <Link
                    href={hero.cta_secondary_link || '/subscription/checkout'}
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-button bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-all border-2 border-white/30 hover:border-white/50"
                  >
                    {hero.cta_secondary_text}
                  </Link>
                )}
              </div>
              
              {hero.trust_line && (
                <p className="mt-6 text-sm text-blue-200 flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  {hero.trust_line}
                </p>
              )}
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
        </section>
      )}

      {/* Trust Metrics */}
      {trustMetrics?.metrics && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trustMetrics.metrics.map((metric: any, idx: number) => {
                const Icon = iconMap[metric.icon] || Target;
                const colorClass = metric.color === 'gold' ? 'brand-gold' : 
                                  metric.color === 'success' ? 'success' :
                                  metric.color === 'warning' ? 'warning' : 'brand-primary';
                
                return (
                  <div key={idx} className={`group bg-white rounded-card p-8 border border-gray-200 hover:border-${colorClass}/30 hover:shadow-card-hover transition-all duration-300`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 bg-${colorClass}/10 rounded-lg group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-6 w-6 text-${colorClass}`} />
                      </div>
                      {metric.badge ? (
                        <div className="text-xs text-success font-semibold">{metric.badge}</div>
                      ) : metric.live_badge ? (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-500">{metric.live_badge}</span>
                        </div>
                      ) : (
                        <TrendingUp className={`h-4 w-4 text-${colorClass}`} />
                      )}
                    </div>
                    <div className="font-heading text-4xl font-bold text-gray-900 mb-2">
                      <CountUp 
                        end={metric.value} 
                        prefix={metric.prefix || ''}
                        suffix={metric.suffix || ''}
                        decimals={metric.decimals || 0}
                      />
                    </div>
                    <div className="text-sm text-gray-600 font-medium">{metric.label}</div>
                    {metric.sublabel && (
                      <div className="text-xs text-gray-500 mt-2">{metric.sublabel}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Trust Badges */}
            {trustMetrics.trust_badges && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
                {trustMetrics.trust_badges.map((badge: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    {idx < 3 ? (
                      <>
                        {idx === 0 && <Shield className="h-5 w-5 text-success" />}
                        {idx > 0 && <CheckCircle className="h-5 w-5 text-success" />}
                        <span>{badge}</span>
                      </>
                    ) : (
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded">{badge}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Problem/Solution Section */}
      {problemSolution && (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 mb-4">
                {problemSolution.section_title}
              </h2>
              {problemSolution.section_subtitle && (
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {problemSolution.section_subtitle}
                </p>
              )}
            </div>

            {/* Problems */}
            {problemSolution.problems && (
              <div className="mb-16">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-heading font-bold text-gray-900 inline-flex items-center gap-2">
                    <span className="text-red-500">✕</span> {problemSolution.problem_heading}
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                  {problemSolution.problems.map((problem: string, idx: number) => (
                    <div key={idx} className="bg-red-50 border border-red-100 rounded-card p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
                          ✕
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">{problem}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Solutions */}
            {problemSolution.solutions && (
              <div>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-heading font-bold text-gray-900 inline-flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" /> {problemSolution.solution_heading}
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                  {problemSolution.solutions.map((solution: string, idx: number) => (
                    <div key={idx} className="bg-green-50 border border-green-200 rounded-card p-4 text-center hover:shadow-md hover:border-green-300 transition-all">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-gray-700 text-sm font-medium">{solution}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      {features?.features && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {features.section_title}
              </h2>
              {features.section_subtitle && (
                <p className="mt-4 text-xl text-gray-600">
                  {features.section_subtitle}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.features.map((feature: any, idx: number) => {
                const Icon = iconMap[feature.icon] || Shield;
                const bgColors: Record<string, string> = {
                  blue: 'bg-blue-50',
                  green: 'bg-success/10',
                  purple: 'bg-purple-50',
                  indigo: 'bg-indigo-50',
                  pink: 'bg-pink-50',
                  yellow: 'bg-yellow-50',
                };
                const iconColors: Record<string, string> = {
                  blue: 'text-blue-600',
                  green: 'text-success',
                  purple: 'text-purple-600',
                  indigo: 'text-indigo-600',
                  pink: 'text-pink-600',
                  yellow: 'text-yellow-600',
                };
                
                return (
                  <div key={idx} className="bg-white rounded-card p-8 border border-gray-200 hover:shadow-card-hover transition-all group">
                    <div className={`inline-flex p-4 rounded-lg ${bgColors[feature.color] || 'bg-gray-100'} mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-8 w-8 ${iconColors[feature.color] || 'text-gray-600'}`} />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ROI Calculator Section */}
      {roi && (
        <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Left Column */}
                {roi.left_column && (
                  <div className="p-12">
                    <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">
                      {roi.left_column.heading}
                    </h2>
                    <p className="text-gray-600 mb-8">
                      {roi.left_column.subheading}
                    </p>
                    
                    {roi.left_column.calculations && (
                      <div className="space-y-4 mb-8">
                        {roi.left_column.calculations.map((calc: any, idx: number) => (
                          <div key={idx} className={`flex justify-between items-center ${calc.highlight ? 'border-b pt-2' : 'border-b pb-3'}`}>
                            <span className={calc.highlight ? 'font-bold text-gray-900' : 'text-gray-600'}>{calc.label}</span>
                            <span className={calc.highlight ? 'text-2xl font-bold text-success' : 'text-gray-900 font-semibold'}>{calc.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Link
                      href={roi.left_column.cta_link || '/subscription/checkout'}
                      className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
                    >
                      {roi.left_column.cta_text}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </div>
                )}

                {/* Right Column */}
                {roi.right_column && (
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 h-full flex flex-col justify-center">
                    <div className="text-white">
                      <h3 className="text-2xl font-heading font-bold mb-6">{roi.right_column.heading}</h3>
                      <div className="space-y-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                          <p className="text-blue-100 text-sm mb-1">Subscription Cost</p>
                          <p className="text-3xl font-bold">{roi.right_column.subscription_cost}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                          <p className="text-blue-100 text-sm mb-1">Cases per Month</p>
                          <p className="text-3xl font-bold">{roi.right_column.cases_per_month}</p>
                        </div>
                        {roi.right_column.note && (
                          <div className="mt-6 p-4 bg-white/5 rounded-lg">
                            <p className="text-sm font-semibold text-blue-100 mb-2">{roi.right_column.note}</p>
                            <p className="text-2xl font-bold">{roi.right_column.subscription_coverage}</p>
                            <p className="text-xs text-blue-200 mt-1">of subscription costs</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      {howItWorks?.steps && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">{howItWorks.section_title}</h2>
              {howItWorks.section_subtitle && (
                <p className="mt-4 text-xl text-gray-600">{howItWorks.section_subtitle}</p>
              )}
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {howItWorks.steps.map((step: any, idx: number) => (
                <div key={idx} className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-600 text-white text-3xl font-bold mb-4 shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials?.testimonials && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">{testimonials.section_title}</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.testimonials.map((testimonial: any, idx: number) => (
                <div key={idx} className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-xl">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600 italic mb-6">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      {finalCta && (
        <section className="py-20 bg-gradient-to-br from-brand-primary via-brand-primary-dark to-brand-blurple-dark text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-heading font-bold mb-4">
              {finalCta.heading}
            </h2>
            {finalCta.subheading && (
              <p className="text-xl text-blue-100 mb-8">
                {finalCta.subheading}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {finalCta.cta_primary_text && (
                <Link
                  href={finalCta.cta_primary_link || '/subscription/checkout'}
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-button bg-gradient-to-r from-brand-gold to-amber-500 text-white hover:from-brand-gold-dark hover:to-amber-600 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  {finalCta.cta_primary_text}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
              {finalCta.cta_secondary_text && (
                <Link
                  href={finalCta.cta_secondary_link || '/subscription/checkout'}
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg bg-transparent text-white hover:bg-white/10 transition-all border-2 border-white"
                >
                  {finalCta.cta_secondary_text}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer - kept simple for now, could be CMS-driven too */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>© {new Date().getFullYear()} Lightpoint. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

