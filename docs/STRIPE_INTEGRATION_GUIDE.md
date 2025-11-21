# 🎯 **Stripe Integration - Implementation Guide**

**Date:** November 21, 2024  
**Status:** Step 3/3 - Ready to Implement  
**Estimated Time:** 2-3 hours

---

## 📋 **Overview**

This guide walks through integrating Stripe for subscription payments, including:
1. Stripe account setup
2. Product/price creation
3. Checkout session implementation
4. Webhook handling
5. Subscription management
6. Usage-based billing

---

## 🔧 **Step 1: Stripe Account Setup** (15 mins)

### **1.1 Create Stripe Account**

```bash
# Go to: https://dashboard.stripe.com/register
# Create account with your email
# Verify email
# Complete business details
```

### **1.2 Get API Keys**

```bash
# Navigate to: https://dashboard.stripe.com/test/apikeys
# Copy these keys:

# Test Mode (for development):
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Live Mode (for production - get these later):
STRIPE_SECRET_KEY_LIVE=sk_live_...
STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...
```

### **1.3 Add to Railway Environment Variables**

```bash
# In Railway dashboard → lightpoint-2.0 → Variables:
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### **1.4 Add to Local .env**

```bash
# In /lightpoint-2.0/.env.local:
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (get this after setting up webhooks)
```

---

## 🛍️ **Step 2: Create Products in Stripe** (30 mins)

### **Option A: Manual Creation** (Recommended for first time)

#### **2.1 Navigate to Products**
- Go to: https://dashboard.stripe.com/test/products
- Click "Add product"

#### **2.2 Create Starter Tier**

```
Product Name: Lightpoint Starter
Description: Perfect for solo practitioners handling occasional complaints
Statement descriptor: LIGHTPOINT STARTER

Pricing:
- Recurring: Monthly
- Price: £99.00
- Currency: GBP
- Product ID: (Stripe will generate - copy this)
- Price ID: (Stripe will generate - copy this)

Click "Add another price"
- Recurring: Yearly
- Price: £990.00
- Currency: GBP
```

#### **2.3 Create Professional Tier**

```
Product Name: Lightpoint Professional
Description: Everything you need to scale your complaints practice
Statement descriptor: LIGHTPOINT PRO

Pricing:
- Monthly: £299.00
- Yearly: £2,990.00
```

#### **2.4 Create Enterprise Tier**

```
Product Name: Lightpoint Enterprise
Description: Complete platform access with dedicated support
Statement descriptor: LIGHTPOINT ENT

Pricing:
- Monthly: £999.00
- Yearly: £9,990.00
```

#### **2.5 Copy Price IDs**

After creating, copy these IDs and add to `.env`:

```env
# Starter
STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_STARTER_ANNUAL_PRICE_ID=price_...

# Professional
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_...
STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_...

# Enterprise
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=price_...
```

### **Option B: Programmatic Creation** (Advanced)

```typescript
// Run this script once to create all products
// scripts/create-stripe-products.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

async function createProducts() {
  // Create Starter Product
  const starterProduct = await stripe.products.create({
    name: 'Lightpoint Starter',
    description: 'Perfect for solo practitioners handling occasional complaints',
  });

  // Create Monthly Price
  const starterMonthly = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 9900, // £99.00 in pence
    currency: 'gbp',
    recurring: { interval: 'month' },
  });

  // Create Annual Price
  const starterAnnual = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 99000, // £990.00 in pence
    currency: 'gbp',
    recurring: { interval: 'year' },
  });

  console.log('Starter Product created:');
  console.log(`Product ID: ${starterProduct.id}`);
  console.log(`Monthly Price ID: ${starterMonthly.id}`);
  console.log(`Annual Price ID: ${starterAnnual.id}`);

  // Repeat for Professional and Enterprise...
}

