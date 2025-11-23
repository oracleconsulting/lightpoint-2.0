-- =====================================================
-- Migration 018: Add Scheduled Publishing to Blog Posts
-- =====================================================
-- Purpose: Enable scheduling blog posts for future publication
-- Date: 2025-11-23
-- =====================================================

BEGIN;

-- Add scheduling columns to blog_posts
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Update published_at for existing published posts
UPDATE blog_posts
SET published_at = created_at
WHERE is_published = true AND published_at IS NULL;

-- Create index for scheduled posts lookup
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled 
ON blog_posts(scheduled_for) 
WHERE auto_publish = true AND is_published = false;

-- Create index for published posts (for public queries)
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at 
ON blog_posts(published_at DESC) 
WHERE is_published = true;

-- =====================================================
-- Function: Auto-publish scheduled posts
-- =====================================================
CREATE OR REPLACE FUNCTION auto_publish_scheduled_posts()
RETURNS TABLE(
  id UUID,
  title TEXT,
  published_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update posts that are scheduled for now or earlier
  UPDATE blog_posts
  SET 
    is_published = true,
    published_at = scheduled_for,
    updated_at = NOW()
  WHERE 
    auto_publish = true 
    AND is_published = false 
    AND scheduled_for <= NOW()
  RETURNING 
    blog_posts.id,
    blog_posts.title,
    blog_posts.published_at
  INTO id, title, published_at;
  
  RETURN QUERY
  SELECT 
    blog_posts.id,
    blog_posts.title,
    blog_posts.published_at
  FROM blog_posts
  WHERE blog_posts.id = auto_publish_scheduled_posts.id;
END;
$$;

-- =====================================================
-- Edge Function Helper: Get posts ready to publish
-- =====================================================
CREATE OR REPLACE FUNCTION get_posts_ready_to_publish()
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  scheduled_for TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id,
    title,
    slug,
    scheduled_for
  FROM blog_posts
  WHERE 
    auto_publish = true 
    AND is_published = false 
    AND scheduled_for <= NOW()
  ORDER BY scheduled_for ASC;
$$;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON COLUMN blog_posts.scheduled_for IS 'When to auto-publish this post (if auto_publish is true)';
COMMENT ON COLUMN blog_posts.auto_publish IS 'Whether to automatically publish at scheduled_for time';
COMMENT ON COLUMN blog_posts.published_at IS 'Actual publication timestamp (for sorting and display)';
COMMENT ON FUNCTION auto_publish_scheduled_posts() IS 'Publishes all posts scheduled for now or earlier';
COMMENT ON FUNCTION get_posts_ready_to_publish() IS 'Returns list of posts ready to be auto-published';

COMMIT;

