-- Migration 021: Blog Post Templates
-- Allows users to select from pre-built professional templates when creating blog posts

-- Create blog_templates table
CREATE TABLE IF NOT EXISTS blog_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'general', -- 'general', 'data-heavy', 'visual', 'guide', etc.
  
  -- Template structure stored as JSON
  -- Contains sections with type, props, and default content
  structure JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Default styling/theme for this template
  theme JSONB DEFAULT '{
    "primary_color": "#2563eb",
    "background": "white",
    "font": "Inter"
  }'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blog_templates_category ON blog_templates(category);
CREATE INDEX IF NOT EXISTS idx_blog_templates_active ON blog_templates(is_active);

-- Seed with initial templates

-- Template 1: Classic Article (Simple, text-focused)
INSERT INTO blog_templates (name, slug, description, thumbnail_url, category, structure) VALUES (
  'Classic Article',
  'classic-article',
  'Clean, text-focused layout perfect for in-depth articles and guides',
  '/templates/classic-article.png',
  'general',
  '[
    {
      "type": "hero",
      "props": {
        "showImage": true,
        "imagePosition": "top",
        "height": "medium"
      }
    },
    {
      "type": "text",
      "props": {
        "columns": 1
      }
    },
    {
      "type": "callout",
      "props": {
        "style": "info",
        "icon": "lightbulb"
      }
    },
    {
      "type": "text",
      "props": {
        "columns": 1
      }
    }
  ]'::jsonb
);

-- Template 2: Data Story (Like your Gamma example)
INSERT INTO blog_templates (name, slug, description, thumbnail_url, category, structure, theme) VALUES (
  'Data Story',
  'data-story',
  'Rich data visualizations with charts, statistics, and infographics',
  '/templates/data-story.png',
  'data-heavy',
  '[
    {
      "type": "hero",
      "props": {
        "showImage": true,
        "imagePosition": "background",
        "height": "large",
        "overlay": true
      }
    },
    {
      "type": "stats_grid",
      "props": {
        "columns": 4,
        "style": "cards"
      }
    },
    {
      "type": "text",
      "props": {
        "columns": 1
      }
    },
    {
      "type": "chart",
      "props": {
        "type": "bar",
        "height": "medium"
      }
    },
    {
      "type": "two_column",
      "props": {
        "leftWidth": 60,
        "rightWidth": 40
      }
    },
    {
      "type": "table",
      "props": {
        "style": "bordered"
      }
    },
    {
      "type": "callout",
      "props": {
        "style": "highlight",
        "size": "large"
      }
    }
  ]'::jsonb,
  '{
    "primary_color": "#3b82f6",
    "background": "#0f172a",
    "accent": "#8b5cf6",
    "font": "Inter"
  }'::jsonb
);

-- Template 3: Step-by-Step Guide
INSERT INTO blog_templates (name, slug, description, thumbnail_url, category, structure) VALUES (
  'Step-by-Step Guide',
  'step-by-step-guide',
  'Perfect for tutorials and processes with numbered steps and checkmarks',
  '/templates/step-by-step.png',
  'guide',
  '[
    {
      "type": "hero",
      "props": {
        "showImage": true,
        "imagePosition": "split",
        "height": "medium"
      }
    },
    {
      "type": "numbered_steps",
      "props": {
        "columns": 2,
        "style": "cards"
      }
    },
    {
      "type": "text",
      "props": {
        "columns": 1
      }
    },
    {
      "type": "checklist",
      "props": {
        "style": "boxed"
      }
    }
  ]'::jsonb
);

-- Template 4: Case Study
INSERT INTO blog_templates (name, slug, description, thumbnail_url, category, structure) VALUES (
  'Case Study',
  'case-study',
  'Showcase results with before/after comparisons and outcome metrics',
  '/templates/case-study.png',
  'visual',
  '[
    {
      "type": "hero",
      "props": {
        "showImage": true,
        "imagePosition": "background",
        "height": "large"
      }
    },
    {
      "type": "stats_grid",
      "props": {
        "columns": 3,
        "style": "minimal"
      }
    },
    {
      "type": "text",
      "props": {
        "columns": 1
      }
    },
    {
      "type": "comparison",
      "props": {
        "layout": "side-by-side"
      }
    },
    {
      "type": "text",
      "props": {
        "columns": 1
      }
    },
    {
      "type": "testimonial",
      "props": {
        "style": "quote"
      }
    }
  ]'::jsonb
);

-- Add template_id to blog_posts table
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES blog_templates(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_blog_posts_template_id ON blog_posts(template_id);

COMMENT ON TABLE blog_templates IS 'Pre-built professional blog post templates with structure and styling';
COMMENT ON COLUMN blog_templates.structure IS 'JSON array defining sections, types, and default props for the template';

