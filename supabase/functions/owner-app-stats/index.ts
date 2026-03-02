import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

type Metric = {
  key: string
  label: string
  value: number | null
  error?: string
}

type UserDetailsRequest = {
  userId?: string
  includeAllProfiles?: boolean
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function parseCsv(input?: string | null): string[] {
  if (!input) return []
  return input
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

const ownerIds = parseCsv(Deno.env.get('OWNER_USER_IDS'))
const ownerEmails = parseCsv(Deno.env.get('OWNER_EMAILS'))

function isOwner(userId: string, email?: string): boolean {
  const normalizedEmail = (email ?? '').toLowerCase()
  return ownerIds.includes(userId.toLowerCase()) || ownerEmails.includes(normalizedEmail)
}

async function safeCount(
  admin: ReturnType<typeof createClient>,
  table: string,
  label: string,
  key: string,
  options?: { column?: string; value?: string | boolean | null; notNullColumn?: string }
): Promise<Metric> {
  let query = admin.from(table).select('*', { count: 'exact', head: true })

  if (options?.column !== undefined && options?.value !== undefined) {
    query = query.eq(options.column, options.value)
  }

  if (options?.notNullColumn) {
    query = query.not(options.notNullColumn, 'is', null)
  }

  const { count, error } = await query

  if (error) {
    return { key, label, value: null, error: error.message }
  }

  return { key, label, value: count ?? 0 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!isOwner(user.id, user.email)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const body = (await req.json().catch(() => ({}))) as UserDetailsRequest
    const selectedUserId = body.userId?.trim()
    const includeAllProfiles = body.includeAllProfiles === true

    if (selectedUserId) {
      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('id, display_name, is_premium, subscription_status, created_at')
        .eq('id', selectedUserId)
        .maybeSingle()

      const { data: enclosures, error: enclosuresError } = await admin
        .from('enclosures')
        .select('id, name, animal_name, created_at, is_active')
        .eq('user_id', selectedUserId)
        .order('created_at', { ascending: false })

      const { data: animals, error: animalsError } = await admin
        .from('enclosure_animals')
        .select('id, name, animal_number, enclosure_id, created_at, is_active')
        .eq('user_id', selectedUserId)
        .order('created_at', { ascending: false })

      const { data: tasks, error: tasksError } = await admin
        .from('care_tasks')
        .select('id, title, type, frequency, next_due_at, is_active, enclosure_id, enclosure_animal_id, created_at')
        .eq('user_id', selectedUserId)
        .order('created_at', { ascending: false })

      return new Response(
        JSON.stringify({
          selectedUser: profile ?? null,
          selectedUserError: profileError?.message,
          userDetails: {
            enclosures: enclosures ?? [],
            animals: animals ?? [],
            tasks: tasks ?? [],
          },
          userDetailsErrors: {
            enclosures: enclosuresError?.message,
            animals: animalsError?.message,
            tasks: tasksError?.message,
          },
          fetchedAt: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const metrics: Metric[] = await Promise.all([
      safeCount(admin, 'profiles', 'Total Profiles', 'totalProfiles'),
      safeCount(admin, 'profiles', 'Premium Users', 'premiumUsers', { column: 'is_premium', value: true }),
      safeCount(admin, 'profiles', 'Active Subscriptions', 'activeSubscriptions', {
        column: 'subscription_status',
        value: 'active',
      }),
      safeCount(admin, 'profiles', 'Trialing Subscriptions', 'trialingSubscriptions', {
        column: 'subscription_status',
        value: 'trialing',
      }),
      safeCount(admin, 'profiles', 'Canceled Subscriptions', 'canceledSubscriptions', {
        column: 'subscription_status',
        value: 'canceled',
      }),
      safeCount(admin, 'profiles', 'Pending Cancellation', 'pendingCancellation', {
        notNullColumn: 'subscription_cancel_at',
      }),
      safeCount(admin, 'profiles', 'Stripe Customers', 'stripeCustomers', {
        notNullColumn: 'stripe_customer_id',
      }),
    ])

    let profilesQuery = admin
      .from('profiles')
      .select('id, display_name, is_premium, subscription_status, created_at')
      .order('created_at', { ascending: false })

    if (!includeAllProfiles) {
      profilesQuery = profilesQuery.limit(10)
    }

    const { data: latestProfiles, error: latestProfilesError } = await profilesQuery

    return new Response(
      JSON.stringify({
        metrics,
        recentProfiles: latestProfilesError ? [] : latestProfiles ?? [],
        fetchedAt: new Date().toISOString(),
        recentProfilesError: latestProfilesError?.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
