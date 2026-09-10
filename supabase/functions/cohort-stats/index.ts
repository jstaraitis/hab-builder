import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Cohort growth statistics.
 *
 * This function is the ONLY way cohort_observations is ever read. The table has
 * no SELECT policy, so a client cannot query it directly even with a valid JWT.
 * That is the whole privacy design: individual observations never leave the
 * database, only aggregates that have cleared a minimum sample size.
 *
 * Two operations:
 *   { speciesId }      -> the growth curve for a species
 *   { withdraw: true } -> delete every observation belonging to the caller
 *
 * The withdraw path runs here rather than client-side because deleting by
 * animal_key requires knowing which keys are yours, and a client permitted to
 * do that could also probe the table for keys that are not.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Must match MIN_ANIMALS_PER_BUCKET in src/engine/cohortStats.ts. */
const MIN_ANIMALS_PER_BUCKET = 8

/** Bucketing must match bucketFor() in src/engine/cohortStats.ts exactly. */
function bucketFor(ageDays: number): { start: number; end: number } {
  if (ageDays < 90) {
    const start = Math.floor(ageDays / 14) * 14
    return { start, end: start + 13 }
  }
  if (ageDays < 730) {
    const start = 90 + Math.floor((ageDays - 90) / 30) * 30
    return { start, end: start + 29 }
  }
  const start = 730 + Math.floor((ageDays - 730) / 91) * 91
  return { start, end: start + 90 }
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN
  if (sorted.length === 1) return sorted[0]
  const position = (sorted.length - 1) * q
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]
  const weight = position - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

function median(values: number[]): number {
  return quantile([...values].sort((a, b) => a - b), 0.5)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Identify the caller from their own JWT, never from the request body.
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userId = userData.user.id

    const body = await req.json().catch(() => ({}))

    // ---- Withdraw ------------------------------------------------------
    if (body.withdraw === true) {
      // Only this keeper's animals, resolved server-side from their own id.
      const { data: animals, error: animalsError } = await admin
        .from('enclosure_animals')
        .select('cohort_key')
        .eq('user_id', userId)

      if (animalsError) throw animalsError

      const keys = (animals ?? []).map((a: { cohort_key: string }) => a.cohort_key).filter(Boolean)

      if (keys.length > 0) {
        const { error: deleteError } = await admin
          .from('cohort_observations')
          .delete()
          .in('animal_key', keys)

        if (deleteError) throw deleteError
      }

      return new Response(JSON.stringify({ withdrawn: keys.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ---- Curve ---------------------------------------------------------
    const speciesId = body.speciesId
    if (!speciesId || typeof speciesId !== 'string') {
      return new Response(JSON.stringify({ error: 'speciesId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: rows, error: rowsError } = await admin
      .from('cohort_observations')
      .select('animal_key, age_days, weight_grams')
      .eq('species_id', speciesId)
      .limit(50000)

    if (rowsError) throw rowsError

    const observations = rows ?? []

    // One value per animal per bucket, so a frequent weigher cannot outvote
    // the rest of the cohort. Mirrors buildCohortCurve() on the client.
    const perAnimalBucket = new Map<string, { bucketStart: number; weights: number[] }>()
    for (const row of observations) {
      const { start } = bucketFor(row.age_days)
      const key = `${row.animal_key}:${start}`
      const existing = perAnimalBucket.get(key)
      if (existing) existing.weights.push(Number(row.weight_grams))
      else perAnimalBucket.set(key, { bucketStart: start, weights: [Number(row.weight_grams)] })
    }

    const byBucket = new Map<number, number[]>()
    for (const { bucketStart, weights } of perAnimalBucket.values()) {
      const list = byBucket.get(bucketStart) ?? []
      list.push(median(weights))
      byBucket.set(bucketStart, list)
    }

    const buckets = []
    for (const [start, weights] of [...byBucket.entries()].sort((a, b) => a[0] - b[0])) {
      // A bucket below the threshold is omitted entirely rather than returned
      // with a caveat. Anything returned here is safe to display as-is.
      if (weights.length < MIN_ANIMALS_PER_BUCKET) continue

      const sorted = [...weights].sort((a, b) => a - b)
      const { end } = bucketFor(start)
      buckets.push({
        ageStartDays: start,
        ageEndDays: end,
        ageMidDays: Math.round((start + end) / 2),
        animals: sorted.length,
        p10: Number(quantile(sorted, 0.1).toFixed(1)),
        p25: Number(quantile(sorted, 0.25).toFixed(1)),
        p50: Number(quantile(sorted, 0.5).toFixed(1)),
        p75: Number(quantile(sorted, 0.75).toFixed(1)),
        p90: Number(quantile(sorted, 0.9).toFixed(1)),
      })
    }

    const distinctAnimals = new Set(observations.map((r: { animal_key: string }) => r.animal_key)).size

    const curve = {
      speciesId,
      buckets,
      totalAnimals: distinctAnimals,
      totalObservations: observations.length,
      insufficientData: buckets.length === 0,
      animalsNeeded: Math.max(0, MIN_ANIMALS_PER_BUCKET - distinctAnimals),
    }

    return new Response(JSON.stringify({ curve }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('cohort-stats failed:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
