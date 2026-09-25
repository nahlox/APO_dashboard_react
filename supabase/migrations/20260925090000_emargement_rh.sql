-- ============================================================
-- ÉMARGEMENT DES HEURES (bordereau RH) + rôle « rh »
--
-- 1. Nouveau rôle `rh` dans user_tenants : accès UNIQUEMENT au module
--    émargement. Le verrou est posé en base, pas seulement dans l'UI :
--    get_tenant_id() renvoie NULL pour un compte RH, donc toutes les
--    policies existantes (tenant_id = get_tenant_id()) lui ferment les
--    données financières/production, le chatbot et les push.
-- 2. get_rh_tenant_id() : tenant de l'utilisateur quel que soit son rôle —
--    sert d'isolation pour les tables RH.
-- 3. Tables : employes, emargements (1 ligne par employé et par jour),
--    bordereaux_heures (validation/verrouillage mensuel).
-- 4. Vue vue_bordereau_mensuel : totaux par employé et par mois.
--
-- Droits sur les tables RH :
--   lecture   → owner, manager, viewer, rh (du même tenant)
--   écriture  → owner, manager, rh
--   un mois validé n'est plus modifiable (sauf réouverture par owner/manager/rh).
-- ============================================================

-- ── 1. Rôle rh ───────────────────────────────────────────────
-- Supprime toute contrainte CHECK existante sur `role`, quel que soit son nom.
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.user_tenants'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.user_tenants DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
ALTER TABLE user_tenants ADD CONSTRAINT user_tenants_role_check
  CHECK (role IN ('owner', 'manager', 'viewer', 'rh'));

-- Tenant « tableau de bord » : jamais pour un compte RH.
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id
  FROM public.user_tenants
  WHERE user_id = auth.uid() AND role <> 'rh'
  LIMIT 1;
$$;

-- Tenant « module RH » : tous les rôles.
CREATE OR REPLACE FUNCTION public.get_rh_tenant_id()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id
  FROM public.user_tenants
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Peut saisir / modifier l'émargement ?
CREATE OR REPLACE FUNCTION public.peut_saisir_rh()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_tenants
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'rh')
  );
$$;

-- Le compte RH doit pouvoir lire le nom/logo/couleurs de son entreprise
-- (branding de la page) — rien d'autre dans `tenants` n'est sensible.
DROP POLICY IF EXISTS tenants_read_rh ON tenants;
CREATE POLICY tenants_read_rh ON tenants
  FOR SELECT USING (id = public.get_rh_tenant_id());

-- ── 2. Employés ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employes (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   TEXT NOT NULL DEFAULT public.get_rh_tenant_id() REFERENCES tenants(id) ON DELETE CASCADE,
  matricule   TEXT,
  nom         TEXT NOT NULL,
  prenom      TEXT,
  poste       TEXT,
  service     TEXT,                       -- ex: Production, Maintenance, Administration
  type_contrat TEXT,                      -- CDI, CDD, journalier, saisonnier…
  taux_horaire_fcfa NUMERIC(12,2),        -- optionnel, pour valoriser le bordereau
  date_entree DATE,
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modifie_le  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS employes_tenant_matricule_key
  ON employes(tenant_id, matricule) WHERE matricule IS NOT NULL AND matricule <> '';
CREATE INDEX IF NOT EXISTS idx_employes_tenant ON employes(tenant_id, actif, nom);

-- ── 3. Bordereaux mensuels (statut de validation) ────────────
CREATE TABLE IF NOT EXISTS bordereaux_heures (
  tenant_id   TEXT NOT NULL DEFAULT public.get_rh_tenant_id() REFERENCES tenants(id) ON DELETE CASCADE,
  annee       INT  NOT NULL CHECK (annee BETWEEN 2000 AND 2100),
  mois        INT  NOT NULL CHECK (mois BETWEEN 1 AND 12),
  statut      TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'valide')),
  valide_par  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  valide_par_email TEXT,
  valide_le   TIMESTAMPTZ,
  commentaire TEXT,
  modifie_le  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, annee, mois)
);

