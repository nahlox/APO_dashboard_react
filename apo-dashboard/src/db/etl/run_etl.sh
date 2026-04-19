#!/bin/bash
# APO ETL — lancé automatiquement par launchd chaque jour à 07h00
# Log: ~/Library/Logs/apo_etl.log

set -euo pipefail

ETL_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$HOME/Library/Logs/apo_etl.log"
PYTHON=/Library/Frameworks/Python.framework/Versions/3.13/bin/python3

echo "" >> "$LOG_FILE"
echo "===== $(date '+%Y-%m-%d %H:%M:%S') — APO ETL démarré =====" >> "$LOG_FILE"

cd "$ETL_DIR"
"$PYTHON" etl.py >> "$LOG_FILE" 2>&1

echo "===== $(date '+%Y-%m-%d %H:%M:%S') — APO ETL terminé =====" >> "$LOG_FILE"
