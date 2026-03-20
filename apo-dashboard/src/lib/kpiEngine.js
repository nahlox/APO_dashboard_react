// ============================================================
// APO KPI ENGINE
// Règles de calcul officielles APO — NE PAS MODIFIER sans
// validation avec Rawad. Toute logique métier passe par ici.
// ============================================================

const USD_RATE = 563 // 1 USD = 563 FCFA (XE.com · 11 mars 2026)

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
   * Formatteur intelligent M/K selon la devise active.
   * < 1 000 000 FCFA → affiche en milliers (K)
   * ≥ 1 000 000 FCFA → affiche en millions (M)
   */
  money: (v, currency = 'FCFA') => {
    if (currency === 'USD') {
      const usd = v / USD_RATE
      if (usd < 1e6) return '$' + Math.round(usd / 1e3).toLocaleString('fr-FR') + ' K'
      return '$' + (usd / 1e6).toFixed(2) + ' M'
    }
    if (v < 1e6) return Math.round(v / 1e3).toLocaleString('fr-FR') + ' K FCFA'
    return (v / 1e6).toFixed(1).replace('.', ',') + ' M FCFA'
  },

  /** Formatte selon devise active — avec suffixe devise */
  currency: (v, currency = 'FCFA') => {
    if (currency === 'USD') {
      const usd = v / USD_RATE
      if (usd < 1e6) return '$' + Math.round(usd / 1e3).toLocaleString('fr-FR') + ' K'
      return '$' + (usd / 1e6).toFixed(2) + ' M'
    }
    if (v < 1e6) return Math.round(v / 1e3).toLocaleString('fr-FR') + ' K FCFA'
    return (v / 1e6).toFixed(1).replace('.', ',') + ' M FCFA'
  },

  /** Pour les KPI cards */
  kpiValue: (v, currency = 'FCFA') => {
    if (currency === 'USD') {
      const usd = v / USD_RATE
      if (usd < 1e6) return '$' + Math.round(usd / 1e3).toLocaleString('fr-FR') + ' K'
      return '$' + (usd / 1e6).toFixed(2) + ' M'
    }
    if (v < 1e6) return Math.round(v / 1e3).toLocaleString('fr-FR') + ' K'
    return (v / 1e6).toFixed(1).replace('.', ',') + ' M'
  },

  /** Suffixe de devise pour les en-têtes de colonnes */
  currencyLabel: (currency = 'FCFA') => currency === 'USD' ? 'USD' : 'FCFA',

  /** Conversion brute vers USD */
  toUSD: (v) => v / USD_RATE,
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

// ── DONNÉES GLOBALES (agrégation Jan + Fév) ──────────────────

export function buildGlobalKPIs(janData, febData) {
  const jan = janData.kpis
  const feb = febData.kpis

  return {
    // CA
    caCumule:          jan.caTotalFCFA + feb.caTotalFCFA,
    evolutionCA:       ((feb.caTotalFCFA - jan.caTotalFCFA) / jan.caTotalFCFA) * 100,

    // Résultat
    resultatCumule:    jan.resultatNetFCFA + feb.resultatNetFCFA,
    evolutionResultat: feb.resultatNetFCFA / jan.resultatNetFCFA,  // multiplicateur ×11,8

    // Production
    huileProduiteTotal: jan.huileProduiteT + feb.huileProduiteT,
    evolutionProduction: ((feb.huileProduiteT - jan.huileProduiteT) / jan.huileProduiteT) * 100,

    // Coûts
    coutMPCumule:      jan.coutMPFCFA + feb.coutMPFCFA,
    chargesExplCumul:  jan.chargesExplFCFA + feb.chargesExplFCFA,
  }
}

// ── CHART DEFAULTS (couleurs APO) ────────────────────────────

export const chartColors = {
  gold:       'rgba(200,150,62,1)',
  goldAlpha:  'rgba(200,150,62,0.7)',
  green:      'rgba(76,175,122,1)',
  greenAlpha: 'rgba(76,175,122,0.7)',
  red:        'rgba(224,92,92,1)',
  redAlpha:   'rgba(224,92,92,0.7)',
  accent:     'rgba(126,200,164,1)',
  dim:        'rgba(138,154,142,0.5)',
}

export const defaultTooltip = {
  backgroundColor: '#1E2421',
  borderColor:     'rgba(200,150,62,0.3)',
  borderWidth:     1,
  titleColor:      '#E8EAE6',
  bodyColor:       '#8A9A8E',
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
    y: { grid: { color: 'rgba(200,150,62,0.06)' } },
  },
}
