-- Check v2.0 precedents table columns
-- Run in v2.0 Supabase (lightpoint 2.0)

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'precedents'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show the single existing precedent to see what fields it has
SELECT *
FROM precedents
LIMIT 1;

