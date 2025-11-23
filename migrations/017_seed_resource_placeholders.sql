-- Seed placeholder content for CPD, Webinars, and Worked Examples
-- This gives users something to see while we build out the real content

-- CPD Articles
INSERT INTO cpd_articles (
  title,
  slug,
  excerpt,
  content,
  featured_image_url,
  category,
  reading_time_minutes,
  tags,
  is_published,
  meta_title,
  meta_description
) VALUES
(
  'Understanding HMRC Charter Rights',
  'understanding-hmrc-charter-rights',
  'A comprehensive guide to your rights when dealing with HMRC complaints and how to leverage them effectively.',
  '<h2>What is the HMRC Charter?</h2><p>The HMRC Charter sets out what you can expect from HMRC and what they expect from you. This is a foundational document for any complaint.</p><h3>Key Rights Include:</h3><ul><li>Respect and fair treatment</li><li>Help and support to get things right</li><li>To be treated as honest</li><li>Privacy and confidentiality</li><li>Professional and effective service</li></ul><p><strong>Coming soon:</strong> Full article with detailed examples and case studies.</p>',
  '/images/placeholder-cpd-1.jpg',
  'Charter Rights',
  15,
  ARRAY['charter', 'rights', 'hmrc', 'complaints'],
  true,
  'Understanding HMRC Charter Rights | Lightpoint CPD',
  'Learn about your rights under the HMRC Charter and how to use them in complaint management.'
),
(
  'Effective Complaint Letter Writing',
  'effective-complaint-letter-writing',
  'Master the art of writing compelling complaint letters that get results from HMRC.',
  '<h2>The Anatomy of a Winning Complaint Letter</h2><p>A well-structured complaint letter is your most powerful tool in dealing with HMRC.</p><h3>Essential Components:</h3><ul><li>Clear statement of facts</li><li>Specific charter breaches referenced</li><li>Professional fees calculation</li><li>Reasonable timeframe for response</li></ul><p><strong>Placeholder content:</strong> Full guide with templates coming soon in our CPD library.</p>',
  '/images/placeholder-cpd-2.jpg',
  'Letter Writing',
  20,
  ARRAY['letters', 'writing', 'templates', 'complaints'],
  true,
  'Effective Complaint Letter Writing | Lightpoint CPD',
  'Learn how to write effective HMRC complaint letters that achieve results.'
)
ON CONFLICT (slug) DO NOTHING;

-- Webinars
INSERT INTO webinars (
  title,
  slug,
  description,
  content,
  thumbnail_url,
  speaker_name,
  speaker_avatar_url,
  video_url,
  scheduled_at,
  duration_minutes,
  tags,
  is_live,
  is_published,
  meta_title,
  meta_description
) VALUES
(
  'Introduction to HMRC Complaint Management',
  'intro-hmrc-complaint-management',
  'A comprehensive introduction to managing HMRC complaints effectively for accounting professionals.',
  '<h2>What You''ll Learn</h2><ul><li>The HMRC complaints process</li><li>Common pitfalls to avoid</li><li>How to calculate professional fees</li><li>Escalation pathways</li></ul><p><strong>This webinar is coming soon.</strong> Join the waitlist to be notified when it''s available.</p>',
  '/images/placeholder-webinar-1.jpg',
  'James Howard',
  '/images/avatar-placeholder.jpg',
  null,
  NOW() + INTERVAL '30 days',
  60,
  ARRAY['introduction', 'basics', 'getting-started'],
  false,
  true,
  'Introduction to HMRC Complaint Management | Lightpoint Webinar',
  'Join our comprehensive webinar on HMRC complaint management for accounting professionals.'
),
(
  'Advanced Fee Recovery Strategies',
  'advanced-fee-recovery-strategies',
  'Deep dive into maximizing professional fee recovery in HMRC complaint cases.',
  '<h2>Advanced Techniques</h2><ul><li>Calculating time accurately</li><li>Justifying higher rates</li><li>ex-gratia claims</li><li>Adjudicator submissions</li></ul><p><strong>Coming in Q1 2025.</strong> This advanced webinar will be available to Professional and Enterprise subscribers.</p>',
  '/images/placeholder-webinar-2.jpg',
  'Sarah Mitchell',
  '/images/avatar-placeholder-2.jpg',
  null,
  NOW() + INTERVAL '45 days',
  90,
  ARRAY['advanced', 'fees', 'recovery'],
  false,
  true,
  'Advanced Fee Recovery Strategies | Lightpoint Webinar',
  'Master advanced techniques for maximizing fee recovery in HMRC complaints.'
)
ON CONFLICT (slug) DO NOTHING;

-- Worked Examples
INSERT INTO worked_examples (
  title,
  slug,
  excerpt,
  featured_image_url,
  background,
  actions_taken,
  outcome,
  roi_metrics,
  category,
  tags,
  is_published,
  meta_title,
  meta_description
) VALUES
(
  'VAT Penalty Complaint - £2,450 Recovery',
  'vat-penalty-complaint-2450-recovery',
  'How a regional accounting firm successfully recovered professional fees after an unjustified VAT penalty.',
  '/images/placeholder-example-1.jpg',
  '<h3>Background</h3><p>Client received a £5,000 VAT penalty due to HMRC processing delays. Firm spent 8 hours resolving the issue.</p>',
  '<h3>Actions Taken</h3><ul><li>Tier 1 complaint filed citing Charter breach</li><li>Detailed timeline of HMRC delays provided</li><li>Professional fees calculated at £306/hour</li><li>Escalated to Tier 2 after 15 working days</li></ul>',
  '<h3>Outcome</h3><p><strong>Success:</strong> HMRC accepted complaint, penalty removed, and professional fees of £2,448 awarded plus £250 ex-gratia payment.</p>',
  '{"fees_recovered": 2448, "ex_gratia": 250, "total_recovery": 2698, "time_invested_hours": 8, "effective_rate": 337.25}',
  'VAT',
  ARRAY['vat', 'penalty', 'tier-2', 'success'],
  true,
  'VAT Penalty Complaint Case Study | £2,450 Recovery',
  'Real example of successful VAT penalty complaint with full fee recovery.'
),
(
  'PAYE Processing Error - £3,890 Recovery',
  'paye-processing-error-3890-recovery',
  'Detailed case study of a PAYE processing error complaint that resulted in full fee recovery and compensation.',
  '/images/placeholder-example-2.jpg',
  '<h3>Background</h3><p>HMRC incorrectly processed PAYE returns for 6 months, causing client cash flow issues. Firm invested 12 hours resolving.</p>',
  '<h3>Actions Taken</h3><ul><li>Comprehensive complaint with evidence</li><li>Charter breaches clearly documented</li><li>Time logs and fee calculation provided</li><li>Adjudicator referral after Tier 2 rejection</li></ul>',
  '<h3>Outcome</h3><p><strong>Full Success:</strong> Adjudicator ruled in favor. £3,672 professional fees + £500 ex-gratia awarded. PAYE corrections made.</p>',
  '{"fees_recovered": 3672, "ex_gratia": 500, "total_recovery": 4172, "time_invested_hours": 12, "effective_rate": 347.67}',
  'PAYE',
  ARRAY['paye', 'adjudicator', 'processing-error', 'success'],
  true,
  'PAYE Processing Error Case Study | £3,890 Recovery',
  'How we secured full fee recovery through the Adjudicator for a PAYE complaint.'
)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE cpd_articles IS 'Seeded with placeholder content for demonstration';
COMMENT ON TABLE webinars IS 'Seeded with upcoming webinar placeholders';
COMMENT ON TABLE worked_examples IS 'Seeded with anonymized example cases';

