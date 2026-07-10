-- ============================================================
-- SÉCURITÉ : RLS sur push_subscriptions
-- À exécuter dans Supabase > SQL Editor (APRÈS migration_multitenant.sql
-- et push_subscriptions_migration.sql).
--
-- Sans RLS, n'importe quel client détenant la clé anon (publique, embarquée
-- dans le bundle) pouvait lire tous les endpoints/clés push de tous les
-- tenants, les supprimer (déni de notifications) ou en injecter.
-- Les Edge Functions utilisent la clé service_role → elles contournent le RLS.
-- ============================================================

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Grants explicites : seul le rôle authenticated (utilisateur connecté).
REVOKE ALL ON push_subscriptions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;

-- Nettoyage d'éventuelles politiques précédentes
DROP POLICY IF EXISTS push_select ON push_subscriptions;
DROP POLICY IF EXISTS push_insert ON push_subscriptions;
DROP POLICY IF EXISTS push_update ON push_subscriptions;
DROP POLICY IF EXISTS push_delete ON push_subscriptions;

-- Chaque utilisateur ne voit / gère que les abonnements de SON tenant.
CREATE POLICY push_select ON push_subscriptions
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY push_insert ON push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY push_update ON push_subscriptions
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY push_delete ON push_subscriptions
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_tenant_id());
