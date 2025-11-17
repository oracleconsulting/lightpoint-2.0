-- Check if the letter was generated and saved successfully

SELECT 
  id,
  complaint_id,
  letter_type,
  created_at,
  LENGTH(letter_content) as letter_length,
  LEFT(letter_content, 200) as preview
FROM generated_letters
WHERE complaint_id = 'ab805550-8303-4807-b5f3-1fcd54fdcd9f'
ORDER BY created_at DESC
LIMIT 5;

