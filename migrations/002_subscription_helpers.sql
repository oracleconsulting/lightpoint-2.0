-- Additional helper functions for subscription management

-- ============================================
-- INCREMENT COMPLAINT USAGE
-- ============================================

CREATE OR REPLACE FUNCTION increment_complaint_usage(org_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_subscriptions
  SET 
    complaints_used_this_period = complaints_used_this_period + 1,
    updated_at = NOW()
  WHERE organization_id = org_id
    AND status IN ('trial', 'active');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RESET MONTHLY QUOTA (called by Stripe webhook or cron)
-- ============================================

CREATE OR REPLACE FUNCTION reset_monthly_quota(subscription_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Archive current period usage
  INSERT INTO subscription_usage (
    subscription_id,
    period_start,
    period_end,
    complaints_created,
    complaints_completed
  )
  SELECT 
    id,
    last_reset_at,
    NOW(),
    complaints_used_this_period,
    0 -- TODO: Calculate actual completed count
  FROM user_subscriptions
  WHERE id = subscription_id_param;
  
  -- Reset counter
  UPDATE user_subscriptions
  SET 
    complaints_used_this_period = 0,
    last_reset_at = NOW(),
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 month',
    updated_at = NOW()
  WHERE id = subscription_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GET TIER FEATURES AS TEXT (for display)
-- ============================================

CREATE OR REPLACE FUNCTION format_tier_features(tier_id_param UUID)
RETURNS TEXT[] AS $$
DECLARE
  features_json JSONB;
  feature_list TEXT[] := ARRAY[]::TEXT[];
  max_complaints INTEGER;
BEGIN
  SELECT features INTO features_json
  FROM subscription_tiers
  WHERE id = tier_id_param;
  
  -- Extract max complaints
  max_complaints := (features_json->'complaints'->>'max_per_month')::INTEGER;
  IF max_complaints = -1 THEN
    feature_list := array_append(feature_list, 'Unlimited complaints per month');
  ELSE
    feature_list := array_append(feature_list, max_complaints || ' complaints per month');
  END IF;
  
  -- Add other features
  IF (features_json->'complaints'->>'ai_generation')::BOOLEAN THEN
    feature_list := array_append(feature_list, 'AI-powered letter drafting');
  END IF;
  
  IF (features_json->'complaints'->>'precedent_search')::BOOLEAN THEN
    feature_list := array_append(feature_list, 'Precedent search');
  END IF;
  
  IF (features_json->'cpd'->>'access')::BOOLEAN THEN
    feature_list := array_append(feature_list, 'CPD content access');
  END IF;
  
  RETURN feature_list;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CHECK IF SUBSCRIPTION IS NEAR LIMIT
-- ============================================

CREATE OR REPLACE FUNCTION is_near_complaint_limit(org_id UUID, threshold_percentage INTEGER DEFAULT 80)
RETURNS BOOLEAN AS $$
DECLARE
  usage_pct INTEGER;
BEGIN
  SELECT 
    CASE 
      WHEN (t.features->'complaints'->>'max_per_month')::INTEGER = -1 THEN 0
      ELSE (s.complaints_used_this_period * 100) / (t.features->'complaints'->>'max_per_month')::INTEGER
    END INTO usage_pct
  FROM user_subscriptions s
  JOIN subscription_tiers t ON s.tier_id = t.id
  WHERE s.organization_id = org_id
    AND s.status IN ('trial', 'active');
  
  RETURN usage_pct >= threshold_percentage;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION increment_complaint_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_feature_access(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_subscription(UUID) TO authenticated;

