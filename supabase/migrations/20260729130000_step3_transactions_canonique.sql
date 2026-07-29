-- ============================================================
-- STEP 3 — MODÈLE CANONIQUE : table `transactions`
-- caisse_apo + caisse_apo2 + banque_apo fusionnent dans une seule table
-- neutre multi-source. Le connecteur Sage (et tout futur connecteur)
-- écrira directement ici.
--
-- Compatibilité : les anciens noms deviennent des VUES insérables
-- (INSTEAD OF triggers) — les ETL existants continuent de fonctionner
-- sans modification. Les anciennes tables sont conservées en
-- *_legacy_20260729 (backup, à supprimer après validation).
--
-- Conventions montants (héritées de la caisse) :
--   debit_fcfa  = entrées d'argent
--   credit_fcfa = sorties d'argent (charges)
--   banque_apo.montant_fcfa (débits uniquement) → credit_fcfa
-- ============================================================

-- ── 1. Table canonique ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id             BIGSERIAL PRIMARY KEY,
  tenant_id      TEXT NOT NULL REFERENCES tenants(id),
  periode_id     INT  NOT NULL REFERENCES periodes(id) ON DELETE CASCADE,
  source         TEXT NOT NULL CHECK (source IN ('caisse', 'caisse2', 'banque', 'sage')),
  banque         TEXT,                       -- nom de banque si source='banque'
  compte         TEXT,                       -- compte SYSCOHADA si connu (Sage)
  date_mouvement DATE,
  date_valeur    DATE,
  libelle        TEXT NOT NULL,
  debit_fcfa     NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit_fcfa    NUMERIC(14,2) NOT NULL DEFAULT 0,
  solde_fcfa     NUMERIC(14,2),
  type_mouvement TEXT,
  categorie      TEXT,                       -- liste par tenant (compte_mappings / config), plus de CHECK figé
  ref_externe    TEXT,                       -- n° pièce Sage, id source... (idempotence connecteurs)
  cree_le        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_tenant          ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tx_periode_source  ON transactions(periode_id, source);
CREATE INDEX IF NOT EXISTS idx_tx_categorie       ON transactions(categorie);
CREATE INDEX IF NOT EXISTS idx_tx_ref_externe     ON transactions(tenant_id, ref_externe);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS transactions_read ON transactions;
CREATE POLICY transactions_read ON transactions
  FOR SELECT USING (tenant_id = public.get_tenant_id());
-- Écritures : service role uniquement (ETL / connecteurs / ingest).

-- ── 2. Copie des données existantes ──────────────────────────
INSERT INTO transactions (tenant_id, periode_id, source, date_mouvement, libelle,
                          debit_fcfa, credit_fcfa, solde_fcfa, type_mouvement, categorie)
SELECT tenant_id, periode_id, 'caisse', date_mouvement, libelle,
       COALESCE(debit_fcfa, 0), COALESCE(credit_fcfa, 0), solde_fcfa, type_mouvement, categorie
FROM caisse_apo;

INSERT INTO transactions (tenant_id, periode_id, source, date_mouvement, libelle,
                          debit_fcfa, credit_fcfa, solde_fcfa, categorie)
SELECT tenant_id, periode_id, 'caisse2', date_mouvement, libelle,
       COALESCE(debit_fcfa, 0), COALESCE(credit_fcfa, 0), solde_fcfa, categorie
FROM caisse_apo2;

INSERT INTO transactions (tenant_id, periode_id, source, banque, date_mouvement, date_valeur,
                          libelle, credit_fcfa, categorie)
SELECT tenant_id, periode_id, 'banque', banque, date_operation, date_valeur,
       libelle, montant_fcfa, categorie
FROM banque_apo;

-- ── 3. Anciennes tables → backup ─────────────────────────────
ALTER TABLE caisse_apo  RENAME TO caisse_apo_legacy_20260729;
ALTER TABLE caisse_apo2 RENAME TO caisse_apo2_legacy_20260729;
ALTER TABLE banque_apo  RENAME TO banque_apo_legacy_20260729;

