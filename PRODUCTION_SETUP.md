# 🚀 DEPLOY HOMEPAGE CONTENT TO PRODUCTION

## You need to run these migrations in your production Supabase database:

### Step 1: Run the homepage content seed
```bash
psql $DATABASE_URL < migrations/005_seed_homepage_content.sql
```

### Step 2: Run the resource placeholders seed
```bash
psql $DATABASE_URL < migrations/017_seed_resource_placeholders.sql
```

### Step 3: (Optional) Run sample content seeds if you want examples
```bash
psql $DATABASE_URL < migrations/012_seed_sample_content_part1.sql
psql $DATABASE_URL < migrations/012_seed_sample_content_part2.sql
psql $DATABASE_URL < migrations/012_seed_sample_content_part3.sql
```

## OR: Use Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the content from `migrations/005_seed_homepage_content.sql`
6. Click "Run"
7. Repeat for `migrations/017_seed_resource_placeholders.sql`

## After running:
Refresh your live site - the homepage should load!

## Quick fix (if you just want to test):
Run this ONE query in Supabase SQL Editor to add minimal homepage content:

```sql
-- Quick homepage seed
INSERT INTO page_sections (page_name, section_key, section_title, content, display_order, is_visible)
VALUES 
('homepage', 'hero', 'Hero Section', '{
  "badge_text": "AI-Powered HMRC Complaint Management",
  "heading_line1": "Recover Your Fees.",
  "heading_line2": "Deliver Excellence.",
  "subheading": "The complete platform for accountants to manage HMRC complaints, track time, identify charter breaches, and secure fee recovery—automatically.",
  "cta_primary_text": "Start Free Trial",
  "cta_primary_link": "/waitlist",
  "cta_secondary_text": "Join Waitlist",
  "cta_secondary_link": "/waitlist",
  "trust_line": "14-day free trial • No credit card • Enterprise-grade security"
}'::jsonb, 1, true)
ON CONFLICT (page_name, section_key) DO NOTHING;
```

This will at least get your homepage to load!

