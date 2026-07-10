-- ============================================================
-- MIGRATION : ONBOARDING ADMIN — branding par tenant + super-admins
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor
-- Prérequis : migration_multitenant.sql déjà appliquée
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. BRANDING PAR TENANT (logo, couleurs, nom affiché)
-- ────────────────────────────────────────────────────────────
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS nom_affichage     TEXT NOT NULL DEFAULT '';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url          TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS couleur_primaire  TEXT NOT NULL DEFAULT '#F28C28';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS couleur_secondaire TEXT NOT NULL DEFAULT '#3FA34D';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email_from        TEXT;   -- ex: "Huilerie Bénin <rapport@huileriebenin.com>"

-- Rétrocompat APO : renseigner les valeurs déjà en dur dans le code
UPDATE tenants SET
  nom_affichage      = 'APO — Agro Palm Oil',
  logo_url           = NULL,   -- reste servi depuis /assets/logo_apo.png en local pour APO
  couleur_primaire   = '#F28C28',
  couleur_secondaire = '#3FA34D'
WHERE id = 'apo' AND nom_affichage = '';

-- ────────────────────────────────────────────────────────────
-- 2. SUPER-ADMINS (accès à tous les tenants + création de tenants)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS super_admins (
  user_id  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cree_le  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voir_son_statut" ON super_admins
  FOR SELECT USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid());
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Le propriétaire de la plateforme (rawad.nahle10@gmail.com) devient super-admin.
-- L'edge function admin-create-tenant utilise le service role et bypass RLS de toute façon,
-- mais ce statut permet aussi d'afficher/masquer la page /admin côté frontend.
INSERT INTO super_admins (user_id)
SELECT id FROM auth.users WHERE email = 'rawad.nahle10@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 3. POLICIES D'ÉCRITURE (super-admin uniquement)
--    Jusqu'ici tenants/tenant_config/user_tenants n'avaient que du SELECT.
--    La création de tenant se fait normalement via l'edge function
--    (service role, bypass RLS), mais on ajoute ces policies en défense
--    en profondeur si jamais un appel est fait avec le rôle "authenticated".
-- ────────────────────────────────────────────────────────────
CREATE POLICY "super_admin_ecrit_tenants" ON tenants
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_ecrit_tenant_config" ON tenant_config
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_ecrit_user_tenants" ON user_tenants
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ============================================================
-- FIN DE MIGRATION
-- Vérification :
-- SELECT id, nom_affichage, couleur_primaire, couleur_secondaire, email_from FROM tenants;
-- SELECT * FROM super_admins;
-- ============================================================
