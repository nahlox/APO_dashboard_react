-- ============================================================
-- STEP 1 — CRONS MULTI-TENANT + SECRET
-- Les jobs bouclent désormais sur TOUS les tenants actifs (plus de 'apo' en dur)
-- et s'authentifient auprès des edge functions via le header x-cron-secret,
-- lu depuis Vault (secret 'cron_secret', créé hors migration — jamais dans le repo).
-- Prérequis : SELECT vault.create_secret('<valeur>', 'cron_secret');
-- ============================================================

-- Supprimer les anciens jobs mono-tenant (ignorer s'ils n'existent pas)
DO $$ BEGIN PERFORM cron.unschedule('apo-daily-push');        EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('apo-daily-email');       EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('fetch-cpo-price-daily'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('daily-push-all-tenants');  EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('daily-email-all-tenants'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('cpo-price-daily');         EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Notification push quotidienne — 12h00 UTC, tous les tenants actifs
SELECT cron.schedule(
  'daily-push-all-tenants',
  '0 12 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://iwfgvhenqzdutjcxhuip.supabase.co/functions/v1/daily-push',
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
                 ),
      body    := jsonb_build_object('tenant_id', t.id)
    )
    FROM tenants t WHERE t.actif;
  $$
);

-- Rapport email quotidien — 07h00 UTC, tous les tenants actifs
SELECT cron.schedule(
  'daily-email-all-tenants',
  '0 7 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://iwfgvhenqzdutjcxhuip.supabase.co/functions/v1/weekly-report',
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
                 ),
      body    := jsonb_build_object('tenant_id', t.id, 'period', 'daily')
    )
    FROM tenants t WHERE t.actif;
  $$
);

-- Prix CPO (FRED) — 06h00 UTC, global (pas de tenant)
SELECT cron.schedule(
  'cpo-price-daily',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://iwfgvhenqzdutjcxhuip.supabase.co/functions/v1/fetch-cpo-price',
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
                 ),
      body    := '{}'::jsonb
    );
  $$
);
