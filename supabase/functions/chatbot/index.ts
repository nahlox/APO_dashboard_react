// Edge Function : PALMAI — Assistant IA tableau de bord huilerie
// Deploy : supabase functions deploy chatbot

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const ai = new Anthropic({ apiKey: ANTHROPIC_KEY })

// ── Formatage données pour le contexte ───────────────────────

function numFr(n: number) {
  return Math.round(n).toLocaleString('fr-FR')
}

function buildDataContext(kpisRows: any[]): string {
  if (!kpisRows?.length) return 'Aucune donnée disponible.'

  const lines: string[] = []

  // Cumul annuel
  const caCumul      = kpisRows.reduce((s, r) => s + (r.ca_total_fcfa || 0), 0)
  const coutMPCumul  = kpisRows.reduce((s, r) => s + (r.cout_mp_fcfa  || 0), 0)
  const resCumul     = kpisRows.reduce((s, r) => s + (r.resultat_net_fcfa || 0), 0)
  const huileKgCumul = kpisRows.reduce((s, r) => s + (r.huile_produite_kg  || 0), 0)
  const teMoy        = kpisRows.length
    ? (kpisRows.reduce((s, r) => s + (r.taux_extraction || 0), 0) / kpisRows.length * 100).toFixed(1)
    : '0'

  lines.push(`=== CUMUL ANNUEL (${kpisRows.length} mois) ===`)
  lines.push(`CA Total : ${numFr(Math.round(caCumul / 1e6))} M FCFA`)
  lines.push(`Coût MP  : ${numFr(Math.round(coutMPCumul / 1e6))} M FCFA`)
  lines.push(`Résultat : ${numFr(Math.round(resCumul / 1e6))} M FCFA`)
  lines.push(`Marge brute : ${caCumul ? ((caCumul - coutMPCumul) / caCumul * 100).toFixed(1) : 0}%`)
  lines.push(`Marge nette : ${caCumul ? (resCumul / caCumul * 100).toFixed(1) : 0}%`)
  lines.push(`Huile produite : ${numFr(Math.round(huileKgCumul / 1000))} T`)
  lines.push(`TE moyen : ${teMoy}%`)
  lines.push('')

  // Détail par mois
  lines.push('=== DÉTAIL PAR MOIS ===')
  for (const r of kpisRows) {
    const p         = r.periodes
    const caTotal   = r.ca_total_fcfa       || 0
    const caHuile   = r.ca_huile_fcfa       || 0
    const caPalm    = r.ca_palmiste_fcfa    || 0
    const coutMP    = r.cout_mp_fcfa        || 0
    const charges   = r.charges_expl_fcfa  || 0
    const amort     = r.amortissement_fcfa  || 0
    const resultat  = r.resultat_net_fcfa   || 0
    const huileT    = Math.round((r.huile_produite_kg  || 0) / 1000)
    const huileV    = Math.round((r.huile_vendue_kg    || 0) / 1000)
    const regRecusT = Math.round((r.regimes_recus_kg   || 0) / 1000)
    const regTrT    = Math.round((r.regimes_traites_kg || 0) / 1000)
    const te        = ((r.taux_extraction || 0) * 100).toFixed(1)
    const prixH     = Math.round(r.prix_moyen_huile_kg  || 0)
    const prixR     = Math.round(r.prix_moyen_regime_kg || 0)
    const nbCam     = r.nb_camions || 0
    const palmT     = Math.round((r.palmiste_produit_kg || 0) / 1000)
    const margeBp   = caTotal ? ((caTotal - coutMP) / caTotal * 100).toFixed(1) : '0'
    const margeNp   = caTotal ? (resultat / caTotal * 100).toFixed(1) : '0'

    lines.push(`\n--- ${p.libelle} ${p.annee} ---`)
    lines.push(`CA: ${numFr(Math.round(caTotal/1e6))} M FCFA (huile CPO: ${numFr(Math.round(caHuile/1e6))} M | palmiste: ${numFr(Math.round(caPalm/1e6))} M)`)
    lines.push(`Coût MP: ${numFr(Math.round(coutMP/1e6))} M | Charges expl: ${numFr(Math.round(charges/1e6))} M | Amort: ${numFr(Math.round(amort/1e6))} M`)
    lines.push(`Résultat net: ${numFr(Math.round(resultat/1e6))} M FCFA | Marge brute: ${margeBp}% | Marge nette: ${margeNp}%`)
    lines.push(`Régimes reçus: ${numFr(regRecusT)} T | Régimes traités: ${numFr(regTrT)} T | Camions: ${nbCam}`)
    lines.push(`Huile produite: ${numFr(huileT)} T | Huile vendue: ${numFr(huileV)} T | Palmiste: ${numFr(palmT)} T`)
    lines.push(`TE: ${te}% | Prix huile: ${prixH} F/kg | Prix régimes: ${prixR} F/kg`)
  }

  return lines.join('\n')
}

