-- ============================================
-- LIGHTPOINT V2.0 - CONTENT SYSTEM FOUNDATION
-- Migration: Create all content tables with rich media support
-- Date: 2024-11-22
-- ============================================

-- =====================================
-- CPD ARTICLES TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS cpd_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL, -- Rich text (Markdown or HTML)
  
  -- Media
  featured_image_url TEXT,
  featured_image_alt TEXT,
  
  -- Access Control
  tier_access TEXT NOT NULL DEFAULT 'free' CHECK (tier_access IN ('free', 'starter', 'professional', 'enterprise')),
  
  -- Organization
  category TEXT,
  tags TEXT[], -- Array of tags
  
  -- CPD Specific
  cpd_hours DECIMAL(4,2) DEFAULT 0, -- e.g., 0.5 hours
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  og_image_url TEXT,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  author TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cpd_articles_slug ON cpd_articles(slug);
CREATE INDEX IF NOT EXISTS idx_cpd_articles_tier ON cpd_articles(tier_access);
CREATE INDEX IF NOT EXISTS idx_cpd_articles_published ON cpd_articles(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_cpd_articles_category ON cpd_articles(category);
CREATE INDEX IF NOT EXISTS idx_cpd_articles_tags ON cpd_articles USING GIN(tags);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_cpd_articles_search ON cpd_articles 
  USING GIN(to_tsvector('english', title || ' ' || excerpt || ' ' || COALESCE(content, '')));

-- =====================================
-- BLOG POSTS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL, -- Rich text with images, embeds, etc.
  
  -- Media
  featured_image_url TEXT,
  featured_image_alt TEXT,
  
  -- Organization
  category TEXT,
  tags TEXT[],
  
  -- Author
  author TEXT NOT NULL,
  author_bio TEXT,
  author_avatar_url TEXT,
  
  -- SEO (Critical for blog!)
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  twitter_card TEXT DEFAULT 'summary_large_image',
  canonical_url TEXT,
  
  -- Schema.org structured data
  schema_type TEXT DEFAULT 'BlogPosting',
  schema_data JSONB,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER, -- Calculated from content length
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts 
  USING GIN(to_tsvector('english', title || ' ' || excerpt || ' ' || COALESCE(content, '')));

-- =====================================
-- WEBINARS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  
  -- Speaker
  speaker_name TEXT NOT NULL,
  speaker_bio TEXT,
  speaker_avatar_url TEXT,
  
  -- Scheduling
  duration_minutes INTEGER,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  
  -- Access Control
  tier_access TEXT NOT NULL DEFAULT 'free' CHECK (tier_access IN ('free', 'starter', 'professional', 'enterprise')),
  
  -- Webinar Type & Status
  webinar_type TEXT NOT NULL CHECK (webinar_type IN ('live', 'recorded', 'hybrid')),
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  
  -- Video Hosting
  recording_url TEXT, -- YouTube, Vimeo, or custom CDN
  video_platform TEXT CHECK (video_platform IN ('youtube', 'vimeo', 'mux', 'cloudflare_stream', 'custom')),
  video_id TEXT, -- Platform-specific video ID
  
  -- Live Streaming
  stream_url TEXT, -- RTMP or HLS stream URL
  stream_key TEXT, -- For broadcasting (encrypted)
  chat_enabled BOOLEAN DEFAULT true,
  
  -- Registration
  requires_registration BOOLEAN DEFAULT true,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  
  -- Media
  thumbnail_url TEXT,
  
  -- Resources
  slides_url TEXT,
  resources JSONB, -- Additional materials, links, etc.
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webinars_slug ON webinars(slug);
CREATE INDEX IF NOT EXISTS idx_webinars_status ON webinars(status);
CREATE INDEX IF NOT EXISTS idx_webinars_type ON webinars(webinar_type);
CREATE INDEX IF NOT EXISTS idx_webinars_scheduled ON webinars(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_webinars_tier ON webinars(tier_access);

-- =====================================
-- WORKED EXAMPLES TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS worked_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  
  -- Content Sections
  background TEXT NOT NULL,
  actions_taken TEXT NOT NULL,
  outcome TEXT NOT NULL,
  lessons_learned TEXT NOT NULL,
  
  -- Media
  featured_image_url TEXT,
  
  -- Classification
  tier_access TEXT NOT NULL DEFAULT 'professional' CHECK (tier_access IN ('free', 'starter', 'professional', 'enterprise')),
  category TEXT NOT NULL, -- e.g., 'penalty_appeals', 'delays', 'incorrect_advice'
  complexity TEXT CHECK (complexity IN ('simple', 'intermediate', 'complex')),
  
  -- Metrics
  fee_recovery_amount INTEGER, -- In pence (£12,000 = 1200000)
  duration_days INTEGER,
  
  -- Organization
  tags TEXT[],
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_worked_examples_slug ON worked_examples(slug);
CREATE INDEX IF NOT EXISTS idx_worked_examples_category ON worked_examples(category);
CREATE INDEX IF NOT EXISTS idx_worked_examples_tier ON worked_examples(tier_access);
CREATE INDEX IF NOT EXISTS idx_worked_examples_published ON worked_examples(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_worked_examples_tags ON worked_examples USING GIN(tags);

-- =====================================
-- MEDIA LIBRARY TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- File Info
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE, -- Storage path (Supabase Storage or S3)
  file_url TEXT NOT NULL, -- Public URL
  
  -- File Details
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'audio', 'other')),
  
  -- Image-specific
  width INTEGER,
  height INTEGER,
  thumbnail_url TEXT,
  
  -- Video-specific
  duration_seconds INTEGER,
  video_codec TEXT,
  
  -- Metadata
  alt_text TEXT,
  caption TEXT,
  title TEXT,
  
  -- Organization
  folder TEXT DEFAULT 'uploads',
  tags TEXT[],
  
  -- Ownership
  uploaded_by UUID REFERENCES auth.users(id),
  
  -- Usage Tracking
  used_in_content TEXT[], -- Array of content IDs where this media is used
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_library_type ON media_library(file_type);
CREATE INDEX IF NOT EXISTS idx_media_library_folder ON media_library(folder);
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_library_tags ON media_library USING GIN(tags);

-- =====================================
-- WEBINAR REGISTRATIONS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Guest Registration (for non-users)
  guest_email TEXT,
  guest_name TEXT,
  guest_company TEXT,
  
  -- Registration Details
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMP WITH TIME ZONE,
  
  -- Communication
  reminder_sent BOOLEAN DEFAULT false,
  recording_sent BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT registration_user_or_guest CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_webinar ON webinar_registrations(webinar_id);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_user ON webinar_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_email ON webinar_registrations(guest_email);

-- =====================================
-- ROW-LEVEL SECURITY (RLS)
-- =====================================

-- Enable RLS on all tables
ALTER TABLE cpd_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE worked_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_registrations ENABLE ROW LEVEL SECURITY;

-- CPD Articles: Public can view published, admins can do anything
CREATE POLICY "Public can view published CPD articles"
  ON cpd_articles FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Admins can manage CPD articles"
  ON cpd_articles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Blog Posts: Same pattern
CREATE POLICY "Public can view published blog posts"
  ON blog_posts FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Admins can manage blog posts"
  ON blog_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Webinars: Same pattern
CREATE POLICY "Public can view published webinars"
  ON webinars FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Admins can manage webinars"
  ON webinars FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Worked Examples: Same pattern
CREATE POLICY "Public can view published examples"
  ON worked_examples FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Admins can manage examples"
  ON worked_examples FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Media Library: Admins only
CREATE POLICY "Admins can manage media"
  ON media_library FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Webinar Registrations: Users can view their own, admins can view all
CREATE POLICY "Users can view their registrations"
  ON webinar_registrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create registrations"
  ON webinar_registrations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage registrations"
  ON webinar_registrations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- =====================================
-- HELPER FUNCTIONS
-- =====================================

-- Auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate read time from content
CREATE OR REPLACE FUNCTION calculate_read_time(content TEXT)
RETURNS INTEGER AS $$
DECLARE
  word_count INTEGER;
  words_per_minute INTEGER := 200; -- Average reading speed
BEGIN
  word_count := array_length(regexp_split_to_array(content, '\s+'), 1);
  RETURN GREATEST(1, CEIL(word_count::DECIMAL / words_per_minute));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_cpd_articles_updated_at BEFORE UPDATE ON cpd_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webinars_updated_at BEFORE UPDATE ON webinars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worked_examples_updated_at BEFORE UPDATE ON worked_examples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_library_updated_at BEFORE UPDATE ON media_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate read time for blog posts
CREATE OR REPLACE FUNCTION auto_calculate_read_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS NOT NULL THEN
    NEW.read_time_minutes := calculate_read_time(NEW.content);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_auto_read_time BEFORE INSERT OR UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION auto_calculate_read_time();

-- =====================================
-- VIEWS FOR EASIER QUERYING
-- =====================================

-- Published content view (for public display)
CREATE OR REPLACE VIEW published_cpd_articles AS
SELECT * FROM cpd_articles WHERE is_published = true ORDER BY published_at DESC;

CREATE OR REPLACE VIEW published_blog_posts AS
SELECT * FROM blog_posts WHERE is_published = true ORDER BY published_at DESC;

CREATE OR REPLACE VIEW published_webinars AS
SELECT * FROM webinars WHERE is_published = true ORDER BY scheduled_date DESC;

CREATE OR REPLACE VIEW published_examples AS
SELECT * FROM worked_examples WHERE is_published = true ORDER BY published_at DESC;

-- Upcoming webinars
CREATE OR REPLACE VIEW upcoming_webinars AS
SELECT * FROM webinars 
WHERE is_published = true 
  AND status = 'upcoming' 
  AND scheduled_date > NOW()
ORDER BY scheduled_date ASC;

-- =====================================
-- COMMENTS
-- =====================================
COMMENT ON TABLE cpd_articles IS 'Educational articles for CPD (Continuing Professional Development)';
COMMENT ON TABLE blog_posts IS 'Blog posts with full SEO support and rich media';
COMMENT ON TABLE webinars IS 'Live and recorded webinar sessions with streaming support';
COMMENT ON TABLE worked_examples IS 'Real-world case studies and examples';
COMMENT ON TABLE media_library IS 'Centralized media storage for images, videos, and documents';
COMMENT ON TABLE webinar_registrations IS 'Tracks user registrations for webinars';

-- Done!
SELECT 'Content system tables created successfully!' as status;

