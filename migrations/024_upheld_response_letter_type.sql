-- Add 'upheld_response' to generated_letters.letter_type for HMRC upheld acceptance letters
-- No-op if generated_letters does not exist (e.g. wrong DB or base schema not applied)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'generated_letters'
  ) THEN
    ALTER TABLE generated_letters DROP CONSTRAINT IF EXISTS generated_letters_letter_type_check;
    ALTER TABLE generated_letters ADD CONSTRAINT generated_letters_letter_type_check
      CHECK (letter_type IN (
        'initial_complaint', 'tier2_escalation',
        'adjudicator_escalation', 'rebuttal', 'acknowledgement',
        'penalty_appeal',
        'penalty_appeal_follow_up',
        'statutory_review_request',
        'tribunal_appeal_notice',
        'tribunal_appeal_grounds',
        'upheld_response'
      ));
  END IF;
END $$;
