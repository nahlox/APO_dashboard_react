// Edge Function : PALMAI — Assistant IA tableau de bord huilerie
// Deploy : supabase functions deploy chatbot

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const ai = new Anthropic({ apiKey: ANTHROPIC_KEY })

// ── Formatage ─────────────────────────────────────────────────

function numFr(n: number) {
  return Math.round(n).toLocaleString('fr-FR')
}

// ── Construction du contexte multi-modules ────────────────────

const CAT_LABELS: Record<string, string> = {
  fournitures_usine:   'Fournitures usine/bureaux',
  frais_transport:     'Frais transport',
  services_ext:        'Services extérieurs',
  autres_services_ext: 'Autres services ext.',
  autres_charges:      'Autres charges',
  charges_personnel:   'Charges personnel',
  taxes_fiscales:      'Impôts et taxes',
  frais_bancaires:     'Frais bancaires',
  amortissement:       'Amortissements',
}

function buildDataContext(
  kpisRows:       any[],
  prodJourRows:   any[],
  ventesHuile:    any[],
  caisseRows:     any[],
  banqueRows:     any[],
  topFourni:      any[],
  periodeMap:     Record<string, any>,
): string {
  if (!kpisRows?.length) return 'Aucune donnée disponible.'

  const lines: string[] = []

  // ═══════════════════════════════════════════════════════════════
  // 1. KPIs MENSUELS — cumul + détail
  // ═══════════════════════════════════════════════════════════════
  const caCumul     = kpisRows.reduce((s, r) => s + (r.ca_total_fcfa    || 0), 0)
  const coutMPCumul = kpisRows.reduce((s, r) => s + (r.cout_mp_fcfa     || 0), 0)
  const resCumul    = kpisRows.reduce((s, r) => s + (r.resultat_net_fcfa|| 0), 0)
  const huileKgCumul= kpisRows.reduce((s, r) => s + (r.huile_produite_kg|| 0), 0)
  const teMoyAll    = kpisRows.length
    ? (kpisRows.reduce((s, r) => s + (r.taux_extraction || 0), 0) / kpisRows.length * 100).toFixed(1)
    : '0'

  lines.push(`=== CUMUL ANNUEL (${kpisRows.length} mois) ===`)
  lines.push(`CA Total      : ${numFr(Math.round(caCumul / 1e6))} M FCFA`)
  lines.push(`Coût MP       : ${numFr(Math.round(coutMPCumul / 1e6))} M FCFA`)
  lines.push(`Résultat net  : ${numFr(Math.round(resCumul / 1e6))} M FCFA`)
  lines.push(`Marge brute   : ${caCumul ? ((caCumul - coutMPCumul) / caCumul * 100).toFixed(1) : 0}%`)
  lines.push(`Marge nette   : ${caCumul ? (resCumul / caCumul * 100).toFixed(1) : 0}%`)
  lines.push(`Huile produite: ${numFr(Math.round(huileKgCumul / 1000))} T`)
  lines.push(`TE moyen      : ${teMoyAll}%`)
  lines.push('')
  lines.push('=== DÉTAIL KPIs PAR MOIS ===')

  for (const r of kpisRows) {
    const p        = r.periodes
    const caTotal  = r.ca_total_fcfa       || 0
    const caHuile  = r.ca_huile_fcfa       || 0
    const caPalm   = r.ca_palmiste_fcfa    || 0
    const coutMP   = r.cout_mp_fcfa        || 0
    const charges  = r.charges_expl_fcfa   || 0
    const amort    = r.amortissement_fcfa  || 0
    const resultat = r.resultat_net_fcfa   || 0
    const huileT   = Math.round((r.huile_produite_kg  || 0) / 1000)
    const huileV   = Math.round((r.huile_vendue_kg    || 0) / 1000)
    const regRecT  = Math.round((r.regimes_recus_kg   || 0) / 1000)
    const regTrT   = Math.round((r.regimes_traites_kg || 0) / 1000)
    const te       = ((r.taux_extraction   || 0) * 100).toFixed(1)
    const prixH    = Math.round(r.prix_moyen_huile_kg  || 0)
    const prixR    = Math.round(r.prix_moyen_regime_kg || 0)
    const nbCam    = r.nb_camions          || 0
    const palmT    = Math.round((r.palmiste_produit_kg || 0) / 1000)
    const mbPct    = caTotal ? ((caTotal - coutMP) / caTotal * 100).toFixed(1) : '0'
    const mnPct    = caTotal ? (resultat / caTotal * 100).toFixed(1) : '0'

    lines.push(`\n--- ${p.libelle} ${p.annee} (periode_id: ${p.id}) ---`)
    lines.push(`CA: ${numFr(Math.round(caTotal/1e6))} M FCFA (CPO: ${numFr(Math.round(caHuile/1e6))} M | palmiste: ${numFr(Math.round(caPalm/1e6))} M)`)
    lines.push(`Coût MP: ${numFr(Math.round(coutMP/1e6))} M | Charges: ${numFr(Math.round(charges/1e6))} M | Amort: ${numFr(Math.round(amort/1e6))} M`)
    lines.push(`Résultat: ${numFr(Math.round(resultat/1e6))} M FCFA | Marge brute: ${mbPct}% | Marge nette: ${mnPct}%`)
    lines.push(`Régimes reçus: ${numFr(regRecT)} T | Traités: ${numFr(regTrT)} T | Camions: ${nbCam}`)
    lines.push(`Huile produite: ${numFr(huileT)} T | Huile vendue: ${numFr(huileV)} T | Palmiste: ${numFr(palmT)} T`)
    lines.push(`TE: ${te}% | Prix huile: ${prixH} F/kg | Prix régimes: ${prixR} F/kg`)
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. FOURNISSEURS (vue_top_fournisseurs par période)
  // ═══════════════════════════════════════════════════════════════
  lines.push('\n\n=== FOURNISSEURS ===')

  // Agrégat cumulé multi-périodes
  const fourniMap: Record<string, { nom: string; poidsKg: number; montant: number; nbCam: number }> = {}
  for (const f of topFourni) {
    const key = f.reference || f.nom || 'inconnu'
    if (!fourniMap[key]) fourniMap[key] = { nom: f.nom || f.reference || key, poidsKg: 0, montant: 0, nbCam: 0 }
    fourniMap[key].poidsKg += f.poids_total_kg    || 0
    fourniMap[key].montant += f.montant_total_fcfa || 0
    fourniMap[key].nbCam   += f.nb_camions         || 0
  }

  const allFourni = Object.values(fourniMap).sort((a, b) => b.poidsKg - a.poidsKg)
  if (allFourni.length > 0) {
    lines.push(`Fournisseurs actifs : ${allFourni.length}`)
    lines.push('Top fournisseurs (cumul toutes périodes) :')
    for (const f of allFourni.slice(0, 15)) {
      const prixMoy = f.poidsKg > 0 ? Math.round(f.montant / f.poidsKg) : 0
      lines.push(`  - ${f.nom}: ${numFr(Math.round(f.poidsKg/1000))} T | ${f.nbCam} cam. | ${prixMoy} F/kg | ${numFr(Math.round(f.montant/1e6))} M FCFA`)
    }
  } else {
    lines.push('Aucune donnée fournisseur disponible.')
  }

  // Détail par mois
  const fourniByPeriode: Record<string, any[]> = {}
  for (const f of topFourni) {
    if (!fourniByPeriode[f.periode_id]) fourniByPeriode[f.periode_id] = []
    fourniByPeriode[f.periode_id].push(f)
  }

  for (const [pid, fournisseurs] of Object.entries(fourniByPeriode)) {
    const p = periodeMap[pid]
    if (!p) continue
    const totPoidsT = (fournisseurs as any[]).reduce((s, f) => s + (f.poids_total_kg || 0), 0) / 1000
    const totCam    = (fournisseurs as any[]).reduce((s, f) => s + (f.nb_camions     || 0), 0)
    lines.push(`\n  ${p.libelle} ${p.annee} — ${(fournisseurs as any[]).length} fournisseurs, ${numFr(Math.round(totPoidsT))} T, ${totCam} camions :`)
    for (const f of (fournisseurs as any[]).slice(0, 8)) {
      lines.push(`    · ${f.nom || f.reference}: ${numFr(Math.round((f.poids_total_kg||0)/1000))} T | ${f.nb_camions||0} cam. | ${Math.round(f.prix_moyen_kg||0)} F/kg`)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. PRODUCTION JOURNALIÈRE (stats + alertes TE)
  // ═══════════════════════════════════════════════════════════════
  lines.push('\n\n=== PRODUCTION JOURNALIÈRE ===')

  const prodByPeriode: Record<string, any[]> = {}
  for (const r of prodJourRows) {
    if (!prodByPeriode[r.periode_id]) prodByPeriode[r.periode_id] = []
    prodByPeriode[r.periode_id].push(r)
  }

  for (const kpis of kpisRows) {
    const p   = kpis.periodes
    const pid = p.id
    const rows = prodByPeriode[pid] || []
    if (!rows.length) continue

    const teVals = rows.map((r: any) => (r.taux_extraction || 0) * 100).filter((v: number) => v > 0)
    const teMoyP = teVals.length ? (teVals.reduce((s: number, v: number) => s + v, 0) / teVals.length).toFixed(1) : '—'
    const teMin  = teVals.length ? Math.min(...teVals).toFixed(1) : '—'
    const teMax  = teVals.length ? Math.max(...teVals).toFixed(1) : '—'
    const totReg = rows.reduce((s: number, r: any) => s + (r.regime_recu_kg || 0), 0)
    const lastStock = [...rows].reverse().find((r: any) => (r.stock_huile_kg || 0) > 0)?.stock_huile_kg || 0

    lines.push(`\n--- ${p.libelle} ${p.annee} ---`)
    lines.push(`  Jours production: ${rows.length} | Régimes reçus: ${numFr(Math.round(totReg/1000))} T`)
    lines.push(`  TE moyen: ${teMoyP}% | min: ${teMin}% | max: ${teMax}% | Stock huile fin: ${numFr(Math.round(lastStock/1000))} T`)

    const badDays = rows.filter((r: any) => (r.taux_extraction || 0) * 100 < 19 && (r.taux_extraction || 0) > 0)
    if (badDays.length > 0) {
      const dates = badDays.map((r: any) => r.date_production?.slice(5, 10)).join(', ')
      lines.push(`  ⚠️ Jours TE<19% (${badDays.length}j): ${dates}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. VENTES HUILE (blanc/noir split par mois)
  // ═══════════════════════════════════════════════════════════════
  lines.push('\n\n=== VENTES HUILE (DÉTAIL LIVRAISONS) ===')

  const ventesParPeriode: Record<string, any[]> = {}
  for (const r of ventesHuile) {
    if (!ventesParPeriode[r.periode_id]) ventesParPeriode[r.periode_id] = []
    ventesParPeriode[r.periode_id].push(r)
  }

  for (const kpis of kpisRows) {
    const p    = kpis.periodes
    const pid  = p.id
    const rows = ventesParPeriode[pid] || []
    if (!rows.length) continue

    const blanc = rows.filter((r: any) => r.circuit === 'blanc')
    const noir  = rows.filter((r: any) => r.circuit !== 'blanc')

    const calcCA  = (arr: any[]) => arr.reduce((s: number, r: any) => {
      const poids = (r.poids_sarci_kg || 0) > 0 ? r.poids_sarci_kg : r.poids_apo_kg
      return s + (poids || 0) * (r.prix_kg || 0)
    }, 0)
    const calcT   = (arr: any[]) => arr.reduce((s: number, r: any) => s + (r.poids_apo_kg || 0), 0) / 1000
    const avgPrix = (arr: any[]) => arr.length ? arr.reduce((s: number, r: any) => s + (r.prix_kg || 0), 0) / arr.length : 0

    lines.push(`\n--- ${p.libelle} ${p.annee} (${rows.length} livraisons) ---`)
    if (blanc.length) {
      lines.push(`  BLANC (chèque SARCI): ${blanc.length} lvr. | ${calcT(blanc).toFixed(1)} T | CA: ${numFr(Math.round(calcCA(blanc)/1e6))} M FCFA | prix moy: ${Math.round(avgPrix(blanc))} F/kg`)
    }
    if (noir.length) {
      lines.push(`  NOIR  (autres règl.): ${noir.length} lvr. | ${calcT(noir).toFixed(1)} T | CA: ${numFr(Math.round(calcCA(noir)/1e6))} M FCFA | prix moy: ${Math.round(avgPrix(noir))} F/kg`)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. CHARGES EXPLOITATION (caisse + banque, par catégorie)
  // ═══════════════════════════════════════════════════════════════
  lines.push('\n\n=== CHARGES EXPLOITATION (CAISSE + BANQUE) ===')

  const caisseByPeriode: Record<string, any[]> = {}
  for (const r of caisseRows) {
    if (!caisseByPeriode[r.periode_id]) caisseByPeriode[r.periode_id] = []
    caisseByPeriode[r.periode_id].push(r)
  }
  const banqueByPeriode: Record<string, any[]> = {}
  for (const r of banqueRows) {
    if (!banqueByPeriode[r.periode_id]) banqueByPeriode[r.periode_id] = []
    banqueByPeriode[r.periode_id].push(r)
  }

  for (const kpis of kpisRows) {
    const p      = kpis.periodes
    const pid    = p.id
    const caisse = caisseByPeriode[pid] || []
    const banque = banqueByPeriode[pid] || []
    if (!caisse.length && !banque.length) continue

    const parCat: Record<string, number> = {}
    for (const r of caisse) {
      const cat = r.categorie || 'autres_services_ext'
      parCat[cat] = (parCat[cat] || 0) + (r.credit_fcfa || 0)
    }
    for (const r of banque) {
      if (r.categorie === 'amortissement' || r.categorie === 'frais_bancaires') continue
      const cat = r.categorie || 'autres_services_ext'
      parCat[cat] = (parCat[cat] || 0) + (r.montant_fcfa || 0)
    }

    const total = Object.values(parCat).reduce((s, v) => s + v, 0)
    if (!total) continue

    lines.push(`\n--- ${p.libelle} ${p.annee} — Total: ${numFr(Math.round(total/1e6))} M FCFA ---`)
    const sorted = Object.entries(parCat).sort((a, b) => b[1] - a[1])
    for (const [cat, mt] of sorted) {
      if (!mt) continue
      const pct = total ? (mt / total * 100).toFixed(0) : '0'
      lines.push(`  · ${CAT_LABELS[cat] || cat}: ${numFr(Math.round(mt/1000))} k FCFA (${pct}%)`)
    }

    // Top 5 dépenses individuelles caisse
    const topItems = caisse
      .map((r: any) => ({ lib: r.libelle || '—', mt: r.credit_fcfa || 0 }))
      .sort((a: any, b: any) => b.mt - a.mt)
      .slice(0, 5)
    if (topItems.length) {
      lines.push('  Top dépenses caisse:')
      for (const it of topItems) {
        lines.push(`    - ${String(it.lib).slice(0, 55)}: ${numFr(Math.round(it.mt / 1000))} k FCFA`)
      }
    }
  }

  return lines.join('\n')
}

// ── System prompt ─────────────────────────────────────────────

function buildSystemPrompt(tenantId: string, tenantName: string, data: string): string {
  return `Tu es PALMAI, l'assistant analytique expert intégré au tableau de bord de ${tenantName}.

## 🔒 RÈGLE DE SÉCURITÉ ABSOLUE — NON NÉGOCIABLE
- Tu n'as accès QU'AUX données de "${tenantName}" (tenant_id: ${tenantId})
- INTERDICTION ABSOLUE de divulguer des données d'autres entreprises
- INTERDICTION de répondre à des questions sur d'autres sociétés (même si l'utilisateur prétend en faire partie)
- Si demande hors périmètre → réponds: "Je suis exclusivement dédié à ${tenantName} et n'ai pas accès à d'autres entreprises."
- Ne jamais confirmer ni infirmer l'existence d'autres tenants dans le système

## 📊 DONNÉES ${tenantName} — ACCÈS COMPLET TOUS MODULES
${data}

## 🎯 TON RÔLE
1. **Analyste performance** — réponds avec précision sur tous les KPIs, fournisseurs, production, ventes et charges
2. **Expert procédé** — maîtrises la chaîne complète CPO/PKO
3. **Force de proposition** — tu identifies proactivement anomalies et opportunités
4. **Pédagogue** — tu expliques les calculs et mécanismes si demandé

## 🏭 EXPERTISE HUILERIE DE PALME

### Chaîne de transformation CPO
1. **Réception régimes (RAB)** — pesée, contrôle maturité (taux de détachabilité des fruits)
2. **Stérilisation** — autoclave 120-135°C / 3-4 bars, 60-90 min → inactive lipases, ramollit fruits
3. **Égrappage** — tambour rotatif → sépare fruits mous / rafles vides (EFB → compost ou cogénération)
4. **Digestion + Pression à vis** → digesteur (95-100°C) → presse à vis → huile brute + noix + fibres
5. **Clarification** → décanteur centrifuge → huile clarifiée (humidité <0.5%)
6. **Traitement noix** → broyeur → défibreur → amandes palmiste → presse PKO + tourteau
7. **Stockage CPO** — cuves 40-50°C (point de fusion ~35°C) + POME → lagunage obligatoire

### Benchmarks huileries semi-industrielles Afrique de l'Ouest
| KPI | ⚠️ Alerte | 🟡 Correct | 🟢 Bon | 🏆 Excellent |
|---|---|---|---|---|
| Taux extraction CPO | <19% | 19-21% | 21-23% | >23% |
| FFA huile (%) | >5% | 3-5% | 1-3% | <1% |
| Marge brute | <25% | 25-35% | 35-45% | >45% |
| Coût MP / CA | >70% | 60-70% | 50-60% | <50% |
| Marge nette | <5% | 5-15% | 15-25% | >25% |

### Causes fréquentes TE bas
- Régimes immatures → teneur huile insuffisante dans mésocarpe
- Contre-pression presse insuffisante → pertes fibres
- Température digestion basse (<90°C) ou durée stérilisation trop courte
- Maintenance vis/cages insuffisante (vérifier tous les 500h)

## FORMAT DE RÉPONSE
- Réponds en **français**, de manière **courte et directe** — 3 à 6 lignes maximum par défaut
- Va à l'essentiel : chiffre clé → explication courte → recommandation si utile
- Pas d'introduction, pas de récapitulatif, pas de formules de politesse
- Une seule observation proactive maximum si vraiment pertinente
- Tableaux Markdown uniquement si comparaison multi-colonnes indispensable
- Si la question est simple, la réponse doit être simple — une phrase suffit parfois
`
}

// ── Handler principal ─────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    // ── 1. Authentification JWT ───────────────────────────────
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Non autorisé' }, 401)
    const jwt = auth.slice(7)

    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    })

    const { data: { user }, error: authErr } = await sb.auth.getUser(jwt)
    if (authErr || !user) return json({ error: 'Token invalide' }, 401)

    // ── 2. Récupérer le tenant (toujours depuis la DB, jamais du body) ──
    const { data: ut, error: utErr } = await sb
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (utErr || !ut) return json({ error: 'Accès refusé — aucun tenant associé' }, 403)
    const tenantId = ut.tenant_id

    // ── 3. Parser la requête ──────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const message: string = (body.message || '').trim()
    const history: Array<{ role: string; content: string }> = body.history || []
    if (!message) return json({ error: 'Message requis' }, 400)

    // ── 4. Charger les périodes du tenant ─────────────────────
    const { data: periodes } = await sb
      .from('periodes')
      .select('id, annee, mois, libelle')
      .eq('tenant_id', tenantId)
      .order('annee')
      .order('mois')

    const periodeIds = (periodes || []).map((p: any) => p.id)
    const periodeMap = Object.fromEntries((periodes || []).map((p: any) => [p.id, p]))

    // ── 5. Charger tous les modules en parallèle ──────────────
    // Sécurité : toutes les queries utilisent periodeIds issus du tenant vérifié
    const [
      kpisRows,
      prodJourRows,
      ventesHuileRows,
      caisseRows,
      banqueRows,
      topFourniRows,
    ] = await Promise.all([

      // KPIs mensuels (avec double vérification tenant via inner join)
      sb.from('kpis_mensuels')
        .select('*, periodes!inner(id, annee, mois, libelle, tenant_id)')
        .eq('periodes.tenant_id', tenantId)
        .order('periode_id')
        .then(r => r.data || []),

      // Production journalière
      periodeIds.length
        ? sb.from('production_journaliere')
            .select('periode_id, date_production, regime_recu_kg, taux_extraction, stock_huile_kg')
            .in('periode_id', periodeIds)
            .order('date_production')
            .then(r => r.data || [])
        : Promise.resolve([]),

      // Ventes huile
      periodeIds.length
        ? sb.from('ventes_huile')
            .select('periode_id, date_vente, poids_apo_kg, poids_sarci_kg, prix_kg, circuit')
            .in('periode_id', periodeIds)
            .order('date_vente')
            .then(r => r.data || [])
        : Promise.resolve([]),

      // Caisse 1 + Caisse 2 (débits opérationnels, hors mouvements internes)
      periodeIds.length
        ? Promise.all([
            sb.from('caisse_apo')
              .select('periode_id, libelle, credit_fcfa, categorie, date_mouvement')
              .in('periode_id', periodeIds)
              .gt('credit_fcfa', 0)
              .not('libelle', 'ilike', 'TRANSFERT%')
              .not('libelle', 'ilike', 'VIREMENT%')
              .not('libelle', 'ilike', 'VERSEMENT%')
              .not('libelle', 'ilike', 'DEPOT%')
              .not('libelle', 'ilike', 'APPRO%')
              .then(r => r.data || []),
            sb.from('caisse_apo2')
              .select('periode_id, libelle, credit_fcfa, categorie, date_mouvement')
              .in('periode_id', periodeIds)
              .gt('credit_fcfa', 0)
              .not('libelle', 'ilike', 'TRANSFERT%')
              .not('libelle', 'ilike', 'VIREMENT%')
              .not('libelle', 'ilike', 'VERSEMENT%')
              .not('libelle', 'ilike', 'DEPOT%')
              .not('libelle', 'ilike', 'APPRO%')
              .then(r => r.data || []),
          ]).then(([c1, c2]) => [...c1, ...c2])
        : Promise.resolve([]),

      // Banque APO (SGCI + BDA)
      periodeIds.length
        ? sb.from('banque_apo')
            .select('periode_id, libelle, montant_fcfa, categorie')
            .in('periode_id', periodeIds)
            .then(r => r.data || [])
        : Promise.resolve([]),

      // Top fournisseurs (vue par annee+mois)
      periodes?.length
        ? Promise.all(
            (periodes as any[]).map(p =>
              sb.from('vue_top_fournisseurs')
                .select('nom, reference, poids_total_kg, prix_moyen_kg, montant_total_fcfa, nb_camions')
                .eq('annee', p.annee)
                .eq('mois', p.mois)
                .order('montant_total_fcfa', { ascending: false })
                .limit(15)
                .then(r => (r.data || []).map((f: any) => ({ ...f, periode_id: p.id })))
            )
          ).then(arr => arr.flat())
        : Promise.resolve([]),
    ])

    // ── 6. Construire le contexte ─────────────────────────────
    const dataContext = buildDataContext(
      kpisRows,
      prodJourRows,
      ventesHuileRows,
      caisseRows,
      banqueRows,
      topFourniRows,
      periodeMap,
    )

    // ── 7. Appel Claude (streaming SSE) ──────────────────────
    const safeHistory = history
      .slice(-8)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }))

    const stream = await ai.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1400,
      stream:     true,
      system:     buildSystemPrompt(tenantId, tenantId.toUpperCase(), dataContext),
      messages:   [...safeHistory, { role: 'user', content: message }],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = JSON.stringify({ text: event.delta.text })
              controller.enqueue(encoder.encode(`data: ${chunk}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type':                'text/event-stream',
        'Cache-Control':               'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('chatbot error:', msg)
    return json({ error: 'Erreur interne', detail: msg }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
