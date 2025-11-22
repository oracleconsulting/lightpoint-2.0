-- ============================================
-- LIGHTPOINT V2.0 - SEED SAMPLE CONTENT (PART 3)
-- Webinars and Worked Examples
-- Date: 2024-11-22
-- ============================================

-- =====================================
-- WEBINARS
-- =====================================

-- Webinar 1: Getting Started (Recorded)
INSERT INTO webinars (
  title, slug, description, speaker_name, speaker_bio, duration_minutes,
  tier_access, webinar_type, status, scheduled_date, recording_url, 
  is_published, created_at, updated_at
) VALUES (
  'Getting Started with Lightpoint',
  'getting-started-with-lightpoint',
  E'A comprehensive introduction to the Lightpoint platform. Learn how to:\n\n- Set up your account and firm profile\n- Upload and analyze HMRC correspondence\n- Track time and calculate fees\n- Generate complaint letters with AI\n- Manage multiple cases efficiently\n\nPerfect for new users wanting to get up and running quickly. Includes live Q&A at the end.',
  'James Howard',
  'Founder of Lightpoint and former HMRC complaints specialist with 15 years experience. James has successfully resolved over 1,000 complaints and recovered £3M+ in professional fees.',
  30,
  'free',
  'recorded',
  'completed',
  NOW() - INTERVAL '30 days',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  true,
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days'
);

-- Webinar 2: Advanced Strategies (Recorded)
INSERT INTO webinars (
  title, slug, description, speaker_name, speaker_bio, duration_minutes,
  tier_access, webinar_type, status, scheduled_date, recording_url,
  is_published, created_at, updated_at
) VALUES (
  'Advanced Complaint Strategies: Tier 2 and Beyond',
  'advanced-complaint-strategies-tier-2',
  E'Take your HMRC complaint management to the next level. This advanced session covers:\n\n- When and how to escalate to Tier 2\n- Preparing for Adjudicator review\n- Handling HMRC pushback and negotiation\n- Complex multi-breach cases\n- Maximizing fee recovery in difficult cases\n- Using precedent and case law\n\nIncludes real case studies and detailed walkthroughs of successful escalations.\n\n**Prerequisites:** Basic understanding of HMRC complaints process',
  'Sarah Thompson',
  'Managing Partner at Thompson Associates and Lightpoint Enterprise user. Sarah has achieved a 96% success rate across 200+ complaints and recovered over £850,000 in professional fees.',
  45,
  'professional',
  'recorded',
  'completed',
  NOW() - INTERVAL '60 days',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  true,
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '60 days'
);

-- Webinar 3: Q&A Session (Upcoming Live)
INSERT INTO webinars (
  title, slug, description, speaker_name, speaker_bio, duration_minutes,
  tier_access, webinar_type, status, scheduled_date,
  is_published, created_at, updated_at
) VALUES (
  'Monthly Q&A with HMRC Complaints Experts',
  'monthly-qa-december-2024',
  E'Join us for our monthly live Q&A session where we answer your burning questions about HMRC complaints.\n\n**This month''s hot topics:**\n- Recent changes to HMRC service standards\n- New case law affecting fee recovery\n- Handling delays in the current environment\n- Best practices for 2025\n\n**Format:**\n- 15 min: Updates on recent developments\n- 45 min: Your questions answered live\n- Open to all tiers\n\n**How to participate:**\n- Submit questions in advance (preferred)\n- Ask questions live during the session\n- Recording available 24h after\n\n**Register now** - limited to 100 participants!',
  'James Howard & Sarah Thompson',
  'Our expert panel combines over 25 years of HMRC complaints experience with thousands of successful resolutions.',
  60,
  'free',
  'live',
  'upcoming',
  NOW() + INTERVAL '14 days',
  true,
  NOW(),
  NOW()
);

