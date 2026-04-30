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
  surveyAnalytics?: boolean
}

type DistributionItem = {
  label: string
  count: number
}

type SurveyRow = {
  id: string
  user_id: string
  heard_about_us: string
  keeper_level: string
  animals_selected: string[] | null
  primary_goal: string
  biggest_challenge: string
  requested_feature: string
  satisfaction_score: number
  additional_feedback: string | null
  created_at: string
}

type SurveyAnalytics = {
  summary: {
    totalResponses: number
    averageSatisfaction: number | null
    last7Days: number
    last30Days: number
    withAdditionalFeedback: number
  }
  satisfactionDistribution: DistributionItem[]
  heardAboutUs: DistributionItem[]
  keeperLevel: DistributionItem[]
  primaryGoal: DistributionItem[]
  biggestChallenge: DistributionItem[]
  requestedFeature: DistributionItem[]
  animalsSelected: DistributionItem[]
  timeline: Array<{ date: string; count: number }>
  recentResponses: Array<{
    id: string
    userId: string
    heardAboutUs: string
    keeperLevel: string
    primaryGoal: string
    biggestChallenge: string
    requestedFeature: string
    satisfactionScore: number
    animalsSelected: string[]
    additionalFeedback: string | null
    createdAt: string
  }>
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

function countBy(values: string[]): DistributionItem[] {
  const counts = new Map<string, number>()

  for (const value of values) {
    const normalized = value.trim()
    if (!normalized) continue
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count
      }

      return left.label.localeCompare(right.label)
    })
}

function buildTimeline(rows: SurveyRow[]): Array<{ date: string; count: number }> {
  const counts = new Map<string, number>()

  for (const row of rows) {
    const day = row.created_at.slice(0, 10)
    counts.set(day, (counts.get(day) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

function buildSurveyAnalytics(rows: SurveyRow[]): SurveyAnalytics {
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  const totalResponses = rows.length
  const satisfactionTotal = rows.reduce((sum, row) => sum + row.satisfaction_score, 0)
  const averageSatisfaction = totalResponses > 0 ? Number((satisfactionTotal / totalResponses).toFixed(1)) : null
  const last7Days = rows.filter((row) => new Date(row.created_at).getTime() >= sevenDaysAgo).length
  const last30Days = rows.filter((row) => new Date(row.created_at).getTime() >= thirtyDaysAgo).length
  const withAdditionalFeedback = rows.filter((row) => Boolean(row.additional_feedback?.trim())).length

  return {
    summary: {
      totalResponses,
      averageSatisfaction,
      last7Days,
      last30Days,
      withAdditionalFeedback,
    },
    satisfactionDistribution: [1, 2, 3, 4, 5].map((score) => ({
      label: `${score} star${score === 1 ? '' : 's'}`,
      count: rows.filter((row) => row.satisfaction_score === score).length,
    })),
    heardAboutUs: countBy(rows.map((row) => row.heard_about_us)),
    keeperLevel: countBy(rows.map((row) => row.keeper_level)),
    primaryGoal: countBy(rows.map((row) => row.primary_goal)),
    biggestChallenge: countBy(rows.map((row) => row.biggest_challenge)),
    requestedFeature: countBy(rows.map((row) => row.requested_feature)),
    animalsSelected: countBy(rows.flatMap((row) => row.animals_selected ?? [])),
    timeline: buildTimeline(rows),
    recentResponses: rows.slice(0, 12).map((row) => ({
      id: row.id,
      userId: row.user_id,
      heardAboutUs: row.heard_about_us,
      keeperLevel: row.keeper_level,
      primaryGoal: row.primary_goal,
      biggestChallenge: row.biggest_challenge,
      requestedFeature: row.requested_feature,
      satisfactionScore: row.satisfaction_score,
      animalsSelected: row.animals_selected ?? [],
      additionalFeedback: row.additional_feedback,
      createdAt: row.created_at,
    })),
  }
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
    const surveyAnalyticsRequested = body.surveyAnalytics === true

    if (surveyAnalyticsRequested) {
      const { data: surveys, error: surveysError } = await admin
        .from('user_feedback_surveys')
        .select('id, user_id, heard_about_us, keeper_level, animals_selected, primary_goal, biggest_challenge, requested_feature, satisfaction_score, additional_feedback, created_at')
        .order('created_at', { ascending: false })

      if (surveysError) {
        throw new Error(surveysError.message)
      }

      return new Response(
        JSON.stringify({
          surveyAnalytics: buildSurveyAnalytics((surveys ?? []) as SurveyRow[]),
          fetchedAt: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (selectedUserId) {
      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('id, display_name, is_premium, subscription_status, created_at, email, last_sign_in_at')
        .eq('id', selectedUserId)
        .maybeSingle()

      // Profile now includes email and last_sign_in_at synced from auth.users
      const enrichedProfile = profile

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
          selectedUser: enrichedProfile ?? null,
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
      .select('id, display_name, is_premium, subscription_status, created_at, email, last_sign_in_at')
      .order('created_at', { ascending: false })

    if (!includeAllProfiles) {
      profilesQuery = profilesQuery.limit(10)
    }

    const { data: latestProfiles, error: latestProfilesError } = await profilesQuery

    const recentProfiles = latestProfiles ?? []

    return new Response(
      JSON.stringify({
        metrics,
        recentProfiles: latestProfilesError ? [] : recentProfiles,
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
