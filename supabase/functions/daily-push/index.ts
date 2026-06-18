// Edge Function : Bilan quotidien APO — envoi push à 19h00
// Deploy : supabase functions deploy daily-push
// Env vars requis (Supabase Dashboard > Edge Functions > Secrets) :
//   VAPID_PRIVATE_KEY = Ixkfi6VS34jslh135O8mGGiGbnts8KVHrXKj09N1eVQ
//   VAPID_PUBLIC_KEY  = BDbg7DUGYdE0gQTPyEnARM7RbwjgDkijc7MuOkiax_bsxnuKlY0Xy9cnzkUIITqfOXp06opJT_APkDbveBld0WA
//   VAPID_EMAIL       = rawad.nahle10@gmail.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC     = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE    = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_EMAIL      = Deno.env.get('VAPID_EMAIL')!

webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC, VAPID_PRIVATE)

Deno.serve(async (req) => {
  try {
    const { tenant_id = 'apo' } = await req.json().catch(() => ({}))

    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

    // ── 1. Dernier jour avec données de production ───────────────────────
    const { data: prod } = await sb
      .from('production_journaliere')
      .select('date_production, taux_extraction, regime_recu_kg')
      .eq('tenant_id', tenant_id)
      .order('date_production', { ascending: false })
      .limit(1)
      .single()

    if (!prod) {
      return new Response(JSON.stringify({ error: 'Aucune donnée production' }), { status: 404 })
    }

    // ── 2. CA du même jour (ventes_huile) ───────────────────────────────
    const { data: ventes } = await sb
      .from('ventes_huile')
      .select('prix_kg, poids_sarci_kg, poids_apo_kg')
      .eq('tenant_id', tenant_id)
      .eq('date_vente', prod.date_production)

    const caFCFA = (ventes ?? []).reduce((sum, v) => {
      const poids = (v.poids_sarci_kg ?? 0) > 0 ? v.poids_sarci_kg : (v.poids_apo_kg ?? 0)
      return sum + poids * (v.prix_kg ?? 0)
    }, 0)

    // ── 3. Format message ────────────────────────────────────────────────
    const date     = new Date(prod.date_production)
    const dateStr  = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    const te       = ((prod.taux_extraction ?? 0) * 100).toFixed(1)
    const teIcon   = parseFloat(te) >= 20 ? '✓' : '⚠'
    const regimes  = Math.round((prod.regime_recu_kg ?? 0) / 1000)
    const caM      = (caFCFA / 1_000_000).toFixed(1)

    const title = `APO — ${dateStr}`
    const body  = `TE ${te}% ${teIcon}  •  ${regimes} T régimes  •  CA ${caM} M FCFA`

    // ── 4. Récupérer les abonnements push du tenant ──────────────────────
    const { data: subs } = await sb
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('tenant_id', tenant_id)

    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'Aucun abonnement' }), { status: 200 })
    }

    // ── 5. Envoyer à tous les abonnés ────────────────────────────────────
    const payload = JSON.stringify({ title, body, url: '/' })
    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    )

    // Supprimer les abonnements expirés (410 Gone)
    const expired = results
      .map((r, i) => r.status === 'rejected' && (r.reason?.statusCode === 410 || r.reason?.statusCode === 404) ? subs[i].endpoint : null)
      .filter(Boolean)
    if (expired.length) {
      await sb.from('push_subscriptions').delete().in('endpoint', expired)
    }

    const sent = results.filter(r => r.status === 'fulfilled').length
    return new Response(JSON.stringify({ sent, total: subs.length, title, body }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('daily-push error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