-- Webinar 4: Fee Recovery Masterclass (Recorded)
INSERT INTO webinars (
  title, slug, description, speaker_name, speaker_bio, duration_minutes,
  tier_access, webinar_type, status, scheduled_date, recording_url,
  is_published, created_at, updated_at
) VALUES (
  'Fee Recovery Masterclass: Maximizing Your Claims',
  'fee-recovery-masterclass',
  E'Everything you need to know about recovering professional fees from HMRC.\n\n**Module 1: The Basics (15 mins)**\n- What''s claimable and what''s not\n- Hourly rates and time recording\n- The 2020 rule change explained\n\n**Module 2: Calculation Methods (20 mins)**\n- 6-minute billing units\n- Activity bundling strategies\n- Dealing with HMRC objections\n\n**Module 3: Invoice Preparation (15 mins)**\n- Required format and information\n- Evidence requirements\n- Common mistakes to avoid\n\n**Module 4: Negotiation Tactics (10 mins)**\n- Handling counteroffers\n- When to hold firm vs compromise\n- Escalation strategies\n\n**Includes:**\n- Downloadable invoice templates\n- Sample fee calculations\n- Negotiation scripts\n- Real case examples\n\nThis masterclass has helped hundreds of professionals recover an additional £2,000+ per case on average.',
  'Michael Chen',
  'Former HMRC Complaints Team Manager (2010-2020) and now independent complaints consultant. Michael has insider knowledge of how HMRC evaluates fee claims and what increases acceptance rates.',
  60,
  'professional',
  'recorded',
  'completed',
  NOW() - INTERVAL '45 days',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  true,
  NOW() - INTERVAL '45 days',
  NOW() - INTERVAL '45 days'
);

-- =====================================
-- WORKED EXAMPLES / CASE STUDIES
-- =====================================

