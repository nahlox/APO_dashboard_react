// Edge Function : Bilan quotidien APO avec insight IA (Claude Haiku)
// Deploy : supabase functions deploy daily-push

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'
import webpush from 'npm:web-push@3'

const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC   = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE  = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_EMAIL    = Deno.env.get('VAPID_EMAIL')!
const ANTHROPIC_KEY  = Deno.env.get('ANTHROPIC_API_KEY')!

webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC, VAPID_PRIVATE)
const ai = new Anthropic({ apiKey: ANTHROPIC_KEY })

function kg(v: number) { return Math.round(v / 1000) }
function pct(v: number) { return (v * 100).toFixed(1) }

Deno.serve(async (req) => {
  try {
    const { tenant_id = 'apo' } = await req.json().catch(() => ({}))
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

    // ── 1. Dernier jour avec données (≤ aujourd'hui) ─────────────────────
    const today = new Date().toISOString().slice(0, 10)
    const { data: prod } = await sb
      .from('production_journaliere')
      .select('date_production, taux_extraction, regime_recu_kg, regime_traite_kg, huile_produite_kg, livraison_citerne_kg')
      .eq('tenant_id', tenant_id)
      .lte('date_production', today)
      .order('date_production', { ascending: false })
      .limit(1)
      .single()

    if (!prod) return new Response(JSON.stringify({ error: 'Aucune donnée' }), { status: 404 })

    // ── 2. Historique 7 jours pour contexte IA ───────────────────────────
    const { data: hist } = await sb
      .from('production_journaliere')
      .select('date_production, taux_extraction, regime_recu_kg, regime_traite_kg, huile_produite_kg, livraison_citerne_kg')
      .eq('tenant_id', tenant_id)
      .lte('date_production', today)
      .order('date_production', { ascending: false })
      .limit(7)

    const histLines = (hist ?? []).map(r =>
      `  ${r.date_production} : TE ${pct(r.taux_extraction ?? 0)}% | Reçus ${kg(r.regime_recu_kg ?? 0)}T | Traités ${kg(r.regime_traite_kg ?? 0)}T | Huile ${kg(r.huile_produite_kg ?? 0)}T | Citernes ${kg(r.livraison_citerne_kg ?? 0)}T`
    ).join('\n')

    // ── 3. Valeurs du jour ───────────────────────────────────────────────
    const te       = pct(prod.taux_extraction ?? 0)
    const recus    = kg(prod.regime_recu_kg ?? 0)
    const traites  = kg(prod.regime_traite_kg ?? 0)
    const huile    = kg(prod.huile_produite_kg ?? 0)
    const citernes = kg(prod.livraison_citerne_kg ?? 0)
    const date     = new Date(prod.date_production)
    const dateStr  = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    const teIcon   = parseFloat(te) >= 20 ? '✓' : '⚠'
    const citerneTxt = citernes > 0 ? `${citernes}T sortis` : 'Aucune sortie'

    // ── 4. Génération IA (Claude Haiku) ──────────────────────────────────
    const aiMsg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Tu es le système de reporting d'APO, une huilerie de palme en Côte d'Ivoire.
Génère UNE SEULE ligne d'insight (max 100 caractères) sur les données du ${dateStr} :

Aujourd'hui :
- Régimes reçus   : ${recus}T
- Régimes traités : ${traites}T
- Huile produite  : ${huile}T
- Citernes        : ${citerneTxt}
- TE              : ${te}% (seuil 20%)

Historique 7 jours :
${histLines}

Règles :
- Ne pas répéter les chiffres du jour (ils apparaissent déjà dans la notification)
- Donner UN seul insight utile : tendance TE, écart reçu/traité, performance citerne, alerte
- Français, direct, sans emoji
- Max 100 caractères`
      }]
    })

    const insight = (aiMsg.content[0] as { text: string }).text.trim()

    // ── 5. Format notification ────────────────────────────────────────────
    // Titre : date + TE
    // Corps : chiffres clés sur 2 lignes + insight IA
    const title = `APO — ${dateStr}  ${teIcon} TE ${te}%`
    const body  = [
      `Reçus ${recus}T • Traités ${traites}T • Huile ${huile}T`,
      `Citernes : ${citerneTxt}`,
      insight,
    ].join('\n')

    // ── 6. Envoyer push à tous les abonnés ───────────────────────────────
    const { data: subs } = await sb
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('tenant_id', tenant_id)

    if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

    const payload = JSON.stringify({ title, body, url: '/' })
    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    )

    const expired = results
      .map((r, i) => r.status === 'rejected' && [410, 404].includes(r.reason?.statusCode) ? subs[i].endpoint : null)
      .filter(Boolean)
    if (expired.length) await sb.from('push_subscriptions').delete().in('endpoint', expired)

    const sent = results.filter(r => r.status === 'fulfilled').length
    return new Response(JSON.stringify({ sent, title, body }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('daily-push error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
