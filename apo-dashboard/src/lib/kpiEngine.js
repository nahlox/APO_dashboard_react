// ============================================================
// APO KPI ENGINE
// Règles de calcul officielles APO — NE PAS MODIFIER sans
// validation avec Rawad. Toute logique métier passe par ici.
// ============================================================

// XOF (FCFA) est arrimé à l'EUR au taux fixe de 655,957
// Le taux live est récupéré au démarrage et stocké dans dashboardStore.
export const EUR_RATE_DEFAULT = 655.957

// ── FORMATTERS ───────────────────────────────────────────────

export const fmt = {
  /** 1 336 263 200 → "1 336 M" */
  millions: (v) => (v / 1e6).toFixed(1).replace('.', ',') + ' M',

  /** 1 336 263 200 → "1 336 263 200" avec espaces */
  full: (v) => Math.round(v).toLocaleString('fr-FR'),

  /** 19.56 → "19,56%" */
  pct: (v) => v.toFixed(2).replace('.', ',') + '%',

  /** 1956 → "1 956 T" */
  tonnes: (v) => Math.round(v).toLocaleString('fr-FR') + ' T',

  /**
   * Formatteur nombre entier — tooltip charts.
   * FCFA → nombre complet avec espaces
   * EUR  → conversion + "€"
   */
  money: (v, currency = 'FCFA', eurRate = EUR_RATE_DEFAULT) => {
    if (currency === 'EUR') {
      const eur = Math.round(v / eurRate)
      return eur.toLocaleString('fr-FR') + ' €'
    }
    return Math.round(v).toLocaleString('fr-FR') + ' FCFA'
  },

  /** Formatte selon devise — tableaux */
  currency: (v, currency = 'FCFA', eurRate = EUR_RATE_DEFAULT) => {
    if (currency === 'EUR') {
      const eur = Math.round(v / eurRate)
      return eur.toLocaleString('fr-FR') + ' €'
    }
    return Math.round(v).toLocaleString('fr-FR') + ' FCFA'
  },

  /** Pour les KPI cards — nombre complet, sans suffixe (la carte gère l'unité) */
  kpiValue: (v, currency = 'FCFA', eurRate = EUR_RATE_DEFAULT) => {
    if (currency === 'EUR') {
      return Math.round(v / eurRate).toLocaleString('fr-FR')
    }
    return Math.round(v).toLocaleString('fr-FR')
  },

  /** Suffixe de devise pour les en-têtes de colonnes */
  currencyLabel: (currency = 'FCFA') => currency === 'EUR' ? 'EUR' : 'FCFA',

  /** Conversion brute vers EUR */
  toEUR: (v, eurRate = EUR_RATE_DEFAULT) => v / eurRate,
}

// ── RÈGLES DE CALCUL OFFICIELLES ────────────────────────────

/**
 * RÈGLE 1 — Coût Matière Première
 * = régimes traités (kg) × prix moyen pondéré (F/kg)
 * EXCLURE : surcharges transport, transferts inter-caisse
 */
export function calculCoutMP(regimesTraitesKg, prixMoyenPondere) {
  return regimesTraitesKg * prixMoyenPondere
}

/**
 * RÈGLE 2 — Taux d'extraction
 * = huile produite (kg) ÷ régimes traités (kg)
 */
export function calculTauxExtraction(huileProduiteKg, regimesTraitesKg) {
  return (huileProduiteKg / regimesTraitesKg) * 100
}

/**
 * RÈGLE 3 — Revenu huile
 * Source : ligne TOTAL MOUVEMENTS du fichier caisse
 * = somme des sorties caisse étiquetées "vente huile"
 */
export function calculRevenusHuile(mouvements) {
  return mouvements
    .filter((m) => m.type === 'vente_huile')
    .reduce((sum, m) => sum + m.montant, 0)
}

/**
 * RÈGLE 4 — P&L (Compte de résultat)
 * Dénominateur = tonnes d'huile PRODUITES (pas livrées)
 * Résultat/tonne = (Total produits - Total charges) / huile produite (T)
 */
export function calculPnL(data) {
  const pnl = data.pnl
  const totalProduits = pnl.produits.reduce((s, r) => s + r.total, 0)
  // Charges = coût MP + charges exploitation + amortissements
  const totalCharges =
    pnl.coutMP.total +
    pnl.chargesExploitation.reduce((s, r) => s + r.total, 0) +
    pnl.amortissements.reduce((s, r) => s + r.total, 0)
  const resultat  = totalProduits + totalCharges
  const margePct  = (resultat / totalProduits) * 100
  return { totalProduits, totalCharges, resultat, margePct }
}

/**
 * RÈGLE 5 — Marge nette
 * = Résultat net / CA total × 100
 */
export function calculMarge(resultatNet, caTotal) {
  return (resultatNet / caTotal) * 100
}

// ── DONNÉES GLOBALES (agrégation tous les mois enregistrés) ──

export function buildGlobalKPIs(...monthDatas) {
  const kpis = monthDatas.map(d => d.kpis)
  const last = kpis.at(-1)
  const prev = kpis.at(-2) ?? kpis.at(-1)

  const caCumule       = kpis.reduce((s, k) => s + k.caTotalFCFA, 0)
  const resultatCumule = kpis.reduce((s, k) => s + k.resultatNetFCFA, 0)
  const huileTotal     = kpis.reduce((s, k) => s + k.huileProduiteT, 0)

  return {
    caCumule,
    evolutionCA_FevJan:  kpis.length >= 2 ? ((kpis[1].caTotalFCFA - kpis[0].caTotalFCFA) / kpis[0].caTotalFCFA) * 100 : 0,
    evolutionCA_MarFev:  prev !== last ? ((last.caTotalFCFA - prev.caTotalFCFA) / (prev.caTotalFCFA || 1)) * 100 : 0,
    resultatCumule,
    evolutionResultat:   kpis.length >= 2 ? kpis[1].resultatNetFCFA / (kpis[0].resultatNetFCFA || 1) : 0,
    huileProduiteTotal:  huileTotal,
    evolutionProduction: kpis.length >= 2 ? ((kpis[1].huileProduiteT - kpis[0].huileProduiteT) / (kpis[0].huileProduiteT || 1)) * 100 : 0,
    coutMPCumule:        kpis.reduce((s, k) => s + k.coutMPFCFA, 0),
    chargesExplCumul:    kpis.reduce((s, k) => s + k.chargesExplFCFA, 0),
  }
}

// ── CHART DEFAULTS (couleurs APO) ────────────────────────────

export const chartColors = {
  gold:       'rgba(242,140,40,1)',
  goldAlpha:  'rgba(242,140,40,0.7)',
  green:      'rgba(63,163,77,1)',
  greenAlpha: 'rgba(63,163,77,0.7)',
  red:        'rgba(224,92,92,1)',
  redAlpha:   'rgba(224,92,92,0.7)',
  accent:     'rgba(107,201,122,1)',
  dim:        'rgba(138,154,130,0.5)',
}

export const defaultTooltip = {
  backgroundColor: '#1A3323',
  borderColor:     'rgba(242,140,40,0.3)',
  borderWidth:     1,
  titleColor:      '#E8EDE6',
  bodyColor:       '#8A9A84',
  padding:         12,
}

export const defaultChartOptions = {
  responsive:          true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { font: { family: "'DM Sans', sans-serif", size: 12 } } },
    tooltip: defaultTooltip,
  },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: 'rgba(242,140,40,0.06)' } },
  },
}
