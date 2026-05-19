# /mois-rapport [mois] — Rapport mensuel détaillé

Génère un rapport financier complet pour un mois donné.
Usage : `/mois-rapport 4` (avril), `/mois-rapport 5` (mai), etc.

Si aucun mois n'est précisé, utiliser le dernier mois avec des données.

## Étapes

### 1. Récupérer toutes les données du mois
```bash
cd /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/etl
python3 -c "
from dotenv import load_dotenv; import os; load_dotenv()
from supabase import create_client

MOIS = $ARGUMENTS  # remplacé par l'argument /mois-rapport
s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

# KPIs
kpi = s.table('kpis_mensuels').select('*').eq('periode_id', MOIS).execute().data
# Ventes par produit
huile = s.table('ventes_huile').select('montant_fcfa').eq('mois', MOIS).execute().data
palmiste = s.table('ventes_palmiste').select('montant_fcfa').eq('mois', MOIS).execute().data
florentin = s.table('ventes_florentin').select('montant_fcfa').eq('mois', MOIS).execute().data
# Production
prod = s.table('production_journaliere').select('*').eq('mois', MOIS).execute().data
# Achats régimes
achats = s.table('achats_regimes').select('montant_fcfa').eq('mois', MOIS).execute().data
# Charges
charges = s.table('caisse_apo2').select('credit_fcfa').eq('mois', MOIS).execute().data

print('KPI:', kpi)
print('Huile ventes:', len(huile), 'lignes, total:', sum(r['montant_fcfa'] or 0 for r in huile))
print('Palmiste ventes:', len(palmiste), 'lignes, total:', sum(r['montant_fcfa'] or 0 for r in palmiste))
print('Production:', len(prod), 'jours')
print('Achats régimes:', sum(r['montant_fcfa'] or 0 for r in achats))
print('Charges caisse2:', sum(r['credit_fcfa'] or 0 for r in charges))
"
```

### 2. Structurer le rapport

Produire un rapport markdown avec ces sections :

#### 📊 Résumé Exécutif
- CA total, Résultat net, Marge nette
- Variation vs mois précédent

#### 🏭 Production
- Total régimes traités, Huile produite, Palmiste produit
- Taux d'extraction, Jours de production

#### 💰 Revenus par produit
- Tableau : Produit | Quantité | Prix moyen | CA

#### 💸 Charges
- Charges opérationnelles, Coût matière première, Amortissement

#### 🌿 Achats régimes
- Tonnage acheté, Montant total, Prix moyen/tonne
- Top 3 fournisseurs

#### ⚠️ Points d'attention
- Anomalies détectées, écarts significatifs

## Format de sortie
Rapport en markdown, prêt à copier dans Notion ou envoyer par email.