-- Example 1: Penalty Appeal
INSERT INTO worked_examples (
  title, slug, summary, background, actions_taken, outcome, lessons_learned,
  tier_access, category, complexity, fee_recovery_amount, duration_days,
  is_published, created_at, updated_at
) VALUES (
  '£12,000 Fee Recovery: Late Payment Penalty Appeal Success',
  '12k-fee-recovery-late-payment-penalty',
  'A manufacturing company was charged a £15,000 late payment penalty due to HMRC delays in processing their time-to-pay arrangement. The accountant successfully appealed the penalty AND recovered £12,000 in professional fees.',
  E'## Client Background
- **Business:** Manufacturing Ltd, annual turnover £2.5M
- **Issue:** £15,000 late payment penalty for VAT
- **Timeline:** 8 months from penalty to resolution

## The Problem
Client requested time-to-pay arrangement in writing (27/01/2024) due to temporary cash flow issues. HMRC didn''t respond for 6 weeks. By the time arrangement was approved (12/03/2024), the payment was already late and penalty applied (01/03/2024).

## Initial Position
- HMRC: "Penalty valid, you paid late"
- Client: "We requested TTP but you didn''t respond"
- Professional fees incurred so far: £2,400',
  E'## Step 1: Evidence Gathering (Week 1)
**Actions:**
- Obtained proof of posting for TTP request (Royal Mail receipt)
- Collected all correspondence showing lack of HMRC response
- Created detailed timeline showing 6-week delay
- Documented multiple follow-up calls (4 calls, total 2 hours hold time)

**Cost:** 8 hours @ £200/h = £1,600

## Step 2: Charter Breach Analysis (Week 2)
**Breaches Identified:**
1. "We will respond within 15 working days" - 6 weeks = 30 working days
2. "We will help you get things right" - TTP request ignored
3. "We will take responsibility when we make mistakes" - Applied penalty despite their delay

**Cost:** 3 hours @ £200/h = £600

## Step 3: Tier 1 Complaint Filed (Week 3)
**Complaint Content:**
- Detailed chronology with exhibits
- Clear Charter breach identification
- Request to cancel penalty
- Claim for professional fees: £2,400 + ongoing costs

**HMRC Response (Week 5):**
- Acknowledged delay in processing TTP
- Agreed to cancel penalty ✓
- Offered £250 ex-gratia for distress ✓
- Rejected fee claim "excessive for simple matter" ✗

**Cost to date:** £3,200

## Step 4: Fee Claim Negotiation (Week 6)
**Our Response:**
- Provided detailed breakdown of time spent
- Evidence of firm''s standard rates
- Comparison showing time was reasonable given HMRC''s lack of response
- Highlighted that simple matter became complex DUE TO HMRC delays

**Revised Breakdown Submitted:**
```
Initial TTP request preparation:     2.0h @ £200/h = £400
Four follow-up calls (inc hold time): 2.5h @ £200/h = £500
Evidence gathering for complaint:     4.0h @ £200/h = £800
Complaint preparation:                3.0h @ £200/h = £600
Fee negotiation correspondence:       1.5h @ £200/h = £300
Partner review (quality control):     0.5h @ £300/h = £150
                                     ----            -----
TOTAL:                               13.5h          £2,750
VAT @ 20%:                                          £550
GRAND TOTAL:                                       £3,300
```

**Cost for this step:** £300

## Step 5: Final Resolution (Week 8)
**HMRC Final Offer:**
- Penalty cancelled: £15,000 ✓
- Ex-gratia payment: £250 ✓
- Professional fees accepted: £3,000 (91% of claim) ✓
- **Total recovery: £18,250**

**Our total costs:** £3,500
**Net benefit to client:** £14,750',
  E'## Successful Outcome

**Financial:**
- ✅ £15,000 penalty cancelled
- ✅ £3,000 professional fees recovered (from £3,500 incurred)
- ✅ £250 ex-gratia payment
- ✅ **Total value: £18,250**

**Timeline:**
- From penalty to resolution: 8 weeks
- HMRC accepted TTP retrospectively
- No credit file impact for client

**Client Feedback:**
"We were facing a £15,000 penalty that wasn''t our fault. Our accountant not only got it cancelled but recovered their fees too. Outstanding result." - Finance Director, Manufacturing Ltd',
  E'## Key Lessons

### 1. Document Everything From Day One
The proof of posting for the original TTP request was crucial. Without it, case would have been much weaker.

**Action:** Always get proof of posting for important HMRC correspondence.

### 2. Quantify Time Contemporaneously
Recording time as we went meant our fee claim was accurate and defensible.

**Action:** Use time tracking tools (like Lightpoint) to capture every activity.

### 3. Don''t Accept First Rejection
HMRC initially rejected the full fee claim. Detailed breakdown and negotiation recovered 91%.

**Action:** Be prepared to justify and negotiate fee claims.

### 4. Link Costs to HMRC''s Error
Showing that "simple matter became complex DUE TO HMRC delays" was persuasive.

**Action:** Explicitly connect your costs to HMRC''s Charter breach.

### 5. Include Quality Control Time
Partner review time was initially challenged but ultimately accepted as reasonable.

**Action:** Don''t be afraid to claim for supervisory review on complex matters.

## Replicability

This approach works for any penalty that resulted from HMRC delays or errors:
- Late payment penalties where TTP was requested
- Late filing penalties where HMRC lost documents
- Incorrect advice penalties

**Success rate for similar cases:** 87%

## Lightpoint Advantage

Using Lightpoint for this case would have:
- Auto-tracked all time (saved 15 mins per entry = 2 hours)
- Identified all 3 Charter breaches via AI analysis
- Generated the initial complaint letter automatically
- Calculated fee recovery amount with proper formatting
- **Estimated time saving: 4 hours (worth £800)**',
  'professional',
  'penalty_appeals',
  'intermediate',
  12000,
  56,
  true,
  NOW(),
  NOW()
);

-- Example 2: Delay Complaint (to be continued...)

-- We now have solid sample content for:
-- ✅ 5 CPD Articles
-- ✅ 3 Blog Posts  
-- ✅ 4 Webinars
-- ✅ 1 Worked Example (with 4 more to add)


