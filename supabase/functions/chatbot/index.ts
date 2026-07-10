// Edge Function : PALMAI — Assistant IA tableau de bord huilerie
// Deploy : supabase functions deploy chatbot

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic        from 'npm:@anthropic-ai/sdk'
import postgres         from 'npm:postgres'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const DB_URL        = Deno.env.get('SUPABASE_DB_URL')!

const ai = new Anthropic({ apiKey: ANTHROPIC_KEY })

// ── CORS : origines autorisées (défense en profondeur) ──────────
// Configurer ALLOWED_ORIGINS (liste séparée par des virgules) dans les
// secrets de la fonction. À défaut, on retombe sur '*' pour ne pas casser
// les déploiements existants — mais la vraie protection reste le JWT.
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',').map(o => o.trim()).filter(Boolean)

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || ''
  const allow = ALLOWED_ORIGINS.length === 0
    ? '*'
    : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0])
  return {
    'Access-Control-Allow-Origin':  allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Vary':                         'Origin',
  }
}

// ── Sécurité : tables/patterns interdits ────────────────────────
// Défense en profondeur — la protection principale est l'exécution sous le
// rôle `authenticated` avec RLS active (voir runQuery ci-dessous).
const BLOCKED = [
  'user_tenants', 'auth.', 'pg_catalog', 'pg_stat', 'pg_class',
  'pg_shadow', 'pg_authid', 'pg_roles', 'pg_user', 'pg_settings',
  'information_schema', 'storage.', 'vault.', 'pgsodium',
  'supabase_migrations', 'schema_migrations', 'secret', 'password',
  'passwd', 'token', 'jwt', 'credential', 'private', 'key',
]

// Mots-clés d'écriture / de contrôle interdits (aucune requête de lecture
// légitime n'en a besoin).
const WRITE_KEYWORDS = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|merge|call|do|vacuum|analyze|refresh|comment|reindex|cluster|lock|set|reset|prepare|execute|listen|notify|begin|commit|rollback|savepoint)\b/

function validateSql(sql: string): string | null {
  let s = sql.trim()
  // Retirer un unique point-virgule final éventuel
  if (s.endsWith(';')) s = s.slice(0, -1).trim()
  const lower = s.toLowerCase()

  if (!/^(select|with)\b/.test(lower)) return 'Seules les requêtes SELECT sont autorisées.'
  // Aucun point-virgule résiduel → interdit les requêtes empilées
  if (s.includes(';')) return 'Une seule requête à la fois.'
  if (WRITE_KEYWORDS.test(lower)) return 'Opération non autorisée : lecture seule.'
  for (const b of BLOCKED) {
    if (lower.includes(b)) return `Accès interdit : "${b}" est une ressource système.`
  }
  return null
}

// ── Schéma métier exposé à PALMAI ───────────────────────────────
const SCHEMA = `
Tables métier disponibles (toutes filtrées sur ton tenant via periode_id) :

achats_regimes       — 1 ligne = 1 camion livré
  id, periode_id, fournisseur_id, date_achat (DATE), type_transport,
  numero_camion, poids_kg, prix_kg, prix_transport, montant_total

fournisseurs         — transporteurs / fournisseurs
  id, reference, nom

production_journaliere — production quotidienne usine
  id, periode_id, date_production (DATE), regime_recu_kg, regime_traite_kg,
  regime_restant_kg, huile_produite_kg, taux_extraction, stock_huile_kg,
  tank_1000_kg, tank_300_kg, nb_sterilisateurs, livraison_citerne_kg,
  livraison_florentin_kg, livraison_bassin_kg, production_palmiste_kg,
  livraison_palmiste_kg, stock_palmiste_kg

ventes_huile         — livraisons CPO à SARCI
  id, periode_id, client_id, date_vente, libelle, poids_apo_kg,
  poids_sarci_kg, prix_kg, circuit, avance_sarci, montant_fcfa

ventes_palmiste      — ventes noix de palmiste
  id, periode_id, client_id, date_vente, poids_kg, prix_kg, montant_fcfa

ventes_florentin     — ventes Florentin
  id, periode_id, client_id, date_vente, poids_kg, prix_kg, montant_fcfa

ventes_bassin        — ventes bassin lagunage
  id, periode_id, client_id, date_vente, poids_kg, prix_kg, montant_fcfa

caisse_apo           — mouvements caisse principale (encaissements & décaissements)
  id, periode_id, date_mouvement, libelle, debit_fcfa, credit_fcfa,
  solde_fcfa, type_mouvement, categorie

caisse_apo2          — charges exploitation (salaires, carburant, etc.)
  id, periode_id, date_mouvement, libelle, debit_fcfa, credit_fcfa,
  solde_fcfa, categorie

banque_apo           — mouvements bancaires SGCI / BDA
  id, periode_id, banque, date_operation, date_valeur, libelle,
  montant_fcfa, categorie

contrats_pepiniere   — contrats pépinière
  id, client_id, numero_ordre, date_contrat, localite_champ,
  superficie_champ_ha, montant_total, net_encaisse, montant_restant

clients              — clients (huile, palmiste, florentin, pépinière…)
  id, reference, nom, telephone, localite, type

kpis_mensuels        — KPIs agrégés par mois
  id, periode_id, ca_huile_fcfa, ca_palmiste_fcfa, ca_total_fcfa,
  cout_mp_fcfa, charges_exploitation, amortissement_fcfa, resultat_net_fcfa,
  regimes_recus_kg, regimes_traites_kg, huile_produite_kg, taux_extraction,
  nb_camions, palmiste_produit_kg, prix_moyen_regime_kg, prix_moyen_huile_kg

amortissement_bancaire — annuités prêt bancaire
  id, periode_id, libelle, montant_fcfa, type

periodes             — référentiel mois/année (ton tenant est déjà filtré)
  id, annee, mois, libelle, tenant_id

Vues utiles :
vue_top_fournisseurs — agrégat fournisseurs par mois (annee, mois, nom, poids_total_kg, nb_camions, prix_moyen_kg, montant_total_fcfa)
vue_ca_par_mois      — CA détaillé par mois
vue_production_par_mois — production agrégée par mois
`

