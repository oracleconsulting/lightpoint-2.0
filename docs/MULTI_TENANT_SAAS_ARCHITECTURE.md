# Lightpoint Multi-Tenant SaaS Architecture

## Executive Summary

Lightpoint is a **B2B SaaS platform** for accounting firms to manage HMRC complaints on behalf of their clients.

**Key Clarification:**
- **Customers** = Accounting firms (the paying subscribers)
- **End users** = Staff at accounting firms who use the platform
- **Their clients** = The accounting firm's clients (taxpayers with HMRC issues)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHARED SUPABASE DATABASE                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  organizations │ lightpoint_users │ complaints │ documents │ letters │   │
│  │  subscriptions │ time_logs │ analytics │ (NO access to: ai_prompts, │   │
│  │                │           │           │  knowledge_base, precedents)│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                    │
                    ▼                                    ▼
    ┌───────────────────────────────┐    ┌───────────────────────────────┐
    │      CUSTOMER PORTAL          │    │      ADMIN PLATFORM           │
    │      app.lightpoint.uk        │    │      lightpoint.uk            │
    │                               │    │                               │
    │  FOR: Accounting Firms        │    │  FOR: Lightpoint Team Only    │
    │                               │    │                               │
    │  • Manage complaints          │    │  • Marketing homepage         │
    │  • Upload documents           │    │  • Knowledge base admin       │
    │  • Generate letters           │    │  • AI prompt management       │
    │  • Track time & billing       │    │  • Precedent library          │
    │  • Practice settings          │    │  • Super admin functions      │
    │  • Team management            │    │  • Analytics dashboard        │
    │  • Subscription management    │    │  • Blog CMS                   │
    │                               │    │  • Customer support           │
    │  Auth: Supabase Auth          │    │  Auth: Supabase Auth          │
    │  RLS: organization_id         │    │  RLS: superadmin role         │
    └───────────────────────────────┘    └───────────────────────────────┘
              │                                    │
              │         Railway Deployments        │
              ▼                                    ▼
    ┌───────────────────────────────┐    ┌───────────────────────────────┐
    │  lightpoint-app               │    │  lightpoint-2.0               │
    │  (Customer-facing)            │    │  (Admin + Marketing)          │
    └───────────────────────────────┘    └───────────────────────────────┘
```

---

## Domain Strategy

| Domain | Purpose | Users |
|--------|---------|-------|
| **lightpoint.uk** | Marketing + Blog + Signup | Public + Lightpoint admins |
| **app.lightpoint.uk** | Customer SaaS platform | Accounting firm staff |

---

## User Types & Permissions

### 1. Lightpoint Super Admins (lightpoint.uk)
- Full access to everything
- Knowledge base management
- AI prompt configuration
- Precedent library
- Customer support & analytics
- Blog CMS

### 2. Customer Organization Admins (app.lightpoint.uk)
- Manage their organization's settings
- Invite/remove team members
- View billing & subscription
- Access all complaints in their org
- Practice settings (letterhead, rates)

### 3. Customer Organization Users (app.lightpoint.uk)
- Create and manage complaints
- Upload documents
- Generate letters
- Track time
- View assigned complaints

---

## Phase 1: Pilot Invite System

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PILOT INVITE FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. LIGHTPOINT ADMIN SENDS INVITE                                          │
│     ├─→ Admin goes to lightpoint.uk/admin/customers                        │
│     ├─→ Creates new organization for the accounting firm                   │
│     ├─→ Enters firm name, admin email, pilot tier                         │
│     └─→ System sends invite email                                          │
│                                                                             │
│  2. ACCOUNTING FIRM ADMIN ACCEPTS                                          │
│     ├─→ Clicks link in email → app.lightpoint.uk/accept-invite            │
│     ├─→ Sets password, confirms details                                    │
│     ├─→ Organization created with pilot subscription                       │
│     └─→ Redirected to app.lightpoint.uk/dashboard                         │
│                                                                             │
│  3. FIRM ADMIN INVITES TEAM                                                │
│     ├─→ Goes to app.lightpoint.uk/settings/team                           │
│     ├─→ Invites team members by email                                      │
│     ├─→ Team members receive invite, set password                          │
│     └─→ Team can now use the platform                                      │
│                                                                             │
│  4. TEAM USES PLATFORM                                                     │
│     ├─→ Create complaints for their clients                                │
│     ├─→ Upload documents, generate letters                                 │
│     ├─→ Track time, manage cases                                           │
│     └─→ All isolated to their organization                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Schema for Invites

```sql
-- Organization invites (from Lightpoint admin to accounting firms)
CREATE TABLE organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  invited_by UUID REFERENCES lightpoint_users(id), -- Lightpoint admin
  token TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'pilot', -- pilot, starter, professional, enterprise
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team member invites (from org admin to team members)
CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'user', -- admin, user
  invited_by UUID REFERENCES lightpoint_users(id), -- Org admin
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 2: Self-Service Signup with Stripe

