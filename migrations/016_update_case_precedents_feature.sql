-- Update Case Precedents feature to protect USP
-- Change from searchable database to curated learning resource

UPDATE page_sections
SET content = jsonb_set(
  content,
  '{features}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN feature->>'title' = 'Case Precedents' THEN
          jsonb_build_object(
            'title', 'Worked Examples',
            'description', 'Learn from curated, anonymized case studies. See proven strategies and approaches without exposing our proprietary complaint database.',
            'icon', 'Award',
            'color', 'yellow'
          )
        ELSE feature
      END
    )
    FROM jsonb_array_elements(content->'features') AS feature
  )
)
WHERE section_key = 'features'
AND content->'features' @> '[{"title": "Case Precedents"}]'::jsonb;

COMMENT ON TABLE page_sections IS 'Updated Case Precedents to Worked Examples to protect proprietary data';