-- ── 4. Émargements (une ligne = un employé, un jour) ─────────
CREATE TABLE IF NOT EXISTS emargements (
  id             BIGSERIAL PRIMARY KEY,
  tenant_id      TEXT NOT NULL DEFAULT public.get_rh_tenant_id() REFERENCES tenants(id) ON DELETE CASCADE,
  employe_id     BIGINT NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
  date_jour      DATE NOT NULL,
  statut         TEXT NOT NULL DEFAULT 'present'
                 CHECK (statut IN ('present', 'absent', 'conge', 'maladie', 'repos', 'ferie', 'mission')),
  heure_arrivee  TIME,
  heure_depart   TIME,
  pause_minutes  INT NOT NULL DEFAULT 0 CHECK (pause_minutes BETWEEN 0 AND 720),
  -- Heures travaillées : gère les postes de nuit (départ < arrivée → +24 h).
  heures_travaillees NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN statut NOT IN ('present', 'mission') OR heure_arrivee IS NULL OR heure_depart IS NULL THEN 0
      ELSE GREATEST(0, ROUND((
        (EXTRACT(EPOCH FROM (heure_depart - heure_arrivee))
          + CASE WHEN heure_depart < heure_arrivee THEN 86400 ELSE 0 END) / 60.0
        - pause_minutes) / 60.0, 2))
    END
  ) STORED,
  observation    TEXT,
  saisi_par      UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  cree_le        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modifie_le     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, employe_id, date_jour)
);
CREATE INDEX IF NOT EXISTS idx_emargements_tenant_date ON emargements(tenant_id, date_jour);

-- Cohérence : l'employé émargé appartient au même tenant.
CREATE OR REPLACE FUNCTION public.emargement_check_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM employes e WHERE e.id = NEW.employe_id AND e.tenant_id = NEW.tenant_id) THEN
    RAISE EXCEPTION 'Employé % inconnu pour ce client', NEW.employe_id;
  END IF;
  NEW.modifie_le := NOW();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_emargement_check_tenant ON emargements;
CREATE TRIGGER trg_emargement_check_tenant
  BEFORE INSERT OR UPDATE ON emargements
  FOR EACH ROW EXECUTE FUNCTION public.emargement_check_tenant();

CREATE OR REPLACE FUNCTION public.touch_modifie_le()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.modifie_le := NOW(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_employes_touch ON employes;
CREATE TRIGGER trg_employes_touch BEFORE UPDATE ON employes
  FOR EACH ROW EXECUTE FUNCTION public.touch_modifie_le();
DROP TRIGGER IF EXISTS trg_bordereaux_touch ON bordereaux_heures;
CREATE TRIGGER trg_bordereaux_touch BEFORE UPDATE ON bordereaux_heures
  FOR EACH ROW EXECUTE FUNCTION public.touch_modifie_le();

-- Mois verrouillé (bordereau validé) ?
CREATE OR REPLACE FUNCTION public.mois_rh_verrouille(p_tenant TEXT, p_date DATE)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM bordereaux_heures b
    WHERE b.tenant_id = p_tenant
      AND b.annee = EXTRACT(YEAR FROM p_date)::int
      AND b.mois  = EXTRACT(MONTH FROM p_date)::int
      AND b.statut = 'valide'
  );
$$;

-- ── 5. RLS ───────────────────────────────────────────────────
ALTER TABLE employes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE emargements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bordereaux_heures ENABLE ROW LEVEL SECURITY;

-- employes
DROP POLICY IF EXISTS employes_select ON employes;
DROP POLICY IF EXISTS employes_write  ON employes;
CREATE POLICY employes_select ON employes
  FOR SELECT USING (tenant_id = public.get_rh_tenant_id());
