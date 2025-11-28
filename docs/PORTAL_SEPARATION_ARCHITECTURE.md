# Lightpoint Portal Separation Architecture

## Executive Summary

**Recommendation: YES - Separate client.lightpoint.uk from lightpoint.uk**

Based on the successful Torsor implementation and Lightpoint's specific requirements, a two-portal architecture is strongly recommended for:
- **Security isolation** between admin/internal functions and client access
- **Scalability** - independent scaling of client-facing services
- **UX optimization** - tailored experiences for each user type
- **GTM readiness** - professional, focused client experience

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHARED SUPABASE DATABASE                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  complaints │ documents │ letters │ knowledge_base │ organizations  │   │
│  │  users      │ analytics │ billing │ ai_prompts     │ precedents     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                    │
                    ▼                                    ▼
    ┌───────────────────────────┐        ┌───────────────────────────┐
    │    CLIENT PORTAL          │        │    MAIN PLATFORM          │
    │    client.lightpoint.uk   │        │    lightpoint.uk          │
    │                           │        │                           │
    │  • Submit complaints      │        │  • Marketing homepage     │
    │  • Upload documents       │        │  • Admin dashboard        │
    │  • View case status       │        │  • User management        │
    │  • Download letters       │        │  • Knowledge base admin   │
    │  • Track progress         │        │  • Analytics & reporting  │
    │  • Secure messaging       │        │  • Billing & subscriptions│
    │  • Invoice access         │        │  • Blog CMS               │
    │                           │        │  • AI prompt management   │
    │  Auth: Client JWT         │        │  Auth: Supabase Auth      │
    │  RLS: organization_id     │        │  RLS: organization_id     │
    └───────────────────────────┘        └───────────────────────────┘
              │                                    │
              │         Railway Deployments        │
              ▼                                    ▼
    ┌───────────────────────────┐        ┌───────────────────────────┐
    │  lightpoint-client-portal │        │  lightpoint-2.0           │
    │  (Separate Railway app)   │        │  (Existing Railway app)   │
    └───────────────────────────┘        └───────────────────────────┘
