-- Export all precedents from v1.0 Supabase (OracleConsulting)
-- Run this in the OLD v1.0 Supabase dashboard

SELECT 
  id,
  complaint_type,
  outcome,
  compensation_amount,
  facts,
  reasoning,
  charter_breaches,
  crg_violations,
  created_at,
  updated_at,
  embedding
FROM precedents
ORDER BY created_at DESC;

-- Save the results as JSON or CSV
-- We'll import them into v2.0

