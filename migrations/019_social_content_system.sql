-- =====================================================
-- Migration 019: AI Social Content Generation System
-- =====================================================
-- Purpose: Enable AI-powered social media content generation and automation
-- Date: 2025-11-23
-- =====================================================

BEGIN;

-- =====================================================
-- Table: social_content_posts
-- =====================================================
CREATE TABLE IF NOT EXISTS social_content_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  
  -- Platform & Status
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'failed')),
  
  -- Content
  content TEXT NOT NULL,
  content_variant INTEGER DEFAULT 1, -- Multiple variants per platform (1-5)
  hashtags TEXT[], -- Platform-specific hashtags
  media_urls TEXT[], -- Images/videos to include
  
  -- AI Metadata
  ai_generated BOOLEAN DEFAULT true,
  ai_model TEXT, -- e.g., 'gpt-4-turbo', 'claude-3-opus'
  ai_prompt TEXT, -- Store prompt for debugging/improvement
  generation_metrics JSONB, -- {tokens: 500, cost: 0.01, temperature: 0.8}
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Analytics (updated via webhooks/APIs)
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0, -- likes + comments + shares
  clicks INTEGER DEFAULT 0, -- click-throughs to blog
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  
  -- External Platform IDs
  platform_post_id TEXT, -- Twitter ID, LinkedIn URN, FB post ID
  platform_url TEXT, -- Direct link to post
  platform_response JSONB, -- Full API response for debugging
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_social_content_blog_post ON social_content_posts(blog_post_id);
CREATE INDEX idx_social_content_status ON social_content_posts(status);
CREATE INDEX idx_social_content_platform ON social_content_posts(platform);
CREATE INDEX idx_social_content_scheduled ON social_content_posts(scheduled_for) 
  WHERE status = 'scheduled';
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
  
  -- Campaign Schedule (JSON array)
  schedule JSONB NOT NULL,
  -- Example: [
  --   {"day": 0, "time": "09:00", "platforms": ["twitter", "linkedin", "facebook"], "type": "announcement"},
  --   {"day": 0, "time": "15:00", "platforms": ["twitter"], "type": "key_quote"},
  --   {"day": 3, "time": "10:00", "platforms": ["linkedin"], "type": "detailed_summary"},
  --   {"day": 7, "time": "11:00", "platforms": ["twitter", "linkedin"], "type": "stat_highlight"},
  --   {"day": 14, "time": "09:00", "platforms": ["facebook"], "type": "case_study"},
  --   {"day": 30, "time": "10:00", "platforms": ["twitter", "linkedin"], "type": "evergreen_reshare"}
  -- ]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Default Drip Campaign: Standard Blog Launch
-- =====================================================
INSERT INTO social_drip_campaigns (name, description, is_default, schedule) VALUES (
  'Standard Blog Launch',
  '30-day drip campaign for new blog posts - maximizes reach and engagement',
  true,
  '[
    {
      "day": 0,
      "time": "09:00",
      "platforms": ["twitter", "linkedin", "facebook"],
      "type": "announcement",
      "note": "Initial launch - all platforms"
    },
    {
      "day": 0,
      "time": "15:00",
      "platforms": ["twitter"],
      "type": "key_quote",
      "note": "Pull best quote from article"
    },
    {
      "day": 3,
      "time": "10:00",
      "platforms": ["linkedin"],
      "type": "detailed_summary",
      "note": "Professional deep-dive for LinkedIn audience"
    },
    {
      "day": 7,
      "time": "11:00",
      "platforms": ["twitter", "linkedin"],
      "type": "stat_highlight",
      "note": "Share key statistic or finding"
    },
    {
      "day": 14,
      "time": "09:00",
      "platforms": ["facebook"],
      "note": "Conversational reshare for Facebook"
    },
    {
      "day": 30,
      "time": "10:00",
      "platforms": ["twitter", "linkedin"],
      "type": "evergreen_reshare",
      "note": "Final reshare - still relevant"
    }
  ]'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Table: social_content_templates
