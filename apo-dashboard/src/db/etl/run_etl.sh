#!/bin/bash
# APO ETL — lancé automatiquement par launchd chaque jour à 07h00
# Log: ~/Library/Logs/apo_etl.log
#
# ⚠️ SPÉCIFIQUE AU TENANT 'apo' — ne pas réutiliser tel quel pour un nouveau client.
# Ce script suppose un Mac allumé en permanence + un dossier Dropbox local synchronisé
# (chemin en dur ci-dessous). Pour onboarder un nouveau client huilerie, utiliser
# etl_cloud.py à la place (API Dropbox, tourne sur GitHub Actions/Railway, config
# 100% pilotée par la table `tenant_config` — voir son docstring et ONBOARDING.md).

set -euo pipefail

ETL_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$HOME/Library/Logs/apo_etl.log"
PYTHON=/Library/Frameworks/Python.framework/Versions/3.13/bin/python3

echo "" >> "$LOG_FILE"
echo "===== $(date '+%Y-%m-%d %H:%M:%S') — APO ETL démarré =====" >> "$LOG_FILE"

BANK_FILE="$HOME/Dropbox/APO/Compta/2026/BANK APO/BANK APO 2026.xlsx"

cd "$ETL_DIR"
"$PYTHON" etl.py >> "$LOG_FILE" 2>&1

echo "--- $(date '+%Y-%m-%d %H:%M:%S') — ETL Banque ---" >> "$LOG_FILE"
if [ -f "$BANK_FILE" ]; then
    "$PYTHON" etl_banque.py "$BANK_FILE" >> "$LOG_FILE" 2>&1
else
    echo "⚠️  Fichier banque introuvable : $BANK_FILE" >> "$LOG_FILE"
fi

echo "===== $(date '+%Y-%m-%d %H:%M:%S') — APO ETL terminé =====" >> "$LOG_FILE"
