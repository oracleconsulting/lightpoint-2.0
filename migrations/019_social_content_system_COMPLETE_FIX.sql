-- =====================================================
-- Migration 019: AI Social Content System - COMPLETE FIX
-- =====================================================
-- Purpose: Fix platform constraint and ensure Instagram support
-- Date: 2025-11-23
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Drop existing constraints and add Instagram
-- =====================================================

-- Drop old constraint if exists
ALTER TABLE IF EXISTS social_content_templates 
DROP CONSTRAINT IF EXISTS social_content_templates_platform_check;

-- Add new constraint with Instagram
ALTER TABLE IF EXISTS social_content_templates
ADD CONSTRAINT social_content_templates_platform_check 
CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'all'));

-- Do the same for social_content_posts if it exists
ALTER TABLE IF EXISTS social_content_posts
DROP CONSTRAINT IF EXISTS social_content_posts_platform_check;

ALTER TABLE IF EXISTS social_content_posts
ADD CONSTRAINT social_content_posts_platform_check
CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram'));

-- =====================================================
-- STEP 2: Now run the full migration
-- =====================================================

-- Drop existing indexes to avoid conflicts
DROP INDEX IF EXISTS idx_social_content_blog_post;
DROP INDEX IF EXISTS idx_social_content_status;
DROP INDEX IF EXISTS idx_social_content_platform;
DROP INDEX IF EXISTS idx_social_content_scheduled;
DROP INDEX IF EXISTS idx_social_content_analytics;

-- Create social_content_posts table
CREATE TABLE IF NOT EXISTS social_content_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'failed')),
  content TEXT NOT NULL,
  content_variant INTEGER DEFAULT 1,
  hashtags TEXT[],
  media_urls TEXT[],
  ai_generated BOOLEAN DEFAULT true,
  ai_model TEXT,
  ai_prompt TEXT,
  generation_metrics JSONB,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  platform_post_id TEXT,
  platform_url TEXT,
  platform_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

-- Ensure correct constraint
ALTER TABLE social_content_posts
DROP CONSTRAINT IF EXISTS social_content_posts_platform_check;

ALTER TABLE social_content_posts
ADD CONSTRAINT social_content_posts_platform_check
CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_content_blog_post ON social_content_posts(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_social_content_status ON social_content_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_content_platform ON social_content_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_content_scheduled ON social_content_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_content_analytics ON social_content_posts(published_at DESC, engagements DESC) WHERE status = 'published';

-- =====================================================
-- social_drip_campaigns
-- =====================================================
CREATE TABLE IF NOT EXISTS social_drip_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  schedule JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO social_drip_campaigns (name, description, is_default, schedule) VALUES (
  'Standard Blog Launch',
  '30-day drip campaign for new blog posts - maximizes reach and engagement',
  true,
  '[
    {"day": 0, "time": "09:00", "platforms": ["twitter", "linkedin", "instagram"], "type": "announcement"},
    {"day": 0, "time": "15:00", "platforms": ["twitter"], "type": "key_quote"},
    {"day": 3, "time": "10:00", "platforms": ["linkedin"], "type": "detailed_summary"},
    {"day": 7, "time": "11:00", "platforms": ["twitter", "linkedin"], "type": "stat_highlight"},
    {"day": 14, "time": "09:00", "platforms": ["instagram"], "type": "visual_story"},
    {"day": 30, "time": "10:00", "platforms": ["twitter", "linkedin"], "type": "evergreen_reshare"}
  ]'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- social_content_templates
-- =====================================================
CREATE TABLE IF NOT EXISTS social_content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  max_length INTEGER,
  include_hashtags BOOLEAN DEFAULT true,
  hashtag_count INTEGER DEFAULT 3,
  include_cta BOOLEAN DEFAULT true,
  tone TEXT DEFAULT 'professional',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure correct constraint
ALTER TABLE social_content_templates
DROP CONSTRAINT IF EXISTS social_content_templates_platform_check;

ALTER TABLE social_content_templates
ADD CONSTRAINT social_content_templates_platform_check
CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'all'));

-- Insert templates (delete old ones first to avoid conflicts)
DELETE FROM social_content_templates WHERE name IN (
  'Twitter - Announcement',
  'LinkedIn - Professional',
  'Instagram - Visual Story',
  'Twitter - Key Quote'
);

INSERT INTO social_content_templates (name, platform, content_type, prompt_template, max_length, hashtag_count) VALUES
  ('Twitter - Announcement', 'twitter', 'announcement', 'Create a concise, attention-grabbing Twitter post announcing this blog article. Use punchy language, include key benefit, and add 1-2 relevant hashtags. Max 280 characters.', 280, 2),
  ('LinkedIn - Professional', 'linkedin', 'detailed_summary', 'Create a professional LinkedIn post (500-1000 chars) summarizing this blog article. Use storytelling, share key insights, and include 3-5 relevant hashtags.', 1000, 5),
  ('Instagram - Visual Story', 'instagram', 'announcement', 'Create an Instagram caption (200-300 chars) with visual, inspiring language. Use emojis liberally, line breaks for readability, and 8-10 relevant hashtags.', 300, 10),
  ('Twitter - Key Quote', 'twitter', 'key_quote', 'Extract the most powerful quote or insight from this blog article and format it as a Twitter post. Max 280 characters.', 280, 2);