-- =====================================================
CREATE TABLE IF NOT EXISTS social_content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'all')),
  content_type TEXT NOT NULL, -- 'announcement', 'key_quote', 'stat_highlight', etc.
  
  -- AI Prompt Template
  prompt_template TEXT NOT NULL,
  -- Example: "Create a {platform} post announcing this blog article. Focus on {focus}. Include {cta}."
  
  -- Configuration
  max_length INTEGER,
  include_hashtags BOOLEAN DEFAULT true,
  hashtag_count INTEGER DEFAULT 3,
  include_cta BOOLEAN DEFAULT true,
  tone TEXT DEFAULT 'professional', -- 'professional', 'casual', 'authoritative'
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Default Templates for Each Platform
-- =====================================================
INSERT INTO social_content_templates (name, platform, content_type, prompt_template, max_length, hashtag_count) VALUES
  (
    'Twitter - Announcement',
    'twitter',
    'announcement',
    'Create a concise, attention-grabbing Twitter post announcing this blog article. Use punchy language, include key benefit, and add 1-2 relevant hashtags. Max 280 characters. End with link placeholder [LINK]',
    280,
    2
  ),
  (
    'LinkedIn - Professional Deep Dive',
    'linkedin',
    'detailed_summary',
    'Create a professional LinkedIn post (500-1000 chars) summarizing this blog article. Use storytelling, share key insights, and include 3-5 relevant hashtags. Write for a professional services audience. End with "Read the full article: [LINK]"',
    1000,
    5
  ),
  (
    'Facebook - Conversational',
    'facebook',
    'announcement',
    'Create an engaging Facebook post (300-500 chars) about this blog article. Use a conversational tone, ask a question to spark discussion, and include 2-3 hashtags. End with "Learn more: [LINK]"',
    500,
    3
  ),
  (
    'Twitter - Key Quote',
    'twitter',
    'key_quote',
    'Extract the most powerful quote or insight from this blog article and format it as a Twitter post. Add context if needed. Include 1-2 hashtags. Max 280 characters.',
    280,
    2
  ),
  (
    'Twitter - Stat Highlight',
    'twitter',
    'stat_highlight',
    'Highlight the most compelling statistic or data point from this article in a Twitter post. Make it visual with numbers/percentages. Add 1-2 hashtags. Max 280 characters.',
    280,
    2
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- Table: social_analytics_summary
-- =====================================================
CREATE TABLE IF NOT EXISTS social_analytics_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  
  -- Aggregate Analytics (sum of all posts for this blog)
  total_impressions INTEGER DEFAULT 0,
  total_engagements INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  
  -- Platform Breakdown
  twitter_impressions INTEGER DEFAULT 0,
  twitter_engagements INTEGER DEFAULT 0,
  linkedin_impressions INTEGER DEFAULT 0,
  linkedin_engagements INTEGER DEFAULT 0,
  facebook_impressions INTEGER DEFAULT 0,
  facebook_engagements INTEGER DEFAULT 0,
  
  -- Engagement Rate (calculated)
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
    blog_post_id,
    total_impressions,
    total_engagements,
    total_clicks,
    total_shares,
    twitter_impressions,
    twitter_engagements,
    linkedin_impressions,
    linkedin_engagements,
    facebook_impressions,
    facebook_engagements,
    engagement_rate,
    last_updated
  )
  SELECT
    blog_post_id,
    SUM(impressions) as total_impressions,
    SUM(engagements) as total_engagements,
    SUM(clicks) as total_clicks,
    SUM(shares) as total_shares,
    SUM(CASE WHEN platform = 'twitter' THEN impressions ELSE 0 END) as twitter_impressions,
    SUM(CASE WHEN platform = 'twitter' THEN engagements ELSE 0 END) as twitter_engagements,
    SUM(CASE WHEN platform = 'linkedin' THEN impressions ELSE 0 END) as linkedin_impressions,
    SUM(CASE WHEN platform = 'linkedin' THEN engagements ELSE 0 END) as linkedin_engagements,
    SUM(CASE WHEN platform = 'facebook' THEN impressions ELSE 0 END) as facebook_impressions,
    SUM(CASE WHEN platform = 'facebook' THEN engagements ELSE 0 END) as facebook_engagements,
    CASE 
      WHEN SUM(impressions) > 0 THEN (SUM(engagements)::DECIMAL / SUM(impressions) * 100)
      ELSE 0
    END as engagement_rate,
    NOW() as last_updated
  FROM social_content_posts
  WHERE blog_post_id = NEW.blog_post_id
    AND status = 'published'
  GROUP BY blog_post_id
  ON CONFLICT (blog_post_id) 
  DO UPDATE SET
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
    engagement_rate = EXCLUDED.engagement_rate,
    last_updated = NOW();

  RETURN NEW;
END;
$$;

-- Trigger: Update analytics when social post metrics change
CREATE TRIGGER trigger_update_social_analytics
AFTER INSERT OR UPDATE OF impressions, engagements, clicks, shares
ON social_content_posts
FOR EACH ROW
EXECUTE FUNCTION update_social_analytics_summary();

-- =====================================================
-- Function: Get posts ready to publish
-- =====================================================
CREATE OR REPLACE FUNCTION get_social_posts_ready_to_publish()
RETURNS TABLE(
  id UUID,
  blog_post_id UUID,
  platform TEXT,
  content TEXT,
  scheduled_for TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id,
    blog_post_id,
    platform,
    content,
    scheduled_for
  FROM social_content_posts
  WHERE 
    status = 'scheduled'
    AND scheduled_for <= NOW()
  ORDER BY scheduled_for ASC
  LIMIT 50;
$$;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE social_content_posts IS 'AI-generated social media content for blog posts';
COMMENT ON TABLE social_drip_campaigns IS 'Predefined posting schedules for maximizing blog reach';
COMMENT ON TABLE social_content_templates IS 'AI prompt templates for different platforms and content types';
COMMENT ON TABLE social_analytics_summary IS 'Aggregated social media analytics per blog post';

COMMENT ON COLUMN social_content_posts.content_variant IS 'Variant number (1-5) - allows multiple versions per platform';
COMMENT ON COLUMN social_content_posts.ai_model IS 'AI model used for generation (e.g., gpt-4-turbo)';
COMMENT ON COLUMN social_content_posts.generation_metrics IS 'JSON: {tokens, cost, temperature, model_params}';
COMMENT ON COLUMN social_content_posts.platform_post_id IS 'External platform ID for published post';

COMMIT;

