# /etl-diagnose — Diagnostiquer un problème ETL

Diagnostiquer et corriger les problèmes courants du pipeline ETL.

## Étapes de diagnostic

### 1. Vérifier le token Dropbox
```bash
cd /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/etl
grep -E "DROPBOX|SUPABASE" .env | sed 's/=.*/=***/'
```
Si `DROPBOX_TOKEN` est vide ou expiré → informer l'utilisateur de régénérer sur https://www.dropbox.com/developers/apps.

### 2. Vérifier les logs du dernier ETL
```bash
cat ~/Library/Logs/apo_etl.log 2>/dev/null | tail -50
```

### 3. Tester la connexion Supabase
```bash
cd /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/etl
python3 -c "
from dotenv import load_dotenv; import os; load_dotenv()
from supabase import create_client
s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
r = s.table('periodes').select('*').execute()
print('Supabase OK — periodes:', len(r.data))
"
```

### 4. Tester la connexion Dropbox
```bash
cd /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/etl
python3 -c "
from dotenv import load_dotenv; import os; load_dotenv()
import dropbox
dbx = dropbox.Dropbox(os.getenv('DROPBOX_TOKEN'))
acc = dbx.users_get_current_account()
print('Dropbox OK —', acc.name.display_name)
"
```

### 5. Vérifier l'état des imports
```bash
cat /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/etl/etat_imports.json
```

## Tableau de bord des problèmes courants

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| `AuthError` Dropbox | Token expiré | Régénérer le token sur dropbox.com/developers |
| `502 Bad Gateway` | Timeout Supabase | Relancer par mois (`--mois X`), attendre 10 min |
| Fichier introuvable | Renommage dans Dropbox | Vérifier le nom exact du fichier |
| Onglet Excel manquant `⚠️` | Mois sans données | Normal — pas d'action requise |
| KPIs à 0 | Import incomplet | Vérifier les lignes insérées, relancer avec `--force` |
| `Connection refused` Supabase | URL/key incorrecte | Vérifier `.env` |

## Rapport final
Résumer : ce qui fonctionne, ce qui est cassé, et l'action corrective recommandée.
