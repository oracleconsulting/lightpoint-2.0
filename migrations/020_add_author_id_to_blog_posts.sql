-- Migration 020: Add author_id column to blog_posts table
-- This column links blog posts to lightpoint_users table

-- Add author_id column (nullable, as existing posts don't have it)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);

-- Make status column if it doesn't exist (for scheduled publishing)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled'));

-- Make scheduled_for column if it doesn't exist
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Make auto_publish column if it doesn't exist
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT false;

-- Update the index for published posts to use status
DROP INDEX IF EXISTS idx_blog_posts_published;
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status, published_at DESC);

-- Add seo_title and seo_description if not exists (aliases for meta_title/description)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS seo_title TEXT;

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Backfill seo_title and seo_description from existing meta fields
UPDATE blog_posts
SET seo_title = meta_title
WHERE seo_title IS NULL AND meta_title IS NOT NULL;

UPDATE blog_posts
SET seo_description = meta_description
WHERE seo_description IS NULL AND meta_description IS NOT NULL;

-- Update status based on is_published
UPDATE blog_posts
SET status = CASE
  WHEN is_published THEN 'published'
  ELSE 'draft'
END
WHERE status = 'draft';

