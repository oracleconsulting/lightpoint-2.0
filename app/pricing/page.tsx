'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/Provider';
import { Check, Zap, Crown, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const router = useRouter();
  
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
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-16 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your practice. All plans include a 14-day free trial.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-lg">
            <button
              className={`px-6 py-2 rounded-md transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-background shadow-sm font-medium'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-background shadow-sm font-medium'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setBillingPeriod('annual')}
            >
              Annual
              <Badge variant="secondary" className="text-xs">
                Save up to 17%
              </Badge>
            </button>
          </div>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {tiers?.map((tier: any) => {
            const price = billingPeriod === 'monthly' 
              ? tier.monthly_price 
              : tier.annual_price;
            const displayPrice = price / 100;
            const monthlyEquivalent = billingPeriod === 'annual' 
              ? (tier.annual_price / 12) / 100 
              : displayPrice;
            
            return (
              <Card 
                key={tier.id}
                className={`relative ${tier.is_popular ? 'border-primary border-2 shadow-lg' : ''}`}
                style={{ borderColor: tier.is_popular ? tier.color_theme : undefined }}
              >
                {tier.is_popular && (
                  <Badge 
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                    style={{ backgroundColor: tier.color_theme }}
                  >
                    Most Popular
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
                    className="w-full" 
                    size="lg"
                    variant={tier.is_popular ? 'default' : 'outline'}
                    onClick={() => {
                      router.push(`/subscription/checkout?tier=${tier.id}&period=${billingPeriod}`);
                    }}
                  >
                    Start 14-Day Free Trial
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        
        {/* FAQ / Additional Info */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">All Plans Include</h2>
          <div className="grid gap-6 md:grid-cols-3 text-left">
            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold mb-2">14-Day Free Trial</h3>
              <p className="text-sm text-muted-foreground">
                Try any plan risk-free. No credit card required.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold mb-2">Cancel Anytime</h3>
              <p className="text-sm text-muted-foreground">
                No long-term contracts. Cancel your subscription at any time.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold mb-2">Easy Upgrades</h3>
              <p className="text-sm text-muted-foreground">
                Start small and upgrade as your practice grows.
              </p>
            </div>
          </div>
        </div>
        
        {/* Enterprise CTA */}
        <div className="max-w-4xl mx-auto mt-12 p-8 border-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Need a Custom Solution?</h3>
              <p className="text-muted-foreground">
                Contact our team for enterprise pricing, custom integrations, and dedicated support.
              </p>
            </div>
            <Button size="lg" onClick={() => router.push('/contact')}>
              Contact Sales
            </Button>
          </div>
        </div>
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

