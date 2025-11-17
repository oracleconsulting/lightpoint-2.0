-- ULTIMATE FIX: Update ALL 16 foreign key references to user ID
-- This is the complete list from the database schema

BEGIN;

-- 1. Show current state
SELECT '=== CURRENT STATE ===' as step;
SELECT id, email, organization_id, role FROM lightpoint_users WHERE email = 'jhoward@rpgcc.co.uk';

-- 2. Create new user with correct Auth ID
SELECT '=== CREATING NEW USER ===' as step;
INSERT INTO lightpoint_users (
  id, email, full_name, organization_id, role, is_active, created_at, updated_at
)
VALUES (
  '19583c08-6993-4113-b46a-bd30e3375f54',
  'jhoward+temp@rpgcc.co.uk',  -- Temporary
  'James Howard',
  '00000000-0000-0000-0000-000000000001',
  'admin', true, NOW(), NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Update ALL 16 foreign key references
SELECT '=== UPDATING ai_prompt_history.changed_by ===' as step;
UPDATE ai_prompt_history SET changed_by = '19583c08-6993-4113-b46a-bd30e3375f54' 
WHERE changed_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING ai_prompt_tests.created_by ===' as step;
UPDATE ai_prompt_tests SET created_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE created_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING ai_prompts.last_modified_by ===' as step;
UPDATE ai_prompts SET last_modified_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE last_modified_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING complaint_assignments.assigned_by ===' as step;
UPDATE complaint_assignments SET assigned_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE assigned_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING complaint_assignments.assigned_to ===' as step;
UPDATE complaint_assignments SET assigned_to = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE assigned_to = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING complaints.assigned_to ===' as step;
UPDATE complaints SET assigned_to = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE assigned_to = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING complaints.created_by ===' as step;
UPDATE complaints SET created_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE created_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING documents.uploaded_by ===' as step;
UPDATE documents SET uploaded_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE uploaded_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING kb_chat_conversations.user_id ===' as step;
UPDATE kb_chat_conversations SET user_id = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE user_id = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING kb_chat_feedback.user_id ===' as step;
UPDATE kb_chat_feedback SET user_id = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE user_id = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING knowledge_base_staging.approved_by ===' as step;
UPDATE knowledge_base_staging SET approved_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE approved_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING knowledge_base_staging.uploaded_by ===' as step;
UPDATE knowledge_base_staging SET uploaded_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE uploaded_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING knowledge_base_updates.performed_by ===' as step;
UPDATE knowledge_base_updates SET performed_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE performed_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING management_tickets.assigned_to ===' as step;
UPDATE management_tickets SET assigned_to = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE assigned_to = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING management_tickets.raised_by ===' as step;
UPDATE management_tickets SET raised_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE raised_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT '=== UPDATING ticket_comments.user_id ===' as step;
UPDATE ticket_comments SET user_id = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE user_id = '964ff71f-b611-494c-908c-22e42d883424';

-- 4. Now safe to delete old user
SELECT '=== DELETING OLD USER ===' as step;
DELETE FROM lightpoint_users WHERE id = '964ff71f-b611-494c-908c-22e42d883424';

-- 5. Fix email on new user
SELECT '=== FIXING EMAIL ===' as step;
UPDATE lightpoint_users SET email = 'jhoward@rpgcc.co.uk'
WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54';

-- 6. Final verification
SELECT '=== ✅ FINAL STATE ===' as step;
SELECT id, email, full_name, organization_id, role, is_active
FROM lightpoint_users WHERE email = 'jhoward@rpgcc.co.uk';

COMMIT;

SELECT '🎉 SUCCESS! All 16 foreign key references updated. User ID migration complete!' as result;

