'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/Provider';
import { Check, Zap, Crown, Building2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  
  const { data: tiers, isLoading } = trpc.subscription.listTiers.useQuery({ 
    includeHidden: false 
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Loading pricing...</div>
      </div>
    );
  }
  
  // Calculate annual savings
  const annualSavings = (monthlyPrice: number, annualPrice: number) => {
    const monthlyCost = monthlyPrice * 12;
    const savings = ((monthlyCost - annualPrice) / monthlyCost) * 100;
    return Math.round(savings);
  };

  const handleStartTrial = async (tier: any) => {
    // If not logged in, redirect to login
    if (!user) {
      router.push(`/login?redirectTo=/pricing`);
      return;
    }

    setCheckoutLoading(tier.id);

    try {
      // Get the correct price ID based on billing period
      const priceId = billingPeriod === 'monthly' 
        ? tier.stripe_price_id_monthly 
        : tier.stripe_price_id_annual;

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          tierId: tier.id,
          billingCycle: billingPeriod,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
        setCheckoutLoading(null);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      setCheckoutLoading(null);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container mx-auto py-16 px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
            <Sparkles className="h-4 w-4" />
            Flexible Pricing for Every Practice
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your practice. All plans include a 14-day free trial.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-gray-100 rounded-lg shadow-sm">
            <button
              className={`px-6 py-2 rounded-md transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white shadow-md font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-white shadow-md font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setBillingPeriod('annual')}
            >
              Annual
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                Save up to 17%
              </Badge>
            </button>
          </div>
        </motion.div>
        
        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {tiers?.map((tier: any, index: number) => {
            const price = billingPeriod === 'monthly' 
              ? tier.monthly_price 
              : tier.annual_price;
            const displayPrice = price / 100;
            const monthlyEquivalent = billingPeriod === 'annual' 
              ? (tier.annual_price / 12) / 100 
              : displayPrice;
            
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`relative glass hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${
                    tier.is_popular ? 'border-2 shadow-xl scale-105' : 'border border-gray-200'
                  }`}
                  style={{ borderColor: tier.is_popular ? tier.color_theme : undefined }}
                >
                  {tier.is_popular && (
                    <Badge 
                      className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-lg"
                      style={{ backgroundColor: tier.color_theme }}
                    >
                      ⭐ Most Popular
                    </Badge>
                  )}
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <TierIcon tierName={tier.name} />
                  </div>
                  <CardTitle className="text-2xl">{tier.display_name}</CardTitle>
                  <CardDescription className="text-base">
                    {tier.tagline}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        £{monthlyEquivalent.toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {billingPeriod === 'annual' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        £{displayPrice.toFixed(0)} billed annually
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Save {annualSavings(tier.monthly_price, tier.annual_price)}%
                        </Badge>
                      </p>
                    )}
                  </div>
                  
                  {/* Features */}
                  <div className="space-y-3">
                    {/* Complaints */}
                    <Feature
                      text={
                        tier.features.complaints.max_per_month === -1
                          ? 'Unlimited complaints per month'
                          : `${tier.features.complaints.max_per_month} complaints per month`
                      }
                      included={true}
                    />
                    
                    {/* AI Generation */}
                    {tier.features.complaints.ai_generation && (
                      <Feature text="AI-powered letter drafting" included={true} />
                    )}
                    
                    {/* Precedent Search */}
                    {tier.features.complaints.precedent_search && (
                      <Feature text="Precedent search" included={true} />
                    )}
                    
                    {/* Success Prediction */}
                    {tier.features.analysis.success_prediction && (
                      <Feature text="Success rate prediction" included={true} />
                    )}
                    
                    {/* ROI Calculator */}
                    {tier.features.analysis.roi_calculator && (
                      <Feature text="ROI calculator" included={true} />
                    )}
                    
                    {/* CPD */}
                    {tier.features.cpd.access && (
                      <Feature text="CPD content & materials" included={true} />
                    )}
                    
                    {/* Webinars */}
                    {tier.features.cpd.webinar_access !== 'none' && (
                      <Feature 
                        text={`Webinar access (${tier.features.cpd.webinar_access})`} 
                        included={true} 
                      />
                    )}
                    
                    {/* Worked Examples */}
                    {tier.features.cpd.worked_examples && (
                      <Feature text="Worked examples library" included={true} />
                    )}
                    
                    {/* Team Members */}
                    <Feature
                      text={
                        tier.features.collaboration.team_members === -1
                          ? 'Unlimited team members'
                          : `${tier.features.collaboration.team_members} team member${tier.features.collaboration.team_members > 1 ? 's' : ''}`
                      }
                      included={true}
                    />
                    
                    {/* White Label */}
                    {tier.features.collaboration.white_label && (
                      <Feature text="White-label branding" included={true} />
                    )}
                    
                    {/* Support */}
                    <Feature
                      text={`${tier.features.support.level} support (${tier.features.support.response_time})`}
                      included={true}
                    />
                    
                    {/* API Access */}
                    {tier.features.advanced.api_access && (
                      <Feature text="API access" included={true} />
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full btn-hover" 
                    size="lg"
                    variant={tier.is_popular ? 'default' : 'outline'}
                    onClick={() => handleStartTrial(tier)}
                    disabled={checkoutLoading === tier.id}
                  >
                    {checkoutLoading === tier.id ? 'Loading...' : 'Start 14-Day Free Trial'}
                  </Button>
                </CardFooter>
              </Card>
              </motion.div>
            );
          })}
        </div>
        
        {/* FAQ / Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mt-16 text-center"
        >
          <h2 className="text-2xl font-heading font-bold mb-8">All Plans Include</h2>
          <div className="grid gap-6 md:grid-cols-3 text-left">
            <div className="p-6 border border-gray-200 rounded-xl glass hover:shadow-lg hover:-translate-y-1 transition-all">
              <h3 className="font-semibold text-lg mb-2">14-Day Free Trial</h3>
              <p className="text-sm text-gray-600">
                Try any plan risk-free. No credit card required.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl glass hover:shadow-lg hover:-translate-y-1 transition-all">
              <h3 className="font-semibold text-lg mb-2">Cancel Anytime</h3>
              <p className="text-sm text-gray-600">
                No long-term contracts. Cancel your subscription at any time.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl glass hover:shadow-lg hover:-translate-y-1 transition-all">
              <h3 className="font-semibold text-lg mb-2">Easy Upgrades</h3>
              <p className="text-sm text-gray-600">
                Start small and upgrade as your practice grows.
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mt-12 p-8 border-2 border-blue-200 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-xl transition-shadow"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Need a Custom Solution?</h3>
              <p className="text-gray-600">
                Contact our team for enterprise pricing, custom integrations, and dedicated support.
              </p>
            </div>
            <Button size="lg" className="btn-hover" onClick={() => router.push('/contact')}>
              Contact Sales
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function TierIcon({ tierName }: { tierName: string }) {
  const icons = {
    starter: <Zap className="h-6 w-6 text-blue-500" />,
    professional: <Crown className="h-6 w-6 text-amber-500" />,
    enterprise: <Building2 className="h-6 w-6 text-purple-500" />,
  };
  
  return icons[tierName as keyof typeof icons] || icons.starter;
}

interface FeatureProps {
  text: string;
  included: boolean;
}

function Feature({ text, included }: FeatureProps) {
  return (
    <div className="flex items-start gap-3">
      <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${included ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className={included ? 'text-foreground' : 'text-muted-foreground line-through'}>
        {text}
      </span>
    </div>
  );
}

