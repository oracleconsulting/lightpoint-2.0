-- Fix ticket_summary view - check actual schema first

-- 1. Check what columns actually exist in management_tickets
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'management_tickets'
ORDER BY ordinal_position;

-- 2. Drop existing view if it exists
DROP VIEW IF EXISTS ticket_summary;

-- 3. Create view with correct columns (assuming standard fields)
CREATE OR REPLACE VIEW ticket_summary AS
SELECT 
  t.id,
  t.complaint_id,
  COALESCE(t.subject, t.description) as title,
  t.description,
  t.status,
  t.priority,
  t.assigned_to,
  t.raised_by,
  t.created_at,
  t.updated_at,
  t.due_date,
  t.resolved_at,
  u_assigned.full_name as assigned_to_name,
  u_raised.full_name as raised_by_name,
  (
    SELECT COUNT(*)
    FROM ticket_comments tc
    WHERE tc.ticket_id = t.id
  ) as comment_count
FROM management_tickets t
LEFT JOIN lightpoint_users u_assigned ON t.assigned_to = u_assigned.id
LEFT JOIN lightpoint_users u_raised ON t.raised_by = u_raised.id;

-- 4. Test it
SELECT * FROM ticket_summary LIMIT 1;

