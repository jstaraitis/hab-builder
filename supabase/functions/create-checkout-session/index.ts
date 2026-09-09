import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Length of the introductory free trial, in days. This is the authority for
// what Stripe actually charges. Keep in sync with TRIAL_DAYS in
// src/constants/billing.ts (display) and the App Store introductory offer.
const TRIAL_PERIOD_DAYS = 7

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Received request to create checkout session')
    
    const body = await req.json()
    console.log('Request body received')
    
    const { priceId, userId, userEmail, userToken, successUrl, cancelUrl } = body

    if (!priceId || !userId || !userEmail) {
      throw new Error('Missing required fields: priceId, userId, or userEmail')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify JWT token if provided (for security)
    if (userToken) {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(userToken)

      if (userError || !user) {
        console.error('Auth verification failed:', userError?.message)
        throw new Error('Invalid user token')
      }

      // Verify the userId matches the authenticated user
      if (userId !== user.id) {
        console.error('User ID mismatch')
        throw new Error('User ID mismatch')
      }

      console.log('User verified:', user.id)
    }

    // Decide trial eligibility server-side. The client is never trusted for
    // this — it only receives the outcome so it can show the right copy.
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('has_used_trial, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      // Don't block the sale on a lookup failure — fall back to no trial,
      // which is the safe direction (we charge rather than give away access).
      console.error('Trial eligibility lookup failed, defaulting to no trial:', profileError.message)
    }

    const isTrialEligible = !profileError
      && !!profile
      && profile.has_used_trial !== true
      && !profile.stripe_customer_id

    console.log('Creating Stripe session for:', userEmail, '| trial eligible:', isTrialEligible)

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(isTrialEligible && {
        subscription_data: {
          trial_period_days: TRIAL_PERIOD_DAYS,
          trial_settings: {
            // Checkout always collects a card in subscription mode, but if it
            // ever goes missing Stripe should cancel rather than silently
            // leave the subscription hanging in an unpaid state.
            end_behavior: { missing_payment_method: 'cancel' },
          },
        },
      }),
    })

    console.log('Session created:', session.id)

    return new Response(
      JSON.stringify({ sessionUrl: session.url, trialDays: isTrialEligible ? TRIAL_PERIOD_DAYS : 0 }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    )
  }
})