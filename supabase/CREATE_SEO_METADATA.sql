-- ============================================================================
-- Create SEO Metadata Table with Default Data
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Create the seo_metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS seo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT UNIQUE NOT NULL,
  page_title TEXT,
  meta_title TEXT NOT NULL,
  meta_description TEXT,
  meta_keywords TEXT[],
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  twitter_card TEXT DEFAULT 'summary_large_image',
  canonical_url TEXT,
  robots TEXT DEFAULT 'index, follow',
  structured_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

-- Public read policy
DROP POLICY IF EXISTS "Public can read seo_metadata" ON seo_metadata;
CREATE POLICY "Public can read seo_metadata"
ON seo_metadata FOR SELECT
USING (true);

-- Admin write policy (allow all for now)
DROP POLICY IF EXISTS "Admins can update seo_metadata" ON seo_metadata;
CREATE POLICY "Admins can update seo_metadata"
ON seo_metadata FOR ALL
USING (true);

-- Insert default SEO data for all pages
INSERT INTO seo_metadata (page_path, page_title, meta_title, meta_description, meta_keywords, canonical_url, og_image_url)
VALUES 
  ('/', 'Homepage', 'Lightpoint - HMRC Complaint Management for Accountants', 
   'Win more HMRC complaints. Recover professional fees. AI-powered complaint management for UK accountants.',
   ARRAY['HMRC complaints', 'accountant fees', 'tax disputes', 'charter breaches'],
   'https://lightpoint.uk', '/og-image.jpg'),
   
  ('/pricing', 'Pricing', 'Pricing - Lightpoint HMRC Complaint Management',
   'Affordable HMRC complaint management for accounting practices. Pay per complaint or subscribe. Start free.',
   ARRAY['HMRC complaint pricing', 'accountant software pricing', 'tax dispute costs'],
   'https://lightpoint.uk/pricing', '/og-image.jpg'),
   
  ('/blog', 'Blog', 'Blog - HMRC Complaint Insights | Lightpoint',
   'Expert insights on HMRC complaints, tax disputes, and professional fee recovery. Tips for UK accountants.',
   ARRAY['HMRC blog', 'tax dispute advice', 'accountant tips', 'complaint handling'],
   'https://lightpoint.uk/blog', '/og-image.jpg'),
   
  ('/cpd', 'CPD', 'CPD Articles - Professional Development | Lightpoint',
   'Continuing Professional Development articles for UK accountants. HMRC compliance and complaint handling.',
   ARRAY['CPD articles', 'accountant training', 'HMRC compliance', 'professional development'],
   'https://lightpoint.uk/cpd', '/og-image.jpg'),
   
  ('/webinars', 'Webinars', 'Webinars - HMRC Training for Accountants | Lightpoint',
   'Free webinars on HMRC complaint handling, fee recovery, and tax dispute resolution for accountants.',
   ARRAY['HMRC webinars', 'accountant training', 'tax dispute webinar', 'free CPD'],
   'https://lightpoint.uk/webinars', '/og-image.jpg'),
   
  ('/examples', 'Examples', 'Worked Examples - Real HMRC Cases | Lightpoint',
   'Real-world HMRC complaint case studies. Learn from successful fee recovery and dispute resolution examples.',
   ARRAY['HMRC case studies', 'complaint examples', 'tax dispute cases', 'fee recovery examples'],
   'https://lightpoint.uk/examples', '/og-image.jpg'),
   
  ('/about', 'About', 'About Lightpoint - HMRC Complaint Specialists',
   'Learn about Lightpoint, the AI-powered HMRC complaint management system built for UK accountants.',
   ARRAY['about Lightpoint', 'HMRC specialists', 'complaint software company'],
   'https://lightpoint.uk/about', '/og-image.jpg'),
   
  ('/contact', 'Contact', 'Contact Us - Lightpoint Support',
   'Get in touch with Lightpoint. Questions about HMRC complaint management? We are here to help.',
   ARRAY['contact Lightpoint', 'HMRC complaint help', 'support'],
   'https://lightpoint.uk/contact', '/og-image.jpg')
   
ON CONFLICT (page_path) DO UPDATE SET
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  meta_keywords = EXCLUDED.meta_keywords,
  canonical_url = EXCLUDED.canonical_url,
  og_image_url = EXCLUDED.og_image_url,
  updated_at = now();

-- Verify the data
SELECT page_path, meta_title, LEFT(meta_description, 50) as description_preview
FROM seo_metadata
ORDER BY page_path;

