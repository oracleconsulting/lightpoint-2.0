-- ============================================================================
-- UNDO DELIVERY MANAGEMENT SYSTEM
-- ============================================================================
-- This script removes all tables, views, policies, and indexes created by
-- the add-delivery-management.sql script that was accidentally run here.
-- ============================================================================

-- 1. Drop RLS Policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Team sees practice teams" ON delivery_teams;
DROP POLICY IF EXISTS "Team sees practice assignments" ON team_member_assignments;
DROP POLICY IF EXISTS "Team sees practice engagements" ON client_engagements;
DROP POLICY IF EXISTS "Team sees engagement members" ON engagement_team_members;
DROP POLICY IF EXISTS "Team sees capacity" ON member_capacity;

-- 2. Drop Views
DROP VIEW IF EXISTS v_service_delivery_summary CASCADE;
DROP VIEW IF EXISTS v_member_workload CASCADE;
DROP VIEW IF EXISTS v_team_capacity CASCADE;

-- 3. Drop Indexes
DROP INDEX IF EXISTS idx_delivery_teams_practice;
DROP INDEX IF EXISTS idx_delivery_teams_service;
DROP INDEX IF EXISTS idx_client_engagements_practice;
DROP INDEX IF EXISTS idx_client_engagements_team;
DROP INDEX IF EXISTS idx_client_engagements_status;

-- 4. Drop Tables (in correct order due to foreign key dependencies)
DROP TABLE IF EXISTS engagement_team_members CASCADE;
DROP TABLE IF EXISTS client_engagements CASCADE;
DROP TABLE IF EXISTS team_member_assignments CASCADE;
DROP TABLE IF EXISTS delivery_teams CASCADE;
DROP TABLE IF EXISTS member_capacity CASCADE;
DROP TABLE IF EXISTS service_demand CASCADE;
DROP TABLE IF EXISTS service_role_skills CASCADE;
DROP TABLE IF EXISTS service_roles CASCADE;
DROP TABLE IF EXISTS service_deliverables CASCADE;

-- 5. Verification - should all return 0 or error (table doesn't exist)
SELECT 'Cleanup complete. These tables should NOT exist:' as status;

SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_deliverables') as service_deliverables_exists;
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_roles') as service_roles_exists;
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_teams') as delivery_teams_exists;
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_engagements') as client_engagements_exists;

