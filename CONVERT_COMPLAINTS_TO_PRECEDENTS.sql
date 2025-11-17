-- Option 1: Convert completed complaints to precedents
-- This uses your actual historical cases

-- Check completed complaints in v2.0
SELECT 
  id,
  complaint_reference,
  status,
  complaint_type,
  created_at
FROM complaints
WHERE status IN ('resolved', 'closed')
ORDER BY created_at DESC;

-- These can be converted to precedents with:
-- - outcome (what happened)
-- - compensation_amount (if any)
-- - key_arguments (what worked)
-- - effective_citations (which CRG/Charter points were successful)

