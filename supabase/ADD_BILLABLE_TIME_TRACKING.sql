-- ============================================================================
-- LIGHTPOINT BILLABLE TIME TRACKING
-- ============================================================================
-- Adds billable flag to time_logs table
-- Time is only billable when complaint status is 'active' or beyond
-- ============================================================================

-- Step 1: Add billable column to time_logs
ALTER TABLE time_logs 
ADD COLUMN IF NOT EXISTS billable boolean DEFAULT false;

-- Step 2: Add notes column for regeneration tracking
ALTER TABLE time_logs 
ADD COLUMN IF NOT EXISTS notes text;

-- Step 3: Create index for billable queries
CREATE INDEX IF NOT EXISTS idx_time_logs_billable ON time_logs(billable);

-- Step 4: Update existing time logs - make them billable if complaint is active
UPDATE time_logs tl
SET billable = true
WHERE EXISTS (
  SELECT 1 FROM complaints c 
  WHERE c.id = tl.complaint_id 
  AND c.status IN ('active', 'escalated', 'resolved', 'closed')
);

-- Step 5: Create function to auto-set billable based on complaint status
CREATE OR REPLACE FUNCTION set_time_log_billable()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if complaint is in billable status
  SELECT 
    CASE 
      WHEN status IN ('active', 'escalated', 'resolved', 'closed') THEN true
      ELSE false
    END INTO NEW.billable
  FROM complaints 
  WHERE id = NEW.complaint_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to auto-set billable on insert
DROP TRIGGER IF EXISTS set_time_log_billable_trigger ON time_logs;
CREATE TRIGGER set_time_log_billable_trigger
  BEFORE INSERT ON time_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_time_log_billable();

-- Step 7: Create function to mark all pending time as billable when complaint becomes active
CREATE OR REPLACE FUNCTION mark_time_billable_on_active()
RETURNS TRIGGER AS $$
BEGIN
  -- When complaint status changes to 'active', mark all time logs as billable
  IF NEW.status = 'active' AND OLD.status = 'assessment' THEN
    UPDATE time_logs
    SET billable = true
    WHERE complaint_id = NEW.id
    AND billable = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger on complaints table
DROP TRIGGER IF EXISTS mark_time_billable_on_active_trigger ON complaints;
CREATE TRIGGER mark_time_billable_on_active_trigger
  AFTER UPDATE ON complaints
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION mark_time_billable_on_active();

-- ============================================================================
-- LETTER REGENERATION TRACKING
-- ============================================================================

-- Add column to track if a letter is a replacement
ALTER TABLE generated_letters
ADD COLUMN IF NOT EXISTS replaces_letter_id uuid REFERENCES generated_letters(id);

-- Add column to track if letter was regenerated (no extra time)
ALTER TABLE generated_letters
ADD COLUMN IF NOT EXISTS is_regeneration boolean DEFAULT false;

-- Add column to mark superseded letters
ALTER TABLE generated_letters
ADD COLUMN IF NOT EXISTS superseded_at timestamp with time zone;

-- Add column for superseded reason
ALTER TABLE generated_letters
ADD COLUMN IF NOT EXISTS superseded_reason text;

-- Create index for finding active letters
CREATE INDEX IF NOT EXISTS idx_generated_letters_superseded ON generated_letters(superseded_at);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  'Time logs billable column' as check,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_logs' AND column_name = 'billable'
  ) as exists;

SELECT 
  'Generated letters regeneration columns' as check,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_letters' AND column_name = 'is_regeneration'
  ) as exists;

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT '✅ Billable time tracking setup complete!' as status;
SELECT 'Time logs now have: billable, notes columns' as time_logs;
SELECT 'Generated letters now have: replaces_letter_id, is_regeneration, superseded_at, superseded_reason' as letters;
SELECT 'Triggers created for auto-billable and mark-on-active' as triggers;

