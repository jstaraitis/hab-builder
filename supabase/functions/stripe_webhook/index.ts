import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@10.15.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Checkout completed for user:', session.client_reference_id)

        // The session itself doesn't carry trial info, so read the real
        // subscription rather than assuming 'active' — a trialing signup
        // would otherwise be recorded with the wrong status and no trial_end.
        let subscriptionStatus = 'active'
        let trialEnd = null
        let startedTrial = false

        if (session.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(session.subscription)
            subscriptionStatus = subscription.status
            startedTrial = subscription.status === 'trialing'
            if (subscription.trial_end) {
              trialEnd = new Date(subscription.trial_end * 1000).toISOString()
            }
            console.log('Subscription status:', subscriptionStatus, '| trial ends:', trialEnd ?? 'n/a')
          } catch (retrieveError) {
            console.error('Could not retrieve subscription, defaulting to active:', retrieveError.message)
          }
        }

        const update = {
          is_premium: true,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          subscription_status: subscriptionStatus,
          trial_end: trialEnd,
        }

        // Burn the trial only once it has actually started. Doing this at
        // checkout-creation time would consume it on abandoned checkouts.
        if (startedTrial) update.has_used_trial = true

        const { error } = await supabase
          .from('profiles')
          .update(update)
          .eq('id', session.client_reference_id)

        if (error) console.error('Database error:', error)
        else console.log('User upgraded to premium', startedTrial ? '(trial started)' : '(paid)')

        // Recorded here rather than in the browser: after the Stripe redirect
        // the client may never run our code again, so this is the only place
        // that reliably sees a conversion. Never let it break the webhook.
        try {
          await supabase.from('analytics_events').insert({
            user_id: session.client_reference_id,
            event: startedTrial ? 'trial_started' : 'subscription_activated',
            properties: { platform: 'web', subscriptionStatus },
            platform: 'web',
          })
        } catch (analyticsError) {
          console.error('Analytics insert failed (ignored):', analyticsError)
        }
        break
      }

      case 'customer.subscription.trial_will_end': {
        // Fires ~3 days before the trial converts. Recorded so the app can
        // surface a heads-up; Stripe also emails the customer.
        const subscription = event.data.object
        console.log('Trial ending soon for subscription:', subscription.id)

        const { error } = await supabase
          .from('profiles')
          .update({
            trial_end: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) console.error('Database error:', error)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status)
        console.log('cancel_at_period_end:', subscription.cancel_at_period_end)
        console.log('current_period_end:', subscription.current_period_end)
        
        // Check if cancellation is scheduled
        let cancelAt = null
        if (subscription.cancel_at_period_end && subscription.current_period_end) {
          cancelAt = new Date(subscription.current_period_end * 1000).toISOString()
          console.log('Subscription will cancel at:', cancelAt)
        } else if (subscription.cancel_at) {
          cancelAt = new Date(subscription.cancel_at * 1000).toISOString()
          console.log('Subscription scheduled to cancel at:', cancelAt)
        }
        
        // User keeps premium if active or trialing, even if cancel is scheduled
        const isPremium = subscription.status === 'active' || subscription.status === 'trialing'
        
        console.log('Updating profile with subscription_id:', subscription.id)
        
        // First, let's check what's in the database
        const { data: existingProfiles, error: fetchError } = await supabase
          .from('profiles')
          .select('id, stripe_subscription_id, stripe_customer_id')
          .eq('stripe_subscription_id', subscription.id)
        
        console.log('Found profiles with this subscription_id:', existingProfiles)
        
        if (!existingProfiles || existingProfiles.length === 0) {
          console.log('No profile found with subscription_id:', subscription.id)
          console.log('Trying to find by stripe_customer_id:', subscription.customer)
          
          // Try finding by customer ID instead
          const { data: profilesByCustomer } = await supabase
            .from('profiles')
            .select('id, stripe_subscription_id, stripe_customer_id')
            .eq('stripe_customer_id', subscription.customer)
          
          console.log('Profiles with matching stripe_customer_id:', profilesByCustomer)
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .update({
            is_premium: isPremium,
            subscription_status: subscription.status,
            subscription_cancel_at: cancelAt,
            // Cleared automatically once the trial converts to a paid period.
            trial_end: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            ...(subscription.status === 'trialing' && { has_used_trial: true }),
          })
          .eq('stripe_subscription_id', subscription.id)
          .select()
        
        if (error) {
          console.error('Database error:', error)
        } else {
          console.log('Subscription updated in database:', data)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('Subscription deleted:', subscription.id)
        
        const { error } = await supabase
          .from('profiles')
          .update({
            is_premium: false,
            subscription_status: 'canceled',
            subscription_cancel_at: null,
            trial_end: null,
            // has_used_trial intentionally left set — cancelling must not
            // hand the user a fresh trial on re-subscribe.
          })
          .eq('stripe_subscription_id', subscription.id)
        
        if (error) console.error('Database error:', error)
        else console.log('User downgraded from premium')
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    )
  }
})