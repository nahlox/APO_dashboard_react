#!/usr/bin/env python3
"""
Applique les migrations SQL versionnées (supabase/migrations/*.sql) sur le projet
Supabase via la Management API (le réseau direct psycopg2 est bloqué).

Chaque fichier suit la convention CLI Supabase : YYYYMMDDHHMMSS_nom.sql
Le suivi se fait dans supabase_migrations.schema_migrations (même table que la CLI,
donc un futur `supabase db push` reconnaîtra ces migrations comme déjà appliquées).

Usage :
  python3 scripts/apply_migrations.py            # applique les migrations en attente
  python3 scripts/apply_migrations.py --status   # liste appliquées / en attente
  python3 scripts/apply_migrations.py --dry      # montre ce qui serait appliqué

Prérequis (.env de l'ETL ou variables d'environnement) :
  SUPABASE_ACCESS_TOKEN = sbp_...   (Personal Access Token Management API)
  SUPABASE_PROJECT_REF  = iwfgvhenqzdutjcxhuip
"""
import os, re, sys, json
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / "apo-dashboard" / "src" / "db" / "etl" / ".env")

PAT = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
REF = os.environ.get("SUPABASE_PROJECT_REF", "iwfgvhenqzdutjcxhuip")
MIGRATIONS_DIR = ROOT / "supabase" / "migrations"

if not PAT:
    sys.exit("SUPABASE_ACCESS_TOKEN manquant (Personal Access Token, format sbp_...)")

VERSION_RE = re.compile(r"^(\d{14})_(.+)\.sql$")


def run_sql(query: str):
    r = requests.post(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
        json={"query": query},
        timeout=120,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:2000]}")
    try:
        return r.json()
    except ValueError:
        return r.text


def ensure_tracking_table():
    run_sql("""
        CREATE SCHEMA IF NOT EXISTS supabase_migrations;
        CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
          version    TEXT PRIMARY KEY,
          statements TEXT[],
          name       TEXT
        );
    """)


def applied_versions() -> set[str]:
    rows = run_sql("SELECT version FROM supabase_migrations.schema_migrations")
    return {r["version"] for r in rows}


def local_migrations() -> list[tuple[str, str, Path]]:
    out = []
    for f in sorted(MIGRATIONS_DIR.glob("*.sql")):
        m = VERSION_RE.match(f.name)
        if not m:
            print(f"⚠️  Ignoré (nom invalide, attendu YYYYMMDDHHMMSS_nom.sql) : {f.name}")
            continue
        out.append((m.group(1), m.group(2), f))
    return out


def main():
    status_only = "--status" in sys.argv
    dry = "--dry" in sys.argv

    ensure_tracking_table()
    done = applied_versions()
    pending = [(v, n, p) for v, n, p in local_migrations() if v not in done]

    if status_only or dry:
        for v, n, p in local_migrations():
            mark = "✅" if v in done else "⏳"
            print(f"{mark} {v} {n}")
        if not pending:
            print("Rien à appliquer.")
        return

    if not pending:
        print("✅ Aucune migration en attente.")
        return

    for version, name, path in pending:
        sql = path.read_text()
        print(f"⏳ Application {version}_{name} ...", flush=True)
        run_sql(sql)
        run_sql(
            "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES "
            f"('{version}', '{name}') ON CONFLICT (version) DO NOTHING"
        )
        print(f"✅ {version}_{name}")

    print(f"\n{len(pending)} migration(s) appliquée(s).")


if __name__ == "__main__":
    main()