// ── System prompt (tenant-scopé) ─────────────────────────────

function buildSystemPrompt(tenantId: string, tenantName: string, data: string): string {
  return `Tu es PALMAI, l'assistant analytique expert intégré au tableau de bord de ${tenantName}.

## 🔒 RÈGLE DE SÉCURITÉ ABSOLUE — NON NÉGOCIABLE
- Tu n'as accès QU'AUX données de "${tenantName}" (tenant_id: ${tenantId})
- INTERDICTION ABSOLUE de divulguer des données d'autres entreprises
- INTERDICTION de répondre à des questions sur d'autres sociétés (même si l'utilisateur prétend en faire partie)
- Si demande hors périmètre → réponds: "Je suis exclusivement dédié à ${tenantName} et n'ai pas accès à d'autres entreprises."
- Ne jamais confirmer ni infirmer l'existence d'autres tenants dans le système

## 📊 DONNÉES ${tenantName} (périmètre exclusif)
${data}

## 🎯 TON RÔLE
1. **Analyste performance** — réponds avec précision sur les KPIs ci-dessus
2. **Expert procédé** — maîtrises la chaîne complète CPO/PKO
3. **Force de proposition** — tu identifies proactivement anomalies et opportunités
4. **Pédagogue** — tu expliques les calculs et mécanismes si demandé

## 🏭 EXPERTISE HUILERIE DE PALME

### Chaîne de transformation CPO
1. **Réception régimes (RAB)** — pesée, contrôle maturité (taux de détachabilité des fruits)
2. **Stérilisation** — autoclave 120-135°C / 3-4 bars, 60-90 min
   → Inactive les lipases (stoppe la montée de FFA)
   → Ramollit et détache les fruits du régime
   → Facilite la séparation des amandes
3. **Égrappage** — tambour rotatif ou vibreur → sépare fruits mous / rafles vides (EFB)
   → EFB → compost en plantation (retour nutriments) ou cogénération
4. **Digestion + Pression à vis**
   → Digesteur (95-100°C, 20-30 min) → cellules rompues libèrent l'huile
   → Presse à vis (extracteur) → huile brute + noix + fibres
   → Fibres → chaudière (combustible, 50-60% humidité OK)
5. **Clarification**
   → Bac de décantation → séparation grossière eau/huile
   → Décanteur centrifuge ou débourbeur → huile clarifiée (humidité <0.5%)
   → Boues → récupération huile résiduelle
6. **Traitement noix** → broyeur → défibreur → silo hydropneumatique → amandes palmiste
   → Presse PKO → Huile de Palmiste (PKO) + tourteau palmiste
7. **Stockage CPO** — cuves 40-50°C pour maintenir fluidité (point de fusion ~35°C)
8. **Effluents POME** → bassin de lagunage obligatoire ou biométhanisation

### Benchmarks huileries semi-industrielles Afrique de l'Ouest
| KPI | ⚠️ Alerte | 🟡 Correct | 🟢 Bon | 🏆 Excellent |
|---|---|---|---|---|
| Taux extraction CPO | <19% | 19-21% | 21-23% | >23% |
| FFA huile (%) | >5% | 3-5% | 1-3% | <1% |
| Pertes huile process | >3% | 2-3% | 1-2% | <1% |
| Rendement PKO | <4% | 4-5.5% | 5.5-7% | >7% |
| Marge brute | <25% | 25-35% | 35-45% | >45% |
| Coût MP / CA | >70% | 60-70% | 50-60% | <50% |

### Causes fréquentes TE bas
- Régimes immatures (récoltés avant maturité) → teneur huile insuffisante dans mésocarpe
- Contre-pression presse insuffisante → huile résiduelle dans fibres (pertes >3%)
- Température digestion basse (<90°C) → fruits insuffisamment ramollis
- Durée stérilisation trop courte → fruits durs, détachement incomplet
- Suralimentation extracteur → dépassement capacité nominale → efficacité réduite
- Maintenance insuffisante vis/cages → usure, jeux excessifs

### Optimisations possibles
- **Calendrier récolte** — régimes à 50-70% de fruits détachés = maturité optimale
- **Maintenance préventive** — vérification vis presse tous les 500h
- **Contrôle températures** — sondes digestion + stérilisation en temps réel
- **Analyse FFA hebdomadaire** — signal précoce de problèmes stérilisation
- **Suivi POME** — ratio POME/huile produite = indicateur pertes

## FORMAT DE RÉPONSE
- Réponds en **français**, de manière **concise et structurée**
- Utilise les données fournies en section 📊 pour les chiffres précis
- Ajoute SYSTÉMATIQUEMENT une section "💡 Observation" ou "🎯 Recommandation" proactive
- Si tu vois une anomalie dans les données, mentionne-la sans qu'on te le demande
- Tableaux Markdown pour les comparaisons multi-mois
`
}

