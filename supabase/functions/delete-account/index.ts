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

    // Verify the token belongs to a real user
    const { data: { user }, error: userError } = await adminClient.auth.getUser(userToken)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = user.id

    // Delete user data in dependency order (child records first)
    const tablesWithUserId = [
      'brumation_logs',
      'shed_logs',
      'vet_records',
      'weight_logs',
      'length_logs',
      'care_logs',
      'push_subscriptions',
      'native_push_tokens',
      'inventory_items',
      'care_tasks',
      'enclosure_animals',
      'enclosures',
    ]

    for (const table of tablesWithUserId) {
      const { error } = await adminClient.from(table).delete().eq('user_id', userId)
      if (error) {
        console.error(`Error deleting from ${table}:`, error.message)
        // Continue — table may not exist or user has no rows
      }
    }

    // profiles table uses `id` as the primary key (= user id)
    const { error: profileError } = await adminClient.from('profiles').delete().eq('id', userId)
    if (profileError) {
      console.error('Error deleting profile:', profileError.message)
    }

    // Delete the auth user last
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
      throw new Error(`Failed to delete auth user: ${deleteAuthError.message}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in delete-account:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})


// testing
