-- ============================================
-- LIGHTPOINT V2.0 - SUBSCRIPTION SYSTEM
-- Migration: Add Tier-Based Subscription System
-- Date: 2024-11-21
-- ============================================

-- ============================================
-- 1. SUBSCRIPTION TIERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  name TEXT UNIQUE NOT NULL, -- 'starter', 'professional', 'enterprise'
  display_name TEXT NOT NULL, -- 'Starter', 'Professional', 'Enterprise'
  description TEXT,
  tagline TEXT, -- 'Perfect for solo practitioners'
  
  -- Pricing (stored in pence to avoid floating point issues)
  monthly_price INTEGER NOT NULL, -- 9900 = £99.00
  annual_price INTEGER NOT NULL, -- 99000 = £990.00
  currency TEXT DEFAULT 'GBP',
  
  -- Display
  is_popular BOOLEAN DEFAULT FALSE, -- "Most Popular" badge
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  color_theme TEXT DEFAULT '#1e40af', -- For UI theming
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE, -- Hide without deleting
  
  -- Feature Flags (JSONB for ultimate flexibility)
  features JSONB DEFAULT '{}'::jsonb,
  /**
   * Example structure:
   * {
   *   "complaints": {
   *     "max_per_month": 5,
   *     "max_active": 10,
   *     "templates_access": true,
   *     "ai_generation": true,
   *     "precedent_search": false
   *   },
   *   "analysis": {
   *     "success_prediction": false,
   *     "roi_calculator": true,
   *     "charter_detection": true,
   *     "advanced_analytics": false
   *   },
   *   "cpd": {
   *     "access": true,
   *     "certification": false,
   *     "worked_examples": true,
   *     "webinar_access": "recorded"
   *   },
   *   "collaboration": {
   *     "team_members": 1,
   *     "client_portal": false,
   *     "white_label": false
   *   },
   *   "support": {
   *     "level": "email",
   *     "response_time": "48h"
   *   },
   *   "advanced": {
   *     "api_access": false,
   *     "custom_integrations": false,
   *     "bulk_operations": false,
   *     "export_capabilities": true
   *   }
   * }
   */
  
  -- Stripe Integration
  stripe_product_id TEXT,
  stripe_monthly_price_id TEXT,
  stripe_annual_price_id TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES lightpoint_users(id),
  updated_by UUID REFERENCES lightpoint_users(id)
);

-- Indexes
CREATE INDEX idx_tiers_active ON subscription_tiers(is_active);
CREATE INDEX idx_tiers_visible ON subscription_tiers(is_visible);
CREATE INDEX idx_tiers_sort ON subscription_tiers(sort_order);

-- Updated trigger
CREATE OR REPLACE FUNCTION update_subscription_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_tiers_updated_at();


-- ============================================
-- 2. USER SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
  
  -- Billing
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'annual')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  
  -- Trial
  trial_ends_at TIMESTAMPTZ,
  trial_used BOOLEAN DEFAULT FALSE,
  
  -- Usage Tracking
  complaints_used_this_period INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Stripe
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_org_subscription UNIQUE (organization_id)
);

-- Indexes
CREATE INDEX idx_subscriptions_org ON user_subscriptions(organization_id);
CREATE INDEX idx_subscriptions_tier ON user_subscriptions(tier_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_period_end ON user_subscriptions(current_period_end);

-- Updated trigger
CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_tiers_updated_at();


-- ============================================
-- 3. SUBSCRIPTION USAGE HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  
  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Complaints
  complaints_created INTEGER DEFAULT 0,
  complaints_completed INTEGER DEFAULT 0,
  
  -- AI Usage
  ai_generations_used INTEGER DEFAULT 0,
  precedent_searches_used INTEGER DEFAULT 0,
  
  -- Feature Usage (flexible JSONB)
  features_used JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_subscription_period UNIQUE (subscription_id, period_start)
);

CREATE INDEX idx_usage_subscription ON subscription_usage(subscription_id);
CREATE INDEX idx_usage_period ON subscription_usage(period_start, period_end);


-- ============================================
-- 4. SUBSCRIPTION CHANGE LOG
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  
  -- Change details
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'upgraded', 'downgraded', 'renewed', 'canceled', 'expired')),
  from_tier_id UUID REFERENCES subscription_tiers(id),
  to_tier_id UUID REFERENCES subscription_tiers(id),
  
  -- Reason
  reason TEXT,
  notes TEXT,
  
  -- Effective date
  effective_at TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES lightpoint_users(id)
);

CREATE INDEX idx_changes_subscription ON subscription_changes(subscription_id);
CREATE INDEX idx_changes_type ON subscription_changes(change_type);
CREATE INDEX idx_changes_effective ON subscription_changes(effective_at);


-- ============================================
-- 5. INSERT DEFAULT TIERS
-- ============================================

