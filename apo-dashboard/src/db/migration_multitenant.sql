-- ============================================================
-- MIGRATION MULTI-TENANT — APO SaaS BI
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor
-- Toutes les données APO existantes sont préservées (tenant_id = 'apo')
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLE TENANTS (nouvelles huileries clientes)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id          TEXT PRIMARY KEY,              -- ex: 'apo', 'huilerie_benin'
  nom         TEXT        NOT NULL,
  pays        TEXT        NOT NULL DEFAULT 'CI',
  plan        TEXT        NOT NULL DEFAULT 'starter'
              CHECK (plan IN ('starter', 'business', 'enterprise')),
  actif       BOOLEAN     NOT NULL DEFAULT TRUE,
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insérer APO comme premier tenant
INSERT INTO tenants (id, nom, pays, plan)
VALUES ('apo', 'APO Company', 'CI', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2. TABLE USER_TENANTS (qui a accès à quoi)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_tenants (
  user_id     UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   TEXT  NOT NULL REFERENCES tenants(id)    ON DELETE CASCADE,
  role        TEXT  NOT NULL DEFAULT 'viewer'
              CHECK (role IN ('owner', 'manager', 'viewer')),
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, tenant_id)
);

-- ────────────────────────────────────────────────────────────
-- 3. FONCTION HELPER : retourne le tenant_id de l'utilisateur connecté
--    Dans public (auth schema interdit en Supabase)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS TEXT AS $$
  SELECT tenant_id
  FROM public.user_tenants
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 4. AJOUTER tenant_id À TOUTES LES TABLES EXISTANTES
--    DEFAULT 'apo' → toutes les données existantes restent visibles
-- ────────────────────────────────────────────────────────────

ALTER TABLE periodes                ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE fournisseurs            ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE clients                 ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE achats_regimes          ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE production_journaliere  ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE ventes_huile            ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE ventes_palmiste         ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE ventes_florentin        ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE ventes_bassin           ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE caisse_apo              ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE caisse_apo2             ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE contrats_pepiniere      ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE kpis_mensuels           ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE amortissement_bancaire  ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);
ALTER TABLE banque_apo              ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'apo' REFERENCES tenants(id);

-- ────────────────────────────────────────────────────────────
-- 5. CORRIGER LES CONTRAINTES UNIQUE (inclure tenant_id)
--    Sans ça, deux huileries ne peuvent pas avoir les mêmes données
-- ────────────────────────────────────────────────────────────

-- periodes : (annee, mois) → (annee, mois, tenant_id)
ALTER TABLE periodes DROP CONSTRAINT IF EXISTS periodes_annee_mois_key;
ALTER TABLE periodes ADD CONSTRAINT periodes_annee_mois_tenant_key UNIQUE (annee, mois, tenant_id);

-- production_journaliere : date_production → (date_production, tenant_id)
ALTER TABLE production_journaliere DROP CONSTRAINT IF EXISTS production_journaliere_date_production_key;
ALTER TABLE production_journaliere ADD CONSTRAINT production_journaliere_date_tenant_key UNIQUE (date_production, tenant_id);

-- fournisseurs : reference → (reference, tenant_id)
ALTER TABLE fournisseurs DROP CONSTRAINT IF EXISTS fournisseurs_reference_key;
ALTER TABLE fournisseurs ADD CONSTRAINT fournisseurs_reference_tenant_key UNIQUE (reference, tenant_id);

-- clients : reference → (reference, tenant_id)
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_reference_key;
ALTER TABLE clients ADD CONSTRAINT clients_reference_tenant_key UNIQUE (reference, tenant_id);

-- contrats_pepiniere : numero_ordre → (numero_ordre, tenant_id)
ALTER TABLE contrats_pepiniere DROP CONSTRAINT IF EXISTS contrats_pepiniere_numero_ordre_key;
ALTER TABLE contrats_pepiniere ADD CONSTRAINT contrats_pepiniere_numero_tenant_key UNIQUE (numero_ordre, tenant_id);

-- kpis_mensuels : periode_id seul est OK (chaque période appartient à 1 tenant)

-- ────────────────────────────────────────────────────────────
-- 6. ACTIVER RLS SUR TOUTES LES TABLES
-- ────────────────────────────────────────────────────────────

ALTER TABLE tenants                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE achats_regimes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_journaliere  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes_huile            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes_palmiste         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes_florentin        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes_bassin           ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse_apo              ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse_apo2             ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrats_pepiniere      ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis_mensuels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE amortissement_bancaire  ENABLE ROW LEVEL SECURITY;
ALTER TABLE banque_apo              ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 7. POLITIQUES RLS (isolation totale par tenant)
-- ────────────────────────────────────────────────────────────

-- tenants : chaque user voit uniquement son tenant
CREATE POLICY "voir_son_tenant" ON tenants
  FOR SELECT USING (id = public.get_tenant_id());

-- user_tenants : chaque user voit uniquement ses propres accès
CREATE POLICY "voir_ses_acces" ON user_tenants
  FOR SELECT USING (user_id = auth.uid());

-- Macro pour toutes les tables opérationnelles : SELECT filtré par tenant
CREATE POLICY "isolation_tenant" ON periodes               FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON fournisseurs           FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON clients                FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON achats_regimes         FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON production_journaliere FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON ventes_huile           FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON ventes_palmiste        FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON ventes_florentin       FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON ventes_bassin          FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON caisse_apo             FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON caisse_apo2            FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON contrats_pepiniere     FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON kpis_mensuels          FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON amortissement_bancaire FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "isolation_tenant" ON banque_apo             FOR SELECT USING (tenant_id = public.get_tenant_id());

-- ────────────────────────────────────────────────────────────
-- 8. METTRE À JOUR LES VUES (security_invoker = RLS respecté)
-- ────────────────────────────────────────────────────────────

-- Les vues doivent hériter du contexte de l'utilisateur connecté
ALTER VIEW vue_ca_par_mois          SET (security_invoker = true);
ALTER VIEW vue_production_par_mois  SET (security_invoker = true);
ALTER VIEW vue_top_fournisseurs     SET (security_invoker = true);
ALTER VIEW vue_top_charges          SET (security_invoker = true);
ALTER VIEW vue_pepiniere            SET (security_invoker = true);

-- ────────────────────────────────────────────────────────────
-- 9. INDEX DE PERFORMANCE (requêtes filtrées par tenant)
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_periodes_tenant               ON periodes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_achats_tenant                 ON achats_regimes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_production_tenant             ON production_journaliere(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ventes_huile_tenant           ON ventes_huile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ventes_palmiste_tenant        ON ventes_palmiste(tenant_id);
CREATE INDEX IF NOT EXISTS idx_caisse_apo_tenant             ON caisse_apo(tenant_id);
CREATE INDEX IF NOT EXISTS idx_caisse_apo2_tenant            ON caisse_apo2(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kpis_tenant                   ON kpis_mensuels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_amortissement_tenant          ON amortissement_bancaire(tenant_id);
CREATE INDEX IF NOT EXISTS idx_banque_tenant                 ON banque_apo(tenant_id);

-- ============================================================
-- FIN DE MIGRATION
-- Vérification : exécuter après la migration
-- SELECT tablename, COUNT(*) FROM information_schema.columns
-- WHERE column_name = 'tenant_id' AND table_schema = 'public'
-- GROUP BY tablename;
-- ============================================================
