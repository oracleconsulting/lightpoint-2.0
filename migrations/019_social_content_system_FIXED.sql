-- =====================================================
-- Migration 019: AI Social Content Generation System (FIXED)
-- =====================================================
-- Purpose: Enable AI-powered social media content generation and automation
-- Date: 2025-11-23
-- Fixed: Handle existing indexes gracefully
-- =====================================================

BEGIN;

-- Drop existing index if it exists (to avoid conflicts)
DROP INDEX IF EXISTS idx_social_content_blog_post;

-- =====================================================
-- Table: social_content_posts
-- =====================================================
CREATE TABLE IF NOT EXISTS social_content_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  
  -- Platform & Status
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'failed')),
  
  -- Content
  content TEXT NOT NULL,
  content_variant INTEGER DEFAULT 1,
  hashtags TEXT[],
  media_urls TEXT[],
  
  -- AI Metadata
  ai_generated BOOLEAN DEFAULT true,
  ai_model TEXT,
  ai_prompt TEXT,
  generation_metrics JSONB,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Analytics
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  
  -- External Platform IDs
  platform_post_id TEXT,
  platform_url TEXT,
  platform_response JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

-- Create indexes (with IF NOT EXISTS pattern via DROP + CREATE)
DROP INDEX IF EXISTS idx_social_content_blog_post;
CREATE INDEX idx_social_content_blog_post ON social_content_posts(blog_post_id);

DROP INDEX IF EXISTS idx_social_content_status;
CREATE INDEX idx_social_content_status ON social_content_posts(status);

DROP INDEX IF EXISTS idx_social_content_platform;
CREATE INDEX idx_social_content_platform ON social_content_posts(platform);

DROP INDEX IF EXISTS idx_social_content_scheduled;
CREATE INDEX idx_social_content_scheduled ON social_content_posts(scheduled_for) 
  WHERE status = 'scheduled';

DROP INDEX IF EXISTS idx_social_content_analytics;
CREATE INDEX idx_social_content_analytics ON social_content_posts(published_at DESC, engagements DESC) 
  WHERE status = 'published';

-- =====================================================
-- Table: social_drip_campaigns
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

-- Insert default campaign (with conflict handling)
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
-- Table: social_content_templates
-- =====================================================
CREATE TABLE IF NOT EXISTS social_content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'all')),
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

-- Insert templates
INSERT INTO social_content_templates (name, platform, content_type, prompt_template, max_length, hashtag_count) VALUES
  ('Twitter - Announcement', 'twitter', 'announcement', 'Create a concise, attention-grabbing Twitter post announcing this blog article. Use punchy language, include key benefit, and add 1-2 relevant hashtags. Max 280 characters.', 280, 2),
  ('LinkedIn - Professional', 'linkedin', 'detailed_summary', 'Create a professional LinkedIn post (500-1000 chars) summarizing this blog article. Use storytelling, share key insights, and include 3-5 relevant hashtags.', 1000, 5),
  ('Instagram - Visual Story', 'instagram', 'announcement', 'Create an Instagram caption (200-300 chars) with visual, inspiring language. Use emojis liberally, line breaks for readability, and 8-10 relevant hashtags.', 300, 10),
  ('Twitter - Key Quote', 'twitter', 'key_quote', 'Extract the most powerful quote or insight from this blog article and format it as a Twitter post. Max 280 characters.', 280, 2)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Table: social_analytics_summary
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
-- Function: Update Analytics Summary
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_update_social_analytics ON social_content_posts;
CREATE TRIGGER trigger_update_social_analytics
AFTER INSERT OR UPDATE OF impressions, engagements, clicks, shares
ON social_content_posts
FOR EACH ROW
EXECUTE FUNCTION update_social_analytics_summary();

-- =====================================================
-- Function: Get posts ready to publish
-- =====================================================
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
  RAISE NOTICE '📊 Created 4 tables for social content system';
  RAISE NOTICE '🤖 AI-powered content generation ready';
  RAISE NOTICE '📱 Platforms: Twitter, LinkedIn, Instagram, Facebook';
END $$;

