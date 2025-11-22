'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/Provider';
import { CheckCircle, Sparkles, Users, Clock, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EarlyAccessPage() {
  const searchParams = useSearchParams();
  const tierId = searchParams.get('tier');
  const period = searchParams.get('period');

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    companyName: '',
    phone: '',
    estimatedComplaints: '',
    referralSource: 'organic',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Fetch tier info if tierId is provided
  const { data: tiers } = trpc.subscription.listTiers.useQuery({});
  const selectedTier = tiers?.find((t: any) => t.id === tierId) as any;

  const joinWaitlist = trpc.cms.joinWaitlist.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setError('');
    },
    onError: (err) => {
      setError(err.message || 'Failed to join waitlist. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    joinWaitlist.mutate({
      email: formData.email,
      fullName: formData.fullName || undefined,
      companyName: formData.companyName || undefined,
      phone: formData.phone || undefined,
      selectedTierId: tierId || undefined,
      selectedTierName: selectedTier?.name || undefined,
      estimatedComplaintsPerMonth: formData.estimatedComplaints ? parseInt(formData.estimatedComplaints) : undefined,
      referralSource: formData.referralSource || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary via-brand-primary-dark to-brand-blurple-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>

            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-4">
              You're on the list! 🎉
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your interest in Lightpoint. We'll be in touch very soon with early access details.
            </p>

            {selectedTier && (
              <div className="bg-blue-50 border border-blue-200 rounded-card p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Selected Plan:</span> {selectedTier.name}
                  {period && <span className="ml-2">({period === 'monthly' ? 'Monthly' : 'Annual'})</span>}
                </p>
              </div>
            )}

            <div className="space-y-3 text-sm text-gray-600 mb-8">
              <p className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                We'll email you within 24-48 hours
              </p>
              <p className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Priority access to platform features
              </p>
              <p className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Special launch pricing locked in
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-primary-dark font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary via-brand-primary-dark to-brand-blurple-dark">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-white hover:text-blue-200 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Home</span>
        </Link>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 pt-24">
        <div className="max-w-4xl w-full">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left Column - Info */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium">Early Access</span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-6">
                Almost There! 🚀
              </h1>

              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                We're putting the finishing touches on Lightpoint. Join our exclusive early access list and be among the first to transform your HMRC complaint management.
              </p>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm flex-shrink-0">
                    <Users className="h-5 w-5 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Priority Access</h3>
                    <p className="text-sm text-blue-200">Be first in line when we launch in the coming weeks</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm flex-shrink-0">
                    <Clock className="h-5 w-5 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Launch Pricing Locked In</h3>
                    <p className="text-sm text-blue-200">Special rates for early adopters - guaranteed for 12 months</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm flex-shrink-0">
                    <Shield className="h-5 w-5 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Dedicated Onboarding</h3>
                    <p className="text-sm text-blue-200">1-on-1 setup assistance to get you started right</p>
                  </div>
                </div>
              </div>

              {selectedTier && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-card p-4">
                  <p className="text-sm text-blue-100 mb-1">Selected Plan</p>
                  <p className="text-xl font-bold">{selectedTier.name}</p>
                  <p className="text-sm text-blue-200 mt-1">
                    {period === 'monthly' ? 'Monthly' : 'Annual'} billing
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
                Join the Waitlist
              </h2>
              <p className="text-gray-600 mb-6">
                Reserve your spot and we'll notify you as soon as we're ready.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    placeholder="you@yourfirm.co.uk"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    placeholder="John Smith"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    placeholder="Smith Accountancy Ltd"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    placeholder="+44 20 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {/* Estimated Complaints */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated complaints per month
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    placeholder="5"
                    value={formData.estimatedComplaints}
                    onChange={(e) => setFormData({ ...formData, estimatedComplaints: e.target.value })}
                  />
                </div>

                {/* Referral Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How did you hear about us?
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    value={formData.referralSource}
                    onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                  >
                    <option value="organic">Google Search</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="referral">Referral from colleague</option>
                    <option value="accountex">Accountex/Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-card p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={joinWaitlist.isPending}
                  className="w-full bg-gradient-to-r from-brand-gold to-amber-500 hover:from-brand-gold-dark hover:to-amber-600 text-white font-semibold py-4 text-lg"
                >
                  {joinWaitlist.isPending ? 'Joining...' : 'Join Waitlist'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By joining, you agree to receive updates about Lightpoint. Unsubscribe anytime.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

