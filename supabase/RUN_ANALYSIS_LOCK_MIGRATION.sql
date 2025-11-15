-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================
-- This adds analysis storage to prevent re-running LLM on refresh
-- Saves money by storing analysis results permanently
-- ============================================

-- Add analysis and context storage to complaints table
-- This prevents losing analysis on refresh and saves LLM costs

ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS analysis JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS complaint_context TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_complaints_analysis_completed 
ON complaints(analysis_completed_at) 
WHERE analysis_completed_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN complaints.analysis IS 'Stores the complete AI analysis result to avoid re-running LLM on refresh';
COMMENT ON COLUMN complaints.complaint_context IS 'Stores the original complaint context provided by the user';
COMMENT ON COLUMN complaints.analysis_completed_at IS 'Timestamp when analysis was completed and locked';

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this after the migration to verify it worked:

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'complaints' 
AND column_name IN ('analysis', 'complaint_context', 'analysis_completed_at')
ORDER BY column_name;

-- You should see 3 rows returned with the new columns

