// Edge Function : Rapport APO par email (résumé + graphique + insight IA)
// Modes : quotidien (défaut) ou hebdomadaire — via body.period = 'daily' | 'weekly'
// Déploiement : supabase functions deploy weekly-report
//
// Variables d'env requises :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
//   RESEND_API_KEY      — clé API Resend (https://resend.com)
//   REPORT_FROM_EMAIL   — expéditeur vérifié dans Resend, ex "Palmeo <rapport@palmeo.co>"
//   APP_URL             — URL du dashboard, ex "https://app.palmeo.co"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_KEY    = Deno.env.get('ANTHROPIC_API_KEY')!
const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')!
const REPORT_FROM      = Deno.env.get('REPORT_FROM_EMAIL') || 'APO <onboarding@resend.dev>'
const APP_URL          = Deno.env.get('APP_URL') || 'https://app.palmeo.co'

const ai = new Anthropic({ apiKey: ANTHROPIC_KEY })

// ── Helpers de format ───────────────────────────────────────────────────────
const T   = (v: number) => (v / 1000).toFixed(1)                 // kg → tonnes 1 déc.
const pct = (v: number) => (v * 100).toFixed(1)
const money = (v: number) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M FCFA'
  if (v >= 1_000)     return Math.round(v / 1_000) + ' K FCFA'
  return Math.round(v) + ' FCFA'
}
const iso = (d: Date) => d.toISOString().slice(0, 10)
const frDate = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

// Delta % formaté avec flèche + couleur (bien = vert, mal = rouge)
function delta(cur: number, prev: number, higherIsBetter = true) {
  if (prev === 0) return { txt: '—', color: '#8a8a8a' }
  const d = (cur / prev - 1) * 100
  const good = higherIsBetter ? d >= 0 : d <= 0
  const arrow = d >= 0 ? '▲' : '▼'
  return { txt: `${arrow} ${Math.abs(d).toFixed(0)}%`, color: good ? '#2e7d40' : '#e05c5c' }
}

interface Alert { emoji: string; msg: string }

// ── Agrégat production/ventes/charges sur une fenêtre de dates ──────────────
async function aggregate(sb: any, tenant: string, start: string, end: string) {
  const [prodRes, vhRes, vpaRes, vfRes, vbRes, c1Res, c2Res] = await Promise.all([
    sb.from('production_journaliere')
      .select('date_production, taux_extraction, regime_recu_kg, regime_traite_kg, huile_produite_kg, livraison_citerne_kg')
      .eq('tenant_id', tenant).gte('date_production', start).lte('date_production', end)
      .order('date_production'),
    sb.from('ventes_huile').select('montant_fcfa').eq('tenant_id', tenant)
      .gte('date_vente', start).lte('date_vente', end),
    sb.from('ventes_palmiste').select('montant_fcfa').eq('tenant_id', tenant)
      .gte('date_vente', start).lte('date_vente', end),
    sb.from('ventes_florentin').select('montant_fcfa').eq('tenant_id', tenant)
      .gte('date_vente', start).lte('date_vente', end),
    sb.from('ventes_bassin').select('montant_fcfa').eq('tenant_id', tenant)
      .gte('date_vente', start).lte('date_vente', end),
    sb.from('caisse_apo').select('credit_fcfa').eq('tenant_id', tenant)
      .gte('date_mouvement', start).lte('date_mouvement', end).gt('credit_fcfa', 0),
    sb.from('caisse_apo2').select('credit_fcfa').eq('tenant_id', tenant)
      .gte('date_mouvement', start).lte('date_mouvement', end).gt('credit_fcfa', 0),
  ])

  const prod = prodRes.data ?? []
  const sum = (rows: any[], k: string) => rows.reduce((s, r) => s + (r[k] ?? 0), 0)

  const recus   = sum(prod, 'regime_recu_kg')
  const traites = sum(prod, 'regime_traite_kg')
  const huile   = sum(prod, 'huile_produite_kg')
  const citernes = sum(prod, 'livraison_citerne_kg')
  const teVals  = prod.map((r: any) => r.taux_extraction ?? 0).filter((v: number) => v > 0)
  const teAvg   = teVals.length ? teVals.reduce((s: number, v: number) => s + v, 0) / teVals.length : 0

  const revenue = sum(vhRes.data ?? [], 'montant_fcfa') + sum(vpaRes.data ?? [], 'montant_fcfa')
                + sum(vfRes.data ?? [], 'montant_fcfa') + sum(vbRes.data ?? [], 'montant_fcfa')
  const charges = sum(c1Res.data ?? [], 'credit_fcfa') + sum(c2Res.data ?? [], 'credit_fcfa')

  return { recus, traites, huile, citernes, teAvg, revenue, charges, nbJours: prod.length }
}