### Subscription Tiers

| Tier | Price | Complaints/mo | Users | Features |
|------|-------|---------------|-------|----------|
| **Starter** | £49/mo | 5 | 2 | Basic AI analysis, letter generation |
| **Professional** | £149/mo | 25 | 5 | + Time tracking, precedent matching |
| **Enterprise** | £399/mo | Unlimited | Unlimited | + API access, custom branding, priority support |

### Signup Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SELF-SERVICE SIGNUP FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. DISCOVERY                                                               │
│     ├─→ User visits lightpoint.uk                                          │
│     ├─→ Reads about features, views pricing                                │
│     └─→ Clicks "Start Free Trial" or "Get Started"                         │
│                                                                             │
│  2. ACCOUNT CREATION                                                        │
│     ├─→ Redirected to app.lightpoint.uk/signup                            │
│     ├─→ Enters: Email, Password, Firm Name                                 │
│     ├─→ Email verification sent                                            │
│     └─→ Clicks verification link                                           │
│                                                                             │
│  3. SUBSCRIPTION SELECTION                                                  │
│     ├─→ Shown tier options (Starter, Professional, Enterprise)             │
│     ├─→ Free trial: 14 days on Professional tier                          │
│     ├─→ Enters payment details via Stripe Checkout                         │
│     └─→ Subscription activated                                             │
│                                                                             │
│  4. ONBOARDING                                                              │
│     ├─→ Guided setup wizard                                                 │
│     ├─→ Configure practice settings (letterhead, rates)                    │
│     ├─→ Invite team members                                                 │
│     └─→ Create first complaint                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Security Model

### What Customers CAN Access

```
✅ Their organization's data only:
   - complaints (where organization_id = their org)
   - documents (attached to their complaints)
   - generated_letters (for their complaints)
   - time_logs (for their complaints)
   - lightpoint_users (in their organization)
   - their subscription & billing info

✅ AI-generated outputs:
   - Analysis results
   - Generated letters
   - Precedent matches (results only, not the source)
```

### What Customers CANNOT Access

```
❌ Lightpoint internal systems:
   - knowledge_base (HMRC guidance documents)
   - precedents (full precedent library)
   - ai_prompts (prompt configurations)
   - Other organizations' data
   - Admin analytics
   - Blog CMS
   - Super admin functions
```

### Row Level Security

```sql
-- Complaints: Users can only see their organization's complaints
CREATE POLICY "Users can view org complaints" ON complaints
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM lightpoint_users 
      WHERE id = auth.uid()
    )
  );

-- Knowledge base: Only superadmins can access
CREATE POLICY "Only superadmins can view knowledge base" ON knowledge_base
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lightpoint_users 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- AI Prompts: Only superadmins can access
CREATE POLICY "Only superadmins can view prompts" ON ai_prompts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lightpoint_users 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );
```

---

## Customer Portal Features (app.lightpoint.uk)

### Dashboard
- Active complaints count
- Recent activity
- Upcoming deadlines
- Quick actions

### Complaints
- Create new complaint
- View all complaints
- Filter by status, client, date
- Complaint detail view

