-- ============================================
-- LIGHTPOINT V2.0 - SEED HOMEPAGE CONTENT
-- Migration: Seed all existing homepage prose into CMS
-- Date: 2024-11-22
-- ============================================

-- ============================================
-- HOMEPAGE HERO SECTION
-- ============================================

INSERT INTO page_sections (page_name, section_key, section_title, content, display_order, is_visible)
VALUES (
  'homepage',
  'hero',
  'Hero Section',
  jsonb_build_object(
    'badge_text', 'AI-Powered HMRC Complaint Management',
    'heading_line1', 'Recover Your Fees.',
    'heading_line2', 'Deliver Excellence.',
    'subheading', 'The complete platform for accountants to manage HMRC complaints, track time, identify charter breaches, and secure fee recovery—automatically.',
    'cta_primary_text', 'Start Free Trial',
    'cta_primary_link', '/pricing',
    'cta_secondary_text', 'Watch Demo',
    'cta_secondary_link', '#demo',
    'trust_line', '14-day free trial • No credit card • Enterprise-grade security'
  ),
  1,
  TRUE
)
ON CONFLICT (page_name, section_key) 
DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

-- ============================================
-- HOMEPAGE TRUST METRICS
-- ============================================

INSERT INTO page_sections (page_name, section_key, section_title, content, display_order, is_visible)
VALUES (
  'homepage',
  'trust_metrics',
  'Trust Metrics',
  jsonb_build_object(
    'metrics', jsonb_build_array(
      jsonb_build_object(
        'id', 'success_rate',
        'value', 98,
        'suffix', '%',
        'label', 'Success Rate',
        'sublabel', 'Above industry avg.',
        'icon', 'Target',
        'color', 'success'
      ),
      jsonb_build_object(
        'id', 'fees_recovered',
        'value', 2.3,
        'prefix', '£',
        'suffix', 'M+',
        'decimals', 1,
        'label', 'Fees Recovered',
        'sublabel', 'For our clients',
        'icon', 'PoundSterling',
        'color', 'gold'
      ),
      jsonb_build_object(
        'id', 'avg_resolution',
        'value', 23,
        'suffix', ' days',
        'label', 'Avg. Resolution',
        'sublabel', '47d faster than standard',
        'icon', 'Clock',
        'color', 'warning',
        'badge', '-47 days'
      ),
      jsonb_build_object(
        'id', 'firms_trust',
        'value', 500,
        'suffix', '+',
        'label', 'Firms Trust Us',
        'sublabel', 'Leading practices',
        'icon', 'Users',
        'color', 'primary',
        'live_badge', '3 online'
      )
    ),
    'trust_badges', jsonb_build_array(
      '🔒 Enterprise-grade encryption',
      'GDPR-ready infrastructure',
      'SOC 2 compliant hosting',
      'Last updated 2 min ago'
    )
  ),
  2,
  TRUE
)
ON CONFLICT (page_name, section_key) 
DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

-- ============================================
-- HOMEPAGE PROBLEM/SOLUTION SECTION
-- ============================================

INSERT INTO page_sections (page_name, section_key, section_title, content, display_order, is_visible)
VALUES (
  'homepage',
  'problem_solution',
  'Problem/Solution Section',
  jsonb_build_object(
    'section_title', 'Stop Losing Revenue on HMRC Complaints',
    'section_subtitle', 'Every year, accountants write off thousands in fees because HMRC complaint management is complex, time-consuming, and inconsistent. Lightpoint changes that.',
    'problem_heading', 'The Problem',
    'problems', jsonb_build_array(
      'HMRC complaints take 20+ hours per case',
      'Fee recovery requires detailed time tracking',
      'Charter breaches are easy to miss',
      'No standardised complaint structure',
      'Clients balk at upfront fees',
      'Inconsistent outcomes and unpredictable timelines'
    ),
    'solution_heading', 'The Solution',
    'solutions', jsonb_build_array(
      'AI analyzes cases in minutes, not hours',
      'Automatic fee calculation & HMRC-compliant invoicing',
      'Charter breach detection with precedent matching',
      'Proven templates for every complaint stage',
      'No-win, no-fee structure with ROI prediction',
      'Predictable timelines with 98% success rate'
    )
  ),
  3,
  TRUE
)
ON CONFLICT (page_name, section_key) 
DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

