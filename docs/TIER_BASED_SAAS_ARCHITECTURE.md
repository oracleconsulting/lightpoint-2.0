# Lightpoint v2.0 - Tier-Based SaaS Platform Architecture

**Date:** November 21, 2024  
**Version:** 2.1 - Subscription Model  
**Status:** Architecture Design Phase

---

## 🎯 **Vision**

Transform Lightpoint from a standalone complaint management system into a **scalable, tier-based SaaS platform** for accountancy practices, enabling:

1. **Flexible subscription tiers** with feature flags
2. **Monthly complaint quotas** with usage tracking
3. **CPD content delivery** for professional development
4. **Worked examples library** for learning
5. **Webinar management** for subscriber engagement
6. **White-label capabilities** for firm branding
7. **Revenue optimization** through charge-out rate guidance

---

## 📊 **Subscription Tier Architecture**

### **Tier Structure (Flexible)**

```typescript
// Database Schema: subscription_tiers table
interface SubscriptionTier {
  id: string;
  name: string; // "Starter", "Professional", "Enterprise", etc.
  display_name: string;
  description: string;
  
  // Pricing
  monthly_price: number; // in pence (e.g., 9900 = £99.00)
  annual_price: number; // discounted annual rate
  currency: 'GBP';
  
  // Feature flags (flexible for future changes)
  features: {
    // Complaint Management
    max_complaints_per_month: number; // -1 for unlimited
    max_active_complaints: number;
    complaint_templates: boolean;
    ai_draft_generation: boolean;
    precedent_search: boolean;
    
    // Analysis & Reporting
    success_rate_prediction: boolean;
    roi_calculator: boolean;
    charter_breach_detection: boolean;
    advanced_analytics: boolean;
    
    // Professional Development
    cpd_access: boolean;
    cpd_certification: boolean;
    worked_examples_access: boolean;
    webinar_access: 'none' | 'recorded' | 'live';
    
    // Collaboration
    team_members: number; // max users per subscription
    client_portal: boolean;
    white_label_branding: boolean;
    
    // Support
    support_level: 'community' | 'email' | 'priority' | 'dedicated';
    response_time_sla: string; // "48h", "24h", "4h", etc.
    
    // Advanced Features
    api_access: boolean;
    custom_integrations: boolean;
    bulk_operations: boolean;
    export_capabilities: boolean;
  };
  
  // Metadata
  is_active: boolean;
  sort_order: number;
  created_at: timestamp;
  updated_at: timestamp;
}
```

### **Example Tier Definitions**

```typescript
// Starter Tier (£99/month)
{
  name: 'starter',
  display_name: 'Starter',
  monthly_price: 9900,
  annual_price: 99000, // £990/year (2 months free)
  features: {
    max_complaints_per_month: 5,
    max_active_complaints: 10,
    complaint_templates: true,
    ai_draft_generation: true,
    precedent_search: false,
    cpd_access: true,
    worked_examples_access: true,
    webinar_access: 'recorded',
    team_members: 1,
    support_level: 'email'
  }
}

// Professional Tier (£299/month)
{
  name: 'professional',
  display_name: 'Professional',
  monthly_price: 29900,
  annual_price: 299000,
  features: {
    max_complaints_per_month: 20,
    max_active_complaints: 50,
    complaint_templates: true,
    ai_draft_generation: true,
    precedent_search: true,
    success_rate_prediction: true,
    roi_calculator: true,
    cpd_access: true,
    cpd_certification: true,
    worked_examples_access: true,
    webinar_access: 'live',
    team_members: 5,
    white_label_branding: true,
    support_level: 'priority'
  }
}

// Enterprise Tier (£999/month)
{
  name: 'enterprise',
  display_name: 'Enterprise',
  monthly_price: 99900,
  annual_price: 999000,
  features: {
    max_complaints_per_month: -1, // unlimited
    max_active_complaints: -1,
    // All features enabled
    api_access: true,
    custom_integrations: true,
    bulk_operations: true,
    team_members: -1, // unlimited
    support_level: 'dedicated'
  }
}
```

---

## 🔒 **Subscription Management Schema**

### **User Subscriptions**

```sql
-- Table: user_subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  
  -- Billing
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'annual')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  
  -- Payment Integration (Stripe)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  
  -- Trial
  trial_ends_at TIMESTAMPTZ,
  trial_used BOOLEAN DEFAULT FALSE,
  
  -- Usage Tracking
  complaints_used_this_period INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  
  CONSTRAINT unique_org_subscription UNIQUE (organization_id)
);

-- Index for efficient lookups
CREATE INDEX idx_subscriptions_org ON user_subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
```

