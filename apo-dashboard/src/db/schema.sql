-- ============================================================
-- APO Dashboard — Supabase PostgreSQL Schema (en français)
-- Sources : 8 fichiers Excel Dropbox
-- ============================================================

-- ── 1. PERIODES (référentiel mois/année) ─────────────────────
CREATE TABLE periodes (
  id          SERIAL PRIMARY KEY,
  annee       INT         NOT NULL,
  mois        INT         NOT NULL CHECK (mois BETWEEN 1 AND 12),
  libelle     TEXT        NOT NULL,  -- ex: 'janvier', 'février'
  UNIQUE (annee, mois)
);

-- ── 2. FOURNISSEURS (source: CAISSE_GRAINE) ──────────────────
CREATE TABLE fournisseurs (
  id          SERIAL PRIMARY KEY,
  reference   TEXT        NOT NULL UNIQUE,   -- ex: 'F001', nom fournisseur
  nom         TEXT,
  cree_le     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. CLIENTS ────────────────────────────────────────────────
-- Sources : VENTE_HUILE (SARCI), VENTE_PALMISTE, VENTE_FLORENTIN, PEPINIERE
CREATE TABLE clients (
  id          SERIAL PRIMARY KEY,
  reference   TEXT        NOT NULL UNIQUE,   -- ex: 'DJE EMANUEL', 'SARCI'
  nom         TEXT,
  telephone   TEXT,
  localite    TEXT,
  type        TEXT        CHECK (type IN ('huile','palmiste','florentin','bassin','pepiniere','sarci')),
  cree_le     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. ACHATS REGIMES (source: CAISSE_GRAINE) ────────────────
-- Chaque ligne = 1 camion / 1 livraison de régimes FFB
CREATE TABLE achats_regimes (
  id                SERIAL PRIMARY KEY,
  periode_id        INT           NOT NULL REFERENCES periodes(id),
  fournisseur_id    INT           REFERENCES fournisseurs(id),
  date_achat        DATE          NOT NULL,
  type_transport    TEXT,                         -- 'CAMION', 'TRACTEUR'
  numero_camion     TEXT,
  poids_kg          NUMERIC(12,2) NOT NULL,
  prix_kg           NUMERIC(8,2)  NOT NULL,
  prix_transport    NUMERIC(12,2) DEFAULT 0,
  appro_caisse      NUMERIC(12,2) DEFAULT 0,
  montant_total     NUMERIC(14,2) GENERATED ALWAYS AS (poids_kg * prix_kg) STORED
);

-- ── 5. PRODUCTION JOURNALIERE (source: TABLEAU_PRODUCTION) ───
CREATE TABLE production_journaliere (
  id                      SERIAL PRIMARY KEY,
  periode_id              INT           NOT NULL REFERENCES periodes(id),
  date_production         DATE          NOT NULL UNIQUE,
  regime_recu_kg          NUMERIC(12,2) DEFAULT 0,
  regime_traite_kg        NUMERIC(12,2) DEFAULT 0,
  regime_restant_kg       NUMERIC(12,2) DEFAULT 0,
  huile_produite_kg       NUMERIC(12,2) DEFAULT 0,
  taux_extraction         NUMERIC(6,4)  DEFAULT 0,   -- ex: 0.1956 = 19.56%
  livraison_citerne_kg    NUMERIC(12,2) DEFAULT 0,   -- = vente huile du jour (col H)
  stock_huile_kg          NUMERIC(12,2) DEFAULT 0,
  tank_1000_kg            NUMERIC(12,2) DEFAULT 0,
  tank_300_kg             NUMERIC(12,2) DEFAULT 0,
  stock_graine_1_kg       NUMERIC(12,2) DEFAULT 0,
  stock_graine_2_kg       NUMERIC(12,2) DEFAULT 0,
  nb_sterilisateurs       INT           DEFAULT 0,
  livraison_florentin_kg  NUMERIC(12,2) DEFAULT 0,
  livraison_bassin_kg     NUMERIC(12,2) DEFAULT 0,
  production_palmiste_kg  NUMERIC(12,2) DEFAULT 0,
  livraison_palmiste_kg   NUMERIC(12,2) DEFAULT 0,
  stock_palmiste_kg       NUMERIC(12,2) DEFAULT 0
);

-- ── 6. VENTES HUILE CPO (source: VENTE_HUILE) ────────────────
-- Livraisons journalières à SARCI
CREATE TABLE ventes_huile (
  id              SERIAL PRIMARY KEY,
  periode_id      INT           NOT NULL REFERENCES periodes(id),
  client_id       INT           REFERENCES clients(id),   -- SARCI
  date_vente      DATE          NOT NULL,
  libelle         TEXT,
  poids_apo_kg    NUMERIC(12,2) NOT NULL,
  poids_sarci_kg  NUMERIC(12,2),
  ecart_kg        NUMERIC(12,2) GENERATED ALWAYS AS (poids_sarci_kg - poids_apo_kg) STORED,
  prix_kg         NUMERIC(8,2)  NOT NULL,
  avance_sarci    NUMERIC(14,2) DEFAULT 0,
  montant_fcfa    NUMERIC(14,2) GENERATED ALWAYS AS (poids_apo_kg * prix_kg) STORED
);

-- ── 7. VENTES PALMISTE (source: VENTE_PALMISTE) ──────────────
CREATE TABLE ventes_palmiste (
  id              SERIAL PRIMARY KEY,
  periode_id      INT           NOT NULL REFERENCES periodes(id),
  client_id       INT           REFERENCES clients(id),
  date_vente      DATE          NOT NULL,
  poids_kg        NUMERIC(12,2) NOT NULL,
  prix_kg         NUMERIC(8,2)  NOT NULL DEFAULT 60,
  montant_fcfa    NUMERIC(14,2) GENERATED ALWAYS AS (poids_kg * prix_kg) STORED
);

-- ── 8. VENTES FLORENTIN (source: VENTE_FLORENTIN) ────────────
CREATE TABLE ventes_florentin (
  id              SERIAL PRIMARY KEY,
  periode_id      INT           NOT NULL REFERENCES periodes(id),
  client_id       INT           REFERENCES clients(id),
  date_vente      DATE          NOT NULL,
  poids_kg        NUMERIC(12,2) NOT NULL,
  prix_kg         NUMERIC(8,2)  NOT NULL,
  montant_fcfa    NUMERIC(14,2) GENERATED ALWAYS AS (poids_kg * prix_kg) STORED
);

-- ── 9. VENTES BASSIN LAGUNAGE (source: VENTE_BASSIN) ─────────
CREATE TABLE ventes_bassin (
  id              SERIAL PRIMARY KEY,
  periode_id      INT           NOT NULL REFERENCES periodes(id),
  client_id       INT           REFERENCES clients(id),
  date_vente      DATE          NOT NULL,
  poids_kg        NUMERIC(12,2) NOT NULL,
  prix_kg         NUMERIC(8,2)  DEFAULT NULL,  -- NULL si non encore facturé
  facture         BOOLEAN       DEFAULT FALSE,
  montant_fcfa    NUMERIC(14,2) DEFAULT 0,
  note            TEXT
);

-- ── 10. CAISSE APO — MOUVEMENTS (source: CAISSE_APO) ─────────
-- Encaissements ventes et décaissements divers
CREATE TABLE caisse_apo (
  id              SERIAL PRIMARY KEY,
  periode_id      INT           NOT NULL REFERENCES periodes(id),
  date_mouvement  DATE          NOT NULL,
  libelle         TEXT          NOT NULL,
  debit_fcfa      NUMERIC(14,2) DEFAULT 0,   -- entrées
  credit_fcfa     NUMERIC(14,2) DEFAULT 0,   -- sorties
  solde_fcfa      NUMERIC(14,2),
  type_mouvement  TEXT          CHECK (type_mouvement IN ('encaissement','decaissement','solde')),
  categorie       TEXT          CHECK (categorie IN (
                    'salaires','carburant','materiel',
                    'vehicules','main_oeuvre','frais_divers','autre'
                  ))
);

-- ── 11. CAISSE APO 2 — CHARGES EXPLOITATION (source: CAISSE_APO_2)
-- Salaires, carburant, matériels, main d'œuvre, frais divers
CREATE TABLE caisse_apo2 (
  id              SERIAL PRIMARY KEY,
  periode_id      INT           NOT NULL REFERENCES periodes(id),
  date_mouvement  DATE          NOT NULL,
  libelle         TEXT          NOT NULL,
  debit_fcfa      NUMERIC(14,2) DEFAULT 0,
  credit_fcfa     NUMERIC(14,2) DEFAULT 0,   -- décaissements exploitation
  solde_fcfa      NUMERIC(14,2),
  categorie       TEXT          CHECK (categorie IN (
                    'salaires','carburant','materiel',
                    'vehicules','main_oeuvre','frais_divers','autre'
                  ))
);

-- ── 12. CONTRATS PEPINIERE (source: PEPINIERE_A_HUILE) ────────
CREATE TABLE contrats_pepiniere (
  id                    SERIAL PRIMARY KEY,
  client_id             INT           REFERENCES clients(id),
  numero_ordre          TEXT          NOT NULL UNIQUE,  -- ex: '1001'
  date_contrat          DATE          NOT NULL,
  localite_champ        TEXT,
  superficie_demandee   NUMERIC(8,2),
  superficie_champ_ha   NUMERIC(8,2),
  prix_unitaire_fcfa    NUMERIC(10,2),               -- FCFA/ha
  montant_total         NUMERIC(14,2),
  net_encaisse          NUMERIC(14,2) DEFAULT 0,
  montant_restant       NUMERIC(14,2) GENERATED ALWAYS AS (montant_total - net_encaisse) STORED
);

-- ── 13. KPIs MENSUELS — TABLEAU RECAPITULATIF ────────────────
-- Résumé calculé par mois, alimenté depuis les tables de détail
CREATE TABLE kpis_mensuels (
  id                      SERIAL PRIMARY KEY,
  periode_id              INT           NOT NULL UNIQUE REFERENCES periodes(id),

  -- Chiffre d'affaires
  ca_huile_fcfa           NUMERIC(16,2) DEFAULT 0,
  ca_palmiste_fcfa        NUMERIC(16,2) DEFAULT 0,
  ca_florentin_fcfa       NUMERIC(16,2) DEFAULT 0,
  ca_bassin_fcfa          NUMERIC(16,2) DEFAULT 0,
  ca_total_fcfa           NUMERIC(16,2) GENERATED ALWAYS AS
                          (ca_huile_fcfa + ca_palmiste_fcfa + ca_florentin_fcfa + ca_bassin_fcfa) STORED,

  -- Coûts
  cout_mp_fcfa            NUMERIC(16,2) DEFAULT 0,   -- Règle 1 : tonnes traitées × prix moyen
  charges_exploitation    NUMERIC(16,2) DEFAULT 0,   -- depuis caisse_apo2
  amortissement_fcfa      NUMERIC(16,2) DEFAULT 0,

  -- Résultat
  resultat_net_fcfa       NUMERIC(16,2) GENERATED ALWAYS AS
                          (ca_huile_fcfa + ca_palmiste_fcfa + ca_florentin_fcfa + ca_bassin_fcfa
                           - cout_mp_fcfa - charges_exploitation - amortissement_fcfa) STORED,
  marge_nette_pct         NUMERIC(6,2),

  -- Production
  regimes_recus_kg        NUMERIC(14,2) DEFAULT 0,
  regimes_traites_kg      NUMERIC(14,2) DEFAULT 0,
  stock_fin_mois_kg       NUMERIC(14,2) DEFAULT 0,
  huile_produite_kg       NUMERIC(14,2) DEFAULT 0,
  huile_vendue_kg         NUMERIC(14,2) DEFAULT 0,
  taux_extraction         NUMERIC(6,4)  DEFAULT 0,
  nb_camions              INT           DEFAULT 0,
  nb_sterilisateurs       INT           DEFAULT 0,
  palmiste_produit_kg     NUMERIC(14,2) DEFAULT 0,
  palmiste_vendu_kg       NUMERIC(14,2) DEFAULT 0,

  -- Prix moyens
  prix_moyen_regime_kg    NUMERIC(8,2)  DEFAULT 0,
  prix_moyen_huile_kg     NUMERIC(8,2)  DEFAULT 0,

  -- Pépinière
  pepiniere_contrats_fcfa NUMERIC(14,2) DEFAULT 0,
  pepiniere_encaisse_fcfa NUMERIC(14,2) DEFAULT 0,
  pepiniere_restant_fcfa  NUMERIC(14,2) DEFAULT 0,

  mis_a_jour_le           TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- SEED : Périodes connues
-- ============================================================
INSERT INTO periodes (annee, mois, libelle) VALUES
  (2026, 1, 'janvier'),
  (2026, 2, 'février'),
  (2026, 3, 'mars');

-- ============================================================
-- VUES UTILES
-- ============================================================

-- CA total par mois (calculé depuis les tables de vente brutes)
CREATE VIEW vue_ca_par_mois AS
SELECT
  p.annee,
  p.mois,
  p.libelle,
  COALESCE(SUM(vh.montant_fcfa),  0) AS ca_huile,
  COALESCE(SUM(vpa.montant_fcfa), 0) AS ca_palmiste,
  COALESCE(SUM(vf.montant_fcfa),  0) AS ca_florentin,
  COALESCE(SUM(vb.montant_fcfa),  0) AS ca_bassin,
  COALESCE(SUM(vh.montant_fcfa),  0)
    + COALESCE(SUM(vpa.montant_fcfa), 0)
    + COALESCE(SUM(vf.montant_fcfa),  0)
    + COALESCE(SUM(vb.montant_fcfa),  0) AS ca_total
FROM periodes p
LEFT JOIN ventes_huile      vh  ON vh.periode_id  = p.id
LEFT JOIN ventes_palmiste   vpa ON vpa.periode_id = p.id
LEFT JOIN ventes_florentin  vf  ON vf.periode_id  = p.id
LEFT JOIN ventes_bassin     vb  ON vb.periode_id  = p.id
GROUP BY p.id, p.annee, p.mois, p.libelle
ORDER BY p.annee, p.mois;

-- Production mensuelle agrégée
CREATE VIEW vue_production_par_mois AS
SELECT
  p.annee,
  p.mois,
  p.libelle,
  SUM(pj.regime_recu_kg)          AS regimes_recus_kg,
  SUM(pj.regime_traite_kg)        AS regimes_traites_kg,
  MAX(pj.regime_restant_kg)       AS stock_fin_mois_kg,
  SUM(pj.huile_produite_kg)       AS huile_produite_kg,
  SUM(pj.livraison_citerne_kg)    AS huile_vendue_kg,
  AVG(pj.taux_extraction)         AS taux_extraction_moyen,
  SUM(pj.nb_sterilisateurs)       AS nb_sterilisateurs,
  SUM(pj.production_palmiste_kg)  AS palmiste_produit_kg,
  SUM(pj.livraison_palmiste_kg)   AS palmiste_vendu_kg
FROM periodes p
JOIN production_journaliere pj ON pj.periode_id = p.id
GROUP BY p.id, p.annee, p.mois, p.libelle
ORDER BY p.annee, p.mois;

-- Top fournisseurs par mois (triés par poids décroissant)
CREATE VIEW vue_top_fournisseurs AS
SELECT
  p.annee,
  p.mois,
  f.reference,
  f.nom,
  SUM(ar.poids_kg)      AS poids_total_kg,
  AVG(ar.prix_kg)       AS prix_moyen_kg,
  SUM(ar.montant_total) AS montant_total_fcfa,
  COUNT(*)              AS nb_camions
FROM achats_regimes ar
JOIN periodes     p ON p.id = ar.periode_id
JOIN fournisseurs f ON f.id = ar.fournisseur_id
GROUP BY p.id, p.annee, p.mois, f.id, f.reference, f.nom
ORDER BY p.annee, p.mois, poids_total_kg DESC;

-- Top charges exploitation par mois (triées par montant décroissant)
CREATE VIEW vue_top_charges AS
SELECT
  p.annee,
  p.mois,
  c.libelle,
  c.categorie,
  SUM(c.credit_fcfa) AS montant_fcfa
FROM caisse_apo2 c
JOIN periodes p ON p.id = c.periode_id
GROUP BY p.id, p.annee, p.mois, c.libelle, c.categorie
ORDER BY p.annee, p.mois, montant_fcfa DESC;

-- Situation pépinière (contrats, encaissé, restant)
CREATE VIEW vue_pepiniere AS
SELECT
  cl.nom,
  cl.telephone,
  cp.numero_ordre,
  cp.date_contrat,
  cp.localite_champ,
  cp.superficie_champ_ha,
  cp.montant_total,
  cp.net_encaisse,
  cp.montant_restant
FROM contrats_pepiniere cp
JOIN clients cl ON cl.id = cp.client_id
ORDER BY cp.date_contrat;


-- ── AMORTISSEMENT BANCAIRE ────────────────────────────────────
-- Annuités mensuelles du prêt bancaire APO.
-- Montant fixe : 20 200 000 FCFA / mois (toutes périodes 2026).
CREATE TABLE amortissement_bancaire (
  id           SERIAL PRIMARY KEY,
  periode_id   INTEGER NOT NULL REFERENCES periodes(id) ON DELETE CASCADE,
  libelle      TEXT    NOT NULL DEFAULT 'Amortissement prêt bancaire',
  montant_fcfa BIGINT  NOT NULL,
  type         TEXT    NOT NULL DEFAULT 'annuite'
               CHECK (type IN ('annuite', 'principal', 'interet', 'autre'))
);
CREATE INDEX idx_amort_periode ON amortissement_bancaire(periode_id);

-- ── BANQUE APO (SGCI + BDA) ───────────────────────────────────
-- Transactions bancaires catégorisées (Jan–Avr 2026, extension possible).
-- Débits uniquement (montant_fcfa > 0).
-- Crédits SARCI exclus (déjà dans ventes_huile).
-- APPRO CAISSE / APPRO SARCI exclus (virements internes).
-- COMPENSATION CHQ IMPAYEE exclud (reversement).
CREATE TABLE banque_apo (
  id             SERIAL PRIMARY KEY,
  periode_id     INTEGER NOT NULL REFERENCES periodes(id) ON DELETE CASCADE,
  banque         TEXT NOT NULL CHECK (banque IN ('SGCI','BDA')),
  date_operation DATE,
  date_valeur    DATE,
  libelle        TEXT NOT NULL,
  montant_fcfa   BIGINT NOT NULL,
  categorie      TEXT NOT NULL CHECK (categorie IN (
    'salaires','carburant','main_oeuvre','entretien','construction',
    'vehicules','materiels','eau_fournitures','frais_relat','frais_admin',
    'electricite','assurance','securite','charges_patronales',
    'taxes_fiscales','frais_bancaires','amortissement','autre'
  ))
);
CREATE INDEX idx_banque_periode ON banque_apo(periode_id);
CREATE INDEX idx_banque_cat     ON banque_apo(categorie);
