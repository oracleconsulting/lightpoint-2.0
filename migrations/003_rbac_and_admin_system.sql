-- ============================================
-- LIGHTPOINT V2.0 - ROLE-BASED ACCESS CONTROL
-- Migration: Add RBAC with Super Admin, Admin, and User Roles
-- Date: 2024-11-22
-- ============================================

-- ============================================
-- 1. USER ROLES TABLE
-- ============================================

CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'user');

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  
  -- Permissions
  can_manage_tiers BOOLEAN DEFAULT FALSE,
  can_manage_users BOOLEAN DEFAULT FALSE,
  can_manage_content BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  can_manage_billing BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one role per user
  UNIQUE(user_id)
);

-- Index for fast role lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role) WHERE revoked_at IS NULL;

-- ============================================
-- 2. SUPER ADMIN SETUP
-- ============================================

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid
    AND role = 'super_admin'
    AND revoked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_record RECORD;
BEGIN
  SELECT * INTO user_role_record
  FROM user_roles
  WHERE user_id = user_uuid
  AND revoked_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Super admin has all permissions
  IF user_role_record.role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permissions based on permission_name
  CASE permission_name
    WHEN 'manage_tiers' THEN RETURN user_role_record.can_manage_tiers;
    WHEN 'manage_users' THEN RETURN user_role_record.can_manage_users;
    WHEN 'manage_content' THEN RETURN user_role_record.can_manage_content;
    WHEN 'view_analytics' THEN RETURN user_role_record.can_view_analytics;
    WHEN 'manage_billing' THEN RETURN user_role_record.can_manage_billing;
    ELSE RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on subscription_tiers
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active tiers (for pricing page)
CREATE POLICY "Anyone can view active tiers"
  ON subscription_tiers
  FOR SELECT
  USING (is_visible = TRUE AND is_active = TRUE);

-- Only super admins can manage tiers
CREATE POLICY "Super admins can manage tiers"
  ON subscription_tiers
  FOR ALL
  USING (is_super_admin(auth.uid()));

-- Enable RLS on user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their organization's subscription
CREATE POLICY "Users can view their org subscription"
  ON user_subscriptions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions
  FOR SELECT
  USING (has_permission(auth.uid(), 'manage_users'));

-- Only system can create/update subscriptions (via Stripe webhooks)
CREATE POLICY "System can manage subscriptions"
  ON user_subscriptions
  FOR ALL
  USING (has_permission(auth.uid(), 'manage_billing'));

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own role
CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Super admins can manage all roles
CREATE POLICY "Super admins can manage roles"
  ON user_roles
  FOR ALL
  USING (is_super_admin(auth.uid()));