-- ── 4. Vues de compatibilité (mêmes noms/colonnes qu'avant) ──
CREATE VIEW caisse_apo WITH (security_invoker = true) AS
  SELECT id, periode_id, date_mouvement, libelle, debit_fcfa, credit_fcfa,
         solde_fcfa, type_mouvement, categorie, tenant_id
  FROM transactions WHERE source = 'caisse';

CREATE VIEW caisse_apo2 WITH (security_invoker = true) AS
  SELECT id, periode_id, date_mouvement, libelle, debit_fcfa, credit_fcfa,
         solde_fcfa, categorie, tenant_id
  FROM transactions WHERE source = 'caisse2';

CREATE VIEW banque_apo WITH (security_invoker = true) AS
  SELECT id, periode_id, banque, date_mouvement AS date_operation, date_valeur,
         libelle, credit_fcfa AS montant_fcfa, categorie, tenant_id
  FROM transactions WHERE source = 'banque';

-- ── 5. Triggers INSTEAD OF : les vues restent insérables ─────
CREATE OR REPLACE FUNCTION trg_caisse_apo_write() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO transactions (tenant_id, periode_id, source, date_mouvement, libelle,
                              debit_fcfa, credit_fcfa, solde_fcfa, type_mouvement, categorie)
    VALUES (NEW.tenant_id, NEW.periode_id, 'caisse', NEW.date_mouvement, NEW.libelle,
            COALESCE(NEW.debit_fcfa, 0), COALESCE(NEW.credit_fcfa, 0), NEW.solde_fcfa,
            NEW.type_mouvement, NEW.categorie)
    RETURNING id INTO NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE transactions SET
      tenant_id = NEW.tenant_id, periode_id = NEW.periode_id,
      date_mouvement = NEW.date_mouvement, libelle = NEW.libelle,
      debit_fcfa = COALESCE(NEW.debit_fcfa, 0), credit_fcfa = COALESCE(NEW.credit_fcfa, 0),
      solde_fcfa = NEW.solde_fcfa, type_mouvement = NEW.type_mouvement, categorie = NEW.categorie
    WHERE id = OLD.id;
    RETURN NEW;
  ELSE
    DELETE FROM transactions WHERE id = OLD.id;
    RETURN OLD;
  END IF;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_caisse_apo2_write() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO transactions (tenant_id, periode_id, source, date_mouvement, libelle,
                              debit_fcfa, credit_fcfa, solde_fcfa, categorie)
    VALUES (NEW.tenant_id, NEW.periode_id, 'caisse2', NEW.date_mouvement, NEW.libelle,
            COALESCE(NEW.debit_fcfa, 0), COALESCE(NEW.credit_fcfa, 0), NEW.solde_fcfa, NEW.categorie)
    RETURNING id INTO NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE transactions SET
      tenant_id = NEW.tenant_id, periode_id = NEW.periode_id,
      date_mouvement = NEW.date_mouvement, libelle = NEW.libelle,
      debit_fcfa = COALESCE(NEW.debit_fcfa, 0), credit_fcfa = COALESCE(NEW.credit_fcfa, 0),
      solde_fcfa = NEW.solde_fcfa, categorie = NEW.categorie
    WHERE id = OLD.id;
    RETURN NEW;
  ELSE
    DELETE FROM transactions WHERE id = OLD.id;
    RETURN OLD;
  END IF;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_banque_apo_write() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO transactions (tenant_id, periode_id, source, banque, date_mouvement, date_valeur,
                              libelle, credit_fcfa, categorie)
    VALUES (NEW.tenant_id, NEW.periode_id, 'banque', NEW.banque, NEW.date_operation, NEW.date_valeur,
            NEW.libelle, COALESCE(NEW.montant_fcfa, 0), NEW.categorie)
    RETURNING id INTO NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE transactions SET
      tenant_id = NEW.tenant_id, periode_id = NEW.periode_id, banque = NEW.banque,
      date_mouvement = NEW.date_operation, date_valeur = NEW.date_valeur,
      libelle = NEW.libelle, credit_fcfa = COALESCE(NEW.montant_fcfa, 0), categorie = NEW.categorie
    WHERE id = OLD.id;
    RETURN NEW;
  ELSE
    DELETE FROM transactions WHERE id = OLD.id;
    RETURN OLD;
  END IF;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER caisse_apo_write  INSTEAD OF INSERT OR UPDATE OR DELETE ON caisse_apo
  FOR EACH ROW EXECUTE FUNCTION trg_caisse_apo_write();
CREATE TRIGGER caisse_apo2_write INSTEAD OF INSERT OR UPDATE OR DELETE ON caisse_apo2
  FOR EACH ROW EXECUTE FUNCTION trg_caisse_apo2_write();
CREATE TRIGGER banque_apo_write  INSTEAD OF INSERT OR UPDATE OR DELETE ON banque_apo
  FOR EACH ROW EXECUTE FUNCTION trg_banque_apo_write();

-- ── 6. vue_top_charges suivait la table renommée → la recréer ─
CREATE OR REPLACE VIEW vue_top_charges AS
SELECT
  p.annee,
  p.mois,
  t.libelle,
  t.categorie,
  SUM(t.credit_fcfa) AS montant_fcfa
FROM transactions t
JOIN periodes p ON p.id = t.periode_id
WHERE t.source = 'caisse2'
GROUP BY p.id, p.annee, p.mois, t.libelle, t.categorie
ORDER BY p.annee, p.mois, montant_fcfa DESC;
ALTER VIEW vue_top_charges SET (security_invoker = true);

-- ── 7. compte_mappings : plan SYSCOHADA → catégorie P&L ──────
-- tenant_id NULL = défaut plateforme (zone OHADA), surchargeable par tenant.
-- C'est LA table que le connecteur Sage lira (fini les dicts en dur dans le code).
CREATE TABLE IF NOT EXISTS compte_mappings (
  id          SERIAL PRIMARY KEY,
  tenant_id   TEXT REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = défaut plateforme
  prefixe     TEXT NOT NULL,           -- préfixe de compte, ex: '601', '66'
  categorie   TEXT NOT NULL,           -- catégorie interne (cf. CAT_LABELS)
  section_pnl TEXT,                    -- section compte de résultat ('60'..'66', 'IV', 'BIC')
  libelle     TEXT,
  UNIQUE NULLS NOT DISTINCT (tenant_id, prefixe)
);
ALTER TABLE compte_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS compte_mappings_read ON compte_mappings;
CREATE POLICY compte_mappings_read ON compte_mappings
  FOR SELECT USING (tenant_id IS NULL OR tenant_id = public.get_tenant_id() OR public.is_super_admin());
DROP POLICY IF EXISTS compte_mappings_admin ON compte_mappings;
CREATE POLICY compte_mappings_admin ON compte_mappings
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

INSERT INTO compte_mappings (tenant_id, prefixe, categorie, section_pnl, libelle) VALUES
  (NULL, '601', 'fournitures_usine',   '60', 'Achats de matières premières'),
  (NULL, '602', 'fournitures_usine',   '60', 'Achats autres approvisionnements'),
  (NULL, '603', 'fournitures_usine',   '60', 'Variations de stocks'),
  (NULL, '604', 'fournitures_usine',   '60', 'Achats stockés de matières et fournitures'),
  (NULL, '605', 'eau_fournitures',     '60', 'Autres achats (eau, électricité, fournitures)'),
  (NULL, '608', 'fournitures_usine',   '60', 'Achats d''emballages'),
  (NULL, '61',  'frais_transport',     '61', 'Transports'),
  (NULL, '612', 'services_ext',        '62', 'Locations'),
  (NULL, '616', 'assurance',           '62', 'Primes d''assurance'),
  (NULL, '62',  'services_ext',        '62', 'Services extérieurs A'),
  (NULL, '621', 'autres_services_ext', '63', 'Personnel extérieur'),
  (NULL, '63',  'autres_services_ext', '63', 'Services extérieurs B'),
  (NULL, '64',  'taxes_fiscales',      '64', 'Impôts et taxes'),
  (NULL, '65',  'autres_charges',      '65', 'Autres charges'),
  (NULL, '66',  'charges_personnel',   '66', 'Charges de personnel'),
  (NULL, '67',  'frais_bancaires',     'IV', 'Frais financiers et charges assimilées'),
  (NULL, '68',  'amortissement',       'IV', 'Dotations aux amortissements'),
  (NULL, '69',  'taxes_fiscales',      'BIC', 'Impôts sur le résultat')
ON CONFLICT (tenant_id, prefixe) DO NOTHING;

-- ── 8. etl_runs : observabilité des imports ──────────────────
CREATE TABLE IF NOT EXISTS etl_runs (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source      TEXT NOT NULL,          -- 'etl_local' | 'etl_cloud' | 'sage_agent' | 'ingest'
  statut      TEXT NOT NULL DEFAULT 'running' CHECK (statut IN ('running', 'ok', 'erreur')),
  demarre_le  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  termine_le  TIMESTAMPTZ,
  lignes      INT DEFAULT 0,
  message     TEXT,
  details     JSONB
);
CREATE INDEX IF NOT EXISTS idx_etl_runs_tenant ON etl_runs(tenant_id, demarre_le DESC);
ALTER TABLE etl_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS etl_runs_read ON etl_runs;
CREATE POLICY etl_runs_read ON etl_runs
  FOR SELECT USING (tenant_id = public.get_tenant_id() OR public.is_super_admin());
