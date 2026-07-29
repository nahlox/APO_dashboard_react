-- ============================================================
-- STEP 4 — CLÉS D'INGESTION PAR TENANT
-- Chaque agent on-site (ex: agent Sage installé chez le client) reçoit une
-- clé API propre à SON tenant. L'edge function `ingest` force tenant_id
-- sur chaque ligne : une clé volée chez le client A ne peut jamais écrire
-- chez le client B (contrairement à la clé service role).
-- Seul le hash SHA-256 de la clé est stocké.
-- ============================================================

CREATE TABLE IF NOT EXISTS tenant_api_keys (
  id            SERIAL PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_hash      TEXT NOT NULL UNIQUE,          -- sha256 hex de la clé (jamais la clé en clair)
  label         TEXT,                          -- ex: 'sage_agent_usine_abidjan'
  actif         BOOLEAN NOT NULL DEFAULT TRUE,
  cree_le       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dernier_usage TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON tenant_api_keys(tenant_id);

ALTER TABLE tenant_api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_api_keys_admin ON tenant_api_keys;
CREATE POLICY tenant_api_keys_admin ON tenant_api_keys
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Idempotence connecteurs : une même pièce source (ref_externe) ne peut
-- exister qu'une fois par tenant/source → les ré-imports Sage font un upsert.
CREATE UNIQUE INDEX IF NOT EXISTS uq_tx_tenant_source_ref
  ON transactions(tenant_id, source, ref_externe)
  WHERE ref_externe IS NOT NULL;
