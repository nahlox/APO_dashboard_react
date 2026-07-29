-- ============================================================
-- STEP 1 — SÉCURITÉ
-- 1. prix_cpo : RLS (était totalement ouvert en lecture/écriture anon)
-- 2. tenant_config : lecture restreinte à son propre tenant (était `true`)
-- 3. push_subscriptions : scope par utilisateur (était par tenant)
-- 4. chatbot_usage : quota journalier par utilisateur pour PALMAI
-- ============================================================

-- ── 1. prix_cpo ──────────────────────────────────────────────
ALTER TABLE prix_cpo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prix_cpo_read ON prix_cpo;
CREATE POLICY prix_cpo_read ON prix_cpo
  FOR SELECT TO authenticated USING (true);
-- Écriture : uniquement service role (edge function fetch-cpo-price) — aucune policy INSERT/UPDATE.

-- ── 2. tenant_config : chaque tenant ne lit que sa config ────
DROP POLICY IF EXISTS tenant_config_read ON tenant_config;
CREATE POLICY tenant_config_read ON tenant_config
  FOR SELECT USING (tenant_id = public.get_tenant_id() OR public.is_super_admin());

-- ── 3. push_subscriptions : par utilisateur ──────────────────
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE push_subscriptions ALTER COLUMN tenant_id DROP DEFAULT;

DROP POLICY IF EXISTS push_select ON push_subscriptions;
DROP POLICY IF EXISTS push_insert ON push_subscriptions;
DROP POLICY IF EXISTS push_update ON push_subscriptions;
DROP POLICY IF EXISTS push_delete ON push_subscriptions;

CREATE POLICY push_select ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY push_insert ON push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid() AND tenant_id = public.get_tenant_id());
CREATE POLICY push_update ON push_subscriptions
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND tenant_id = public.get_tenant_id());
-- delete : ses propres lignes + lignes legacy (user_id NULL) de son tenant
CREATE POLICY push_delete ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid() OR (user_id IS NULL AND tenant_id = public.get_tenant_id()));

-- ── 4. Quota chatbot (PALMAI) ────────────────────────────────
CREATE TABLE IF NOT EXISTS chatbot_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jour    DATE NOT NULL DEFAULT CURRENT_DATE,
  nb      INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, jour)
);
ALTER TABLE chatbot_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chatbot_usage_own ON chatbot_usage;
CREATE POLICY chatbot_usage_own ON chatbot_usage
  FOR SELECT USING (user_id = auth.uid());
-- Écriture : service role uniquement (edge function chatbot).