### **Usage Tracking**

```sql
-- Table: subscription_usage
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id),
  
  -- Period tracking
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Usage metrics
  complaints_created INTEGER DEFAULT 0,
  complaints_completed INTEGER DEFAULT 0,
  ai_generations_used INTEGER DEFAULT 0,
  precedent_searches_used INTEGER DEFAULT 0,
  
  -- Feature usage
  features_used JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_subscription_period UNIQUE (subscription_id, period_start)
);

CREATE INDEX idx_usage_subscription ON subscription_usage(subscription_id);
CREATE INDEX idx_usage_period ON subscription_usage(period_start, period_end);
```

---

## 🎓 **CPD (Continuing Professional Development) System**

### **CPD Content Schema**

```sql
-- Table: cpd_content
CREATE TABLE cpd_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Content details
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'quiz', 'case_study', 'template')),
  
  -- Content body
  content TEXT NOT NULL, -- Markdown or HTML
  video_url TEXT,
  duration_minutes INTEGER,
  
  -- Categorization
  category TEXT NOT NULL, -- 'complaints', 'charter', 'procedure', 'precedents'
  tags TEXT[], -- ['CRG4025', 'delays', 'tier-2']
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- CPD credits
  cpd_hours DECIMAL(3,1), -- e.g., 0.5, 1.0, 2.0
  certifiable BOOLEAN DEFAULT FALSE,
  
  -- Access control
  min_tier_required UUID REFERENCES subscription_tiers(id),
  is_premium BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  author_id UUID REFERENCES lightpoint_users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: cpd_progress
CREATE TABLE cpd_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES lightpoint_users(id),
  content_id UUID NOT NULL REFERENCES cpd_content(id),
  
  -- Progress tracking
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  passed_quiz BOOLEAN,
  quiz_score INTEGER,
  
  -- Certification
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  
  -- Metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_content UNIQUE (user_id, content_id)
);
```

---

## 📚 **Worked Examples Library**

### **Schema**

```sql
-- Table: worked_examples
CREATE TABLE worked_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Example details
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  
  -- Case details
  complaint_type TEXT NOT NULL, -- 'delay', 'penalty', 'conduct', 'mixed'
  hmrc_department TEXT,
  duration_months INTEGER,
  complexity_level TEXT CHECK (complexity_level IN ('simple', 'moderate', 'complex')),
  
  -- Outcome
  outcome TEXT NOT NULL CHECK (outcome IN ('upheld', 'partially_upheld', 'rejected')),
  tier_resolved TEXT, -- 'tier-1', 'tier-2', 'adjudicator'
  financial_redress DECIMAL(10,2),
  professional_fees_recovered DECIMAL(10,2),
  ex_gratia_payment DECIMAL(10,2),
  
  -- Example content
  timeline JSONB, -- Array of timeline events
  charter_breaches TEXT[], -- ['CRG4025', 'CRG5225']
  strategy_notes TEXT,
  key_arguments TEXT,
  
  -- Documents
  letter_examples JSONB, -- Array of {stage, content}
  supporting_docs TEXT[], -- URLs to anonymized documents
  
  -- Learning points
  lessons_learned TEXT,
  common_pitfalls TEXT,
  success_factors TEXT,
  
  -- Access control
  min_tier_required UUID REFERENCES subscription_tiers(id),
  is_premium BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_by UUID REFERENCES lightpoint_users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Analytics
  views_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0
);

CREATE INDEX idx_examples_type ON worked_examples(complaint_type);
CREATE INDEX idx_examples_outcome ON worked_examples(outcome);
CREATE INDEX idx_examples_published ON worked_examples(is_published);
```

---

## 🎥 **Webinar Management System**

### **Schema**

