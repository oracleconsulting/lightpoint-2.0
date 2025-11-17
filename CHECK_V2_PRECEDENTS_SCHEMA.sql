-- Check v2.0 precedents table schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'precedents'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'precedents'
  AND table_schema = 'public';

