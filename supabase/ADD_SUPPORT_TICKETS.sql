-- ============================================================================
-- SUPPORT TICKET SYSTEM FOR PILOT USERS
-- ============================================================================
-- Allows pilot users to raise issues/tickets with Lightpoint support
-- ============================================================================

-- Step 1: Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who raised the ticket
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES lightpoint_users(id),
  
  -- Ticket details
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'general',
    'bug_report',
    'feature_request',
    'letter_quality',
    'upload_issue',
    'account_issue',
    'other'
  )),
  
  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES lightpoint_users(id),
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create ticket_messages table for conversation
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  
  -- Message details
  sender_id UUID NOT NULL REFERENCES lightpoint_users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL,
  
  -- Optional attachments (store as JSON array of URLs)
  attachments JSONB DEFAULT '[]',
  
  -- Read status
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_org ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON support_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender ON ticket_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON ticket_messages(created_at);

-- Step 4: Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies for support_tickets
-- Users can view their org's tickets
DROP POLICY IF EXISTS "Users can view org tickets" ON support_tickets;
CREATE POLICY "Users can view org tickets" ON support_tickets
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM lightpoint_users WHERE id = auth.uid()
    )
  );

-- Users can create tickets for their org
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM lightpoint_users WHERE id = auth.uid()
    )
  );

-- Superadmins can view all tickets
DROP POLICY IF EXISTS "Superadmins can view all tickets" ON support_tickets;
CREATE POLICY "Superadmins can view all tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin' 
      AND revoked_at IS NULL
    )
  );

-- Superadmins can update all tickets
DROP POLICY IF EXISTS "Superadmins can update all tickets" ON support_tickets;
CREATE POLICY "Superadmins can update all tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin' 
      AND revoked_at IS NULL
    )
  );

-- Step 6: RLS Policies for ticket_messages
-- Users can view messages on their org's tickets
DROP POLICY IF EXISTS "Users can view ticket messages" ON ticket_messages;
CREATE POLICY "Users can view ticket messages" ON ticket_messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE organization_id IN (
        SELECT organization_id FROM lightpoint_users WHERE id = auth.uid()
      )
    )
  );

-- Users can add messages to their org's tickets
DROP POLICY IF EXISTS "Users can add messages" ON ticket_messages;
CREATE POLICY "Users can add messages" ON ticket_messages
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE organization_id IN (
        SELECT organization_id FROM lightpoint_users WHERE id = auth.uid()
      )
    )
  );

-- Superadmins can view all messages
DROP POLICY IF EXISTS "Superadmins can view all messages" ON ticket_messages;
CREATE POLICY "Superadmins can view all messages" ON ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin' 
      AND revoked_at IS NULL
    )
  );

-- Superadmins can add messages to any ticket
DROP POLICY IF EXISTS "Superadmins can add messages" ON ticket_messages;
CREATE POLICY "Superadmins can add messages" ON ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin' 
      AND revoked_at IS NULL
    )
  );

-- Step 7: Function to get unread ticket count for admin
CREATE OR REPLACE FUNCTION get_unread_ticket_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM support_tickets
  WHERE status IN ('open', 'waiting_response')
    AND updated_at > NOW() - INTERVAL '24 hours';
$$ LANGUAGE SQL SECURITY DEFINER;

-- Step 8: Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ticket_timestamp ON support_tickets;
CREATE TRIGGER update_ticket_timestamp
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_ticket_timestamp();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'support_tickets table' as check,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') as exists;

SELECT 'ticket_messages table' as check,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_messages') as exists;

SELECT '✅ Support ticket system ready!' as status;

