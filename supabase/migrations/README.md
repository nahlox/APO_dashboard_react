# Migrations de schéma — source de vérité

Depuis juillet 2026, **tout changement de schéma passe par un fichier ici** — plus
jamais de SQL collé à la main dans le SQL Editor.

## Convention

- Nom de fichier : `YYYYMMDDHHMMSS_description.sql` (même convention que la CLI Supabase).
- Une migration = un changement cohérent, idempotent si possible (`IF NOT EXISTS`, `OR REPLACE`).
- Ne jamais modifier une migration déjà appliquée — en créer une nouvelle.

## Appliquer

```bash
python3 scripts/apply_migrations.py           # applique les migrations en attente
python3 scripts/apply_migrations.py --status  # état appliqué / en attente
```

Le script passe par la Management API Supabase (`SUPABASE_ACCESS_TOKEN` dans
`apo-dashboard/src/db/etl/.env`) et trace les versions dans
`supabase_migrations.schema_migrations` — la même table que la CLI officielle,
donc compatible avec un futur `supabase db push`.

## Historique pré-migrations

Les fichiers `apo-dashboard/src/db/*.sql` (schema.sql, migration_multitenant.sql,
migration_admin_onboarding.sql, push_subscriptions_migration.sql, weekly_report_cron.sql)
sont l'historique **déjà appliqué à la main** avant ce système. Ils sont conservés
comme documentation ; ne pas les rejouer.