```sql
-- Table: webinars
CREATE TABLE webinars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Webinar details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  topic_category TEXT, -- 'complaints', 'charter', 'strategy', 'tools'
  
  -- Scheduling
  type TEXT NOT NULL CHECK (type IN ('live', 'recorded', 'hybrid')),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL,
  timezone TEXT DEFAULT 'Europe/London',
  
  -- Access control
  min_tier_required UUID REFERENCES subscription_tiers(id),
  max_attendees INTEGER, -- NULL for unlimited
  registration_required BOOLEAN DEFAULT TRUE,
  
  -- Platform integration
  zoom_meeting_id TEXT,
  zoom_join_url TEXT,
  recording_url TEXT,
  slides_url TEXT,
  
  -- Content
  agenda TEXT,
  speaker_bio TEXT,
  speaker_name TEXT,
  resources JSONB, -- Links to additional materials
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'live', 'completed', 'canceled')),
  is_published BOOLEAN DEFAULT FALSE,
  
  -- CPD
  cpd_hours DECIMAL(3,1),
  certifiable BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_by UUID REFERENCES lightpoint_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: webinar_registrations
CREATE TABLE webinar_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID NOT NULL REFERENCES webinars(id),
  user_id UUID NOT NULL REFERENCES lightpoint_users(id),
  
  -- Registration details
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended BOOLEAN DEFAULT FALSE,
  attendance_duration_minutes INTEGER,
  
  -- Feedback
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  
  -- Certificate
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  
  CONSTRAINT unique_webinar_registration UNIQUE (webinar_id, user_id)
);
```

---

## 💰 **Charge-Out Rate Management**

### **Schema**

```sql
-- Table: charge_out_rates
CREATE TABLE charge_out_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Rate details
  rate_type TEXT NOT NULL CHECK (rate_type IN ('hourly', 'fixed_fee', 'value_based')),
  hourly_rate DECIMAL(8,2), -- £185.00 per hour
  currency TEXT DEFAULT 'GBP',
  
  -- Time tracking granularity
  billing_increment_minutes INTEGER DEFAULT 12, -- 12-minute segments (0.2 hours)
  minimum_charge_minutes INTEGER DEFAULT 12,
  
  -- Rate categories
  service_category TEXT, -- 'complaints', 'tax_advice', 'general'
  seniority_level TEXT, -- 'partner', 'manager', 'senior', 'junior'
  
  -- Benchmarking data
  industry_average DECIMAL(8,2), -- For comparison
  region TEXT, -- 'London', 'Southeast', 'Midlands', etc.
  firm_size TEXT, -- 'sole_practitioner', 'small', 'medium', 'large'
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: rate_benchmarks (industry data)
CREATE TABLE rate_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Geographic/demographic
  region TEXT NOT NULL,
  firm_size TEXT NOT NULL,
  service_category TEXT NOT NULL,
  
  -- Benchmark data
  percentile_25 DECIMAL(8,2),
  percentile_50 DECIMAL(8,2), -- median
  percentile_75 DECIMAL(8,2),
  percentile_90 DECIMAL(8,2),
  
  -- Sample size
  data_points INTEGER,
  last_updated DATE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📄 **HMRC-Compliant Invoice Generation**

### **Invoice Schema**

```sql
-- Table: professional_invoices
CREATE TABLE professional_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Invoice details
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  
  -- Client details
  client_reference TEXT,
  complaint_reference TEXT,
  
  -- Line items (HMRC format)
  line_items JSONB NOT NULL, -- Array of time entries
  /**
   * Example structure:
   * [
   *   {
   *     date: '2024-11-21',
   *     description: 'Reviewed HMRC correspondence dated 15/11/24',
   *     time_minutes: 12,
   *     rate: 185.00,
   *     amount: 37.00,
   *     chargeable: true
   *   },
   *   {
   *     date: '2024-11-21',
   *     description: 'Reading inbound HMRC letter',
   *     time_minutes: 12,
   *     rate: 185.00,
   *     amount: 0.00, // HMRC won't pay for reading their letters
   *     chargeable: false
   *   }
   * ]
   */
  
  -- Totals
  subtotal DECIMAL(10,2) NOT NULL,
  vat_amount DECIMAL(10,2),
  vat_rate DECIMAL(5,2) DEFAULT 20.00,
  total DECIMAL(10,2) NOT NULL,
  
  -- HMRC submission
  submitted_to_hmrc BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  hmrc_reference TEXT,
  
  -- Payment tracking
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_client', 'pending_hmrc', 'paid', 'disputed')),
  paid_at TIMESTAMPTZ,
  
  -- Export
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 **White-Label Template System**

### **Firm Branding**

