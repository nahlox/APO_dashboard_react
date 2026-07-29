-- ============================================================
-- CONSOLE ADMIN (opérateur plateforme) — backend
-- RPC d'agrégats par tenant + journal des actions admin.
--
-- Les fonctions sont SECURITY DEFINER (elles doivent traverser le RLS pour
-- agréger TOUS les tenants) mais refusent l'exécution si l'appelant n'est pas
-- super-admin. Elles ne renvoient que des AGRÉGATS, jamais les lignes de
-- données d'un client : la console pilote la plateforme, elle n'ouvre pas
-- l'accès aux données métier des clients.
-- ============================================================

-- ── 1. Vue d'ensemble de tous les clients ────────────────────
CREATE OR REPLACE FUNCTION public.admin_tenants_overview()
RETURNS TABLE (
  tenant_id             TEXT,
  nom_affichage         TEXT,
  pays                  TEXT,
  plan                  TEXT,
  actif                 BOOLEAN,
  cree_le               TIMESTAMPTZ,
  couleur_primaire      TEXT,
  nb_users              INT,
  nb_periodes           INT,
  nb_transactions       BIGINT,
  derniere_donnee       DATE,
  dernier_import        TIMESTAMPTZ,
  dernier_import_statut TEXT,
  nb_cles_actives       INT,
  ca_total_fcfa         NUMERIC,
  nb_sources            INT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    t.id, t.nom_affichage, t.pays, t.plan, t.actif, t.cree_le, t.couleur_primaire,
    (SELECT COUNT(*)::int  FROM user_tenants ut WHERE ut.tenant_id = t.id),
    (SELECT COUNT(*)::int  FROM periodes p      WHERE p.tenant_id  = t.id),
    (SELECT COUNT(*)       FROM transactions tx WHERE tx.tenant_id = t.id),
    GREATEST(
      (SELECT MAX(pj.date_production) FROM production_journaliere pj WHERE pj.tenant_id = t.id),
      (SELECT MAX(tx.date_mouvement)  FROM transactions tx          WHERE tx.tenant_id = t.id)
    ),
    (SELECT MAX(r.demarre_le) FROM etl_runs r WHERE r.tenant_id = t.id),
    (SELECT r.statut FROM etl_runs r WHERE r.tenant_id = t.id ORDER BY r.demarre_le DESC LIMIT 1),
    (SELECT COUNT(*)::int FROM tenant_api_keys k WHERE k.tenant_id = t.id AND k.actif),
    COALESCE((SELECT SUM(k.ca_total_fcfa) FROM kpis_mensuels k WHERE k.tenant_id = t.id), 0),
    COALESCE((SELECT jsonb_array_length(c.config->'sources') FROM tenant_config c WHERE c.tenant_id = t.id), 0)
  FROM tenants t
  WHERE public.is_super_admin()          -- aucune ligne si l'appelant n'est pas super-admin
  ORDER BY t.actif DESC, t.cree_le DESC;
$$;

-- ── 2. Santé détaillée d'un client (fraîcheur par source de données) ──
CREATE OR REPLACE FUNCTION public.admin_tenant_health(p_tenant_id TEXT)
RETURNS TABLE (
  domaine        TEXT,   -- libellé métier
  nb_lignes      BIGINT,
  derniere_date  DATE,
  jours_retard   INT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH src AS (
    SELECT 'Production journalière' AS domaine,
           (SELECT COUNT(*) FROM production_journaliere WHERE tenant_id = p_tenant_id) AS nb,
           (SELECT MAX(date_production) FROM production_journaliere WHERE tenant_id = p_tenant_id) AS d
    UNION ALL
    SELECT 'Mouvements financiers (caisse/banque/Sage)',
           (SELECT COUNT(*) FROM transactions WHERE tenant_id = p_tenant_id),
           (SELECT MAX(date_mouvement) FROM transactions WHERE tenant_id = p_tenant_id)
    UNION ALL
    SELECT 'Ventes huile',
           (SELECT COUNT(*) FROM ventes_huile WHERE tenant_id = p_tenant_id),
           (SELECT MAX(date_vente) FROM ventes_huile WHERE tenant_id = p_tenant_id)
    UNION ALL
    SELECT 'Achats régimes',
           (SELECT COUNT(*) FROM achats_regimes WHERE tenant_id = p_tenant_id),
           (SELECT MAX(date_achat) FROM achats_regimes WHERE tenant_id = p_tenant_id)
    UNION ALL
    SELECT 'KPIs mensuels',
           (SELECT COUNT(*) FROM kpis_mensuels WHERE tenant_id = p_tenant_id),
           NULL::date
  )
  SELECT domaine, nb, d,
         CASE WHEN d IS NULL THEN NULL ELSE (CURRENT_DATE - d)::int END
  FROM src
  WHERE public.is_super_admin();
$$;

-- ── 3. Journal des actions admin ─────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          BIGSERIAL PRIMARY KEY,
  acteur_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acteur_email TEXT,
  tenant_id   TEXT,
  action      TEXT NOT NULL,     -- ex: 'config_update', 'user_invite', 'key_create'
  details     JSONB,
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON admin_audit_log(tenant_id, cree_le DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_super_admin ON admin_audit_log;
CREATE POLICY audit_super_admin ON admin_audit_log
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ── 4. Réglages par tenant réellement consommés ──────────────
-- Documente les clés attendues dans tenant_config.config (aucune n'est
-- obligatoire — les edge functions appliquent les valeurs par défaut) :
--   rapport_email_actif   BOOLEAN   (défaut true)  — envoi du rapport quotidien
--   push_actif            BOOLEAN   (défaut true)  — notification push quotidienne
--   seuil_te_critique     NUMERIC   (défaut 0.17)  — TE sous lequel l'alerte est urgente
--   seuil_te_bas          NUMERIC   (défaut 0.18)  — TE sous lequel on alerte dans le rapport
--   seuil_marge_cible     NUMERIC   (défaut 0.15)  — marge nette cible
--   report_recipients     TEXT[]                    — destinataires (sinon owners/managers)
--   tank_capacite_kg      NUMERIC                   — jauge de stock huile
--   skip_caisse/skip_banque TEXT[]                  — libellés exclus des charges
COMMENT ON TABLE tenant_config IS
  'Configuration par tenant. Clés consommées : rapport_email_actif, push_actif, seuil_te_critique, seuil_te_bas, seuil_marge_cible, report_recipients, tank_capacite_kg, skip_caisse, skip_banque, sources, dropbox/fichiers/sheets (ETL Excel).';
