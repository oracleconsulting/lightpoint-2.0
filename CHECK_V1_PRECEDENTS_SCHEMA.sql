-- Check v1.0 precedents table schema
-- Run this in v1.0 Supabase (OracleConsulting)

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'precedents'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Then export the data with only the columns that exist
SELECT *
FROM precedents
ORDER BY created_at DESC;

-- Also check how many precedents exist
SELECT COUNT(*) as total_precedents
FROM precedents;

