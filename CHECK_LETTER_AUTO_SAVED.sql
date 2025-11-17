-- Check if letter was auto-saved despite client timeout error
-- Complaint ID: ab805550-8303-4807-b5f3-1fcd54fdcd9f

SELECT 
    id,
    complaint_id,
    letter_type,
    LEFT(letter_content, 200) as letter_preview,
    LENGTH(letter_content) as letter_length,
    notes,
    created_at
FROM generated_letters
WHERE complaint_id = 'ab805550-8303-4807-b5f3-1fcd54fdcd9f'
ORDER BY created_at DESC
LIMIT 5;

-- Also check all recent letters
SELECT 
    id,
    complaint_id,
    letter_type,
    LENGTH(letter_content) as letter_length,
    notes,
    created_at
FROM generated_letters
ORDER BY created_at DESC
LIMIT 10;

