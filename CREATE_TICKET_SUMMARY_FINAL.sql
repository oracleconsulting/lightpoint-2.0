-- Create ticket_summary view with correct column names

DROP VIEW IF EXISTS ticket_summary;

CREATE OR REPLACE VIEW ticket_summary AS
SELECT 
  t.id,
  t.complaint_id,
  t.subject as title,  -- Map subject to title for the view
  t.description,
  t.status,
  t.priority,
  t.assigned_to,
  t.raised_by,
  t.created_at,
  t.updated_at,
  t.resolved_at,
  t.resolution_notes,
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

-- Test it
SELECT * FROM ticket_summary LIMIT 1;

