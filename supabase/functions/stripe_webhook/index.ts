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
        
        const { error } = await supabase
          .from('profiles')
          .update({
            is_premium: true,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_status: 'active',
          })
          .eq('id', session.client_reference_id)
        
        if (error) console.error('Database error:', error)
        else console.log('User upgraded to premium')
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