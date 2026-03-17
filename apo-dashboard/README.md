# APO Dashboard — React + Vite

## Démarrage

```bash
npm install
npm run dev
```

## Déploiement Vercel

```bash
npm run build
# puis push sur GitHub → Vercel déploie automatiquement
```

---

## Ajouter un nouveau mois (ex : Mars 2026)

### 1. Créer le fichier de données

Copier `src/data/fevrier.js` → `src/data/mars.js`  
Remplacer toutes les valeurs par les données Excel du mois.

Les **règles de calcul** sont dans `src/lib/kpiEngine.js` — ne pas les modifier dans les fichiers de données.

### 2. Enregistrer le mois dans App.jsx

```jsx
import { marsData } from './data/mars'

// Dans le JSX :
{activeMonth === 'mar' && <MonthPanel data={marsData} month="mar" />}
```

### 3. Ajouter le bouton dans Sidebar.jsx

```jsx
<div className={`sidebar-month-btn${activeMonth === 'mar' ? ' active' : ''}`}
     onClick={() => setActiveMonth('mar')}>
  📅 Mars 2026
</div>
```

### 4. Ajouter la carte dans GlobalPanel.jsx

Ajouter une entrée dans le tableau `comparAnnuel` de chaque graphique.

---

## Structure du projet

```
src/
├── components/
│   ├── layout/       Header, Sidebar
│   ├── kpi/          KPICard, AlertBox
│   ├── pnl/          PnLTable
│   └── sections/     VueEnsemble, Production, Revenus, OperationalSections
├── data/
│   ├── janvier.js    ← données Jan 2026
│   └── fevrier.js    ← données Fév 2026
├── lib/
│   └── kpiEngine.js  ← TOUTES les règles de calcul APO
├── pages/
│   ├── GlobalPanel.jsx
│   └── MonthPanel.jsx
├── store/
│   └── dashboardStore.js  ← Zustand (thème, devise, navigation)
└── styles/
    └── global.css    ← design tokens identiques au HTML original
```

## Règles de calcul APO (résumé)

| Indicateur | Formule |
|---|---|
| Coût MP | régimes traités (kg) × prix moyen pondéré |
| Taux extraction | huile produite ÷ régimes traités |
| P&L / tonne | dénominateur = **tonnes huile produites** |
| Résultat net | Total produits − Total charges |
| Marge nette | Résultat / CA total |
| Source revenu huile | TOTAL MOUVEMENTS (fichier caisse) |
