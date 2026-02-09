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

    // Verify JWT token if provided (for security)
    if (userToken) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

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

    console.log('Creating Stripe session for:', userEmail)

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    console.log('Session created:', session.id)

    return new Response(
      JSON.stringify({ sessionUrl: session.url }),
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