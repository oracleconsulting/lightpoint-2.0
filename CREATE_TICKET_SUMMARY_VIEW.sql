-- Create ticket_summary view for management tickets feature
-- This is referenced by tickets.getByComplaint endpoint

CREATE OR REPLACE VIEW ticket_summary AS
SELECT 
  t.id,
  t.complaint_id,
  t.title,
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

-- Verify it works
SELECT * FROM ticket_summary LIMIT 1;

