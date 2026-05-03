"""
Migration — Remapping catégories vers nomenclature OHADA (compte de résultat APO)

Ancienne catégorie  →  Nouvelle catégorie
──────────────────────────────────────────────────────────
carburant           →  fournitures_usine
electricite         →  fournitures_usine
eau_fournitures     →  fournitures_usine
materiels           →  fournitures_usine
construction        →  fournitures_usine

vehicules           →  frais_transport

entretien           →  services_ext
assurance           →  services_ext

main_oeuvre         →  autres_services_ext
securite            →  autres_services_ext
frais_admin         →  autres_services_ext
autre               →  autres_services_ext

frais_relat         →  autres_charges

salaires            →  charges_personnel
charges_patronales  →  charges_personnel

taxes_fiscales      →  inchangé (section séparée IV)
frais_bancaires     →  inchangé (section séparée V)
amortissement       →  inchangé (section séparée V)

Usage : python migrate_categories.py [--dry-run]
"""

import os, argparse
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ["SUPABASE_KEY"]

REMAPPING = {
    # → fournitures_usine (60)
    "carburant":         "fournitures_usine",
    "electricite":       "fournitures_usine",
    "eau_fournitures":   "fournitures_usine",
    "materiels":         "fournitures_usine",
    "construction":      "fournitures_usine",
    # → frais_transport (61)
    "vehicules":         "frais_transport",
    # → services_ext (62)
    "entretien":         "services_ext",
    "assurance":         "services_ext",
    # → autres_services_ext (63)
    "main_oeuvre":       "autres_services_ext",
    "securite":          "autres_services_ext",
    "frais_admin":       "autres_services_ext",
    "autre":             "autres_services_ext",
    # → autres_charges (65)
    "frais_relat":       "autres_charges",
    # → charges_personnel (66)
    "salaires":          "charges_personnel",
    "charges_patronales":"charges_personnel",
}

TABLES = ["caisse_apo", "caisse_apo2", "banque_apo"]

def migrate(dry_run: bool):
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"{'[DRY RUN] ' if dry_run else ''}Migration catégories OHADA\n")

    total_updated = 0
    for table in TABLES:
        print(f"── Table : {table}")
        for old_cat, new_cat in REMAPPING.items():
            # Count first
            res = sb.from_(table).select("id", count="exact").eq("categorie", old_cat).execute()
            count = res.count or 0
            if count == 0:
                continue
            print(f"   {old_cat:20s} → {new_cat:22s}  ({count} lignes)")
            if not dry_run:
                sb.from_(table).update({"categorie": new_cat}).eq("categorie", old_cat).execute()
            total_updated += count
        print()

    print(f"{'[DRY RUN] ' if dry_run else ''}Total : {total_updated} lignes {'à mettre à jour' if dry_run else 'mises à jour'}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Affiche les changements sans les appliquer")
    args = parser.parse_args()
    migrate(dry_run=args.dry_run)
