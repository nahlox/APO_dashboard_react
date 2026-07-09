-- ============================================================
-- MIGRATION : Rapport hebdomadaire par email — cron lundi 06h00 CI
-- À exécuter dans Supabase > SQL Editor
-- Prérequis : edge function `weekly-report` déployée, extensions pg_cron + pg_net activées
-- ============================================================

-- Cron lundi 06h00 CI (= 06h00 UTC, la Côte d'Ivoire est UTC+0)
SELECT cron.schedule(
  'apo-weekly-report',        -- nom du job
  '0 6 * * 1',                -- chaque lundi à 06h00 UTC
  $$
    SELECT net.http_post(
      url    := 'https://iwfgvhenqzdutjcxhuip.supabase.co/functions/v1/weekly-report',
      headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
      body   := '{"tenant_id": "apo"}'::jsonb
    );
  $$
);

-- Pour vérifier le job :
-- SELECT * FROM cron.job WHERE jobname = 'apo-weekly-report';

-- Pour supprimer le job :
-- SELECT cron.unschedule('apo-weekly-report');

-- ============================================================
-- CONFIG DESTINATAIRES (optionnel)
-- Par défaut : tous les users owner/manager du tenant reçoivent le rapport.
-- Pour forcer une liste explicite, ajoutez report_recipients dans tenant_config :
--
-- UPDATE tenant_config
-- SET config = config || '{"report_recipients": ["directeur@apo-ci.com", "compta@apo-ci.com"]}'::jsonb
-- WHERE tenant_id = 'apo';
-- ============================================================