-- Starter Tier
INSERT INTO subscription_tiers (
  name, display_name, description, tagline,
  monthly_price, annual_price,
  is_popular, sort_order, color_theme,
  features
) VALUES (
  'starter',
  'Starter',
  'Perfect for solo practitioners handling occasional complaints',
  'Get started with essential complaint management',
  9900, -- £99/month
  99000, -- £990/year (2 months free)
  FALSE,
  1,
  '#64748b',
  '{
    "complaints": {
      "max_per_month": 5,
      "max_active": 10,
      "templates_access": true,
      "ai_generation": true,
      "precedent_search": false
    },
    "analysis": {
      "success_prediction": false,
      "roi_calculator": true,
      "charter_detection": true,
      "advanced_analytics": false
    },
    "cpd": {
      "access": true,
      "certification": false,
      "worked_examples": true,
      "webinar_access": "recorded"
    },
    "collaboration": {
      "team_members": 1,
      "client_portal": false,
      "white_label": false
    },
    "support": {
      "level": "email",
      "response_time": "48h"
    },
    "advanced": {
      "api_access": false,
      "custom_integrations": false,
      "bulk_operations": false,
      "export_capabilities": true
    }
  }'::jsonb
);

-- Professional Tier (Most Popular)
INSERT INTO subscription_tiers (
  name, display_name, description, tagline,
  monthly_price, annual_price,
  is_popular, sort_order, color_theme,
  features
) VALUES (
  'professional',
  'Professional',
  'For growing practices managing multiple complaints monthly',
  'Everything you need to scale your complaints practice',
  29900, -- £299/month
  299000, -- £2,990/year (2 months free)
  TRUE,
  2,
  '#1e40af',
  '{
    "complaints": {
      "max_per_month": 20,
      "max_active": 50,
      "templates_access": true,
      "ai_generation": true,
      "precedent_search": true
    },
    "analysis": {
      "success_prediction": true,
      "roi_calculator": true,
      "charter_detection": true,
      "advanced_analytics": true
    },
    "cpd": {
      "access": true,
      "certification": true,
      "worked_examples": true,
      "webinar_access": "live"
    },
    "collaboration": {
      "team_members": 5,
      "client_portal": true,
      "white_label": true
    },
    "support": {
      "level": "priority",
      "response_time": "24h"
    },
    "advanced": {
      "api_access": false,
      "custom_integrations": false,
      "bulk_operations": true,
      "export_capabilities": true
    }
  }'::jsonb
);

-- Enterprise Tier
INSERT INTO subscription_tiers (
  name, display_name, description, tagline,
  monthly_price, annual_price,
  is_popular, sort_order, color_theme,
  features
) VALUES (
  'enterprise',
  'Enterprise',
  'For large firms requiring unlimited complaints and advanced features',
  'Complete platform access with dedicated support',
  99900, -- £999/month
  999000, -- £9,990/year (2 months free)
  FALSE,
  3,
  '#0f172a',
  '{
    "complaints": {
      "max_per_month": -1,
      "max_active": -1,
      "templates_access": true,
      "ai_generation": true,
      "precedent_search": true
    },
    "analysis": {
      "success_prediction": true,
      "roi_calculator": true,
      "charter_detection": true,
      "advanced_analytics": true
    },
    "cpd": {
      "access": true,
      "certification": true,
      "worked_examples": true,
      "webinar_access": "live"
    },
    "collaboration": {
      "team_members": -1,
      "client_portal": true,
      "white_label": true
    },
    "support": {
      "level": "dedicated",
      "response_time": "4h"
    },
    "advanced": {
      "api_access": true,
      "custom_integrations": true,
      "bulk_operations": true,
      "export_capabilities": true
    }
  }'::jsonb
);


-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to get active subscription for an organization
CREATE OR REPLACE FUNCTION get_org_subscription(org_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  tier_name TEXT,
  tier_display_name TEXT,
  features JSONB,
  status TEXT,
  complaints_used INTEGER,
  complaints_limit INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    t.name,
    t.display_name,
    t.features,
    s.status,
    s.complaints_used_this_period,
    COALESCE((t.features->'complaints'->>'max_per_month')::INTEGER, 0)
  FROM user_subscriptions s
  JOIN subscription_tiers t ON s.tier_id = t.id
  WHERE s.organization_id = org_id
    AND s.status IN ('trial', 'active')
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if org has feature access
CREATE OR REPLACE FUNCTION has_feature_access(
  org_id UUID,
  feature_path TEXT -- e.g., 'complaints.ai_generation'
)
RETURNS BOOLEAN AS $$
DECLARE
  feature_value TEXT;
BEGIN
  SELECT jsonb_extract_path_text(t.features, variadic string_to_array(feature_path, '.'))
  INTO feature_value
  FROM user_subscriptions s
  JOIN subscription_tiers t ON s.tier_id = t.id
  WHERE s.organization_id = org_id
    AND s.status IN ('trial', 'active')
  LIMIT 1;
  
  RETURN COALESCE(feature_value::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Grant permissions (adjust roles as needed)
GRANT SELECT ON subscription_tiers TO authenticated;
GRANT SELECT ON user_subscriptions TO authenticated;
GRANT SELECT ON subscription_usage TO authenticated;

-- Admin only for tier management
-- GRANT ALL ON subscription_tiers TO admin_role;

COMMENT ON TABLE subscription_tiers IS 'Defines available subscription tiers with flexible feature flags';
COMMENT ON TABLE user_subscriptions IS 'Tracks active subscriptions for each organization';
COMMENT ON TABLE subscription_usage IS 'Historical usage data per billing period';
COMMENT ON TABLE subscription_changes IS 'Audit log of subscription tier changes';

