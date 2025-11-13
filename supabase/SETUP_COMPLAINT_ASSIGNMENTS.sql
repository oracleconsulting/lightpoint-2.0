-- ============================================================================
-- COMPLAINT ASSIGNMENT & USER-SPECIFIC VIEWS
-- ============================================================================
-- Enables complaint assignment with role-based visibility:
-- - Admins/Managers: See ALL complaints
-- - Analysts/Viewers: See only ASSIGNED complaints
-- Run AFTER SETUP_USER_MANAGEMENT.sql
-- ============================================================================

-- ============================================================================
-- 1. ADD ASSIGNMENT UI HELPER VIEW
-- ============================================================================

-- View to get assignable users (active analysts, managers, admins)
CREATE OR REPLACE VIEW assignable_users AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.job_title,
  COUNT(DISTINCT c.id) as current_workload
FROM lightpoint_users u
LEFT JOIN complaints c ON c.assigned_to = u.id AND c.status NOT IN ('closed', 'resolved')
WHERE u.is_active = true
  AND u.role IN ('admin', 'manager', 'analyst')
GROUP BY u.id, u.email, u.full_name, u.role, u.job_title
ORDER BY current_workload ASC, u.full_name ASC;

COMMENT ON VIEW assignable_users IS 'Active users who can be assigned complaints, with current workload';

-- ============================================================================
-- 2. UPDATE COMPLAINTS RLS POLICIES FOR USER-SPECIFIC VISIBILITY
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view complaints in their organization" ON complaints;
DROP POLICY IF EXISTS "Users can insert complaints in their organization" ON complaints;
DROP POLICY IF EXISTS "Users can update complaints in their organization" ON complaints;

-- NEW: Admins/Managers see ALL complaints in their org
-- Analysts/Viewers see only ASSIGNED complaints
CREATE POLICY "Users can view complaints based on role"
  ON complaints FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM lightpoint_users WHERE id = auth.uid())
    AND (
      -- Admins and Managers see everything
      (SELECT role FROM lightpoint_users WHERE id = auth.uid()) IN ('admin', 'manager')
      OR
      -- Analysts and Viewers see only assigned complaints
      assigned_to = auth.uid()
      OR
      -- Creator can see their own complaints
      created_by = auth.uid()
    )
  );

-- Users can insert complaints (will be auto-assigned or manually assigned)
CREATE POLICY "Users can insert complaints in their organization"
  ON complaints FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM lightpoint_users WHERE id = auth.uid())
  );

