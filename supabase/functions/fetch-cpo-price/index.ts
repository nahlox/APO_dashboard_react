// Edge Function : fetch-cpo-price
// Fetche le prix CPO depuis FRED (IMF) et stocke dans prix_cpo
// Déclenché par cron quotidien ou manuellement

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FRED_API_KEY     = Deno.env.get('FRED_API_KEY')!

// Comparaison à temps constant (évite les attaques temporelles sur le secret)
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  // Autorisation : déclenchement interne (cron / admin) uniquement.
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token || !safeEqual(token, SUPABASE_KEY)) {
    return new Response(JSON.stringify({ ok: false, error: 'Non autorisé' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    })

    // Récupérer les 24 derniers mois depuis FRED
    const fredUrl = new URL('https://api.stlouisfed.org/fred/series/observations')
    fredUrl.searchParams.set('series_id',  'PPOILUSDM')
    fredUrl.searchParams.set('api_key',    FRED_API_KEY)
    fredUrl.searchParams.set('file_type',  'json')
    fredUrl.searchParams.set('limit',      '24')
    fredUrl.searchParams.set('sort_order', 'desc')

    const fredRes = await fetch(fredUrl.toString())
    if (!fredRes.ok) throw new Error(`FRED HTTP ${fredRes.status}`)

    const fredData = await fredRes.json()
    const observations = (fredData.observations ?? []).filter((o: any) => o.value !== '.')

    if (!observations.length) throw new Error('Aucune donnée FRED reçue')

    // Upsert dans prix_cpo
    const rows = observations.map((o: any) => ({
      date:           o.date,
      prix_usd_tonne: parseFloat(o.value),
      source:         'FRED/IMF',
    }))

    const { error } = await sb
      .from('prix_cpo')
      .upsert(rows, { onConflict: 'date' })

    if (error) throw error

    const latest = rows[0]
    console.log(`CPO price updated: ${latest.date} = ${latest.prix_usd_tonne.toFixed(2)} USD/t (${rows.length} mois)`)

    return new Response(JSON.stringify({
      ok:      true,
      updated: rows.length,
      latest:  { date: latest.date, prix_usd_tonne: latest.prix_usd_tonne },
    }), {
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('fetch-cpo-price error:', msg)
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