-- ============================================
-- HOMEPAGE FEATURES SECTION
-- ============================================

INSERT INTO page_sections (page_name, section_key, section_title, content, display_order, is_visible)
VALUES (
  'homepage',
  'features',
  'Features Section',
  jsonb_build_object(
    'section_title', 'Everything You Need to Win HMRC Complaints',
    'section_subtitle', 'Purpose-built for UK accountants and tax professionals',
    'features', jsonb_build_array(
      jsonb_build_object(
        'icon', 'Shield',
        'title', 'AI Charter Analysis',
        'description', 'Automatically detect HMRC Charter breaches with 95%+ accuracy. Our AI is trained on 10,000+ successful cases.',
        'color', 'blue'
      ),
      jsonb_build_object(
        'icon', 'TrendingUp',
        'title', 'Fee Recovery Engine',
        'description', 'Calculate professional fees in HMRC''s required 12-minute segments. Track time accurately and maximize recovery.',
        'color', 'green'
      ),
      jsonb_build_object(
        'icon', 'FileText',
        'title', 'Complaint Letter Drafting',
        'description', 'Generate Tier 1, Tier 2, and Adjudicator letters using proven templates. Consistent quality every time.',
        'color', 'purple'
      ),
      jsonb_build_object(
        'icon', 'BookOpen',
        'title', 'CPD & Training',
        'description', 'Learn best practices with our comprehensive CPD library. Stay updated on latest HMRC procedures.',
        'color', 'indigo'
      ),
      jsonb_build_object(
        'icon', 'Video',
        'title', 'Expert Webinars',
        'description', 'Live and on-demand webinars from complaint resolution specialists. Ask questions and get real answers.',
        'color', 'pink'
      ),
      jsonb_build_object(
        'icon', 'Award',
        'title', 'Case Precedents',
        'description', 'Search 1,000+ worked examples with outcomes. Learn from successful complaints and avoid pitfalls.',
        'color', 'yellow'
      )
    )
  ),
  4,
  TRUE
)
ON CONFLICT (page_name, section_key) 
DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

-- ============================================
-- HOMEPAGE ROI CALCULATOR SECTION
-- ============================================

INSERT INTO page_sections (page_name, section_key, section_title, content, display_order, is_visible)
VALUES (
  'homepage',
  'roi_calculator',
  'ROI Calculator Section',
  jsonb_build_object(
    'left_column', jsonb_build_object(
      'heading', 'See Your Potential ROI',
      'subheading', 'On average, accountants using Lightpoint recover £12,400 per complaint in professional fees and ex-gratia payments.',
      'calculations', jsonb_build_array(
        jsonb_build_object('label', 'Average fee recovery per case', 'value', '£8,600'),
        jsonb_build_object('label', 'Average ex-gratia payment', 'value', '£3,800'),
        jsonb_build_object('label', 'Total per case', 'value', '£12,400', 'highlight', true)
      ),
      'cta_text', 'Start Recovering Fees',
      'cta_link', '/pricing'
    ),
    'right_column', jsonb_build_object(
      'heading', 'Professional Tier Example',
      'subscription_cost', '£299/month',
      'cases_per_month', '20 complaints',
      'subscription_coverage', '41 months of subscription costs',
      'note', 'Just 1 successful case covers:'
    )
  ),
  5,
  TRUE
)
ON CONFLICT (page_name, section_key) 
DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

-- ============================================
-- HOMEPAGE HOW IT WORKS SECTION
-- ============================================

