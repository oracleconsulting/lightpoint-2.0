-- ============================================
-- LIGHTPOINT V2.0 - CMS & PAGE CONTENT SYSTEM
-- Migration: Add editable page content system
-- Date: 2024-11-22
-- ============================================

-- ============================================
-- 1. PAGE SECTIONS TABLE (for landing page, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS page_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Page & Section Identity
  page_name TEXT NOT NULL, -- 'homepage', 'pricing', 'about'
  section_key TEXT NOT NULL, -- 'hero', 'features', 'testimonials'
  section_title TEXT NOT NULL, -- Human-readable name for admin UI
  
  -- Content (JSONB for ultimate flexibility)
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  /**
   * Example for hero section:
   * {
   *   "heading": "HMRC Complaint Management Made Simple",
   *   "subheading": "AI-powered platform for accountants...",
   *   "cta_primary": "Start Free Trial",
   *   "cta_secondary": "Watch Demo",
   *   "background_color": "#1e40af"
   * }
   * 
   * Example for features section:
   * {
   *   "title": "Everything You Need",
   *   "features": [
   *     {
   *       "icon": "Shield",
   *       "title": "AI Charter Analysis",
   *       "description": "..."
   *     }
   *   ]
   * }
   */
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  
  -- SEO
  seo_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(page_name, section_key)
);

CREATE INDEX idx_page_sections_page ON page_sections(page_name);
CREATE INDEX idx_page_sections_visible ON page_sections(is_visible);
CREATE INDEX idx_page_sections_order ON page_sections(display_order);

-- ============================================
-- 2. SITE SETTINGS TABLE (global settings)
-- ============================================

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Setting Identity
  setting_key TEXT UNIQUE NOT NULL, -- 'site_name', 'contact_email', 'trial_days'
  setting_group TEXT NOT NULL, -- 'general', 'seo', 'features', 'pricing'
  display_name TEXT NOT NULL, -- Human-readable name
  
  -- Value (JSONB for any type)
  value JSONB NOT NULL,
  default_value JSONB,
  
  -- Metadata
  description TEXT, -- Help text for admin
  data_type TEXT NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_site_settings_group ON site_settings(setting_group);
CREATE INDEX idx_site_settings_key ON site_settings(setting_key);

-- ============================================
-- 3. SEO METADATA TABLE (per page)
-- ============================================

CREATE TABLE IF NOT EXISTS seo_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Page
  page_path TEXT UNIQUE NOT NULL, -- '/', '/pricing', '/blog/post-slug'
  page_title TEXT NOT NULL, -- Browser tab title
  
  -- SEO
  meta_title TEXT NOT NULL, -- SEO title (can differ from page_title)
  meta_description TEXT NOT NULL,
  meta_keywords TEXT[],
  
  -- Open Graph (for social sharing)
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  og_type TEXT DEFAULT 'website',
  
  -- Twitter Card
  twitter_card TEXT DEFAULT 'summary_large_image',
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image_url TEXT,
  
  -- Structured Data (Schema.org)
  structured_data JSONB, -- For rich snippets
  
  -- Robots
  robots_index BOOLEAN DEFAULT TRUE,
  robots_follow BOOLEAN DEFAULT TRUE,
  canonical_url TEXT,
  
  -- AI Search Optimization
  ai_search_hints TEXT[], -- Keywords for AI search engines
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_seo_page_path ON seo_metadata(page_path);

-- ============================================
-- 4. INSERT DEFAULT HOMEPAGE CONTENT
-- ============================================

-- Hero Section
INSERT INTO page_sections (page_name, section_key, section_title, content, display_order) VALUES
('homepage', 'hero', 'Hero Section', '{
  "heading": "HMRC Complaint Management Made Simple",
  "subheading": "AI-powered platform for accountants and tax professionals to manage HMRC complaints, recover fees, and deliver exceptional client service.",
  "cta_primary_text": "Start Free Trial",
  "cta_primary_url": "/pricing",
  "cta_secondary_text": "Watch Demo",
  "cta_secondary_url": "/demo",
  "trial_text": "14-day free trial • No credit card required • Cancel anytime",
  "background_gradient": "from-blue-600 via-blue-700 to-indigo-800"
}'::jsonb, 1);

-- Trust Indicators
INSERT INTO page_sections (page_name, section_key, section_title, content, display_order) VALUES
('homepage', 'trust_indicators', 'Trust Indicators', '{
  "stats": [
    {
      "value": "95%+",
      "label": "Success Rate"
    },
    {
      "value": "£2.4M+",
      "label": "Fees Recovered"
    },
    {
      "value": "500+",
      "label": "Firms Trust Us"
    },
    {
      "value": "4.9/5",
      "label": "User Rating"
    }
  ]
}'::jsonb, 2);

