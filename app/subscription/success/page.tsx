'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give webhook time to process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary via-brand-primary-dark to-brand-blurple-dark flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary via-brand-primary-dark to-brand-blurple-dark flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 mb-8 animate-bounce">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 mb-6">
            <Sparkles className="h-4 w-4 text-brand-gold" />
            <span className="text-sm font-medium text-brand-gold">Payment Successful</span>
          </div>

          <h1 className="font-heading text-4xl font-bold text-gray-900 mb-4">
            Welcome to Lightpoint! 🎉
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your subscription is now active. You have <span className="font-bold text-brand-primary">14 days free trial</span> to explore all features.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-card p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>You'll receive a confirmation email with your invoice</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>Your 14-day free trial starts now - no charges until {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>Access all features immediately from your dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>Cancel anytime during your trial - no questions asked</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/user/dashboard">
              <Button className="gap-2 bg-gradient-to-r from-brand-gold to-amber-500 hover:from-brand-gold-dark hover:to-amber-600">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/cpd">
              <Button variant="outline" className="gap-2">
                Explore CPD Library
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            Need help getting started? <a href="mailto:support@lightpoint.uk" className="text-brand-primary hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-brand-primary via-brand-primary-dark to-brand-blurple-dark flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

