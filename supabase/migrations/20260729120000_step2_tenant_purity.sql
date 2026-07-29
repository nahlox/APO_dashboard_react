-- ============================================================
-- STEP 2 — PURETÉ TENANT
-- 1. production_fallback : les données statiques APO (graphiques journaliers
--    Jan–Mars + historique annuel) déménagent du code JS vers une table
--    scopée par tenant. Avant ça, N'IMPORTE QUEL tenant dont le mois 2026-1/2/3
--    était vide affichait les chiffres réels d'APO (fuite cross-tenant).
-- 2. Suppression des DEFAULT 'apo' sur toutes les colonnes tenant_id :
--    chaque écriture doit désormais être explicite sur son tenant.
-- ============================================================

-- ── 1. Table de fallback production, par tenant ──────────────
CREATE TABLE IF NOT EXISTS production_fallback (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  annee     INT  NOT NULL,
  mois      INT  NOT NULL CHECK (mois BETWEEN 1 AND 12),
  payload   JSONB NOT NULL,
  PRIMARY KEY (tenant_id, annee, mois)
);
ALTER TABLE production_fallback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS production_fallback_read ON production_fallback;
CREATE POLICY production_fallback_read ON production_fallback
  FOR SELECT USING (tenant_id = public.get_tenant_id());

INSERT INTO production_fallback (tenant_id, annee, mois, payload) VALUES
  ('apo', 2026, 1, '{"grainesDailyLabels":["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31"],"grainesDailyKg":[152640,343560,242880,222920,226960,392840,232040,311940,300380,357540,269080,413160,427700,300900,387160,438200,372240,456200,520000,494700,524520,490800,430200,351680,338280,398400,468080,471840,532400,620120,777240],"teDailyLabels":["01–04","05","06","07","08","09","10","11–14","15–16","17–19","20–22","23–25","26–28","29–31"],"teDailyVals":[19.56,19.56,19.56,19.48,19.48,19.48,19.54,19.54,19.26,19.26,19.26,19.26,19.18,19.18],"comparAnnuel":[{"label":"Jan 2024","values":[8250,7200,1380,1350]},{"label":"Jan 2025","values":[9800,8900,1720,1690]}]}'::jsonb),
  ('apo', 2026, 2, '{"grainesDailyLabels":["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16a","16b","17","18","19","20","21","22a","22b","23","24","25","26","27","28"],"grainesDailyKg":[439380,488520,385380,304760,344740,554420,422920,469060,484940,464720,573400,547400,551240,802740,504280,813860,675440,779380,814800,995240,983740,796660,184580,151620,137580,148220,447420,531960],"teDailyLabels":["01","02","03","05","06","07","08","09","10","11","12","13","14","15","16a","16b","17","18","19","20","21","22a","22b","23","24","25","26","27","28"],"teDailyVals":[19.14,19.14,19.14,19.56,19.56,19.48,19.48,19.48,19.54,19.54,19.54,19.54,18.26,18.26,18.26,18.6,18.6,18.6,18.6,19.26,19.26,19.26,18.53,18.53,18.53,18.53,19.18,19.18,19.18],"comparAnnuel":[{"label":"Fév 2023","values":[5251,6541,1193,1204]},{"label":"Fév 2024","values":[9342,8169,1662,1651]},{"label":"Fév 2025","values":[12754,10334,1993,2019]}]}'::jsonb),
  ('apo', 2026, 3, '{"grainesDailyLabels":["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31"],"grainesDailyKg":[565440,1092720,732720,271960,420360,564960,490900,787020,463980,607080,570180,359840,163740,207980,627200,215240,386760,263880,383860,133840,211300,160560,251780,136460,239480,273800,446460,509760,469480,594840,544820],"teDailyLabels":["01–03","04a","04b–09","10a","10b–13a","13b–14","15a","15b–19a","19b–21","23–24","26–28a","28b–30a","30b–31"],"teDailyVals":[18.16,18.16,18,18.08,18.08,18.78,18.78,21.23,21.7,21.77,19.25,19.74,22.16],"comparAnnuel":[{"label":"Mars 2023","values":[11680,10848,2050,2111]},{"label":"Mars 2024","values":[10250,11114,2338,2336]},{"label":"Mars 2025","values":[16547,16182,2927,2869]}],"stockHuileKg":300232}'::jsonb)
ON CONFLICT (tenant_id, annee, mois) DO UPDATE SET payload = EXCLUDED.payload;

-- ── 2. Plus de DEFAULT 'apo' : tenant explicite obligatoire ──
ALTER TABLE periodes                ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE fournisseurs            ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE clients                 ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE achats_regimes          ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE production_journaliere  ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE ventes_huile            ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE ventes_palmiste         ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE ventes_florentin        ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE ventes_bassin           ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE caisse_apo              ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE caisse_apo2             ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE contrats_pepiniere      ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE kpis_mensuels           ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE amortissement_bancaire  ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE banque_apo              ALTER COLUMN tenant_id DROP DEFAULT;
