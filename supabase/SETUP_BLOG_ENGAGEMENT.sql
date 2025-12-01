-- ============================================================================
-- Blog Engagement System: Comments & Likes
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Blog Comments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    
    -- Author info (can be authenticated user or guest)
    user_id UUID, -- Optional reference to auth.users
    author_name TEXT NOT NULL,
    author_email TEXT, -- Optional for notifications
    
    -- Content
    content TEXT NOT NULL,
    
    -- Reply threading (optional)
    parent_comment_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
    
    -- Moderation
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON public.blog_comments(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON public.blog_comments(status);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON public.blog_comments(parent_comment_id);

-- ============================================================================
-- 2. Blog Likes Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blog_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    
    -- User info (can track by user_id or fingerprint for anonymous)
    user_id UUID, -- Optional reference to auth.users
    fingerprint TEXT, -- For anonymous like tracking (browser fingerprint or IP hash)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate likes
    UNIQUE(blog_post_id, user_id),
    UNIQUE(blog_post_id, fingerprint)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id ON public.blog_likes(blog_post_id);

-- ============================================================================
-- 3. Add like_count column to blog_posts if not exists
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'like_count'
    ) THEN
        ALTER TABLE public.blog_posts ADD COLUMN like_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'comment_count'
    ) THEN
        ALTER TABLE public.blog_posts ADD COLUMN comment_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================================
-- 4. RPC Functions
-- ============================================================================

-- Function to add a like
CREATE OR REPLACE FUNCTION public.toggle_blog_like(
    p_post_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_like UUID;
    v_new_count INTEGER;
    v_action TEXT;
BEGIN
    -- Check if like already exists
    IF p_user_id IS NOT NULL THEN
        SELECT id INTO v_existing_like 
        FROM public.blog_likes 
        WHERE blog_post_id = p_post_id AND user_id = p_user_id;
    ELSIF p_fingerprint IS NOT NULL THEN
        SELECT id INTO v_existing_like 
        FROM public.blog_likes 
        WHERE blog_post_id = p_post_id AND fingerprint = p_fingerprint;
    END IF;
    
    IF v_existing_like IS NOT NULL THEN
        -- Unlike: remove the like
        DELETE FROM public.blog_likes WHERE id = v_existing_like;
        UPDATE public.blog_posts 
        SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1)
        WHERE id = p_post_id
        RETURNING like_count INTO v_new_count;
        v_action := 'unliked';
    ELSE
        -- Like: add the like
        INSERT INTO public.blog_likes (blog_post_id, user_id, fingerprint)
        VALUES (p_post_id, p_user_id, p_fingerprint);
        UPDATE public.blog_posts 
        SET like_count = COALESCE(like_count, 0) + 1
        WHERE id = p_post_id
        RETURNING like_count INTO v_new_count;
        v_action := 'liked';
    END IF;
    
    RETURN jsonb_build_object(
        'action', v_action,
        'like_count', COALESCE(v_new_count, 0)
    );
END;
$$;

-- Function to check if user has liked a post
CREATE OR REPLACE FUNCTION public.check_blog_like(
    p_post_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_fingerprint TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_user_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.blog_likes 
            WHERE blog_post_id = p_post_id AND user_id = p_user_id
        );
    ELSIF p_fingerprint IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.blog_likes 
            WHERE blog_post_id = p_post_id AND fingerprint = p_fingerprint
        );
    END IF;
    RETURN FALSE;
END;
$$;

-- Function to add a comment
CREATE OR REPLACE FUNCTION public.add_blog_comment(
    p_post_id UUID,
    p_author_name TEXT,
    p_content TEXT,
    p_author_email TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_parent_comment_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comment_id UUID;
BEGIN
    INSERT INTO public.blog_comments (
        blog_post_id,
        user_id,
        author_name,
        author_email,
        content,
        parent_comment_id,
        status
    )
    VALUES (
        p_post_id,
        p_user_id,
        p_author_name,
        p_author_email,
        p_content,
        p_parent_comment_id,
        'approved' -- Auto-approve for now, can change to 'pending' for moderation
    )
    RETURNING id INTO v_comment_id;
    
    -- Update comment count
    UPDATE public.blog_posts 
    SET comment_count = COALESCE(comment_count, 0) + 1
    WHERE id = p_post_id;
    
    RETURN v_comment_id;
END;
$$;

-- Function to get comments for a post
CREATE OR REPLACE FUNCTION public.get_blog_comments(p_post_id UUID)
RETURNS TABLE (
    id UUID,
    author_name TEXT,
    content TEXT,
    is_featured BOOLEAN,
    parent_comment_id UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.author_name,
        c.content,
        c.is_featured,
        c.parent_comment_id,
        c.created_at
    FROM public.blog_comments c
    WHERE c.blog_post_id = p_post_id
      AND c.status = 'approved'
    ORDER BY c.is_featured DESC, c.created_at ASC;
END;
$$;

-- ============================================================================
-- 5. Row Level Security
-- ============================================================================

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

-- Comments: Anyone can read approved comments
DROP POLICY IF EXISTS "Anyone can read approved comments" ON public.blog_comments;
CREATE POLICY "Anyone can read approved comments"
ON public.blog_comments FOR SELECT
USING (status = 'approved');

-- Comments: Anyone can insert comments (will need approval)
DROP POLICY IF EXISTS "Anyone can add comments" ON public.blog_comments;
CREATE POLICY "Anyone can add comments"
ON public.blog_comments FOR INSERT
WITH CHECK (true);

-- Comments: Admins can manage all comments
DROP POLICY IF EXISTS "Admins can manage comments" ON public.blog_comments;
CREATE POLICY "Admins can manage comments"
ON public.blog_comments FOR ALL
USING (true); -- Allow all for now, can add admin check later

-- Likes: Anyone can read likes
DROP POLICY IF EXISTS "Anyone can read likes" ON public.blog_likes;
CREATE POLICY "Anyone can read likes"
ON public.blog_likes FOR SELECT
USING (true);

-- Likes: Anyone can add/remove likes
DROP POLICY IF EXISTS "Anyone can toggle likes" ON public.blog_likes;
CREATE POLICY "Anyone can toggle likes"
ON public.blog_likes FOR ALL
USING (true);

-- ============================================================================
-- 6. Verify Setup
-- ============================================================================

SELECT 'blog_comments table' as item, COUNT(*) as count FROM public.blog_comments
UNION ALL
SELECT 'blog_likes table' as item, COUNT(*) as count FROM public.blog_likes;

