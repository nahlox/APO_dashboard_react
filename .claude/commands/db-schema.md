# /db-schema — Afficher le schéma de base de données

Affiche le schéma Supabase avec les relations entre tables, pour faciliter le développement et le débogage.

## Étapes

### 1. Lire le schéma SQL
```bash
cat /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/schema.sql
```

### 2. Produire un résumé structuré

Afficher :

#### Tables et colonnes clés
Pour chaque table : nom, colonnes principales, clé primaire, clés étrangères.

#### Diagramme de relations
```
periodes (id)
    ├── achats_regimes.periode_id
    ├── production_journaliere.periode_id  
    ├── ventes_huile.periode_id
    ├── ventes_palmiste.periode_id
    ├── ventes_florentin.periode_id
    ├── ventes_bassin.periode_id
    ├── caisse_apo.periode_id
    ├── caisse_apo2.periode_id
    └── kpis_mensuels.periode_id (UNIQUE)

fournisseurs (id)
    └── achats_regimes.fournisseur_id

clients (id)
    └── contrats_pepiniere.client_id
```

#### Vues disponibles
Lister les 5 vues avec leur usage :
- `vue_ca_par_mois` — CA mensuel par produit
- `vue_production_par_mois` — Production mensuelle
- `vue_top_fournisseurs` — Classement fournisseurs par volume
- `vue_top_charges` — Classement des charges par catégorie
- `vue_pepiniere` — État des contrats pépinière

#### Index et contraintes notables
Mentionner les contraintes UNIQUE importantes (ex: `kpis_mensuels.periode_id`).

### 3. Données actuelles (optionnel)
```bash
cd /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/etl
python3 -c "
from dotenv import load_dotenv; import os; load_dotenv()
from supabase import create_client
s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
tables = ['periodes','achats_regimes','production_journaliere','ventes_huile','ventes_palmiste','caisse_apo','caisse_apo2','kpis_mensuels','contrats_pepiniere','banque_apo']
for t in tables:
    n = len(s.table(t).select('id', count='exact').execute().data)
    print(f'{t}: {n} lignes')
"
```

## Format de sortie
Résumé markdown clair avec le diagramme de relations et le comptage des lignes par table.