### Documents
- Upload documents
- View document library
- OCR status
- Document preview

### Letters
- View generated letters
- Edit/regenerate
- Lock and send
- Download PDF

### Time Tracking
- View time logs
- Manual time entry
- Export for invoicing

### Settings
- **Practice Settings**: Letterhead, charge-out rate, contact details
- **Team Management**: Invite users, manage roles
- **Subscription**: View plan, upgrade, billing history
- **Integrations**: (Future) API keys, webhooks

---

## Implementation Plan

### Week 1: Pilot Invite System
- [ ] Create `organization_invites` table
- [ ] Create `team_invites` table
- [ ] Build admin invite UI (lightpoint.uk/admin/customers)
- [ ] Build accept invite flow (app.lightpoint.uk/accept-invite)
- [ ] Email templates for invites

### Week 2: Customer Portal Base
- [ ] Create app.lightpoint.uk deployment
- [ ] Authentication flow (Supabase Auth)
- [ ] Dashboard page
- [ ] Complaints list (filtered by org)
- [ ] Basic navigation

### Week 3: Core Features
- [ ] Complaint creation (same as current)
- [ ] Document upload
- [ ] Letter generation
- [ ] Time tracking

### Week 4: Settings & Team
- [ ] Practice settings page
- [ ] Team management (invite, remove)
- [ ] Role-based permissions
- [ ] Subscription view (read-only for pilot)

### Week 5: Stripe Integration
- [ ] Stripe products & prices setup
- [ ] Checkout flow
- [ ] Webhook handling
- [ ] Subscription management
- [ ] Usage tracking

### Week 6: Polish & Launch
- [ ] Onboarding wizard
- [ ] Help documentation
- [ ] Error handling
- [ ] Performance optimization
- [ ] Security audit

---

## Technical Decisions

### Single Codebase vs Separate Apps

**Recommendation: Single codebase with route-based separation**

```
lightpoint-2.0/
├── app/
│   ├── (marketing)/          # lightpoint.uk routes
│   │   ├── page.tsx          # Homepage
│   │   ├── pricing/
│   │   ├── blog/
│   │   └── ...
│   ├── (admin)/              # Admin-only routes
│   │   ├── admin/
│   │   │   ├── customers/    # Manage customer orgs
│   │   │   ├── knowledge/    # Knowledge base
│   │   │   ├── prompts/      # AI prompts
│   │   │   └── analytics/    # Platform analytics
│   │   └── ...
│   └── (customer)/           # app.lightpoint.uk routes
│       ├── dashboard/
│       ├── complaints/
│       ├── documents/
│       ├── letters/
│       ├── settings/
│       │   ├── practice/
│       │   ├── team/
│       │   └── subscription/
│       └── ...
├── middleware.ts             # Route protection & subdomain handling
└── ...
```

### Subdomain Routing in Middleware

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const isAppSubdomain = hostname.startsWith('app.');
  
  if (isAppSubdomain) {
    // Rewrite to customer routes
    const url = request.nextUrl.clone();
    url.pathname = `/customer${url.pathname}`;
    return NextResponse.rewrite(url);
  }
  
  // Default: marketing/admin routes
  return NextResponse.next();
}
```

---

## Migration Path

### For Existing Users (You)
1. Your organization remains as-is
2. You get `superadmin` role
3. Access to both admin and customer features
4. No disruption to current workflow

### For Pilot Customers
1. Receive invite from you
2. Set up their organization
3. Configure practice settings
4. Start using immediately

### For Self-Service Customers (Later)
1. Sign up via lightpoint.uk
2. Choose subscription tier
3. Complete payment
4. Auto-provisioned organization

---

## Next Steps

1. **Approve this architecture** - Confirm the approach
2. **Start with invite system** - Week 1 implementation
3. **Build customer portal** - Weeks 2-4
4. **Add Stripe** - Week 5
5. **Launch pilot** - Week 6

---

*Document Version: 2.0*
*Created: November 2025*
*Status: Pending Approval*

