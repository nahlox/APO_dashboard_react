#!/usr/bin/env python3
"""
Génère une clé d'ingestion pour un tenant (agent Sage on-site, connecteurs).
La clé n'est affichée QU'UNE FOIS — seul son hash SHA-256 est stocké en base.

Usage :
  python3 scripts/generate_ingest_key.py <tenant_id> [label]
  python3 scripts/generate_ingest_key.py apo sage_agent_apo
"""
import hashlib, os, secrets, sys
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / "apo-dashboard" / "src" / "db" / "etl" / ".env")

PAT = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
REF = os.environ.get("SUPABASE_PROJECT_REF", "iwfgvhenqzdutjcxhuip")

if len(sys.argv) < 2:
    sys.exit(__doc__)
tenant_id = sys.argv[1]
label = sys.argv[2] if len(sys.argv) > 2 else f"ingest_{tenant_id}"

key = f"pk_{tenant_id}_{secrets.token_hex(24)}"
key_hash = hashlib.sha256(key.encode()).hexdigest()

r = requests.post(
    f"https://api.supabase.com/v1/projects/{REF}/database/query",
    headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
    json={"query": f"""
        INSERT INTO tenant_api_keys (tenant_id, key_hash, label)
        VALUES ('{tenant_id}', '{key_hash}', '{label}')
        RETURNING id, tenant_id, label
    """},
)
if r.status_code not in (200, 201):
    sys.exit(f"Échec : HTTP {r.status_code} {r.text[:500]}")

print(f"✅ Clé créée pour tenant '{tenant_id}' (label: {label})")
print("\n⚠️  À COPIER MAINTENANT — elle ne sera plus jamais affichée :\n")
print(f"    {key}\n")
print("L'agent l'utilise en header :  x-api-key: <clé>")
print("Révocation :  UPDATE tenant_api_keys SET actif = FALSE WHERE label = '...';")
