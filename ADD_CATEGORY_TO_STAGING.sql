-- Add category column to knowledge_base_staging table if it doesn't exist

-- Check if column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'knowledge_base_staging' 
        AND column_name = 'category'
    ) THEN
        -- Add category column
        ALTER TABLE knowledge_base_staging 
        ADD COLUMN category TEXT DEFAULT 'CRG' NOT NULL;
        
        RAISE NOTICE 'Added category column to knowledge_base_staging';
    ELSE
        RAISE NOTICE 'Category column already exists in knowledge_base_staging';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'knowledge_base_staging'
AND column_name = 'category';

