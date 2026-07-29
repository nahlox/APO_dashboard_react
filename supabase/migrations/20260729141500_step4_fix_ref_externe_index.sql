-- L'index unique partiel (WHERE ref_externe IS NOT NULL) n'est pas ciblable
-- par PostgREST (on_conflict). Un index unique simple suffit : les NULLs sont
-- distincts par défaut, donc les lignes sans ref_externe restent illimitées.
DROP INDEX IF EXISTS uq_tx_tenant_source_ref;
CREATE UNIQUE INDEX uq_tx_tenant_source_ref
  ON transactions(tenant_id, source, ref_externe);
