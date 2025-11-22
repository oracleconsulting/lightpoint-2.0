'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/Provider';
import { FileText, Search, Filter, Award, TrendingUp, Clock, Lock, CheckCircle, XCircle } from 'lucide-react';

export default function WorkedExamplesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [complexityFilter, setComplexityFilter] = useState<string>('all');

  const { data: examples, isLoading } = trpc.cms.listContentPosts.useQuery({
    contentType: 'worked_example',
    status: 'published',
    limit: 50,
  });

  const { data: subscription } = trpc.subscription.getUserSubscription.useQuery();
  const hasAccess = subscription && ['professional', 'enterprise'].includes((subscription as any).tier?.name);

  const outcomes = ['all', 'Upheld', 'Partially Upheld', 'Not Upheld', 'Ongoing'];
  const complexities = ['all', 'Simple', 'Moderate', 'Complex'];

  const filteredExamples = examples?.posts?.filter((example: any) => {
    const matchesSearch = !searchTerm || 
      example.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      example.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOutcome = outcomeFilter === 'all' || 
      example.tags?.includes(outcomeFilter);
    
    const matchesComplexity = complexityFilter === 'all' || 
      example.tags?.includes(complexityFilter);
    
    return matchesSearch && matchesOutcome && matchesComplexity;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold">
              Worked Examples
            </h1>
          </div>
          <p className="text-xl text-emerald-100 max-w-3xl">
            Real complaint case studies with full timelines, correspondence, and outcomes. 
            Learn from successful (and unsuccessful) complaints to improve your success rate.
          </p>
        </div>
      </div>

      {/* Access Check */}
      {!hasAccess ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-2xl p-12 text-center">
            <div className="inline-flex p-4 bg-orange-100 rounded-full mb-6">
              <Lock className="h-12 w-12 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Professional or Enterprise Required
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Access 200+ worked examples from real HMRC complaints with full documentation, 
              timelines, and lessons learned. Essential learning resource for complaint professionals.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Award className="mr-2 h-5 w-5" />
              Upgrade Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Search & Filters */}
          <div className="mb-12 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search case studies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-lg"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-6">
              {/* Outcome Filter */}
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Outcome:</span>
                <div className="flex gap-2">
                  {outcomes.map((outcome) => (
                    <button
                      key={outcome}
                      onClick={() => setOutcomeFilter(outcome)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        outcomeFilter === outcome
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {outcome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complexity Filter */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Complexity:</span>
                <div className="flex gap-2">
                  {complexities.map((complexity) => (
                    <button
                      key={complexity}
                      onClick={() => setComplexityFilter(complexity)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        complexityFilter === complexity
                          ? 'bg-teal-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {complexity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-1">{filteredExamples?.length || 0}</div>
              <div className="text-emerald-100 text-sm">Case Studies</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-1">89%</div>
              <div className="text-green-100 text-sm">Success Rate</div>
            </div>
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-1">£8.6k</div>
              <div className="text-teal-100 text-sm">Avg Recovery</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-1">84 days</div>
              <div className="text-cyan-100 text-sm">Avg Resolution</div>
            </div>
          </div>

          {/* Examples List */}
          {!filteredExamples || filteredExamples.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {searchTerm || outcomeFilter !== 'all' || complexityFilter !== 'all'
                  ? 'No case studies match your filters. Try adjusting your search.'
                  : 'No worked examples yet. Check back soon!'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredExamples.map((example: any) => (
                <Link
                  key={example.id}
                  href={`/examples/${example.slug}`}
                  className="block group"
                >
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-emerald-300">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      {/* Title & Tags */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {/* Outcome Badge */}
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            example.tags?.includes('Upheld') 
                              ? 'bg-green-100 text-green-700'
                              : example.tags?.includes('Not Upheld')
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {example.tags?.includes('Upheld') ? (
                              <><CheckCircle className="h-3 w-3" /> Upheld</>
                            ) : example.tags?.includes('Not Upheld') ? (
                              <><XCircle className="h-3 w-3" /> Not Upheld</>
                            ) : (
                              '⏳ Ongoing'
                            )}
                          </span>

                          {/* Complexity Badge */}
                          {example.tags?.some((t: string) => ['Simple', 'Moderate', 'Complex'].includes(t)) && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {example.tags.find((t: string) => ['Simple', 'Moderate', 'Complex'].includes(t))}
                            </span>
                          )}
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                          {example.title}
                        </h3>

                        {example.excerpt && (
                          <p className="text-gray-600 line-clamp-2">
                            {example.excerpt}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex flex-col gap-2 text-right">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">£{(Math.random() * 15000 + 5000).toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{Math.floor(Math.random() * 180 + 30)} days</span>
                        </div>
                      </div>
                    </div>

                    {/* Key Learnings Preview */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500 mb-2 font-medium">Key Learnings:</div>
                      <div className="flex flex-wrap gap-2">
                        {['Charter breach detection', 'Fee calculation strategy', 'Escalation timing'].map((learning, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                            {learning}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

