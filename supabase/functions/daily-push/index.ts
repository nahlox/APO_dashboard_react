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

Deno.serve(async (req) => {
  try {
    const { tenant_id = 'apo' } = await req.json().catch(() => ({}))
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

    // ── 1. Dernier jour avec données ─────────────────────────────────────
    const { data: prod } = await sb
      .from('production_journaliere')
      .select('date_production, taux_extraction, regime_recu_kg')
      .eq('tenant_id', tenant_id)
      .order('date_production', { ascending: false })
      .limit(1)
      .single()

    if (!prod) return new Response(JSON.stringify({ error: 'Aucune donnée' }), { status: 404 })

    // ── 2. CA du jour ────────────────────────────────────────────────────
    const { data: ventes } = await sb
      .from('ventes_huile')
      .select('prix_kg, poids_sarci_kg, poids_apo_kg')
      .eq('tenant_id', tenant_id)
      .eq('date_vente', prod.date_production)

    const caFCFA = (ventes ?? []).reduce((sum, v) => {
      const poids = (v.poids_sarci_kg ?? 0) > 0 ? v.poids_sarci_kg : (v.poids_apo_kg ?? 0)
      return sum + poids * (v.prix_kg ?? 0)
    }, 0)

    // ── 3. Historique 7 jours (pour contexte IA) ─────────────────────────
    const { data: hist } = await sb
      .from('production_journaliere')
      .select('date_production, taux_extraction, regime_recu_kg')
      .eq('tenant_id', tenant_id)
      .order('date_production', { ascending: false })
      .limit(7)

    const histLines = (hist ?? []).map(r => {
      const te = ((r.taux_extraction ?? 0) * 100).toFixed(1)
      const reg = Math.round((r.regime_recu_kg ?? 0) / 1000)
      return `  ${r.date_production} : TE ${te}%, ${reg}T régimes`
    }).join('\n')

    // ── 4. Génération IA (Claude Haiku) ──────────────────────────────────
    const te      = ((prod.taux_extraction ?? 0) * 100).toFixed(1)
    const regimes = Math.round((prod.regime_recu_kg ?? 0) / 1000)
    const caM     = (caFCFA / 1_000_000).toFixed(1)
    const date    = new Date(prod.date_production)
    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

    const aiMsg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `Tu es le système de reporting d'APO, une huilerie de palme en Côte d'Ivoire.
Génère UNE SEULE ligne d'insight (max 90 caractères) basée sur ces données du ${dateStr} :

Aujourd'hui : TE ${te}% | ${regimes}T régimes | CA ${caM}M FCFA
Seuil TE : 20%
Historique récent :
${histLines}

Règles :
- Ne pas répéter les chiffres du jour (ils sont déjà dans le titre)
- Donner UN insight : tendance, alerte, ou point positif
- Français, direct, sans emoji
- Max 90 caractères`
      }]
    })

    const insight = (aiMsg.content[0] as { text: string }).text.trim()

    // ── 5. Format notification ────────────────────────────────────────────
    const teIcon = parseFloat(te) >= 20 ? '✓' : '⚠'
    const title  = `APO — ${dateStr}  TE ${te}% ${teIcon}  •  ${regimes}T  •  ${caM}M FCFA`
    const body   = insight

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

    // Nettoyer les abonnements expirés
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
