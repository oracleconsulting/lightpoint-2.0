# Lightpoint Multi-Tenant SaaS Architecture

## Overview

Lightpoint is a **B2B SaaS platform** for accounting firms to manage HMRC complaints on behalf of their clients.

**User Model:**
- **Customers** = Accounting firms (the paying subscribers)
- **End Users** = Staff at accounting firms who use the platform
- **Their Clients** = The accounting firm's clients (taxpayers with HMRC issues)

---

## Architecture

The current platform (`lightpoint.uk`) serves as both the marketing site AND the customer application. There's no need for a separate portal - the existing platform already has:

✅ Multi-tenant organization isolation (RLS)  
✅ Role-based access control (admin, user, superadmin)  
✅ Stripe subscription management  
✅ Practice settings per organization  
✅ Team management  

### What We're Adding: Pilot Invite System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PILOT INVITE FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. LIGHTPOINT ADMIN                                                        │
│     └─→ /admin/customers → "Invite New Customer"                           │
│         ├─→ Enter: Organization name, admin email, trial days              │
│         └─→ System sends invite email with unique token                    │
│                                                                             │
│  2. ACCOUNTING FIRM ADMIN                                                   │
│     └─→ Clicks link in email → /accept-invite?token=xxx                    │
│         ├─→ Creates Supabase auth account                                  │
│         ├─→ System creates organization                                    │
│         ├─→ Links user as org admin                                        │
│         └─→ Redirects to /user/dashboard                                   │
│                                                                             │
│  3. FIRM USES PLATFORM                                                      │
│     └─→ /user/dashboard                                                    │
│         ├─→ Create complaints                                              │
│         ├─→ Upload documents                                               │
│         ├─→ Generate letters                                               │
│         ├─→ Track time                                                     │
│         └─→ Invite team members (via /settings/team)                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### New Tables

```sql
-- Organization invites (from Lightpoint admin to accounting firms)
CREATE TABLE organization_invites (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  contact_name TEXT,
  invited_by UUID REFERENCES lightpoint_users(id),
  token TEXT UNIQUE NOT NULL,
  tier_id UUID REFERENCES subscription_tiers(id),
  trial_days INTEGER DEFAULT 30,
  status TEXT DEFAULT 'pending', -- pending, accepted, expired, cancelled
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team invites (from org admin to team members)
CREATE TABLE team_invites (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'user', -- admin, user
  invited_by UUID REFERENCES lightpoint_users(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
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
   - /admin/* routes
   - Super admin functions
```

### RLS Enforcement

All data isolation is enforced at the database level via Row Level Security:

```sql
-- Example: Complaints only visible to same organization
CREATE POLICY "Users can view org complaints" ON complaints
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM lightpoint_users 
      WHERE id = auth.uid()
    )
  );
```

---

## Admin Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/admin` | Admin dashboard | Superadmin only |
| `/admin/customers` | Invite & manage customers | Superadmin only |
| `/admin/tiers` | Subscription tier management | Superadmin only |
| `/admin/blog` | Blog CMS | Superadmin only |
| `/admin/analytics` | Platform analytics | Superadmin only |

---

## Customer Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/user/dashboard` | Main dashboard | All authenticated users |
| `/complaints` | Complaint management | All authenticated users |
| `/settings/practice` | Practice settings | Org admins |
| `/settings/team` | Team management | Org admins |
| `/subscription` | Subscription management | Org admins |

---

## Implementation Status

### ✅ Completed

- [x] Database schema for invites (`SETUP_PILOT_INVITE_SYSTEM.sql`)
- [x] Admin customers page (`/admin/customers`)
- [x] tRPC admin router (`lib/trpc/routers/admin.ts`)
- [x] Accept invite page (`/accept-invite`)
- [x] API routes for invite verification and acceptance
- [x] Email templates (via Resend)

### 🔲 To Do

- [ ] Run SQL migration in Supabase
- [ ] Add Resend API key to environment
- [ ] Test invite flow end-to-end
- [ ] Add team invite UI to settings page

---

## Quick Start

### 1. Run the SQL Migration

In Supabase SQL Editor, run:
```
supabase/SETUP_PILOT_INVITE_SYSTEM.sql
```

### 2. Add Resend API Key

Add to Railway environment:
```
RESEND_API_KEY=re_xxxxxxxxx
```

### 3. Invite Your First Customer

1. Go to `/admin/customers`
2. Click "Invite New Customer"
3. Enter organization name and admin email
4. Customer receives email with invite link
5. Customer creates account and joins

---

*Document Version: 3.0*
*Last Updated: November 2025*
