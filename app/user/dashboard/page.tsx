'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  BookOpen, 
  Video, 
  TrendingUp, 
  Users, 
  Settings,
  Crown,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';

interface DashboardCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  badge?: string;
  locked?: boolean;
  requiredTier?: string;
}

function DashboardCard({ icon: Icon, title, description, href, badge, locked, requiredTier }: DashboardCardProps) {
  return (
    <Link
      href={locked ? '#' : href}
      className={`block bg-white rounded-xl border-2 p-6 transition-all ${
        locked
          ? 'border-gray-200 opacity-60 cursor-not-allowed'
          : 'border-gray-100 hover:border-blue-200 hover:shadow-lg cursor-pointer'
      }`}
      onClick={(e) => locked && e.preventDefault()}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`inline-flex p-3 rounded-lg ${locked ? 'bg-gray-100' : 'bg-blue-100'}`}>
          <Icon className={`h-6 w-6 ${locked ? 'text-gray-400' : 'text-blue-600'}`} />
        </div>
        {badge && (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
            {badge}
          </span>
        )}
        {locked && (
          <div className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
            <Crown className="h-3 w-3" />
            {requiredTier}
          </div>
        )}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
      {locked && (
        <p className="text-xs text-gray-500 mt-3">
          Upgrade to {requiredTier} tier to access this feature
        </p>
      )}
    </Link>
  );
}

interface SubscriptionData {
  tier_id: string;
  complaints_remaining?: number;
  is_trial?: boolean;
  trial_ends_at?: string;
}

interface TierData {
  name: string;
  features?: {
    complaints?: {
      max_per_month?: number;
    };
  };
}

export default function UserDashboard() {
  const { data: subscription, isLoading: subLoading } = trpc.subscription.getUserSubscription.useQuery();
  const { data: tierInfo, isLoading: tierLoading } = trpc.subscription.getTierFeatures.useQuery(
    (subscription as SubscriptionData)?.tier_id || '',
    { enabled: !!(subscription as SubscriptionData)?.tier_id }
  );

  const isLoading = subLoading || tierLoading;

  // Determine what features user has access to
  const tierName = (tierInfo as unknown as TierData)?.name || 'starter';
  const complaintsRemaining = (subscription as SubscriptionData)?.complaints_remaining || 0;
  const complaintsLimit = (tierInfo as unknown as TierData)?.features?.complaints?.max_per_month || 5;
  const isTrial = (subscription as SubscriptionData)?.is_trial || false;
  const trialEndsAt = (subscription as SubscriptionData)?.trial_ends_at;

  // Feature access based on tier
  const features = {
    complaints: true, // Everyone has some access
    cpd: tierName !== 'starter', // Professional and Enterprise
    webinars: tierName !== 'starter',
    workedExamples: tierName === 'enterprise' || tierName === 'professional',
    analytics: tierName === 'enterprise' || tierName === 'professional',
    api: tierName === 'enterprise',
    whiteLabel: tierName === 'enterprise',
    teamMembers: tierName === 'enterprise' || tierName === 'professional',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's what you can do today.</p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trial/Subscription Status Banner */}
        {isTrial && trialEndsAt && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Free Trial Active</h3>
                  <p className="text-blue-700 mt-1">
                    Your trial ends on {new Date(trialEndsAt).toLocaleDateString()}. 
                    Upgrade now to keep access to all features.
                  </p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
              >
                Upgrade Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Complaints Quota */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Monthly Complaint Quota</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{complaintsRemaining}</span>
                <span className="text-blue-100">/ {complaintsLimit} remaining</span>
              </div>
              <p className="text-sm text-blue-100 mt-2">
                Resets on the 1st of each month
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold opacity-20">{tierName}</div>
              <Link
                href="/pricing"
                className="inline-flex items-center text-sm text-white hover:text-blue-100 mt-2 underline"
              >
                Need more? Upgrade
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${(complaintsRemaining / complaintsLimit) * 100}%` }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <DashboardCard
            icon={FileText}
            title="Complaint Management"
            description="Create and manage HMRC complaints with AI-powered analysis"
            href="/dashboard"
            badge={`${complaintsRemaining} left`}
            locked={complaintsRemaining === 0}
            requiredTier="Upgrade"
          />

          <DashboardCard
            icon={BookOpen}
            title="CPD Library"
            description="Access continuing professional development resources"
            href="/cpd"
            locked={!features.cpd}
            requiredTier="Professional"
          />

          <DashboardCard
            icon={Video}
            title="Webinars"
            description="Watch live and recorded expert webinars"
            href="/webinars"
            locked={!features.webinars}
            requiredTier="Professional"
          />

          <DashboardCard
            icon={FileText}
            title="Worked Examples"
            description="Learn from successful complaint case studies"
            href="/examples"
            locked={!features.workedExamples}
            requiredTier="Professional"
          />

          <DashboardCard
            icon={TrendingUp}
            title="Analytics & ROI"
            description="Track your complaint success rates and fee recovery"
            href="/analytics"
            locked={!features.analytics}
            requiredTier="Professional"
          />

          <DashboardCard
            icon={Users}
            title="Team Management"
            description="Add team members and manage permissions"
            href="/team"
            locked={!features.teamMembers}
            requiredTier="Professional"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border-2 border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {/* Placeholder - will be populated with actual activity */}
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity yet</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first complaint
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Upgrade CTA (for non-Enterprise users) */}
        {tierName !== 'enterprise' && (
          <div className="mt-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {tierName === 'starter' ? 'Unlock Professional Features' : 'Upgrade to Enterprise'}
                </h3>
                <p className="text-indigo-100 mb-4">
                  {tierName === 'starter'
                    ? 'Get access to CPD, webinars, worked examples, and more.'
                    : 'Get unlimited complaints, white-label templates, and API access.'}
                </p>
                <ul className="space-y-2">
                  {tierName === 'starter' ? (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>20 complaints per month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Full CPD library access</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Expert webinars & worked examples</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Unlimited complaints</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>White-label templates</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>API access & dedicated support</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 transition-all font-semibold"
              >
                View Plans
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

