-- ============================================
-- LIGHTPOINT V2.0 - WAITLIST SYSTEM
-- Migration: Add waitlist for pre-launch signups
-- Date: 2024-11-22
-- ============================================

-- ============================================
-- 1. WAITLIST TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Contact Info
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  
  -- Interest
  selected_tier_id UUID REFERENCES subscription_tiers(id),
  selected_tier_name TEXT, -- Denormalized for easy viewing
  estimated_complaints_per_month INTEGER,
  
  -- Metadata
  referral_source TEXT, -- 'organic', 'linkedin', 'referral', etc.
  notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'declined')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Timestamps
  signed_up_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(email)
);

-- Indexes
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_signed_up ON waitlist(signed_up_at DESC);
CREATE INDEX idx_waitlist_tier ON waitlist(selected_tier_id);

-- ============================================
-- 2. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Super admins can view/manage all waitlist entries
DROP POLICY IF EXISTS "Super admins can manage waitlist" ON waitlist;
CREATE POLICY "Super admins can manage waitlist"
  ON waitlist
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Public can insert (for signup form)
DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist;
CREATE POLICY "Anyone can join waitlist"
  ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- Function to check if email is already on waitlist
CREATE OR REPLACE FUNCTION is_on_waitlist(email_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM waitlist
    WHERE email = email_address
  );
END;
$$;

-- ============================================
-- 4. AUDIT TRIGGERS
-- ============================================

-- Update contacted_at when status changes to 'contacted'
CREATE OR REPLACE FUNCTION update_waitlist_contacted_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'contacted' AND OLD.status != 'contacted' THEN
    NEW.contacted_at = NOW();
  END IF;
  
  IF NEW.status = 'converted' AND OLD.status != 'converted' THEN
    NEW.converted_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_waitlist_status_update ON waitlist;
CREATE TRIGGER trigger_waitlist_status_update
  BEFORE UPDATE ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_contacted_at();

-- ============================================
-- 5. ADMIN VIEWS (for reporting)
-- ============================================

-- Waitlist summary view
CREATE OR REPLACE VIEW waitlist_summary AS
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE signed_up_at > NOW() - INTERVAL '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE signed_up_at > NOW() - INTERVAL '30 days') as last_30_days
FROM waitlist
GROUP BY status;

-- Waitlist by tier
CREATE OR REPLACE VIEW waitlist_by_tier AS
SELECT 
  selected_tier_name,
  COUNT(*) as signups,
  AVG(estimated_complaints_per_month) as avg_complaints,
  COUNT(*) FILTER (WHERE status = 'converted') as conversions
FROM waitlist
GROUP BY selected_tier_name
ORDER BY signups DESC;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table was created:
-- SELECT * FROM waitlist LIMIT 5;

-- Check summary view:
-- SELECT * FROM waitlist_summary;

-- Check by tier view:
-- SELECT * FROM waitlist_by_tier;