```sql
-- Table: firm_branding
CREATE TABLE firm_branding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  
  -- Branding elements
  firm_name TEXT NOT NULL,
  trading_name TEXT,
  letterhead_html TEXT, -- HTML template for letters
  
  -- Logo
  logo_url TEXT,
  logo_position TEXT CHECK (logo_position IN ('left', 'center', 'right')),
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postcode TEXT,
  
  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Professional details
  firm_registration_number TEXT,
  tax_registration TEXT,
  professional_body TEXT, -- 'ICAEW', 'ACCA', etc.
  
  -- Colors (hex codes)
  primary_color TEXT DEFAULT '#1e40af',
  secondary_color TEXT DEFAULT '#64748b',
  
  -- Typography
  font_family TEXT DEFAULT 'Arial, sans-serif',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 **Feature Flag Enforcement (Middleware)**

### **TypeScript Implementation**

```typescript
// lib/subscription/featureFlags.ts

import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '@/lib/supabase/client';

interface FeatureCheck {
  organizationId: string;
  feature: keyof SubscriptionTier['features'];
}

/**
 * Check if organization has access to a feature
 */
export async function hasFeatureAccess(
  organizationId: string,
  feature: string
): Promise<boolean> {
  const { data: subscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select(`
      *,
      tier:subscription_tiers(features)
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .single();
  
  if (!subscription) return false;
  
  const features = subscription.tier.features;
  return features[feature] === true || features[feature] > 0;
}

/**
 * Check complaint quota
 */
export async function checkComplaintQuota(
  organizationId: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const { data: subscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select(`
      complaints_used_this_period,
      tier:subscription_tiers(features)
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .single();
  
  if (!subscription) {
    return { allowed: false, used: 0, limit: 0 };
  }
  
  const limit = subscription.tier.features.max_complaints_per_month;
  const used = subscription.complaints_used_this_period;
  
  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, used, limit: -1 };
  }
  
  return {
    allowed: used < limit,
    used,
    limit
  };
}

/**
 * Increment complaint usage
 */
export async function incrementComplaintUsage(
  organizationId: string
): Promise<void> {
  await supabaseAdmin
    .from('user_subscriptions')
    .update({
      complaints_used_this_period: supabaseAdmin.raw('complaints_used_this_period + 1'),
      updated_at: new Date().toISOString()
    })
    .eq('organization_id', organizationId);
}

/**
 * tRPC middleware for feature gating
 */
export const requireFeature = (feature: string) => {
  return async ({ ctx, next }: any) => {
    if (!ctx.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Organization required',
      });
    }
    
    const hasAccess = await hasFeatureAccess(ctx.organizationId, feature);
    
    if (!hasAccess) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `This feature requires a higher subscription tier. Please upgrade to access ${feature}.`,
      });
    }
    
    return next({ ctx });
  };
};
```

---

## 💳 **Payment Integration (Stripe)**

### **Stripe Setup**

```typescript
// lib/stripe/client.ts

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

/**
 * Create Stripe customer
 */
export async function createStripeCustomer(
  email: string,
  organizationId: string,
  organizationName: string
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      organization_id: organizationId,
      organization_name: organizationName,
    },
  });
  
  return customer.id;
}

/**
 * Create subscription checkout session
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 14, // 14-day free trial
    },
  });
  
  return session.url!;
}

/**
 * Handle Stripe webhooks
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
      // Create user_subscription record
      break;
    
    case 'customer.subscription.updated':
      // Update subscription status
      break;
    
    case 'customer.subscription.deleted':
      // Cancel subscription
      break;
    
    case 'invoice.payment_succeeded':
      // Reset monthly quota
      await resetMonthlyQuota(event.data.object.customer as string);
      break;
    
    case 'invoice.payment_failed':
      // Mark subscription as past_due
      break;
  }
}

/**
 * Reset monthly complaint quota on billing cycle
 */
