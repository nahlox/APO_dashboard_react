-- ============================================================
-- MIGRATION : Rapport APO par email — cron QUOTIDIEN 07h00 CI
-- À exécuter dans Supabase > SQL Editor
-- Prérequis :
--   - edge function `weekly-report` déployée
--   - extensions pg_cron + pg_net activées
--   - domaine vérifié dans Resend + REPORT_FROM_EMAIL défini
-- ============================================================

-- Cron quotidien 07h00 CI (= 07h00 UTC, la Côte d'Ivoire est UTC+0)
-- period=daily → résume le dernier jour de production, comparé à la veille
SELECT cron.schedule(
  'apo-daily-email',          -- nom du job
  '0 7 * * *',                -- chaque jour à 07h00 UTC
  $$
    SELECT net.http_post(
      url    := 'https://iwfgvhenqzdutjcxhuip.supabase.co/functions/v1/weekly-report',
      headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
      body   := '{"tenant_id": "apo", "period": "daily"}'::jsonb
    );
  $$
);

-- Pour vérifier le job :
-- SELECT * FROM cron.job WHERE jobname = 'apo-daily-email';

-- Pour supprimer le job :
-- SELECT cron.unschedule('apo-daily-email');

-- ============================================================
-- Pour repasser en hebdomadaire plus tard : body period='weekly'
-- et planning '0 6 * * 1' (lundi 06h00).
--
-- DESTINATAIRES : définis dans tenant_config.config.report_recipients
-- (rawad, ramy, rayan). Sinon fallback = tous les owner/manager du tenant.
-- ============================================================
