# 🎉 STRIPE INTEGRATION - COMPLETE SETUP GUIDE

## ✅ WHAT'S BEEN BUILT:

Full Stripe subscription integration with:
- ✅ Checkout sessions (with 14-day free trial)
- ✅ Webhook handling (subscription events)
- ✅ Customer portal (manage subscriptions)
- ✅ Database sync (Supabase ↔ Stripe)
- ✅ Success page
- ✅ Real-time status updates

---

## 🔧 ENVIRONMENT VARIABLES NEEDED:

Add these to your **Railway environment variables**:

```bash
# Publishable Key (starts with pk_live_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE

# Secret Key (starts with sk_live_... - KEEP SECRET!)
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE

# Webhook Secret (starts with whsec_... - YOU NEED TO GET THIS)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# App URL (your production domain)
NEXT_PUBLIC_APP_URL=https://lightpoint.uk
```

**⚠️ SECURITY NOTE:** The actual keys have been provided separately and should be added directly to Railway environment variables. Never commit actual keys to Git!

---

## 🔔 WEBHOOK SETUP (CRITICAL):

### Step 1: Create Webhook Endpoint

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter **Endpoint URL**: `https://lightpoint.uk/api/webhooks/stripe`
4. Select these **6 events**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Click **"Add endpoint"**

### Step 2: Get Webhook Secret

1. After creating the endpoint, click on it
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_...`)
4. Add it to Railway environment variables as `STRIPE_WEBHOOK_SECRET`

---

## 🚀 DEPLOYMENT STEPS:

### 1. Run Database Migration

In **Supabase SQL Editor**, run:

```sql
-- Copy/paste contents of:
-- migrations/007_stripe_integration.sql
```

This will:
- Add Stripe columns to `subscription_tiers`
- Add Stripe columns to `user_subscriptions`
- Create `stripe_events` log table
- Update all tiers with your Price IDs
- Add helper functions

### 2. Add Environment Variables to Railway

Go to your Railway project → Variables → Add:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(your key)
STRIPE_SECRET_KEY=(your key)
STRIPE_WEBHOOK_SECRET=(from webhook setup above)
NEXT_PUBLIC_APP_URL=https://lightpoint.uk
```

### 3. Deploy!

The code is already pushed to GitHub, so Railway will auto-deploy.

---

## 🎯 HOW IT WORKS:

### User Flow:

```
1. User visits /pricing
2. Clicks "Start 14-Day Free Trial"
3. If not logged in → redirects to /login
4. If logged in → creates Stripe Checkout Session
5. Redirects to Stripe hosted checkout page
6. User enters payment info
7. Stripe processes payment
8. Redirects back to /subscription/success
9. Webhook fires → updates database
10. User has active subscription!
```

### Technical Flow:

```
┌─────────────┐
│ Pricing Page│
└──────┬──────┘
       │ POST /api/stripe/create-checkout
       ▼
┌──────────────┐
│ Stripe API   │ Creates checkout session
└──────┬───────┘
       │ Redirects to Stripe
       ▼
┌──────────────┐
│ Stripe UI    │ User pays
└──────┬───────┘
       │ Webhook: checkout.session.completed
       ▼
┌──────────────────┐
│ /api/webhooks/   │ Processes event
│ stripe           │
└──────┬───────────┘
       │ Updates database
       ▼
┌──────────────────┐
│ user_subscriptions│ Status: active
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ /subscription/   │ Success page
│ success          │
└──────────────────┘
```

---

## 📋 FILES CREATED:

### API Routes:
1. **`app/api/stripe/create-checkout/route.ts`** - Creates checkout sessions
2. **`app/api/webhooks/stripe/route.ts`** - Handles Stripe webhooks
3. **`app/api/stripe/create-portal/route.ts`** - Customer portal (manage subscription)

### Pages:
1. **`app/subscription/success/page.tsx`** - Success page after payment

### Migrations:
1. **`migrations/007_stripe_integration.sql`** - Database schema updates

### Updates:
1. **`app/pricing/page.tsx`** - Now creates real Stripe checkouts
2. **`package.json`** - Added `stripe` and `@stripe/stripe-js`

---

## 🎉 FEATURES:

### ✅ For Users:
- 14-day free trial (no charge until trial ends)
- Secure Stripe checkout
- Automatic subscription activation
- Email confirmation with invoice
- Manage subscription via customer portal
- Cancel anytime

### ✅ For You:
- Automatic payment processing
- Subscription lifecycle management
- Failed payment handling
- Prorated upgrades/downgrades
- Revenue tracking in Stripe Dashboard
- Webhook event logging in database

---

## 🧪 TESTING:

### Test Cards (for testing):

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184

Any future date for expiry
Any 3 digits for CVC
Any postal code
```

### Test Flow:

1. Go to `/pricing`
2. Click "Start 14-Day Free Trial"
3. Use test card above
4. Should redirect to `/subscription/success`
5. Check database: `user_subscriptions` should have new row
6. Check Stripe Dashboard: subscription should appear

---

## 🔍 VERIFICATION:

### Check Database:

```sql
-- See updated tiers with Stripe IDs
SELECT name, stripe_price_id_monthly, stripe_price_id_annual 
FROM subscription_tiers;

-- See user subscriptions
SELECT * FROM user_subscriptions 
WHERE stripe_subscription_id IS NOT NULL;

-- See webhook events
SELECT event_type, processed, created_at 
FROM stripe_events 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Stripe Dashboard:

1. Go to: https://dashboard.stripe.com/subscriptions
2. Should see subscriptions after users sign up

---

## ⚠️ IMPORTANT NOTES:

1. **Free Trial**: Set to 14 days in `create-checkout/route.ts` (line 46)
2. **Webhook URL**: Must be HTTPS in production
3. **Price IDs**: Already configured in migration for all 6 tiers
4. **Customer Portal**: Users can manage subscription at `/api/stripe/create-portal`
5. **Test vs Live**: You're using LIVE keys - be careful!

---

## 🚨 BEFORE YOU GO LIVE:

- [ ] Run migration 007
- [ ] Add all 4 environment variables to Railway
- [ ] Create webhook endpoint in Stripe Dashboard
- [ ] Test with test card (if possible)
- [ ] Verify webhook is receiving events
- [ ] Check database updates on test purchase

---

## 📞 WHAT TO SEND ME:

**Just send me the webhook secret:**

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

And I'll add it to the deployment guide!

---

## ✅ STATUS:

- [x] Stripe SDK installed
- [x] Checkout API route created
- [x] Webhook handler built
- [x] Customer portal endpoint
- [x] Success page designed
- [x] Pricing page updated
- [x] Database migration ready
- [x] Price IDs configured
- [ ] Webhook secret needed
- [ ] Migration 007 to be run
- [ ] Environment variables to be set

**Almost ready to take payments!** 🎉

