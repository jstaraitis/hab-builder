import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userToken } = await req.json()

    if (!userToken) {
      return new Response(JSON.stringify({ error: 'No user token provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the JWT and get the user
    const { data: { user }, error: userError } = await adminClient.auth.getUser(userToken)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const revenueCatSecretKey = Deno.env.get('REVENUECAT_SECRET_KEY')
    if (!revenueCatSecretKey) {
      throw new Error('REVENUECAT_SECRET_KEY not configured')
    }

    // Call RevenueCat REST API — subscriber ID matches Supabase user ID (set via logIn)
    const rcResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`,
      {
        headers: {
          'Authorization': `Bearer ${revenueCatSecretKey}`,
          'Content-Type': 'application/json',
          'X-Platform': 'ios',
        },
      }
    )

    if (!rcResponse.ok) {
      console.error('RevenueCat API error:', rcResponse.status)
      return new Response(JSON.stringify({ error: 'Failed to verify purchase' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const subscriber = await rcResponse.json()
    const entitlements = subscriber?.subscriber?.entitlements ?? {}
    const premiumEntitlement = entitlements['premium']
    const isPremium = premiumEntitlement != null &&
      (premiumEntitlement.expires_date == null ||
        new Date(premiumEntitlement.expires_date) > new Date())

    // expires_date = end of current billing period (null = lifetime/no expiry)
    const expiresDate = premiumEntitlement?.expires_date ?? null

    // Update the Supabase profile
    await adminClient
      .from('profiles')
      .upsert(
        {
          id: user.id,
          is_premium: isPremium,
          subscription_platform: isPremium ? 'ios' : null,
          subscription_status: isPremium ? 'active' : 'canceled',
          subscription_cancel_at: expiresDate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    return new Response(JSON.stringify({ isPremium }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in sync-revenuecat:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
