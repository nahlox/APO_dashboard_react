# /dropbox-token — Régénérer le token Dropbox

À utiliser quand l'ETL échoue avec `AuthError` — le token Dropbox a expiré.

## Étapes

### 1. Vérifier que le token est bien expiré
```bash
cd /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/etl
python3 -c "
from dotenv import load_dotenv; import os; load_dotenv()
import dropbox
try:
    dbx = dropbox.Dropbox(os.getenv('DROPBOX_TOKEN'))
    acc = dbx.users_get_current_account()
    print('Token OK —', acc.name.display_name)
except Exception as e:
    print('Token KO —', e)
"
```

### 2. Instructions pour régénérer le token

Informer l'utilisateur :

1. Aller sur https://www.dropbox.com/developers/apps
2. Sélectionner l'app APO
3. Dans l'onglet **Settings**, générer un nouveau **Access Token**
4. Copier le token

### 3. Mettre à jour le .env
```bash
# L'utilisateur doit modifier manuellement :
# /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/etl/.env
# Remplacer la ligne : DROPBOX_TOKEN=ancien_token
# Par :               DROPBOX_TOKEN=nouveau_token
```
Ne pas afficher ni loguer le token. Demander à l'utilisateur de le coller directement dans `.env`.

### 4. Tester et relancer
Après mise à jour du token :
```bash
cd /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/etl
python3 -c "
from dotenv import load_dotenv; import os; load_dotenv()
import dropbox
dbx = dropbox.Dropbox(os.getenv('DROPBOX_TOKEN'))
acc = dbx.users_get_current_account()
print('Token OK —', acc.name.display_name)
"
```
Si OK → lancer `/etl-run`.

## Note de sécurité
Ne jamais afficher le token dans la conversation. Le `.env` est dans `.gitignore` — ne jamais committer ce fichier.