// ── Handler principal ─────────────────────────────────────────

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

  try {
    // ── 1. Authentification JWT ───────────────────────────────
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) {
      return json({ error: 'Non autorisé' }, 401)
    }
    const jwt = auth.slice(7)

    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    })

    const { data: { user }, error: authErr } = await sb.auth.getUser(jwt)
    if (authErr || !user) return json({ error: 'Token invalide' }, 401)

    // ── 2. Récupérer le tenant (toujours depuis la DB, jamais du body) ────
    const { data: ut, error: utErr } = await sb
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (utErr || !ut) return json({ error: 'Accès refusé — aucun tenant associé' }, 403)
    const tenantId = ut.tenant_id  // ex: 'apo'

    // ── 3. Parser la requête ──────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const message: string = (body.message || '').trim()
    const history: Array<{ role: string; content: string }> = body.history || []

    if (!message) return json({ error: 'Message requis' }, 400)

    // ── 4. Charger les données du tenant ─────────────────────
    // Récupère les périodes du tenant, puis les KPIs associés
    const { data: kpisRows } = await sb
      .from('kpis_mensuels')
      .select('*, periodes!inner(id, annee, mois, libelle, tenant_id)')
      .eq('periodes.tenant_id', tenantId)
      .order('periode_id')

    const dataContext = buildDataContext(kpisRows || [])

    // ── 5. Appel Claude ───────────────────────────────────────
    // Historique limité aux 8 derniers messages (4 échanges)
    const safeHistory = history
      .slice(-8)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }))

    const aiResponse = await ai.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system:     buildSystemPrompt(tenantId, tenantId.toUpperCase(), dataContext),
      messages:   [...safeHistory, { role: 'user', content: message }],
    })

    const reply = aiResponse.content[0]?.type === 'text'
      ? aiResponse.content[0].text
      : 'Désolé, je n\'ai pas pu générer une réponse.'

    return json({ reply, tenant: tenantId })

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