// ── Outil SQL pour PALMAI ───────────────────────────────────────
const SQL_TOOL: Anthropic.Tool = {
  name: 'query_database',
  description: `Exécute une requête SQL SELECT sur la base de données du tenant.
Utilise cet outil chaque fois que tu as besoin de données précises : réceptions journalières,
détail par transporteur, ventes, charges, production, etc.
IMPORTANT : filtre TOUJOURS par les periode_id du tenant (fournis dans le contexte).
Limite à 200 lignes maximum pour les détails. Utilise des agrégats (SUM, COUNT, AVG) quand possible.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      sql: {
        type: 'string',
        description: 'Requête SQL SELECT à exécuter. SELECT uniquement, pas de modification de données.',
      },
    },
    required: ['sql'],
  },
}

// ── System prompt ───────────────────────────────────────────────
function buildSystemPrompt(tenantId: string, periodeIds: number[], periodes: any[]): string {
  const periodeList = periodes.map(p => `  - ${p.libelle} ${p.annee} → periode_id = ${p.id}`).join('\n')

  return `Tu es PALMAI, l'assistant analytique expert intégré au tableau de bord de ${tenantId.toUpperCase()}.

## 🔒 SÉCURITÉ — NON NÉGOCIABLE
- Tu n'as accès QU'AUX données du tenant "${tenantId}" (periode_id IN (${periodeIds.join(',')}))
- Dans CHAQUE requête SQL, inclus TOUJOURS : WHERE periode_id IN (${periodeIds.join(',')}) ou une jointure équivalente
- Pour les tables sans periode_id (fournisseurs, clients), jointure via achats_regimes ou autre table liée
- INTERDICTION de répondre sur d'autres entreprises

## 🗄️ BASE DE DONNÉES — ACCÈS COMPLET VIA L'OUTIL query_database
${SCHEMA}

## 📅 PÉRIODES DU TENANT ${tenantId.toUpperCase()}
${periodeList}
IDs à utiliser : periode_id IN (${periodeIds.join(',')})

## 🎯 COMPORTEMENT
- Utilise TOUJOURS query_database pour des données précises — ne devine jamais un chiffre
- Préfère les agrégats SQL (SUM, COUNT, GROUP BY) aux listes brutes
- Si une première requête ne suffit pas, enchaîne avec une deuxième
- Réponds en français, concis : chiffre clé → explication courte → recommandation si utile
- Pas d'introduction, pas de politesse, pas de récapitulatif

## 🏭 EXPERTISE HUILERIE
Taux extraction CPO : excellent >23% | bon 21-23% | correct 19-21% | ⚠️ <19%
Marge nette : excellent >25% | bon 15-25% | correct 5-15% | ⚠️ <5%
`
}

// ── Handler ─────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const cors = corsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors })
  }

  try {
    // 1. Auth JWT
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Non autorisé' }, 401, cors)
    const jwt = auth.slice(7)

    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
    const { data: { user }, error: authErr } = await sb.auth.getUser(jwt)
    if (authErr || !user) return json({ error: 'Token invalide' }, 401, cors)

    // 2. Tenant (toujours depuis la DB)
    const { data: ut } = await sb.from('user_tenants').select('tenant_id').eq('user_id', user.id).single()
    if (!ut) return json({ error: 'Accès refusé — aucun tenant associé' }, 403, cors)
    const tenantId = ut.tenant_id

    // 3. Périodes du tenant
    const { data: periodes } = await sb
      .from('periodes')
      .select('id, annee, mois, libelle')
      .eq('tenant_id', tenantId)
      .order('annee').order('mois')

    const periodeIds = (periodes || []).map((p: any) => p.id)
    if (!periodeIds.length) return json({ error: 'Aucune période disponible' }, 404, cors)

    // 4. Message
    const body = await req.json().catch(() => ({}))
    const message: string = (body.message || '').trim()
    const history: Array<{ role: string; content: string }> = body.history || []
    if (!message) return json({ error: 'Message requis' }, 400, cors)

    const systemPrompt = buildSystemPrompt(tenantId, periodeIds, periodes || [])

    // 5. Boucle agentique (outil SQL + réponse finale)
    const sql = postgres(DB_URL, { max: 1, prepare: false, ssl: 'require' })

    // Exécute la requête sous le rôle `authenticated` avec les claims JWT de
    // l'utilisateur → les politiques RLS s'appliquent et l'isolation par tenant
    // est garantie par la base, même si le modèle omet le filtre periode_id.
    const jwtClaims = JSON.stringify({ sub: user.id, role: 'authenticated' })
    const runQuery = (querySql: string) =>
      sql.begin(async (tx) => {
        await tx.unsafe('SET LOCAL ROLE authenticated')
        await tx.unsafe("SELECT set_config('request.jwt.claims', $1, true)", [jwtClaims])
        await tx.unsafe('SET LOCAL statement_timeout = 8000')
        return await tx.unsafe(querySql)
      })

    const messages: Anthropic.MessageParam[] = [
      ...history
        .slice(-6)
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: String(m.content) })),
      { role: 'user', content: message },
    ]

    let finalText = ''

    try {
      for (let iter = 0; iter < 5; iter++) {
        const isLast = iter === 4
        const response = await ai.messages.create({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          system:     systemPrompt,
          tools:      isLast ? [] : [SQL_TOOL],
          tool_choice: isLast ? { type: 'none' } : { type: 'auto' },
          messages,
        })

        // Collecter le texte de cette itération
        const textBlocks = response.content.filter(b => b.type === 'text')
        if (textBlocks.length) {
          finalText = textBlocks.map(b => (b as Anthropic.TextBlock).text).join('')
        }

        if (response.stop_reason === 'end_turn') break

        if (response.stop_reason === 'tool_use') {
          // Ajouter le message assistant (avec blocs tool_use)
          messages.push({ role: 'assistant', content: response.content })

          // Exécuter chaque appel d'outil
          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const block of response.content) {
            if (block.type !== 'tool_use') continue
            const input = block.input as { sql: string }
            const querySql = (input.sql || '').trim()

            const valErr = validateSql(querySql)
            let resultContent: string

            if (valErr) {
              resultContent = `Erreur : ${valErr}`
            } else {
              try {
                const rows = await runQuery(querySql)
                const limited = Array.isArray(rows) ? rows.slice(0, 300) : rows
                resultContent = JSON.stringify(limited)
              } catch (e) {
                console.error('chatbot sql error:', e)
                resultContent = 'Erreur lors de l’exécution de la requête.'
              }
            }

            toolResults.push({
              type:        'tool_result',
              tool_use_id: block.id,
              content:     resultContent,
            })
          }

          messages.push({ role: 'user', content: toolResults })
          continue
        }

        break
      }
    } finally {
      await sql.end({ timeout: 5 })
    }

    // 6. Streamer la réponse finale en SSE
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      start(controller) {
        // Émettre par chunks de ~30 caractères pour simuler le streaming
        const chunkSize = 30
        for (let i = 0; i < finalText.length; i += chunkSize) {
          const chunk = finalText.slice(i, i + chunkSize)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        ...cors,
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('chatbot error:', msg)
    return json({ error: 'Erreur interne' }, 500, cors)
  }
})

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  })
}