-- =====================================================
-- social_analytics_summary
-- =====================================================
CREATE TABLE IF NOT EXISTS social_analytics_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  total_impressions INTEGER DEFAULT 0,
  total_engagements INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  twitter_impressions INTEGER DEFAULT 0,
  twitter_engagements INTEGER DEFAULT 0,
  linkedin_impressions INTEGER DEFAULT 0,
  linkedin_engagements INTEGER DEFAULT 0,
  facebook_impressions INTEGER DEFAULT 0,
  facebook_engagements INTEGER DEFAULT 0,
  instagram_impressions INTEGER DEFAULT 0,
  instagram_engagements INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blog_post_id)
);

-- =====================================================
-- Functions
-- =====================================================

CREATE OR REPLACE FUNCTION update_social_analytics_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO social_analytics_summary (
    blog_post_id, total_impressions, total_engagements, total_clicks, total_shares,
    twitter_impressions, twitter_engagements, linkedin_impressions, linkedin_engagements,
    facebook_impressions, facebook_engagements, instagram_impressions, instagram_engagements,
    engagement_rate, last_updated
  )
  SELECT
    blog_post_id,
    SUM(impressions), SUM(engagements), SUM(clicks), SUM(shares),
    SUM(CASE WHEN platform = 'twitter' THEN impressions ELSE 0 END),
    SUM(CASE WHEN platform = 'twitter' THEN engagements ELSE 0 END),
    SUM(CASE WHEN platform = 'linkedin' THEN impressions ELSE 0 END),
    SUM(CASE WHEN platform = 'linkedin' THEN engagements ELSE 0 END),
    SUM(CASE WHEN platform = 'facebook' THEN impressions ELSE 0 END),
    SUM(CASE WHEN platform = 'facebook' THEN engagements ELSE 0 END),
    SUM(CASE WHEN platform = 'instagram' THEN impressions ELSE 0 END),
    SUM(CASE WHEN platform = 'instagram' THEN engagements ELSE 0 END),
    CASE WHEN SUM(impressions) > 0 THEN (SUM(engagements)::DECIMAL / SUM(impressions) * 100) ELSE 0 END,
    NOW()
  FROM social_content_posts
  WHERE blog_post_id = NEW.blog_post_id AND status = 'published'
  GROUP BY blog_post_id
  ON CONFLICT (blog_post_id) DO UPDATE SET
    total_impressions = EXCLUDED.total_impressions,
    total_engagements = EXCLUDED.total_engagements,
    total_clicks = EXCLUDED.total_clicks,
    total_shares = EXCLUDED.total_shares,
    twitter_impressions = EXCLUDED.twitter_impressions,
    twitter_engagements = EXCLUDED.twitter_engagements,
    linkedin_impressions = EXCLUDED.linkedin_impressions,
    linkedin_engagements = EXCLUDED.linkedin_engagements,
    facebook_impressions = EXCLUDED.facebook_impressions,
    facebook_engagements = EXCLUDED.facebook_engagements,
    instagram_impressions = EXCLUDED.instagram_impressions,
    instagram_engagements = EXCLUDED.instagram_engagements,
    engagement_rate = EXCLUDED.engagement_rate,
    last_updated = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_social_analytics ON social_content_posts;
CREATE TRIGGER trigger_update_social_analytics
AFTER INSERT OR UPDATE OF impressions, engagements, clicks, shares
ON social_content_posts
FOR EACH ROW
EXECUTE FUNCTION update_social_analytics_summary();

CREATE OR REPLACE FUNCTION get_social_posts_ready_to_publish()
RETURNS TABLE(id UUID, blog_post_id UUID, platform TEXT, content TEXT, scheduled_for TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, blog_post_id, platform, content, scheduled_for
  FROM social_content_posts
  WHERE status = 'scheduled' AND scheduled_for <= NOW()
  ORDER BY scheduled_for ASC
  LIMIT 50;
$$;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 019 completed successfully!';
  RAISE NOTICE '📊 Tables ready: social_content_posts, social_drip_campaigns, social_content_templates, social_analytics_summary';
  RAISE NOTICE '📱 Platforms supported: Twitter, LinkedIn, Instagram, Facebook';
  RAISE NOTICE '🤖 AI content generation ready to use!';
  RAISE NOTICE '🚀 Go to /admin/blog and click the Share button to test!';
END $$;