-- Features Section
INSERT INTO page_sections (page_name, section_key, section_title, content, display_order) VALUES
('homepage', 'features', 'Features Section', '{
  "title": "Everything You Need to Win HMRC Complaints",
  "subtitle": "Purpose-built for UK accountants and tax professionals",
  "features": [
    {
      "icon": "Shield",
      "title": "AI Charter Analysis",
      "description": "Automatically detect HMRC Charter breaches with 95%+ accuracy. Our AI is trained on 10,000+ successful cases.",
      "color": "blue"
    },
    {
      "icon": "TrendingUp",
      "title": "Fee Recovery Engine",
      "description": "Calculate professional fees in HMRC''s required 12-minute segments. Track time accurately and maximize recovery.",
      "color": "green"
    },
    {
      "icon": "FileText",
      "title": "Complaint Letter Drafting",
      "description": "Generate Tier 1, Tier 2, and Adjudicator letters using proven templates. Consistent quality every time.",
      "color": "purple"
    },
    {
      "icon": "BookOpen",
      "title": "CPD & Training",
      "description": "Learn best practices with our comprehensive CPD library. Stay updated on latest HMRC procedures.",
      "color": "indigo"
    },
    {
      "icon": "Video",
      "title": "Expert Webinars",
      "description": "Live and on-demand webinars from complaint resolution specialists. Ask questions and get real answers.",
      "color": "pink"
    },
    {
      "icon": "Users",
      "title": "Case Precedents",
      "description": "Search 1,000+ worked examples with outcomes. Learn from successful complaints and avoid pitfalls.",
      "color": "yellow"
    }
  ]
}'::jsonb, 3);

-- ROI Calculator
INSERT INTO page_sections (page_name, section_key, section_title, content, display_order) VALUES
('homepage', 'roi_calculator', 'ROI Calculator', '{
  "title": "See Your Potential ROI",
  "description": "On average, accountants using Lightpoint recover £12,400 per complaint in professional fees and ex-gratia payments.",
  "stats": [
    {
      "label": "Average fee recovery per case",
      "value": "£8,600",
      "color": "blue"
    },
    {
      "label": "Average ex-gratia payment",
      "value": "£3,800",
      "color": "blue"
    },
    {
      "label": "Total per case",
      "value": "£12,400",
      "color": "green"
    }
  ],
  "example": {
    "title": "Professional Tier Example",
    "subscription_cost": "£299/month",
    "cases_per_month": "20 complaints",
    "break_even": "Just 1 successful case covers 41 months"
  }
}'::jsonb, 4);

-- Testimonials
INSERT INTO page_sections (page_name, section_key, section_title, content, display_order) VALUES
('homepage', 'testimonials', 'Testimonials', '{
  "title": "Trusted by UK Accountancy Firms",
  "testimonials": [
    {
      "quote": "Lightpoint paid for itself with our first case. The AI caught breaches we would have missed, and the letter templates saved us 15+ hours.",
      "author": "Sarah Mitchell",
      "role": "Partner, Mitchell & Associates",
      "rating": 5
    },
    {
      "quote": "The CPD content is exceptional. Our team is now confident handling complaints that we used to refer out. Game changer for our practice.",
      "author": "David Chen",
      "role": "Managing Director, Chen Tax Solutions",
      "rating": 5
    },
    {
      "quote": "We''ve recovered over £84,000 in fees in 6 months. The ROI calculator was conservative - actual results exceeded predictions.",
      "author": "Emma Thompson",
      "role": "Senior Tax Advisor, Thompson & Co",
      "rating": 5
    }
  ]
}'::jsonb, 5);

-- ============================================
-- 5. INSERT DEFAULT SITE SETTINGS
-- ============================================

INSERT INTO site_settings (setting_key, setting_group, display_name, value, data_type, description) VALUES
('site_name', 'general', 'Site Name', '"Lightpoint"'::jsonb, 'string', 'Name of the site'),
('site_tagline', 'general', 'Site Tagline', '"HMRC Complaint Management"'::jsonb, 'string', 'Short tagline'),
('contact_email', 'general', 'Contact Email', '"hello@lightpoint.uk"'::jsonb, 'string', 'Main contact email'),
('support_email', 'general', 'Support Email', '"support@lightpoint.uk"'::jsonb, 'string', 'Support email'),

('trial_days', 'features', 'Trial Period (Days)', '14'::jsonb, 'number', 'Free trial length in days'),
('trial_requires_card', 'features', 'Trial Requires Card', 'false'::jsonb, 'boolean', 'Whether trial requires credit card'),

('default_meta_description', 'seo', 'Default Meta Description', '"AI-powered HMRC complaint management for UK accountants. Recover fees, manage complaints professionally, and deliver exceptional client service."'::jsonb, 'string', 'Default SEO description'),
('default_meta_keywords', 'seo', 'Default Meta Keywords', '["HMRC complaints", "tax complaints", "accountant software", "fee recovery", "HMRC charter"]'::jsonb, 'array', 'Default SEO keywords'),

('annual_discount_percent', 'pricing', 'Annual Discount %', '16.67'::jsonb, 'number', 'Discount for annual billing (e.g., 16.67 = 2 months free)'),
('launch_discount_percent', 'pricing', 'Launch Discount %', '25'::jsonb, 'number', 'Early adopter discount'),
('launch_discount_seats', 'pricing', 'Launch Discount Seats', '100'::jsonb, 'number', 'Number of early adopter spots');

-- ============================================
-- 6. INSERT DEFAULT SEO METADATA
-- ============================================

