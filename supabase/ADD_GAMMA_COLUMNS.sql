-- ============================================================================
-- ADD GAMMA API INTEGRATION COLUMNS TO BLOG_POSTS
-- ============================================================================
-- Run this in Supabase SQL Editor to add Gamma integration support
-- ============================================================================

-- Add Gamma-related columns to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS gamma_url TEXT,
ADD COLUMN IF NOT EXISTS gamma_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS gamma_generation_id TEXT,
ADD COLUMN IF NOT EXISTS gamma_generated_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN blog_posts.gamma_url IS 'URL to the Gamma-generated visual version of the blog post';
COMMENT ON COLUMN blog_posts.gamma_pdf_url IS 'URL to the PDF export of the Gamma presentation';
COMMENT ON COLUMN blog_posts.gamma_generation_id IS 'Gamma API generation ID for tracking/regeneration';
COMMENT ON COLUMN blog_posts.gamma_generated_at IS 'Timestamp when the Gamma version was generated';

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_gamma_url ON blog_posts(gamma_url) WHERE gamma_url IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that columns were added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
  AND column_name LIKE 'gamma_%'
ORDER BY column_name;