```

---

## Domain Strategy

| Domain | Purpose | Users |
|--------|---------|-------|
| **lightpoint.uk** | Marketing + Admin Platform | Internal team, admins |
| **client.lightpoint.uk** | Client-facing portal | End clients (accountants) |
| **api.lightpoint.uk** (optional) | Shared API layer | Both portals |

### DNS Configuration (Cloudflare)

```
lightpoint.uk          → Railway (lightpoint-2.0)
client.lightpoint.uk   → Railway (lightpoint-client-portal)
api.lightpoint.uk      → Railway (lightpoint-api) [optional]
```

---

## User Journeys

### Client Journey (client.lightpoint.uk)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT PORTAL FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. INVITATION                                                              │
│     ├─→ Accountant sends invite from lightpoint.uk                         │
│     ├─→ Client receives email with link to client.lightpoint.uk            │
│     └─→ Client sets password and activates account                         │
│                                                                             │
│  2. COMPLAINT SUBMISSION                                                    │
│     ├─→ Client logs in to client.lightpoint.uk                             │
│     ├─→ Fills out complaint form (guided wizard)                           │
│     ├─→ Uploads supporting documents                                        │
│     └─→ Submits for AI analysis                                            │
│                                                                             │
│  3. PROGRESS TRACKING                                                       │
│     ├─→ Dashboard shows complaint status                                    │
│     ├─→ Timeline of actions taken                                          │
│     ├─→ Document repository                                                │
│     └─→ Secure messaging with accountant                                   │
│                                                                             │
│  4. LETTER ACCESS                                                           │
│     ├─→ View generated complaint letters                                    │
│     ├─→ Download as PDF/Word                                               │
│     ├─→ Track HMRC responses                                               │
│     └─→ Access invoice history                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Accountant Journey (lightpoint.uk)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MAIN PLATFORM FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. MARKETING & SIGNUP                                                      │
│     ├─→ Landing page, pricing, blog                                        │
│     ├─→ Free trial signup                                                  │
│     └─→ Subscription management                                            │
│                                                                             │
│  2. ADMIN DASHBOARD                                                         │
│     ├─→ View all client complaints                                         │
│     ├─→ Manage team members                                                │
│     ├─→ Analytics & reporting                                              │
│     └─→ Knowledge base management                                          │
│                                                                             │
│  3. COMPLAINT MANAGEMENT                                                    │
│     ├─→ Review AI analysis                                                 │
│     ├─→ Edit/approve letters                                               │
│     ├─→ Track time & billing                                               │
│     └─→ Manage escalations                                                 │
│                                                                             │
│  4. CLIENT MANAGEMENT                                                       │
│     ├─→ Invite clients to portal                                           │
│     ├─→ Monitor client activity                                            │
│     ├─→ Secure messaging                                                   │
│     └─→ Generate invoices                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Phase 1: Create Client Portal App

```
lightpoint-client-portal/
├── app/
│   ├── layout.tsx              # Client portal layout
│   ├── page.tsx                # Login page
│   ├── dashboard/
│   │   └── page.tsx            # Client dashboard
│   ├── complaints/
│   │   ├── page.tsx            # List complaints
│   │   ├── new/
│   │   │   └── page.tsx        # Submit new complaint
│   │   └── [id]/
│   │       └── page.tsx        # Complaint detail
│   ├── documents/
│   │   └── page.tsx            # Document vault
│   ├── letters/
│   │   └── page.tsx            # Generated letters
│   ├── messages/
│   │   └── page.tsx            # Secure messaging
│   └── account/
│       └── page.tsx            # Account settings
├── components/
│   ├── ClientNav.tsx           # Simplified navigation
│   ├── ComplaintWizard.tsx     # Step-by-step submission
│   ├── DocumentUploader.tsx    # File upload
│   ├── StatusTimeline.tsx      # Progress tracker
│   └── SecureMessaging.tsx     # Chat interface
├── lib/
│   ├── clientAuth.ts           # Client authentication
│   ├── supabase.ts             # Shared Supabase client
│   └── api.ts                  # API helpers
└── middleware.ts               # Auth middleware
```

### Phase 2: Authentication Strategy

```typescript
// Client Portal Auth (client.lightpoint.uk)
// Uses custom JWT tokens stored in client_portal_auth table

interface ClientAuth {
  client_id: string;           // UUID
  organization_id: string;     // Links to accountant's org
  email: string;
  password_hash: string;
  last_login: Date;
  is_active: boolean;
}

// Main Platform Auth (lightpoint.uk)
// Uses Supabase Auth with organization-based RLS

interface UserAuth {
  id: string;                  // Supabase auth.users.id
  organization_id: string;     // Organization membership
  role: 'admin' | 'user';
  email: string;
}
```

### Phase 3: Database Schema Updates

```sql
-- Client Portal Users (separate from main auth)
CREATE TABLE client_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Invitations
CREATE TABLE client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  invited_by UUID REFERENCES lightpoint_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Client Portal
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own complaints" ON complaints
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM client_portal_users 
      WHERE id = current_setting('app.current_client_id')::uuid
    )
  );

CREATE POLICY "Clients can create complaints" ON complaints
  FOR INSERT
  WITH CHECK (
    client_id = current_setting('app.current_client_id')::uuid
  );
```

### Phase 4: Railway Deployment

```yaml
# railway.toml for client portal
[build]
builder = "nixpacks"

[deploy]
startCommand = "node .next/standalone/server.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 300