-- Homepage SEO
INSERT INTO seo_metadata (
  page_path, page_title, meta_title, meta_description, meta_keywords,
  og_title, og_description, og_type,
  twitter_card, twitter_title, twitter_description,
  structured_data, ai_search_hints
) VALUES (
  '/',
  'HMRC Complaint Management Made Simple | Lightpoint',
  'HMRC Complaint Management Software for UK Accountants | Lightpoint',
  'AI-powered platform for accountants to manage HMRC complaints, recover professional fees, and deliver exceptional client service. 95%+ success rate. 14-day free trial.',
  ARRAY['HMRC complaints', 'tax complaints UK', 'accountant software', 'fee recovery', 'HMRC charter breaches', 'tax professional tools', 'complaint management', 'HMRC appeal'],
  'Lightpoint - HMRC Complaint Management for Accountants',
  'AI-powered complaint management. Recover £8,600+ per case. 95%+ success rate. Trusted by 500+ UK firms.',
  'website',
  'summary_large_image',
  'HMRC Complaint Management Software',
  'Automate HMRC complaints, recover fees, and win more cases with AI-powered analysis.',
  '{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Lightpoint",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "HMRC complaint management software for UK accountants and tax professionals",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "99",
      "highPrice": "999",
      "priceCurrency": "GBP",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "99",
        "priceCurrency": "GBP",
        "referenceQuantity": {
          "@type": "QuantitativeValue",
          "value": "1",
          "unitCode": "MON"
        }
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "500"
    }
  }'::jsonb,
  ARRAY[
    'HMRC complaint software for accountants',
    'automated HMRC complaint management',
    'UK tax professional complaint tools',
    'HMRC charter breach detection',
    'accountant fee recovery software',
    'AI HMRC complaint analysis'
  ]
);

-- Pricing Page SEO
INSERT INTO seo_metadata (
  page_path, page_title, meta_title, meta_description, meta_keywords,
  ai_search_hints
) VALUES (
  '/pricing',
  'Pricing - Flexible Plans for Every Practice | Lightpoint',
  'Lightpoint Pricing - £99 to £999/month | Accountant Complaint Software',
  'Flexible pricing for HMRC complaint management. Starter (£99), Professional (£299), Enterprise (£999). 14-day free trial, no credit card required.',
  ARRAY['lightpoint pricing', 'accountant software pricing', 'HMRC complaint software cost', 'professional fees'],
  ARRAY[
    'how much does lightpoint cost',
    'lightpoint subscription prices',
    'HMRC complaint software pricing UK',
    'accountant complaint management cost'
  ]
);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Get page section content
CREATE OR REPLACE FUNCTION get_page_section(p_page_name TEXT, p_section_key TEXT)
RETURNS JSONB AS $$
DECLARE
  section_content JSONB;
BEGIN
  SELECT content INTO section_content
  FROM page_sections
  WHERE page_name = p_page_name
  AND section_key = p_section_key
  AND is_visible = TRUE;
  
  RETURN section_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get site setting
CREATE OR REPLACE FUNCTION get_site_setting(p_setting_key TEXT)
RETURNS JSONB AS $$
DECLARE
  setting_value JSONB;
BEGIN
  SELECT value INTO setting_value
  FROM site_settings
  WHERE setting_key = p_setting_key;
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get SEO metadata for page
CREATE OR REPLACE FUNCTION get_seo_metadata(p_page_path TEXT)
RETURNS JSONB AS $$
DECLARE
  seo_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'page_title', page_title,
    'meta_title', meta_title,
    'meta_description', meta_description,
    'meta_keywords', meta_keywords,
    'og_title', og_title,
    'og_description', og_description,
    'og_image_url', og_image_url,
    'twitter_card', twitter_card,
    'twitter_title', twitter_title,
    'twitter_description', twitter_description,
    'structured_data', structured_data,
    'robots_index', robots_index,
    'robots_follow', robots_follow,
    'canonical_url', canonical_url
  ) INTO seo_data
  FROM seo_metadata
  WHERE page_path = p_page_path;
  
  RETURN seo_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- Page sections: public read, admin write
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible page sections"
  ON page_sections
  FOR SELECT
  USING (is_visible = TRUE);

CREATE POLICY "Admins can manage page sections"
  ON page_sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND can_manage_content = TRUE
      AND revoked_at IS NULL
    )
  );

-- Site settings: public read, admin write
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
  ON site_settings
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage site settings"
  ON site_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND (can_manage_content = TRUE OR role = 'super_admin')
      AND revoked_at IS NULL
    )
  );

-- SEO metadata: public read, admin write
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view SEO metadata"
  ON seo_metadata
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage SEO metadata"
  ON seo_metadata
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND (can_manage_content = TRUE OR role = 'super_admin')
      AND revoked_at IS NULL
    )
  );

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMENT ON TABLE page_sections IS 'Editable page content sections (hero, features, etc.)';
COMMENT ON TABLE site_settings IS 'Global site settings (trial days, contact email, etc.)';
COMMENT ON TABLE seo_metadata IS 'SEO metadata for each page (meta tags, Open Graph, etc.)';

