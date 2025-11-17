-- Count total rows in each key table
SELECT 'knowledge_base' as table_name, COUNT(*) as row_count FROM knowledge_base
UNION ALL
SELECT 'precedents', COUNT(*) FROM precedents
UNION ALL
SELECT 'complaints', COUNT(*) FROM complaints
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'generated_letters', COUNT(*) FROM generated_letters
UNION ALL
SELECT 'lightpoint_users', COUNT(*) FROM lightpoint_users
UNION ALL
SELECT 'organizations', COUNT(*) FROM organizations;