async function resetMonthlyQuota(customerId: string): Promise<void> {
  await supabaseAdmin
    .from('user_subscriptions')
    .update({
      complaints_used_this_period: 0,
      last_reset_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);
}
```

---

## 📊 **Usage Dashboard (for Users)**

### **React Component**

```typescript
// components/subscription/UsageDashboard.tsx

export function UsageDashboard() {
  const { data: usage } = trpc.subscription.getUsage.useQuery();
  
  return (
    <Card>
      <CardHeader>
        <h2>Your Subscription</h2>
        <p>{usage?.tier.display_name} Plan</p>
      </CardHeader>
      
      <CardContent>
        {/* Complaint Quota */}
        <div>
          <h3>Monthly Complaints</h3>
          <Progress 
            value={(usage.complaints_used / usage.complaints_limit) * 100} 
          />
          <p>
            {usage.complaints_used} / {usage.complaints_limit === -1 ? '∞' : usage.complaints_limit}
          </p>
          {usage.complaints_remaining <= 3 && (
            <Alert>
              ⚠️ You're running low on complaints. Consider upgrading!
            </Alert>
          )}
        </div>
        
        {/* Feature Access */}
        <div>
          <h3>Available Features</h3>
          <ul>
            {usage.features.ai_draft_generation && <li>✅ AI Draft Generation</li>}
            {usage.features.precedent_search && <li>✅ Precedent Search</li>}
            {usage.features.cpd_access && <li>✅ CPD Content</li>}
            {usage.features.webinar_access !== 'none' && (
              <li>✅ Webinars ({usage.features.webinar_access})</li>
            )}
          </ul>
        </div>
        
        {/* Upgrade CTA */}
        {usage.tier.name !== 'enterprise' && (
          <Button onClick={() => router.push('/subscription/upgrade')}>
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 🎁 **Additional Feature Ideas**

Based on your requirements, here are additional features to consider:

### **1. ROI Calculator** ✅ (You mentioned this)
- Show potential recovery based on complaint type
- Compare charge-out rates with industry benchmarks
- Calculate ex-gratia payment estimates
- Show professional fee recovery potential

### **2. Compliance Timeline Tracker**
- MTD deadlines
- Filing reminders
- HMRC correspondence tracking
- Automated follow-up reminders

### **3. Client Portal** (White-label)
- Clients can view complaint progress
- Upload documents
- Approve letters before sending
- Track invoices and payments

### **4. Team Collaboration**
- Assign complaints to team members
- Internal notes and comments
- Approval workflows
- Activity audit trail

### **5. Template Library**
- Tier 1/2/Adjudicator templates
- Engagement letter templates
- Invoice templates
- HMRC-compliant formats

### **6. Analytics Dashboard**
- Success rate by complaint type
- Average resolution time
- Financial recovery metrics
- Charter breach frequency

### **7. Knowledge Base Search**
- AI-powered search across CPD, examples, precedents
- "Ask anything" chatbot trained on your content
- Contextual suggestions during letter drafting

### **8. Email Integration**
- Import HMRC correspondence automatically
- Track email threads
- Auto-categorize communications
- Reminder system for follow-ups

### **9. Reporting & Insights**
- Monthly practice reports
- Client-facing reports
- Recovery rate analysis
- Time tracking for billing

### **10. Community Forum** (Tiered access)
- Peer support
- Share anonymized examples
- Q&A section
- Expert contributions

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Foundation** (Weeks 1-4)
1. ✅ Database schema design
2. ✅ Subscription tier system
3. ✅ Stripe payment integration
4. ✅ Feature flag middleware
5. ✅ Usage tracking system

### **Phase 2: Core Features** (Weeks 5-8)
1. CPD content management system
2. Worked examples library
3. Webinar platform integration
4. Charge-out rate management
5. HMRC invoice generation

### **Phase 3: Enhanced Features** (Weeks 9-12)
1. White-label branding
2. ROI calculator
3. Client portal
4. Team collaboration tools
5. Advanced analytics

### **Phase 4: Optimization** (Weeks 13-16)
1. Performance optimization
2. User onboarding flow
3. Admin dashboard
4. Reporting suite
5. API documentation

---

## 💰 **Monetization Strategy**

### **Pricing Psychology**

```
Starter:       £99/month   (5 complaints)   = £19.80 per complaint
Professional:  £299/month  (20 complaints)  = £14.95 per complaint ✅ Best value
Enterprise:    £999/month  (unlimited)      = Volume pricing
```

### **Revenue Projections**

```
Target: 100 subscribers by Month 6

Conservative:
- 60 Starter (£99)    = £5,940/month
- 30 Professional (£299) = £8,970/month
- 10 Enterprise (£999)   = £9,990/month
Total: £24,900/month = £298,800/year

Optimistic:
- 40 Starter          = £3,960/month
- 80 Professional     = £23,920/month
- 30 Enterprise       = £29,970/month
Total: £57,850/month = £694,200/year
```

---

## 📋 **Next Steps**

Would you like me to:

1. **Start implementing the database schema** for subscription tiers?
2. **Build the Stripe integration** for payment processing?
3. **Create the CPD content management system**?
4. **Design the worked examples library**?
5. **Build the usage tracking and quota system**?

Let me know which component you'd like to tackle first, and I'll start building it! 🚀

