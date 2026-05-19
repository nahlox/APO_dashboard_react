# /kpis — Afficher et analyser les KPIs mensuels

Récupère les KPIs depuis Supabase, les affiche et détecte les anomalies.

## Étapes

### 1. Charger les KPIs depuis Supabase
```bash
cd /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/etl
python3 -c "
from dotenv import load_dotenv; import os; load_dotenv()
from supabase import create_client
import json

s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
r = s.table('kpis_mensuels').select('*').order('periode_id').execute()

for k in r.data:
    ca = k.get('ca_total', 0) or 0
    res = k.get('resultat_net', 0) or 0
    marge = k.get('marge_nette', 0) or 0
    te = k.get('taux_extraction', 0) or 0
    prod = k.get('production_huile_kg', 0) or 0
    print(f'Mois {k[\"periode_id\"]} | CA: {ca:,.0f} | Résultat: {res:,.0f} | Marge: {marge:.1f}% | TE: {te:.1f}% | Prod: {prod:,.0f} kg')
"
```

### 2. Analyser les anomalies
Détecter et signaler :
- **CA** < 500M FCFA sur un mois plein → faible activité
- **Marge nette** < 10% → sous le seuil de rentabilité
- **Taux d'extraction** < 16% ou > 24% → hors fourchette normale (18–22% attendu)
- **Production huile** = 0 → données manquantes ou arrêt usine
- **Charges** > 50% du CA → ratio anormal

### 3. Comparaison mensuelle
Calculer la variation mois/mois pour CA, résultat, et production. Signaler toute variation > 30%.

### 4. Résumé
Présenter un tableau markdown propre :
```
| Mois | CA (FCFA) | Résultat | Marge | TE | Production |
|------|-----------|----------|-------|----|------------|
| ...  | ...       | ...      | ...   | ...| ...        |
```
Puis une liste des anomalies détectées avec recommandations.

## Seuils de référence APO
- Taux d'extraction nominal : **18–22%**
- Marge nette cible : **> 20%**
- Production mensuelle normale : **> 50 000 kg** (mois plein)
- CA mensuel normal : **> 800M FCFA** (mois plein)
