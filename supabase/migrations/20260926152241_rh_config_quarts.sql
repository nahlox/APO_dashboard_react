-- Configuration RH par client : quart affecté à chaque équipe/service
-- (module « Bordereau des Heures », onglet Effectif). Ex. :
--   {"A":"q07","B":"q23","C":"q15","CP":"jour",...}
CREATE TABLE IF NOT EXISTS rh_config (
  tenant_id  TEXT PRIMARY KEY DEFAULT public.get_rh_tenant_id() REFERENCES tenants(id) ON DELETE CASCADE,
  quarts     JSONB NOT NULL DEFAULT '{}'::jsonb,
  modifie_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE rh_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rh_config_select ON rh_config;
DROP POLICY IF EXISTS rh_config_write  ON rh_config;
CREATE POLICY rh_config_select ON rh_config
  FOR SELECT USING (tenant_id = public.get_rh_tenant_id());
CREATE POLICY rh_config_write ON rh_config
  FOR ALL USING (tenant_id = public.get_rh_tenant_id() AND public.peut_saisir_rh())
  WITH CHECK (tenant_id = public.get_rh_tenant_id() AND public.peut_saisir_rh());
DROP TRIGGER IF EXISTS trg_rh_config_touch ON rh_config;
CREATE TRIGGER trg_rh_config_touch BEFORE UPDATE ON rh_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_modifie_le();
GRANT SELECT, INSERT, UPDATE, DELETE ON rh_config TO authenticated;
