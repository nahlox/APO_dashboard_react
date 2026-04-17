-- ============================================================
-- APO Dashboard — Données initiales (depuis fichiers JS existants)
-- À exécuter après schema.sql
-- ============================================================

-- ── CLIENTS CONNUS ────────────────────────────────────────────
INSERT INTO clients (reference, nom, type) VALUES
  ('SARCI',       'SARCI',           'sarci'),
  ('IMAM',        'Madame Imane',    'florentin'),
  ('DJE_EMANUEL', 'DJE EMANUEL',     'palmiste'),
  ('MOE_ATIE',    'MOE ATIE',        'palmiste')
ON CONFLICT (reference) DO NOTHING;

-- ── KPIs — JANVIER 2026 ───────────────────────────────────────
INSERT INTO kpis_mensuels (
  periode_id,
  ca_huile_fcfa, ca_palmiste_fcfa, ca_florentin_fcfa, ca_bassin_fcfa,
  cout_mp_fcfa, charges_exploitation, amortissement_fcfa, marge_nette_pct,
  regimes_recus_kg, regimes_traites_kg, stock_fin_mois_kg,
  huile_produite_kg, huile_vendue_kg, taux_extraction,
  nb_camions, nb_sterilisateurs,
  palmiste_produit_kg, palmiste_vendu_kg,
  prix_moyen_regime_kg, prix_moyen_huile_kg,
  pepiniere_contrats_fcfa, pepiniere_encaisse_fcfa, pepiniere_restant_fcfa
)
VALUES (
  (SELECT id FROM periodes WHERE annee = 2026 AND mois = 1),
  1269504000, 58171200, 8588000, 0,
  1227091010, 61100000, 12146469, 2.1,
  11170000, 9998000, 1401000,
  1956000, 1763000, 0.1956,
  675, 369,
  999804, 969520,
  122.73, 720.00,
  80640000, 38394000, 42246000
);

-- ── KPIs — FÉVRIER 2026 ───────────────────────────────────────
INSERT INTO kpis_mensuels (
  periode_id,
  ca_huile_fcfa, ca_palmiste_fcfa, ca_florentin_fcfa, ca_bassin_fcfa,
  cout_mp_fcfa, charges_exploitation, amortissement_fcfa, marge_nette_pct,
  regimes_recus_kg, regimes_traites_kg, stock_fin_mois_kg,
  huile_produite_kg, huile_vendue_kg, taux_extraction,
  nb_camions, nb_sterilisateurs,
  palmiste_produit_kg, palmiste_vendu_kg,
  prix_moyen_regime_kg, prix_moyen_huile_kg,
  pepiniere_contrats_fcfa, pepiniere_encaisse_fcfa, pepiniere_restant_fcfa
)
VALUES (
  (SELECT id FROM periodes WHERE annee = 2026 AND mois = 2),
  2016088200, 113640000, 0, 0,
  1695469933, 83900000, 0, NULL,
  14798400, 15071435, 1127600,
  2865783, 2959220, 0.1901,
  0, 558,
  1507144, 1894000,
  112.50, 684.44,
  0, 0, 0
);

-- ── NOTE : données journalières ───────────────────────────────
-- Les tables de détail (production_journaliere, achats_regimes,
-- ventes_huile, etc.) sont à importer depuis les fichiers Excel
-- via export CSV > Supabase Table Editor > Import CSV
-- ou via le script Python ETL (à venir).
