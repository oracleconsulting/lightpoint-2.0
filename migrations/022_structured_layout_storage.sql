-- Migration 022: Add Structured Layout Storage
-- Allows blog posts to store AI-generated layouts as structured JSON

-- Add structured_layout column to blog_posts
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS structured_layout JSONB DEFAULT NULL;

-- Add layout_type to track how the post was created
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS layout_type TEXT DEFAULT 'rich_text' CHECK (layout_type IN ('rich_text', 'ai_generated', 'template', 'hybrid'));

-- Create index for faster layout queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_layout_type ON blog_posts(layout_type);
CREATE INDEX IF NOT EXISTS idx_blog_posts_structured_layout ON blog_posts USING GIN (structured_layout);

-- Create table for AI generation history (optional, for tracking)
CREATE TABLE IF NOT EXISTS blog_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  
  -- Input data
  prompt TEXT,
  content_input TEXT,
  
  -- Generation params
  model_used TEXT, -- 'claude-3.5-sonnet', 'gpt-4o', etc.
  temperature DECIMAL(3,2),
  
  -- Output
  layout_generated JSONB,
  images_generated TEXT[], -- Array of image URLs
  charts_generated JSONB,
  
  -- Metadata
  generation_time_ms INTEGER,
  tokens_used INTEGER,
  cost_estimate DECIMAL(10,4),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_history_post ON blog_generation_history(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_model ON blog_generation_history(model_used);

COMMENT ON TABLE blog_generation_history IS 'Tracks all AI blog generation attempts for analytics and debugging';
COMMENT ON COLUMN blog_posts.structured_layout IS 'Structured JSON layout for AI-generated or template-based posts';
COMMENT ON COLUMN blog_posts.layout_type IS 'How the post was created: rich_text (manual), ai_generated (full AI), template (pre-built), hybrid (mix)';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
