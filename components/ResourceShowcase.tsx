'use client';

import { motion } from 'framer-motion';
import { BookOpen, Video, FileText, GraduationCap, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ResourcePreview {
  type: 'blog' | 'cpd' | 'webinar' | 'example';
  title: string;
  description: string;
  image?: string;
  tier: 'free' | 'professional' | 'enterprise';
  isLocked: boolean;
  link: string;
}

interface ResourceShowcaseProps {
  userTier?: 'free' | 'professional' | 'enterprise';
}

const sampleResources: ResourcePreview[] = [
  // CPD Articles
  {
    type: 'cpd',
    title: 'Understanding HMRC Charter Rights',
    description: 'Learn the 7 key rights every accountant must know when dealing with HMRC complaints.',
    image: '/images/cpd-charter.jpg',
    tier: 'free',
    isLocked: false,
    link: '/cpd/understanding-hmrc-charter-rights',
  },
  {
    type: 'cpd',
    title: 'Advanced Escalation Techniques',
    description: 'Master the art of escalating to Tier 2 and Adjudicators with proven frameworks.',
    tier: 'professional',
    isLocked: true,
    link: '/cpd/advanced-escalation-techniques',
  },
  
  // Webinars
  {
    type: 'webinar',
    title: 'Monthly HMRC Update: December 2025',
    description: 'Live Q&A session covering recent HMRC policy changes and complaint trends.',
    tier: 'professional',
    isLocked: true,
    link: '/webinars/monthly-hmrc-update-dec-2025',
  },
  {
    type: 'webinar',
    title: 'Tax Penalty Appeals Masterclass',
    description: 'Complete workshop on successfully appealing penalties with live case studies.',
    tier: 'enterprise',
    isLocked: true,
    link: '/webinars/tax-penalty-appeals-masterclass',
  },
  
  // Worked Examples
  {
    type: 'example',
    title: 'VAT Repayment Delay: £12k Recovery',
    description: 'How we helped a mid-sized firm recover £12,000 in delayed VAT repayments plus compensation.',
    tier: 'free',
    isLocked: false,
    link: '/examples/vat-repayment-delay-12k-recovery',
  },
  {
    type: 'example',
    title: 'PAYE Investigation Complaint',
    description: 'Successfully challenged unreasonable PAYE investigation timeline - 6 month case study.',
    tier: 'professional',
    isLocked: true,
    link: '/examples/paye-investigation-complaint',
  },
  
  // Blog Posts
  {
    type: 'blog',
    title: '5 Common HMRC Complaint Mistakes',
    description: 'Avoid these critical errors that cause 80% of complaints to fail.',
    tier: 'free',
    isLocked: false,
    link: '/blog/5-common-hmrc-complaint-mistakes',
  },
  {
    type: 'blog',
    title: 'The Psychology of HMRC Negotiations',
    description: 'Understanding HMRC decision-making processes to improve your success rate.',
    tier: 'professional',
    isLocked: true,
    link: '/blog/psychology-of-hmrc-negotiations',
  },
];

const tierIcons = {
  blog: FileText,
  cpd: GraduationCap,
  webinar: Video,
  example: BookOpen,
};

const tierColors = {
  free: 'bg-green-100 text-green-700 border-green-300',
  professional: 'bg-blue-100 text-blue-700 border-blue-300',
  enterprise: 'bg-purple-100 text-purple-700 border-purple-300',
};

const tierLabels = {
  free: 'Free Tier',
  professional: 'Professional',
  enterprise: 'Enterprise Only',
};

export function ResourceShowcase({ userTier = 'free' }: ResourceShowcaseProps) {
  const canAccess = (resourceTier: string) => {
    const tiers = ['free', 'professional', 'enterprise'];
    const userLevel = tiers.indexOf(userTier);
    const resourceLevel = tiers.indexOf(resourceTier);
    return userLevel >= resourceLevel;
  };

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-heading font-bold text-gray-900 mb-4">
            Explore Our Resources
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get instant access to CPD articles, live webinars, worked examples, and expert insights.
            Unlock more as you upgrade.
          </p>
        </motion.div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {sampleResources.map((resource, index) => {
            const Icon = tierIcons[resource.type];
            const isAccessible = canAccess(resource.tier);

            return (
              <motion.div
                key={resource.link}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  !isAccessible ? 'opacity-75' : ''
                }`}>
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <Icon className="h-16 w-16 text-white opacity-50" />
                    
                    {/* Lock Overlay */}
                    {!isAccessible && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Lock className="h-12 w-12 text-white" />
                        </motion.div>
                      </div>
                    )}

                    {/* Tier Badge */}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold border ${
                      tierColors[resource.tier]
                    }`}>
                      {tierLabels[resource.tier]}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                        {resource.type}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                      {resource.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {resource.description}
                    </p>

                    {isAccessible ? (
                      <Link href={resource.link}>
                        <Button size="sm" className="w-full" variant="outline">
                          Read More
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/pricing">
                        <Button size="sm" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0">
                          Upgrade to Access
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/pricing">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8">
              View All Pricing Options
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

