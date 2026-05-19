# /new-section [nom] — Ajouter une nouvelle section au dashboard

Guide pour ajouter une nouvelle section de données au dashboard React.
Usage : `/new-section pepiniere` ou `/new-section banque`

## Architecture à suivre

### Fichiers à créer / modifier

```
apo-dashboard/src/
├── components/
│   └── [NomSection]/
│       ├── [NomSection]Section.jsx    ← Composant principal
│       └── [NomSection]Chart.jsx      ← Graphique (si nécessaire)
├── hooks/
│   └── use[NomSection]DB.js           ← Hook de chargement Supabase (si nouvelle table)
└── pages/
    └── MonthPanel.jsx                 ← Ajouter <[NomSection]Section />
```

## Étapes

### 1. Explorer les données disponibles
Lire le schéma Supabase pour identifier la table source :
```bash
grep -A5 "CREATE TABLE" /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/schema.sql | grep -A5 "$ARGUMENTS"
```

### 2. Créer le hook de données (si table non encore chargée)
Pattern standard — s'inspirer de `src/hooks/useMoisDB.js` :
```javascript
// use[Nom]DB.js
import { useState, useEffect } from 'react'
import { supabase } from '../db/supabase'

export function use[Nom]DB(mois) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!mois) return
    supabase
      .from('[table_name]')
      .select('*')
      .eq('mois', mois)
      .then(({ data }) => { setData(data); setLoading(false) })
  }, [mois])

  return { data, loading }
}
```

### 3. Créer le composant section
Pattern standard — s'inspirer d'un composant existant dans `src/components/` :
```jsx
// [Nom]Section.jsx
export function [Nom]Section({ moisData }) {
  // 1. Extraire les données pertinentes de moisData
  // 2. Calculer les métriques à afficher
  // 3. Rendre les KPI cards + graphique

  return (
    <section>
      <h2>[Titre Section]</h2>
      {/* KPI cards */}
      {/* Chart */}
    </section>
  )
}
```

### 4. Intégrer dans MonthPanel
```bash
# Lire MonthPanel pour voir où insérer
cat /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/pages/MonthPanel.jsx
```
Ajouter l'import et le composant à la bonne position dans la page.

### 5. Vérifier le store Zustand
```bash
cat /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/store/dashboardStore.js
```
Si la nouvelle section a besoin d'un état global, l'ajouter ici.

## Conventions du projet
- Composants en PascalCase, hooks en camelCase avec préfixe `use`
- Couleurs : utiliser les variables CSS existantes (pas de couleurs hardcodées)
- Charts : Chart.js via react-chartjs-2 (déjà installé)
- Toujours tester avec un mois qui a des données (avril ou mai 2026)