-- Users can update complaints based on role and assignment
CREATE POLICY "Users can update complaints based on role"
  ON complaints FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM lightpoint_users WHERE id = auth.uid())
    AND (
      -- Admins and Managers can update anything
      (SELECT role FROM lightpoint_users WHERE id = auth.uid()) IN ('admin', 'manager')
      OR
      -- Analysts can update their assigned complaints
      assigned_to = auth.uid()
      OR
      -- Creator can update their own complaints
      created_by = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view complaints based on role" ON complaints IS 
  'Admins/Managers see all complaints. Analysts/Viewers see only assigned complaints.';

-- ============================================================================
-- 3. CREATE ASSIGNMENT HELPER FUNCTIONS
-- ============================================================================

-- Function to assign complaint to user
CREATE OR REPLACE FUNCTION assign_complaint(
  p_complaint_id uuid,
  p_user_id uuid,
  p_assigned_by uuid
)
RETURNS void AS $$
BEGIN
  -- Update complaint
  UPDATE complaints
  SET 
    assigned_to = p_user_id,
    updated_at = now()
  WHERE id = p_complaint_id;
  
  -- Log assignment
  INSERT INTO complaint_assignments (
    complaint_id,
    assigned_to,
    assigned_by,
    notes
  ) VALUES (
    p_complaint_id,
    p_user_id,
    p_assigned_by,
    'Assigned via system'
  )
  ON CONFLICT (complaint_id, assigned_to) DO UPDATE
  SET 
    assigned_by = p_assigned_by,
    assigned_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION assign_complaint IS 'Assign a complaint to a user and log the assignment';

-- Function to get user's complaint stats
CREATE OR REPLACE FUNCTION get_user_complaint_stats(p_user_id uuid)
RETURNS TABLE(
  total_assigned bigint,
  active_complaints bigint,
  pending_analysis bigint,
  in_progress bigint,
  total_hours numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT c.id) as total_assigned,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('active', 'assessment')) as active_complaints,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'assessment') as pending_analysis,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as in_progress,
    COALESCE(SUM(tl.minutes_spent) / 60.0, 0) as total_hours
  FROM complaints c
  LEFT JOIN time_logs tl ON tl.complaint_id = c.id
  WHERE c.assigned_to = p_user_id
    AND c.status NOT IN ('closed', 'resolved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_complaint_stats IS 'Get workload statistics for a specific user';

-- ============================================================================
-- 4. ADD AUTO-ASSIGNMENT TRIGGER (Optional)
-- ============================================================================

-- Function to auto-assign new complaints to least busy analyst
CREATE OR REPLACE FUNCTION auto_assign_complaint()
RETURNS TRIGGER AS $$
DECLARE
  v_assigned_user uuid;
BEGIN
  -- Only auto-assign if no user specified
  IF NEW.assigned_to IS NULL THEN
    -- Find least busy analyst
    SELECT id INTO v_assigned_user
    FROM assignable_users
    WHERE role = 'analyst'
    ORDER BY current_workload ASC, id ASC
    LIMIT 1;
    
    -- Assign if analyst found
    IF v_assigned_user IS NOT NULL THEN
      NEW.assigned_to := v_assigned_user;
      
      -- Log auto-assignment
      INSERT INTO complaint_assignments (
        complaint_id,
        assigned_to,
        assigned_by,
        notes
      ) VALUES (
        NEW.id,
        v_assigned_user,
        NEW.created_by,
        'Auto-assigned to least busy analyst'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (DISABLED by default - uncomment to enable auto-assignment)
-- DROP TRIGGER IF EXISTS trigger_auto_assign_complaint ON complaints;
-- CREATE TRIGGER trigger_auto_assign_complaint
--   BEFORE INSERT ON complaints
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_assign_complaint();

COMMENT ON FUNCTION auto_assign_complaint IS 
  'Auto-assigns new complaints to the analyst with the lowest workload (disabled by default)';

-- ============================================================================
-- 5. CREATE MANAGEMENT DASHBOARD VIEW WITH ASSIGNMENTS
-- ============================================================================

-- Enhanced management overview including assignments
CREATE OR REPLACE VIEW management_dashboard AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.email,
  u.role,
  u.job_title,
  u.is_active,
  
  -- Complaint counts
  COUNT(DISTINCT c.id) as total_complaints,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'assessment') as pending_analysis,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_complaints,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('escalated', 'resolved')) as completed_complaints,
  
  -- Ticket counts
  COUNT(DISTINCT mt.id) FILTER (WHERE mt.status IN ('open', 'in_progress')) as open_tickets,
  
  -- Time tracking
  COALESCE(SUM(tl.minutes_spent), 0) as total_minutes_logged,
  ROUND(COALESCE(SUM(tl.minutes_spent) / 60.0, 0), 1) as total_hours_logged,
  
  -- Last activity
  MAX(u.last_login) as last_login,
  MAX(tl.created_at) as last_activity
  
FROM lightpoint_users u
LEFT JOIN complaints c ON c.assigned_to = u.id
LEFT JOIN management_tickets mt ON mt.raised_by = u.id OR mt.assigned_to = u.id
LEFT JOIN time_logs tl ON tl.user_id = u.id
WHERE u.is_active = true
GROUP BY u.id, u.full_name, u.email, u.role, u.job_title, u.is_active
ORDER BY u.role, u.full_name;

COMMENT ON VIEW management_dashboard IS 
  'Complete management overview with per-user complaint assignments and workload';

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================

-- Check assignable users
SELECT 
  full_name,
  email,
  role,
  current_workload as "Current Complaints"
FROM assignable_users;

-- Check RLS policies are updated
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'complaints'
ORDER BY policyname;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

SELECT '✅ Complaint Assignment System Ready!' as status;
SELECT 'Admins/Managers: See ALL complaints' as admin_access;
SELECT 'Analysts/Viewers: See only ASSIGNED complaints' as analyst_access;
SELECT 'Next: Update UI to show assignment controls' as next_step;

