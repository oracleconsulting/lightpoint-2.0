import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-11-17.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

export async function POST(req: NextRequest) {
  // Dynamic import to avoid build-time evaluation
  const { supabaseAdmin } = await import('@/lib/supabase/client');
  
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Log the event
  await (supabaseAdmin as any).from('stripe_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    data: event.data as any,
    processed: false,
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabaseAdmin);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, supabaseAdmin);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabaseAdmin);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabaseAdmin);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabaseAdmin);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await (supabaseAdmin as any)
      .from('stripe_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    
    // Log error
    await (supabaseAdmin as any)
      .from('stripe_events')
      .update({ error_message: error.message })
      .eq('stripe_event_id', event.id);

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabaseAdmin: any) {
  console.log('✅ Checkout completed:', session.id);

  const { customer, subscription, client_reference_id } = session;

  if (!customer || !subscription || !client_reference_id) {
    console.error('Missing required data in checkout session');
    return;
  }

  const userId = client_reference_id;
  const stripeCustomerId = customer as string;
  const stripeSubscriptionId = subscription as string;

  // Get subscription details
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any;
  const priceId = stripeSub.items.data[0].price.id;
  const billingCycle = stripeSub.items.data[0].price.recurring?.interval === 'year' ? 'annual' : 'monthly';

  // Get tier ID from price ID
  const { data: tier } = await (supabaseAdmin as any)
    .from('subscription_tiers')
    .select('id')
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_annual.eq.${priceId}`)
    .single();

  if (!tier) {
    console.error('Tier not found for price ID:', priceId);
    return;
  }

  // Create or update subscription
  const { error } = await (supabaseAdmin as any)
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      tier_id: tier.id,
      status: 'active',
      start_date: new Date((stripeSub.current_period_start as any) * 1000).toISOString(),
      end_date: new Date((stripeSub.current_period_end as any) * 1000).toISOString(),
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_price_id: priceId,
      billing_cycle: billingCycle,
      next_billing_date: new Date((stripeSub.current_period_end as any) * 1000).toISOString(),
      cancel_at_period_end: stripeSub.cancel_at_period_end,
    });

  if (error) {
    console.error('Error creating subscription:', error);
  } else {
    console.log('✅ Subscription created for user:', userId);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, supabaseAdmin: any) {
  console.log('🔄 Subscription updated:', subscription.id);

  const priceId = subscription.items.data[0].price.id;
  const billingCycle = subscription.items.data[0].price.recurring?.interval === 'year' ? 'annual' : 'monthly';

  // Get tier ID
  const { data: tier } = await (supabaseAdmin as any)
    .from('subscription_tiers')
    .select('id')
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_annual.eq.${priceId}`)
    .single();

  if (!tier) {
    console.error('Tier not found for price ID:', priceId);
    return;
  }

  // Update subscription
  const { error } = await (supabaseAdmin as any)
    .from('user_subscriptions')
    .update({
      tier_id: tier.id,
      status: subscription.status === 'active' ? 'active' : 'cancelled',
      end_date: new Date((subscription as any).current_period_end * 1000).toISOString(),
      stripe_price_id: priceId,
      billing_cycle: billingCycle,
      next_billing_date: new Date((subscription as any).current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log('✅ Subscription updated:', subscription.id);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabaseAdmin: any) {
  console.log('❌ Subscription deleted:', subscription.id);

  const { error} = await (supabaseAdmin as any)
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      end_date: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error cancelling subscription:', error);
  } else {
    console.log('✅ Subscription cancelled:', subscription.id);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabaseAdmin: any) {
  console.log('💰 Payment succeeded:', invoice.id);

  if (!(invoice as any).subscription) return;

  // Extend subscription end date
  const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string) as any;
  
  await (supabaseAdmin as any)
    .from('user_subscriptions')
    .update({
      status: 'active',
      end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', (invoice as any).subscription as string);

  console.log('✅ Subscription renewed');
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabaseAdmin: any) {
  console.error('❌ Payment failed:', invoice.id);

  if (!(invoice as any).subscription) return;

  // Mark subscription as past_due
  await (supabaseAdmin as any)
    .from('user_subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_subscription_id', (invoice as any).subscription as string);

  console.log('⚠️ Subscription marked as past_due');
}

