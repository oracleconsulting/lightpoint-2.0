-- ============================================
-- LIGHTPOINT V2.0 - STRIPE INTEGRATION
-- Migration: Add Stripe price IDs to subscription tiers
-- Date: 2024-11-22
-- ============================================

-- ============================================
-- 1. ADD STRIPE COLUMNS TO SUBSCRIPTION TIERS
-- ============================================

-- Add Stripe-specific columns
ALTER TABLE subscription_tiers 
ADD COLUMN IF NOT EXISTS stripe_price_id_monthly TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id_annual TEXT,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- ============================================
-- 2. UPDATE EXISTING TIERS WITH STRIPE PRICE IDs
-- ============================================

-- Starter Tier
UPDATE subscription_tiers
SET 
  stripe_price_id_monthly = 'price_1SWIxCRHZdOe1AXg6Jmr93sw',
  stripe_price_id_annual = 'price_1SWIxcRHZdOe1AXgkATqXNYl',
  stripe_product_id = 'prod_TTFSbLSo6fX4R6'
WHERE name = 'Starter';

-- Professional Tier
UPDATE subscription_tiers
SET 
  stripe_price_id_monthly = 'price_1SWIy3RHZdOe1AXgAbuBjFvC',
  stripe_price_id_annual = 'price_1SWIyKRHZdOe1AXgkGZCAay4',
  stripe_product_id = 'prod_TTFSUD14WF9cKX'
WHERE name = 'Professional';

-- Enterprise Tier
UPDATE subscription_tiers
SET 
  stripe_price_id_monthly = 'price_1SWIydRHZdOe1AXg7Ht7Oe2X',
  stripe_price_id_annual = 'price_1SWIyrRHZdOe1AXgu9kGed8f',
  stripe_product_id = 'prod_TTFT5k7YrCxRtW'
WHERE name = 'Enterprise';

-- ============================================
-- 3. ADD STRIPE COLUMNS TO USER SUBSCRIPTIONS
-- ============================================

ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual')),
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Create indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);

-- ============================================
-- 4. CREATE STRIPE EVENTS LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Stripe Event Info
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  
  -- Event Data
  data JSONB NOT NULL,
  
  -- Processing Status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_events_stripe_id ON stripe_events(stripe_event_id);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to get tier by Stripe price ID
CREATE OR REPLACE FUNCTION get_tier_by_price_id(price_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tier_id UUID;
BEGIN
  SELECT id INTO tier_id
  FROM subscription_tiers
  WHERE stripe_price_id_monthly = price_id
     OR stripe_price_id_annual = price_id;
  
  RETURN tier_id;
END;
$$;

-- Function to check if user has active Stripe subscription
CREATE OR REPLACE FUNCTION has_active_stripe_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_subscriptions
    WHERE user_id = user_uuid
      AND status = 'active'
      AND stripe_subscription_id IS NOT NULL
      AND (end_date IS NULL OR end_date > NOW())
  );
END;
$$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tiers have Stripe IDs:
-- SELECT name, stripe_price_id_monthly, stripe_price_id_annual 
-- FROM subscription_tiers;

-- Check columns were added:
-- \d user_subscriptions

-- Check stripe_events table:
-- SELECT COUNT(*) FROM stripe_events;

