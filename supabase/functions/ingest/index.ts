// Edge Function : ingest — point d'entrée des connecteurs de données
// (agent Sage on-site, futurs connecteurs). Auth par clé API scopée tenant :
// le tenant_id est FORCÉ côté serveur sur chaque ligne, une clé du client A
// ne peut jamais écrire chez le client B.
//
// Headers : x-api-key: <clé du tenant>
// Body :
//   { action: "heartbeat", statut: "ok"|"erreur", source?: "sage_agent",
//     lignes?: 123, message?: "..." }
//   { action: "upsert_rows", table: "transactions", rows: [...],
//     on_conflict?: "tenant_id,source,ref_externe" }
//   { action: "delete_periode", table: "transactions", periode_id: 4,
//     source?: "sage" }   // purge avant ré-import complet d'un mois
//
// Tables autorisées : voir ALLOWED_TABLES. La colonne tenant_id de chaque
// ligne est écrasée par celle de la clé. periode_id est vérifié comme
// appartenant au tenant.
//
// Deploy : python3 scratchpad/deploy_fn.py ingest (Management API)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const ALLOWED_TABLES = new Set([
  'transactions',
  'production_journaliere',
  'achats_regimes',
  'ventes_huile',
  'ventes_palmiste',
  'fournisseurs',
  'kpis_mensuels',
])

const MAX_ROWS = 5000

async function sha256hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return json({ error: 'POST uniquement' }, 405)

    // ── 1. Auth par clé API tenant ───────────────────────────────────────────
    const apiKey = req.headers.get('x-api-key') ?? ''
    if (!apiKey) return json({ error: 'x-api-key requis' }, 401)

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
    const hash = await sha256hex(apiKey)
    const { data: keyRow } = await sb.from('tenant_api_keys')
      .select('id, tenant_id').eq('key_hash', hash).eq('actif', true).maybeSingle()
    if (!keyRow) return json({ error: 'Clé API invalide ou désactivée' }, 401)

    const tenantId: string = keyRow.tenant_id
    sb.from('tenant_api_keys').update({ dernier_usage: new Date().toISOString() })
      .eq('id', keyRow.id).then(() => {})

    const body = await req.json().catch(() => null)
    if (!body?.action) return json({ error: 'action requise' }, 400)

    // ── 2. heartbeat → etl_runs ──────────────────────────────────────────────
    if (body.action === 'heartbeat') {
      const statut = body.statut === 'erreur' ? 'erreur' : 'ok'
      const { error } = await sb.from('etl_runs').insert({
        tenant_id:  tenantId,
        source:     String(body.source ?? 'sage_agent').slice(0, 40),
        statut,
        termine_le: new Date().toISOString(),
        lignes:     Number(body.lignes ?? 0) || 0,
        message:    String(body.message ?? '').slice(0, 500),
      })
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true, tenant_id: tenantId })
    }

    // ── Validation table + périodes du tenant ────────────────────────────────
    const table: string = body.table
    if (!ALLOWED_TABLES.has(table)) {
      return json({ error: `Table non autorisée. Autorisées : ${[...ALLOWED_TABLES].join(', ')}` }, 400)
    }

    const { data: periodes } = await sb.from('periodes').select('id').eq('tenant_id', tenantId)
    const periodeIds = new Set((periodes ?? []).map((p: { id: number }) => p.id))

    // ── 3. delete_periode : purge avant ré-import complet ────────────────────
    if (body.action === 'delete_periode') {
      const pid = Number(body.periode_id)
      if (!periodeIds.has(pid)) return json({ error: `periode_id ${pid} n'appartient pas au tenant` }, 400)
      let q = sb.from(table).delete().eq('tenant_id', tenantId).eq('periode_id', pid)
      if (body.source && table === 'transactions') q = q.eq('source', String(body.source))
      const { error } = await q
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true, deleted_periode: pid })
    }

    // ── 4. upsert_rows ───────────────────────────────────────────────────────
    if (body.action === 'upsert_rows') {
      const rows: Record<string, unknown>[] = body.rows
      if (!Array.isArray(rows) || rows.length === 0) return json({ error: 'rows vide' }, 400)
      if (rows.length > MAX_ROWS) return json({ error: `Max ${MAX_ROWS} lignes par appel` }, 400)

      for (const r of rows) {
        r.tenant_id = tenantId              // FORCÉ — jamais celui du payload
        if ('periode_id' in r && !periodeIds.has(Number(r.periode_id))) {
          return json({ error: `periode_id ${r.periode_id} n'appartient pas au tenant ${tenantId}` }, 400)
        }
      }

      const onConflict: string | undefined = body.on_conflict
      const q = onConflict
        ? sb.from(table).upsert(rows, { onConflict })
        : sb.from(table).insert(rows)
      const { error } = await q
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true, table, rows: rows.length, tenant_id: tenantId })
    }

    return json({ error: `action inconnue : ${body.action}` }, 400)

  } catch (err) {
    console.error('ingest error:', err)
    return json({ error: 'Erreur interne' }, 500)
  }
})