[[services]]
name = "lightpoint-client-portal"
domain = "client.lightpoint.uk"
```

---

## Feature Comparison

| Feature | client.lightpoint.uk | lightpoint.uk |
|---------|---------------------|---------------|
| **Authentication** | Custom JWT | Supabase Auth |
| **User Type** | End clients | Accountants/Admins |
| **Complaint Submit** | ✅ | ❌ (view only) |
| **Document Upload** | ✅ | ✅ |
| **Letter View** | ✅ (own only) | ✅ (all clients) |
| **Letter Edit** | ❌ | ✅ |
| **AI Analysis** | View results | Trigger & edit |
| **Knowledge Base** | ❌ | ✅ Admin |
| **Blog CMS** | ❌ | ✅ |
| **User Management** | ❌ | ✅ |
| **Billing/Stripe** | View invoices | Full management |
| **Analytics** | Basic stats | Full dashboard |
| **Time Tracking** | ❌ | ✅ |

---

## Security Considerations

### Data Isolation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ROW LEVEL SECURITY                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Client Portal Access:                                                      │
│  ├─→ Can ONLY see data where client_id = their ID                          │
│  ├─→ Cannot see other clients' data                                        │
│  ├─→ Cannot access admin functions                                         │
│  └─→ Cannot modify knowledge base or prompts                               │
│                                                                             │
│  Main Platform Access:                                                      │
│  ├─→ Can see ALL data within their organization                            │
│  ├─→ Admin users can manage all org settings                               │
│  ├─→ Can invite and manage clients                                         │
│  └─→ Full access to knowledge base and AI prompts                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
Client Login (client.lightpoint.uk):
1. POST /api/auth/login { email, password }
2. Verify against client_portal_users table
3. Generate JWT with client_id, organization_id
4. Set httpOnly cookie
5. Client-side stores token for API calls

Admin Login (lightpoint.uk):
1. Supabase Auth signIn()
2. Verify organization membership
3. Supabase session cookie
4. RLS policies enforce access
```

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Create `lightpoint-client-portal` repository
- [ ] Set up Next.js project with shared UI components
- [ ] Configure Supabase connection (shared database)
- [ ] Implement client authentication system

### Week 2: Core Features
- [ ] Client dashboard
- [ ] Complaint submission wizard
- [ ] Document upload system
- [ ] Status tracking timeline

### Week 3: Integration
- [ ] Letter viewing (read-only)
- [ ] Secure messaging between client and accountant
- [ ] Invoice access
- [ ] Email notifications

### Week 4: Deployment & Polish
- [ ] Railway deployment setup
- [ ] DNS configuration (client.lightpoint.uk)
- [ ] SSL certificates
- [ ] Testing and QA
- [ ] Documentation

---

## Cost Analysis

### Current (Single App)
- Railway: ~£20/month
- Supabase: ~£25/month
- Total: ~£45/month

### With Portal Separation
- Railway (main): ~£20/month
- Railway (client): ~£15/month (lighter app)
- Supabase: ~£25/month (shared)
- Total: ~£60/month (+£15)

**ROI**: The £15/month increase provides:
- Better security isolation
- Independent scaling
- Professional client experience
- Easier maintenance
- GTM-ready architecture

---

## Migration Path

### For Existing Users
1. No changes needed for accountant users
2. New client portal URL communicated
3. Existing client data preserved
4. Gradual migration of client-facing features

### For New Clients
1. All new invitations go to client.lightpoint.uk
2. Clean onboarding experience
3. No legacy baggage

---

## Alternatives Considered

### Option A: Single App with Role-Based Routing ❌
- **Pros**: Simpler deployment, shared codebase
- **Cons**: Security risk, bloated client bundle, harder to scale

### Option B: Subdirectory Routing (lightpoint.uk/client) ❌
- **Pros**: Single deployment
- **Cons**: Shared authentication complexity, no true isolation

### Option C: Separate Portals (Recommended) ✅
- **Pros**: True isolation, independent scaling, better UX
- **Cons**: Slightly more infrastructure cost

---

## Next Steps

1. **Approve architecture** - Confirm this approach
2. **Create repository** - `lightpoint-client-portal`
3. **Set up Railway** - New service for client portal
4. **Configure DNS** - Add client.lightpoint.uk
5. **Build MVP** - Core client features
6. **Test with pilot users** - Validate experience
7. **Full rollout** - Migrate all clients

---

*Document Version: 1.0*
*Created: November 2025*
*Status: Pending Approval*