createProducts();
```

---

## 💳 **Step 3: Implement Checkout Flow** (45 mins)

### **3.1 Install Stripe SDK**

```bash
npm install stripe @stripe/stripe-js
```

### **3.2 Create Stripe Client**

File: `lib/stripe/client.ts`

```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});
```

### **3.3 Create Checkout API Route**

File: `app/api/stripe/create-checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { tierId, period } = await req.json();

    // Get user session
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tier details
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .single();

    if (!tier) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      );
    }

    // Determine price ID
    const priceId = period === 'annual'
      ? tier.stripe_annual_price_id
      : tier.stripe_monthly_price_id;

    // Create or get Stripe customer
    let stripeCustomerId = user.user_metadata?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Update user metadata
      await supabase.auth.updateUser({
        data: { stripe_customer_id: stripeCustomerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          tier_id: tierId,
          supabase_user_id: user.id,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### **3.4 Update Pricing Page with Checkout**

Add to `app/pricing/page.tsx`:

```typescript
const handleSubscribe = async (tierId: string, period: 'monthly' | 'annual') => {
  try {
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId, period }),
    });

    const { url } = await response.json();

    if (url) {
      // Redirect to Stripe Checkout
      window.location.href = url;
    }
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Failed to start checkout. Please try again.');
  }
};

// Update button click:
<Button onClick={() => handleSubscribe(tier.id, billingPeriod)}>
  Start 14-Day Free Trial
</Button>
```

---

## 🔔 **Step 4: Set Up Webhooks** (30 mins)

### **4.1 Install Stripe CLI** (for local testing)

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3005/api/stripe/webhook
```

### **4.2 Create Webhook Handler**

File: `app/api/stripe/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { supabaseAdmin } from '@/lib/supabase/client';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const tierId = session.metadata?.tier_id;
  const userId = session.metadata?.supabase_user_id;

  if (!tierId || !userId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Get user's organization
  const { data: user } = await supabaseAdmin
    .from('lightpoint_users')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (!user?.organization_id) {
    console.error('User organization not found');
    return;
  }

  // Create subscription record
  await supabaseAdmin.from('user_subscriptions').insert({
    organization_id: user.organization_id,
    tier_id: tierId,
    status: 'trial',
    billing_period: session.metadata?.billing_period || 'monthly',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: session.subscription as string,
  });

  console.log(`Subscription created for organization: ${user.organization_id}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const { data: sub } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: subscription.trial_end ? 'trial' : 'active',
      stripe_subscription_id: subscription.id,
    })
    .eq('stripe_customer_id', subscription.customer as string)
    .select()
    .single();

  console.log(`Subscription activated: ${subscription.id}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: subscription.status === 'active' ? 'active' : subscription.status as any,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`Subscription updated: ${subscription.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`Subscription canceled: ${subscription.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  // Reset monthly quota
  const { data: subscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (subscription) {
    await supabaseAdmin.rpc('reset_monthly_quota', {
      subscription_id_param: subscription.id,
    });

    console.log(`Monthly quota reset for subscription: ${subscriptionId}`);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  await supabaseAdmin
    .from('user_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId);

  console.log(`Payment failed for subscription: ${subscriptionId}`);
}
```

### **4.3 Set Up Production Webhook**

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://lightpoint.uk/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy signing secret and add to Railway:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## ✅ **Step 5: Testing Checklist**

### **5.1 Test Card Numbers**

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Require 3D Secure: 4000 0025 0000 3155

Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits
ZIP: Any 5 digits
```

### **5.2 Test Flow**

1. ✅ Click "Start Trial" on pricing page
2. ✅ Redirects to Stripe Checkout
3. ✅ Enter test card details
4. ✅ Complete checkout
5. ✅ Redirects to success page
6. ✅ Check database: subscription created
7. ✅ Check Stripe Dashboard: subscription active
8. ✅ Test creating a complaint (should work during trial)
9. ✅ Test quota enforcement

---

## 📊 **Summary**

**Total Implementation Time:** ~2-3 hours

**Files Created:**
- `lib/stripe/client.ts`
- `app/api/stripe/create-checkout/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/subscription/success/page.tsx` (success page)

**Environment Variables Added:**
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_[TIER]_[PERIOD]_PRICE_ID` (6 variables)

**Ready for:** Live launch! 🚀