INSERT INTO page_sections (page_name, section_key, section_title, content, display_order, is_visible)
VALUES (
  'homepage',
  'how_it_works',
  'How It Works Section',
  jsonb_build_object(
    'section_title', 'How Lightpoint Works',
    'section_subtitle', 'From upload to resolution in 4 simple steps',
    'steps', jsonb_build_array(
      jsonb_build_object(
        'number', 1,
        'title', 'Upload Documents',
        'description', 'Upload HMRC correspondence, tax returns, and client communication'
      ),
      jsonb_build_object(
        'number', 2,
        'title', 'AI Analysis',
        'description', 'Our AI detects Charter breaches, calculates success probability, and estimates ROI'
      ),
      jsonb_build_object(
        'number', 3,
        'title', 'Generate Letters',
        'description', 'Create professional complaint letters with citations and precedents'
      ),
      jsonb_build_object(
        'number', 4,
        'title', 'Track & Recover',
        'description', 'Monitor case progress and recover your fees when HMRC upholds the complaint'
      )
    )
  ),
  6,
  TRUE
)
ON CONFLICT (page_name, section_key) 
DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

-- ============================================
-- HOMEPAGE TESTIMONIALS SECTION
-- ============================================

INSERT INTO page_sections (page_name, section_key, section_title, content, display_order, is_visible)
VALUES (
  'homepage',
  'testimonials',
  'Testimonials Section',
  jsonb_build_object(
    'section_title', 'Trusted by UK Accountancy Firms',
    'testimonials', jsonb_build_array(
      jsonb_build_object(
        'quote', 'Lightpoint paid for itself with our first case. The AI caught breaches we would have missed, and the letter templates saved us 15+ hours.',
        'author', 'Sarah Mitchell',
        'role', 'Partner, Mitchell & Associates',
        'rating', 5
      ),
      jsonb_build_object(
        'quote', 'The CPD content is exceptional. Our team is now confident handling complaints that we used to refer out. Game changer for our practice.',
        'author', 'David Chen',
        'role', 'Managing Director, Chen Tax Solutions',
        'rating', 5
      ),
      jsonb_build_object(
        'quote', 'We''ve recovered over £84,000 in fees in 6 months. The ROI calculator was conservative - actual results exceeded predictions.',
        'author', 'Emma Thompson',
        'role', 'Senior Tax Advisor, Thompson & Co',
        'rating', 5
      )
    )
  ),
  7,
  TRUE
)
ON CONFLICT (page_name, section_key) 
DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

-- ============================================
-- HOMEPAGE FINAL CTA SECTION
-- ============================================

INSERT INTO page_sections (page_name, section_key, section_title, content, display_order, is_visible)
VALUES (
  'homepage',
  'final_cta',
  'Final CTA Section',
  jsonb_build_object(
    'heading', 'Ready to Stop Losing Revenue?',
    'subheading', 'Join 500+ UK accountancy firms using Lightpoint to win HMRC complaints and recover fees.',
    'cta_primary_text', 'Start Free Trial',
    'cta_primary_link', '/pricing',
    'cta_secondary_text', 'Book a Demo',
    'cta_secondary_link', '/contact'
  ),
  8,
  TRUE
)
ON CONFLICT (page_name, section_key) 
DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

-- ============================================
-- ADD RLS POLICIES FOR page_sections
-- ============================================

-- Public read access (for displaying on website)
DROP POLICY IF EXISTS "Public can view visible page sections" ON page_sections;
CREATE POLICY "Public can view visible page sections" 
  ON page_sections
  FOR SELECT
  USING (is_visible = TRUE);

-- Super admins can manage all sections
DROP POLICY IF EXISTS "Super admins can manage page sections" ON page_sections;
CREATE POLICY "Super admins can manage page sections"
  ON page_sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this to verify the data was inserted:
-- SELECT page_name, section_key, section_title, display_order 
-- FROM page_sections 
-- WHERE page_name = 'homepage' 
-- ORDER BY display_order;