// ── Série d'huile produite : `days` jours se terminant à endDay (pour le graphe) ──
async function oilSeries(sb: any, tenant: string, endDay: string, days = 7) {
  const end = new Date(endDay + 'T00:00:00')
  const start = new Date(end.getTime() - (days - 1) * 86400000)
  const { data } = await sb.from('production_journaliere')
    .select('date_production, huile_produite_kg')
    .eq('tenant_id', tenant).gte('date_production', iso(start)).lte('date_production', endDay)
  const rows = data ?? []
  const out: { date: string; kg: number }[] = []
  for (let i = 0; i < days; i++) {
    const dk = iso(new Date(start.getTime() + i * 86400000))
    const row = rows.find((r: any) => r.date_production === dk)
    out.push({ date: dk, kg: row?.huile_produite_kg ?? 0 })
  }
  return out
}

// ── Graphique en barres HTML (compatible clients email — table + divs) ──────
function barChart(daily: { date: string; kg: number }[]): string {
  const max = Math.max(...daily.map(d => d.kg), 1)
  const cells = daily.map(d => {
    const h = Math.round((d.kg / max) * 110)
    const jour = new Date(d.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)
    const label = d.kg > 0 ? T(d.kg) : ''
    return `
      <td style="vertical-align:bottom; text-align:center; padding:0 4px;">
        <div style="font-size:10px; color:#6b6b6b; margin-bottom:4px; font-family:Arial,sans-serif;">${label}</div>
        <div style="width:100%; height:${h}px; min-height:2px; background:linear-gradient(180deg,#f28c28,#c86a10); border-radius:4px 4px 0 0;"></div>
        <div style="font-size:11px; color:#8a8a8a; margin-top:6px; font-family:Arial,sans-serif; text-transform:capitalize;">${jour}</div>
      </td>`
  }).join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="height:150px;">
      <tr>${cells}</tr>
    </table>`
}

// ── Carte KPI ───────────────────────────────────────────────────────────────
function kpiCard(label: string, value: string, d: { txt: string; color: string }, cmpLabel: string): string {
  return `
    <td width="50%" style="padding:6px;">
      <div style="background:#faf8f5; border:1px solid #ece7df; border-radius:10px; padding:14px 16px;">
        <div style="font-size:11px; color:#8a8a8a; text-transform:uppercase; letter-spacing:.5px; font-family:Arial,sans-serif;">${label}</div>
        <div style="font-size:22px; font-weight:700; color:#2a2a2a; margin-top:4px; font-family:Arial,sans-serif;">${value}</div>
        <div style="font-size:12px; color:${d.color}; margin-top:2px; font-family:Arial,sans-serif;">${d.txt} <span style="color:#b0b0b0;">${cmpLabel}</span></div>
      </div>
    </td>`
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}))
    const tenant_id: string = body.tenant_id ?? 'apo'
    const period: 'daily' | 'weekly' = body.period === 'weekly' ? 'weekly' : 'daily'
    const testEmail: string | undefined = body.test_email  // envoi test à une seule adresse

    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
    const today = iso(new Date())

    // ── 1. Fenêtres de dates selon le mode ──────────────────────────────────
    let wStart: string, wEnd: string, pStart: string, pEnd: string
    let periodLabel: string, cmpLabel: string, chartTitle: string, kind: string

    if (period === 'weekly') {
      // Semaine écoulée (lun→dim) vs semaine d'avant
      const now = new Date()
      const dow = (now.getDay() + 6) % 7
      const lastMonday = new Date(now); lastMonday.setDate(now.getDate() - dow - 7)
      const lastSunday = new Date(lastMonday); lastSunday.setDate(lastMonday.getDate() + 6)
      const prevMonday = new Date(lastMonday); prevMonday.setDate(lastMonday.getDate() - 7)
      const prevSunday = new Date(lastMonday); prevSunday.setDate(lastMonday.getDate() - 1)
      wStart = iso(lastMonday); wEnd = iso(lastSunday)
      pStart = iso(prevMonday); pEnd = iso(prevSunday)
      periodLabel = `Semaine du ${frDate(wStart)} au ${frDate(wEnd)}`
      cmpLabel = 'vs sem. préc.'
      chartTitle = "Production d'huile (T) par jour"
      kind = 'hebdomadaire'
    } else {
      // Quotidien : toujours J-1 (hier), quelles que soient les données trouvées
      const refDay = iso(new Date(new Date(today + 'T00:00:00').getTime() - 86400000))
      const prevDay = iso(new Date(new Date(today + 'T00:00:00').getTime() - 2 * 86400000))
      wStart = refDay; wEnd = refDay
      pStart = prevDay; pEnd = prevDay
      periodLabel = `Journée du ${frDate(refDay)}`
      cmpLabel = 'vs veille'
      chartTitle = "Production d'huile (T) — 7 derniers jours"
      kind = 'quotidien'
    }

    const [cur, prev] = await Promise.all([
      aggregate(sb, tenant_id, wStart, wEnd),
      aggregate(sb, tenant_id, pStart, pEnd),
    ])

    // En hebdo, on saute s'il n'y a aucune donnée. En quotidien, on envoie toujours J-1.
    if (period === 'weekly' && cur.nbJours === 0) {
      return new Response(JSON.stringify({ skipped: 'Aucune donnée sur la période', wStart, wEnd }),
        { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const chart = await oilSeries(sb, tenant_id, wEnd, 7)

    // ── 2. Alertes ──────────────────────────────────────────────────────────
    const alerts: Alert[] = []
    // Pas d'alerte sur une journée sans aucune donnée (évite les faux "−100%")
    const hasData = cur.nbJours > 0 && (cur.recus > 0 || cur.huile > 0)
    if (hasData && cur.teAvg > 0 && cur.teAvg < 0.18)
      alerts.push({ emoji: '🔴', msg: `Taux d'extraction faible : ${pct(cur.teAvg)}% (cible 20%)` })
    if (hasData && prev.recus > 0 && cur.recus < prev.recus * 0.60)
      alerts.push({ emoji: '📉', msg: `Régimes reçus en baisse de ${Math.round((1 - cur.recus / prev.recus) * 100)}% ${cmpLabel}` })
    if (period === 'weekly') {
      if (prev.charges > 0 && cur.charges > prev.charges * 1.20)
        alerts.push({ emoji: '💸', msg: `Charges en hausse de ${Math.round((cur.charges / prev.charges - 1) * 100)}% vs semaine précédente` })
      if (cur.revenue < cur.charges)
        alerts.push({ emoji: '⚠️', msg: `Charges (${money(cur.charges)}) supérieures aux revenus (${money(cur.revenue)})` })
    }

    // ── 3. Synthèse IA (Claude Haiku) ───────────────────────────────────────
    const aiMsg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Tu es le directeur analytique d'APO, une huilerie de palme en Côte d'Ivoire.
Rédige une synthèse de 2 phrases (français, professionnel et direct) pour le rapport ${kind} destiné à la direction.

${periodLabel} :
- Régimes reçus : ${T(cur.recus)}T (${cmpLabel} ${T(prev.recus)}T)
- Régimes traités : ${T(cur.traites)}T
- Huile produite : ${T(cur.huile)}T (${cmpLabel} ${T(prev.huile)}T)
- Taux d'extraction : ${pct(cur.teAvg)}% (${cmpLabel} ${pct(prev.teAvg)}%)
- Revenus ventes : ${money(cur.revenue)}
- Charges : ${money(cur.charges)}

${alerts.length ? 'Points de vigilance :\n' + alerts.map(a => '- ' + a.msg).join('\n') : 'Aucune alerte.'}

Règles : identifie la tendance dominante et le point le plus important. Pas de liste, pas d'emoji, pas de salutation, pas de mention du coût de revient.`
      }]
    })
    const synthese = (aiMsg.content[0] as { text: string }).text.trim()

    // ── 4. Construction de l'email HTML ─────────────────────────────────────
    const marge = cur.revenue - cur.charges
    const html = `
<!DOCTYPE html>
<html lang="fr">
<body style="margin:0; padding:0; background:#f4f2ee;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee; padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.06);">

        <!-- En-tête -->
        <tr><td style="background:linear-gradient(135deg,#1f5a2a,#2e7d40); padding:28px 32px;">
          <div style="font-size:13px; color:#a9d9b3; font-family:Arial,sans-serif; letter-spacing:1px; text-transform:uppercase;">Rapport ${kind}</div>
          <div style="font-size:24px; color:#ffffff; font-weight:700; font-family:Arial,sans-serif; margin-top:4px;">APO — Agro Palm Oil</div>
          <div style="font-size:14px; color:#d4ecd9; font-family:Arial,sans-serif; margin-top:6px;">${periodLabel}</div>
        </td></tr>

        <!-- Synthèse IA -->
        <tr><td style="padding:24px 32px 8px;">
          <div style="font-size:15px; line-height:1.6; color:#3a3a3a; font-family:Arial,sans-serif; background:#f6f9f6; border-left:3px solid #2e7d40; padding:14px 16px; border-radius:0 8px 8px 0;">
            ${synthese}
          </div>
        </td></tr>

        <!-- KPI -->
        <tr><td style="padding:12px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${kpiCard('Huile produite', T(cur.huile) + ' T', delta(cur.huile, prev.huile, true), cmpLabel)}
              ${kpiCard('Taux extraction', pct(cur.teAvg) + ' %', delta(cur.teAvg, prev.teAvg, true), cmpLabel)}
            </tr>
            <tr>
              ${kpiCard('Régimes reçus', T(cur.recus) + ' T', delta(cur.recus, prev.recus, true), cmpLabel)}
              ${kpiCard('Régimes traités', T(cur.traites) + ' T', delta(cur.traites, prev.traites, true), cmpLabel)}
            </tr>
            <tr>
              ${kpiCard('Revenus', money(cur.revenue), delta(cur.revenue, prev.revenue, true), cmpLabel)}
              ${kpiCard('Charges', money(cur.charges), delta(cur.charges, prev.charges, false), cmpLabel)}
            </tr>
          </table>
        </td></tr>

        <!-- Graphique -->
        <tr><td style="padding:16px 32px 8px;">
          <div style="font-size:13px; color:#8a8a8a; text-transform:uppercase; letter-spacing:.5px; font-family:Arial,sans-serif; margin-bottom:10px;">${chartTitle}</div>
          ${barChart(chart)}
        </td></tr>

        ${alerts.length ? `
        <!-- Alertes -->
        <tr><td style="padding:16px 32px 8px;">
          <div style="background:#fdf6f2; border:1px solid #f3d9c9; border-radius:10px; padding:14px 18px;">
            <div style="font-size:13px; color:#c05a1a; font-weight:700; font-family:Arial,sans-serif; margin-bottom:8px;">⚠️ Points de vigilance</div>
            ${alerts.map(a => `<div style="font-size:14px; color:#5a4a3a; font-family:Arial,sans-serif; padding:3px 0;">${a.emoji} ${a.msg}</div>`).join('')}
          </div>
        </td></tr>` : ''}

        <!-- CTA -->
        <tr><td align="center" style="padding:24px 32px 12px;">
          <a href="${APP_URL}" style="display:inline-block; background:#f28c28; color:#ffffff; text-decoration:none; font-family:Arial,sans-serif; font-size:15px; font-weight:700; padding:14px 32px; border-radius:10px;">Ouvrir le tableau de bord →</a>
        </td></tr>

        <!-- Pied -->
        <tr><td style="padding:16px 32px 28px; border-top:1px solid #eee;">
          <div style="font-size:12px; color:#a0a0a0; font-family:Arial,sans-serif; text-align:center;">
            Rapport ${kind} généré automatiquement · APO Dashboard<br>
            ${periodLabel}
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    // ── 5. Déterminer les destinataires ─────────────────────────────────────
    let recipients: string[] = []
    if (testEmail) {
      recipients = [testEmail]
    } else {
      const { data: cfg } = await sb.from('tenant_config').select('config').eq('tenant_id', tenant_id).single()
      const override: string[] = cfg?.config?.report_recipients ?? []

      if (override.length) {
        recipients = override
      } else {
        const { data: links } = await sb.from('user_tenants')
          .select('user_id, role').eq('tenant_id', tenant_id).in('role', ['owner', 'manager'])
        const ids = new Set((links ?? []).map((l: any) => l.user_id))
        if (ids.size) {
          const { data: usersPage } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
          recipients = (usersPage?.users ?? [])
            .filter((u: any) => ids.has(u.id) && u.email)
            .map((u: any) => u.email)
        }
      }
    }

    if (!recipients.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'Aucun destinataire', wStart, wEnd }),
        { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    // ── 6. Envoi via Resend ──────────────────────────────────────────────────
    const dateShort = new Date(wEnd + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    const subject = `APO ${dateShort} · ${T(cur.huile)}T huile · TE ${pct(cur.teAvg)}%${alerts.length ? ` · ${alerts.length} alerte${alerts.length > 1 ? 's' : ''}` : ''}`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: REPORT_FROM, to: recipients, subject, html }),
    })

    const resendData = await resendRes.json()
    if (!resendRes.ok) {
      console.error('Resend error:', resendData)
      return new Response(JSON.stringify({ error: 'Envoi email échoué', detail: resendData, recipients }), { status: 502 })
    }

    return new Response(JSON.stringify({
      sent: recipients.length, recipients, subject,
      period, window: { wStart, wEnd }, alerts: alerts.map(a => a.msg), id: resendData.id,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('weekly-report error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