CREATE POLICY employes_write ON employes
  FOR ALL USING (tenant_id = public.get_rh_tenant_id() AND public.peut_saisir_rh())
  WITH CHECK (tenant_id = public.get_rh_tenant_id() AND public.peut_saisir_rh());

-- emargements (écriture interdite sur un mois validé)
DROP POLICY IF EXISTS emargements_select ON emargements;
DROP POLICY IF EXISTS emargements_insert ON emargements;
DROP POLICY IF EXISTS emargements_update ON emargements;
DROP POLICY IF EXISTS emargements_delete ON emargements;
CREATE POLICY emargements_select ON emargements
  FOR SELECT USING (tenant_id = public.get_rh_tenant_id());
CREATE POLICY emargements_insert ON emargements
  FOR INSERT WITH CHECK (
    tenant_id = public.get_rh_tenant_id() AND public.peut_saisir_rh()
    AND NOT public.mois_rh_verrouille(tenant_id, date_jour));
CREATE POLICY emargements_update ON emargements
  FOR UPDATE USING (
    tenant_id = public.get_rh_tenant_id() AND public.peut_saisir_rh()
    AND NOT public.mois_rh_verrouille(tenant_id, date_jour))
  WITH CHECK (
    tenant_id = public.get_rh_tenant_id() AND public.peut_saisir_rh()
    AND NOT public.mois_rh_verrouille(tenant_id, date_jour));
CREATE POLICY emargements_delete ON emargements
  FOR DELETE USING (
    tenant_id = public.get_rh_tenant_id() AND public.peut_saisir_rh()
    AND NOT public.mois_rh_verrouille(tenant_id, date_jour));

-- bordereaux_heures
DROP POLICY IF EXISTS bordereaux_select ON bordereaux_heures;
DROP POLICY IF EXISTS bordereaux_write  ON bordereaux_heures;
CREATE POLICY bordereaux_select ON bordereaux_heures
  FOR SELECT USING (tenant_id = public.get_rh_tenant_id());
CREATE POLICY bordereaux_write ON bordereaux_heures
  FOR ALL USING (tenant_id = public.get_rh_tenant_id() AND public.peut_saisir_rh())
  WITH CHECK (tenant_id = public.get_rh_tenant_id() AND public.peut_saisir_rh());

-- ── 6. Vue : totaux mensuels par employé ─────────────────────
-- Heures sup = au-delà de 8 h par jour travaillé (seuil ajustable plus tard
-- via tenant_config si besoin). security_invoker : le RLS des tables s'applique.
CREATE OR REPLACE VIEW vue_bordereau_mensuel
WITH (security_invoker = true) AS
SELECT
  em.tenant_id,
  EXTRACT(YEAR  FROM em.date_jour)::int AS annee,
  EXTRACT(MONTH FROM em.date_jour)::int AS mois,
  e.id        AS employe_id,
  e.matricule,
  e.nom,
  e.prenom,
  e.poste,
  e.service,
  e.taux_horaire_fcfa,
  COUNT(*) FILTER (WHERE em.statut IN ('present', 'mission'))   AS jours_presents,
  COUNT(*) FILTER (WHERE em.statut = 'absent')                  AS jours_absents,
  COUNT(*) FILTER (WHERE em.statut IN ('conge', 'maladie'))     AS jours_conges,
  COALESCE(SUM(em.heures_travaillees), 0)                       AS heures_totales,
  COALESCE(SUM(GREATEST(em.heures_travaillees - 8, 0)), 0)      AS heures_sup,
  ROUND(COALESCE(SUM(em.heures_travaillees), 0) * COALESCE(e.taux_horaire_fcfa, 0)) AS montant_fcfa
FROM emargements em
JOIN employes e ON e.id = em.employe_id
GROUP BY em.tenant_id, annee, mois, e.id;

GRANT SELECT ON vue_bordereau_mensuel TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON employes, emargements, bordereaux_heures TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE employes_id_seq, emargements_id_seq TO authenticated;
