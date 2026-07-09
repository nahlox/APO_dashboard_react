// Edge Function : Bilan quotidien APO avec alertes intelligentes + insight IA
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

const kg  = (v: number) => Math.round(v / 1000)
const pct = (v: number) => (v * 100).toFixed(1)
const fmt = (v: number) => v >= 1_000_000
  ? (v / 1_000_000).toFixed(1) + 'M'
  : Math.round(v / 1000) + 'K'

interface Alert { emoji: string; msg: string; level: 'urgent' | 'warn' | 'info' }

Deno.serve(async (req) => {
  try {
    const { tenant_id = 'apo' } = await req.json().catch(() => ({}))
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

    const today = new Date().toISOString().slice(0, 10)

    // ── 1. Dernier jour de production ────────────────────────────────────────
    const { data: prod } = await sb
      .from('production_journaliere')
      .select('date_production, taux_extraction, regime_recu_kg, regime_traite_kg, huile_produite_kg, livraison_citerne_kg')
      .eq('tenant_id', tenant_id)
      .lte('date_production', today)
      .order('date_production', { ascending: false })
      .limit(1)
      .single()

    if (!prod) return new Response(JSON.stringify({ error: 'Aucune donnée' }), { status: 404 })

    // ── 2. Historique 7 jours ────────────────────────────────────────────────
    const { data: hist } = await sb
      .from('production_journaliere')
      .select('date_production, taux_extraction, regime_recu_kg, regime_traite_kg, huile_produite_kg, livraison_citerne_kg')
      .eq('tenant_id', tenant_id)
      .lte('date_production', today)
      .order('date_production', { ascending: false })
      .limit(7)

    const histRows = hist ?? []
    const histLines = histRows.map(r =>
      `  ${r.date_production} : TE ${pct(r.taux_extraction ?? 0)}% | Reçus ${kg(r.regime_recu_kg ?? 0)}T | Huile ${kg(r.huile_produite_kg ?? 0)}T`
    ).join('\n')

    // ── 3. ALERTES INTELLIGENTES ─────────────────────────────────────────────
    const alerts: Alert[] = []

    // — 3a. Taux d'extraction en dessous du seuil —
    const teVal   = prod.taux_extraction ?? 0
    const avgTE   = histRows.length
      ? histRows.reduce((s, r) => s + (r.taux_extraction ?? 0), 0) / histRows.length
      : teVal
    if (teVal < 0.17) {
      alerts.push({ emoji: '🔴', msg: `TE ${pct(teVal)}% sous seuil critique (17%)`, level: 'urgent' })
    } else if (teVal < avgTE * 0.90 && histRows.length >= 3) {
      alerts.push({ emoji: '🟡', msg: `TE ${pct(teVal)}% — chute vs moy. 7j (${pct(avgTE)}%)`, level: 'warn' })
    }

    // — 3b. Régimes reçus en forte chute —
    const avgRecus = histRows.length
      ? histRows.reduce((s, r) => s + (r.regime_recu_kg ?? 0), 0) / histRows.length
      : 0
    const recusKg = prod.regime_recu_kg ?? 0
    if (avgRecus > 0 && recusKg < avgRecus * 0.60) {
      const drop = Math.round((1 - recusKg / avgRecus) * 100)
      alerts.push({ emoji: '📉', msg: `Régimes reçus: ${kg(recusKg)}T (−${drop}% vs moy. 7j)`, level: 'warn' })
    }

    // — 3c. Fournisseurs absents depuis 7+ jours —
    const d7  = new Date(Date.now() -  7 * 86400000).toISOString().slice(0, 10)
    const d21 = new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10)

    const [{ data: fourn7 }, { data: fourn21 }] = await Promise.all([
      sb.from('achats_regimes').select('fournisseur_id').eq('tenant_id', tenant_id).gte('date_achat', d7),
      sb.from('achats_regimes').select('fournisseur_id').eq('tenant_id', tenant_id).gte('date_achat', d21).lt('date_achat', d7),
    ])

    const ids7  = new Set((fourn7  ?? []).map(r => r.fournisseur_id).filter(Boolean))
    const ids21 = new Set((fourn21 ?? []).map(r => r.fournisseur_id).filter(Boolean))
    const absentIds = [...ids21].filter(id => !ids7.has(id))

    if (absentIds.length > 0) {
      const { data: absentData } = await sb
        .from('fournisseurs')
        .select('nom, reference')
        .in('id', absentIds)
        .eq('tenant_id', tenant_id)
        .limit(3)

      const names  = (absentData ?? []).map(f => (f.nom || f.reference).split(' ')[0]).join(', ')
      const extra  = absentIds.length > 3 ? ` +${absentIds.length - 3}` : ''
      alerts.push({ emoji: '🚛', msg: `Fournisseurs absents 7j: ${names}${extra}`, level: 'warn' })
    }

    // — 3d. Charges mois en cours vs même période mois précédent —
    const now        = new Date(today)
    const dayN       = now.getDate()
    const curStart   = `${today.slice(0, 8)}01`
    const prevMStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
    const prevMDay   = new Date(now.getFullYear(), now.getMonth() - 1,
                         Math.min(dayN, new Date(now.getFullYear(), now.getMonth(), 0).getDate())
                       ).toISOString().slice(0, 10)

    const sumCaisse = async (start: string, end: string): Promise<number> => {
      const [r1, r2] = await Promise.all([
        sb.from('caisse_apo').select('credit_fcfa').eq('tenant_id', tenant_id)
          .gte('date_mouvement', start).lte('date_mouvement', end).gt('credit_fcfa', 0),
        sb.from('caisse_apo2').select('credit_fcfa').eq('tenant_id', tenant_id)
          .gte('date_mouvement', start).lte('date_mouvement', end).gt('credit_fcfa', 0),
      ])
      return [...(r1.data ?? []), ...(r2.data ?? [])].reduce((s, r) => s + (r.credit_fcfa ?? 0), 0)
    }

    const [chargesCur, chargesPrev] = await Promise.all([
      sumCaisse(curStart, today),
      sumCaisse(prevMStart, prevMDay),
    ])

    if (chargesPrev > 0 && chargesCur > chargesPrev * 1.20) {
      const delta = Math.round((chargesCur / chargesPrev - 1) * 100)
      alerts.push({ emoji: '💸', msg: `Charges: ${fmt(chargesCur)} FCFA (+${delta}% vs mois préc.)`, level: 'warn' })
    }

    // ── 4. Valeurs du jour (affichage) ───────────────────────────────────────
    const te       = pct(teVal)
    const recus    = kg(recusKg)
    const traites  = kg(prod.regime_traite_kg ?? 0)
    const huile    = kg(prod.huile_produite_kg ?? 0)
    const citernes = kg(prod.livraison_citerne_kg ?? 0)
    const date     = new Date(prod.date_production)
    const dateStr  = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    const citerneTxt = citernes > 0 ? `${citernes}T sortis` : 'Aucune sortie'

    const hasUrgent = alerts.some(a => a.level === 'urgent')
    const teIcon    = teVal >= 0.20 ? '✓' : teVal >= 0.17 ? '~' : '⚠'

    // ── 5. Insight IA (Claude Haiku) — contextuel selon alertes ─────────────
    const alertCtx = alerts.length > 0
      ? `\nALERTES ACTIVES :\n${alerts.map(a => `- ${a.msg}`).join('\n')}\n\nTon insight doit prioritairement commenter la ou les alertes les plus critiques.`
      : ''

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
- TE              : ${te}% (seuil min 17%, cible 20%)

Historique 7 jours :
${histLines}
${alertCtx}

Règles :
- Ne pas répéter les chiffres du jour (ils apparaissent déjà dans la notification)
- Donner UN seul insight utile : tendance, cause probable, action recommandée
- Français, direct, sans emoji
- Max 100 caractères`
      }]
    })

    const insight = (aiMsg.content[0] as { text: string }).text.trim()

    // ── 6. Format notification ────────────────────────────────────────────────
    let title: string
    let bodyParts: string[]

    if (alerts.length > 0) {
      const alertLabel = hasUrgent ? '🚨' : '⚠️'
      title = `${alertLabel} APO ${dateStr} — ${alerts.length} alerte${alerts.length > 1 ? 's' : ''}`
      bodyParts = [
        ...alerts.map(a => `${a.emoji} ${a.msg}`),
        `─`,
        `Reçus ${recus}T • TE ${te}% ${teIcon} • Huile ${huile}T`,
        insight,
      ]
    } else {
      title = `APO — ${dateStr}  ${teIcon} TE ${te}%`
      bodyParts = [
        `Reçus ${recus}T • Traités ${traites}T • Huile ${huile}T`,
        `Citernes : ${citerneTxt}`,
        insight,
      ]
    }

    const body = bodyParts.join('\n')

    // ── 7. Envoyer push à tous les abonnés ───────────────────────────────────
    const { data: subs } = await sb
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('tenant_id', tenant_id)

    if (!subs?.length) return new Response(JSON.stringify({ sent: 0, title, body }), { status: 200 })

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
      .map((r, i) => r.status === 'rejected' && [410, 404].includes((r as PromiseRejectedResult).reason?.statusCode) ? subs[i].endpoint : null)
      .filter(Boolean)
    if (expired.length) await sb.from('push_subscriptions').delete().in('endpoint', expired)

    const sent = results.filter(r => r.status === 'fulfilled').length
    return new Response(JSON.stringify({ sent, title, body, alerts: alerts.map(a => a.msg) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('daily-push error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