-- ============================================
-- 4. ADMIN ACTIVITY LOG
-- ============================================

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who did what
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'create_tier', 'update_tier', 'grant_role', etc.
  resource_type TEXT NOT NULL, -- 'tier', 'user', 'subscription', etc.
  resource_id UUID,
  
  -- Details
  changes JSONB, -- Store what changed (before/after)
  metadata JSONB, -- Additional context
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX idx_admin_activity_admin_id ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_activity_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX idx_admin_activity_action ON admin_activity_log(action);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO admin_activity_log (
    admin_id,
    action,
    resource_type,
    resource_id,
    changes,
    metadata
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_changes,
    p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. BLOG POSTS & CONTENT MANAGEMENT
-- ============================================

CREATE TYPE content_type AS ENUM ('blog_post', 'cpd_article', 'worked_example', 'webinar', 'knowledge_base');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS content_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Content Details
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly version of title
  excerpt TEXT, -- Short description for SEO/previews
  content TEXT NOT NULL, -- Full content (markdown/HTML)
  featured_image_url TEXT,
  
  -- Categorization
  content_type content_type NOT NULL,
  status content_status DEFAULT 'draft',
  tags TEXT[], -- e.g., ['HMRC', 'Tax Relief', 'Complaints']
  
  -- Access Control
  required_tier TEXT[], -- NULL = public, ['starter'] = Starter+, etc.
  is_public BOOLEAN DEFAULT FALSE, -- True for blog posts, false for premium content
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- Author
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT, -- Cached for display
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  -- Scheduling
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for content queries
CREATE INDEX idx_content_posts_slug ON content_posts(slug);
CREATE INDEX idx_content_posts_type ON content_posts(content_type);
CREATE INDEX idx_content_posts_status ON content_posts(status);
CREATE INDEX idx_content_posts_published_at ON content_posts(published_at DESC);
CREATE INDEX idx_content_posts_tags ON content_posts USING gin(tags);

-- Enable RLS on content_posts
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

-- Public content is viewable by everyone
CREATE POLICY "Public content is visible to all"
  ON content_posts
  FOR SELECT
  USING (is_public = TRUE AND status = 'published');

-- Premium content requires subscription
CREATE POLICY "Premium content requires subscription"
  ON content_posts
  FOR SELECT
  USING (
    status = 'published' AND (
      is_public = TRUE OR
      EXISTS (
        SELECT 1 FROM user_subscriptions us
        JOIN subscription_tiers st ON us.tier_id = st.id
        WHERE us.user_id = auth.uid()
        AND us.status = 'active'
        AND (
          content_posts.required_tier IS NULL OR
          st.name = ANY(content_posts.required_tier) OR
          st.name = 'enterprise' -- Enterprise always has access
        )
      )
    )
  );

-- Only admins can create/edit content
CREATE POLICY "Admins can manage content"
  ON content_posts
  FOR ALL
  USING (has_permission(auth.uid(), 'manage_content'));

-- ============================================
-- 6. USER PROFILES (Extended)
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  full_name TEXT,
  company_name TEXT,
  job_title TEXT,
  avatar_url TEXT,
  
  -- Contact
  phone TEXT,
  
  -- Preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  
  -- Features they've used (for analytics)
  features_used TEXT[] DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view/update their own profile
CREATE POLICY "Users manage their own profile"
  ON user_profiles
  FOR ALL
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  USING (has_permission(auth.uid(), 'manage_users'));

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to get user's current tier
CREATE OR REPLACE FUNCTION get_user_tier(user_uuid UUID)
RETURNS TABLE (
  tier_name TEXT,
  tier_id UUID,
  complaints_remaining INTEGER,
  is_trial BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.name,
    st.id,
    (COALESCE((st.features->>'complaints'->>'max_per_month')::INTEGER, 0) - 
     COALESCE(us.complaints_used_this_period, 0)) as complaints_remaining,
    (us.trial_ends_at IS NOT NULL AND us.trial_ends_at > NOW()) as is_trial
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.id
  JOIN organization_members om ON us.organization_id = om.organization_id
  WHERE om.user_id = user_uuid
  AND us.status IN ('trial', 'active')
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access feature
CREATE OR REPLACE FUNCTION can_access_feature(
  user_uuid UUID,
  feature_category TEXT,
  feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  tier_features JSONB;
BEGIN
  SELECT st.features INTO tier_features
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.id
  JOIN organization_members om ON us.organization_id = om.organization_id
  WHERE om.user_id = user_uuid
  AND us.status IN ('trial', 'active')
  LIMIT 1;
  
  IF tier_features IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN COALESCE(
    (tier_features->feature_category->>feature_name)::BOOLEAN,
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. INITIAL DATA
-- ============================================

-- This will be populated when you first run this migration
-- You'll manually grant yourself super_admin role

COMMENT ON TABLE user_roles IS 'Role-based access control for admin features';
COMMENT ON TABLE admin_activity_log IS 'Audit log of all admin actions';
COMMENT ON TABLE content_posts IS 'Blog posts, CPD articles, worked examples, webinars';
COMMENT ON TABLE user_profiles IS 'Extended user profile information';

-- ============================================
-- 9. GRANT YOUR OWN SUPER ADMIN ACCESS
-- ============================================

-- After running this migration, run this query with YOUR user ID:
-- 
-- INSERT INTO user_roles (user_id, role, can_manage_tiers, can_manage_users, can_manage_content, can_view_analytics, can_manage_billing)
-- VALUES (
--   'YOUR_USER_ID_HERE',  -- Replace with your actual Supabase user ID
--   'super_admin',
--   TRUE,
--   TRUE,
--   TRUE,
--   TRUE,
--   TRUE
-- );
--
-- To find your user ID, run:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

