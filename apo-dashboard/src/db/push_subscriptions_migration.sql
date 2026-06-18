-- ============================================================
-- MIGRATION : Push Notifications — table + cron 19h00 CI
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. Table des abonnements push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          BIGSERIAL    PRIMARY KEY,
  tenant_id   TEXT         NOT NULL DEFAULT 'apo',
  endpoint    TEXT         NOT NULL UNIQUE,
  p256dh      TEXT         NOT NULL,
  auth        TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index par tenant pour l'Edge Function
CREATE INDEX IF NOT EXISTS idx_push_tenant ON push_subscriptions(tenant_id);

-- 2. Activer pg_cron (si pas déjà fait)
-- Dans Supabase : Database > Extensions > pg_cron → activer

-- 3. Cron 19h00 CI (= 19h00 UTC, CI est UTC+0 sans heure d'été)
SELECT cron.schedule(
  'apo-daily-push',          -- nom du job
  '0 19 * * *',              -- chaque jour à 19h00 UTC
  $$
    SELECT net.http_post(
      url    := 'https://iwfgvhenqzdutjcxhuip.supabase.co/functions/v1/daily-push',
      headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
      body   := '{"tenant_id": "apo"}'::jsonb
    );
  $$
);

-- Pour vérifier le job :
-- SELECT * FROM cron.job WHERE jobname = 'apo-daily-push';

-- Pour supprimer le job :
-- SELECT cron.unschedule('apo-daily-push');
