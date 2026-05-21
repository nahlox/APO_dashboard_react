/**
 * aggregateData.js — combine plusieurs mois en un seul objet "data".
 *
 * Reproduit la même structure que buildData() (useMoisDB.js) afin que
 * les composants section (VueEnsemble, Production, Revenus, Charges,
 * Fournisseurs, Pépinière) puissent fonctionner sans modification.
 *
 * Stratégies d'agrégation par champ :
 *   - sommes       : CA, coût MP, charges, résultat, tonnages, etc.
 *   - moyennes pondérées : taux d'extraction (par huile produite), prix moyens
 *   - dernière valeur     : stock fin mois, stock huile tank
 *   - concaténation       : séries journalières (production, revenus)
 *   - agrégation par clé  : top dépenses (par libellé), fournisseurs (par nom)
 *   - cumul              : P&L lignes (par libellé)
 */

const MONTH_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

function shortMois(libelle) {
  const idx = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'].indexOf(libelle?.toLowerCase())
  return idx >= 0 ? MONTH_SHORT[idx] : (libelle ?? '').slice(0, 3)
}

function sum(arr, get) {
  return arr.reduce((s, x) => s + (get(x) || 0), 0)
}

/** Moyenne pondérée d'une valeur (get) par un poids (weight) */
function weightedAvg(arr, get, weight) {
  const totW = arr.reduce((s, x) => s + (weight(x) || 0), 0)
  if (!totW) return 0
  return arr.reduce((s, x) => s + (get(x) || 0) * (weight(x) || 0), 0) / totW
}

/** Combine des séries journalières en préfixant les labels par le mois court */
function concatDaily(arr, getLabels, getVals) {
  const labels = []
  const vals   = []
  for (const m of arr) {
    const prefix = shortMois(m.data?._etl?.mois)
    const ls = getLabels(m.data) || []
    const vs = getVals(m.data)   || []
    ls.forEach((l, i) => {
      labels.push(`${prefix}-${l}`)
      vals.push(vs[i])
    })
  }
  return { labels, vals }
}

/** Agrège un tableau d'objets {label, total, pertonne, ...} par label, en sommant les "total" */
function aggregateLines(monthArr, getLines) {
  const byLabel = {}
  for (const m of monthArr) {
    for (const line of (getLines(m.data) || [])) {
      const k = line.label
      if (!byLabel[k]) byLabel[k] = { ...line, total: 0, pertonne: 0 }
      byLabel[k].total    += (line.total    || 0)
      byLabel[k].pertonne += (line.pertonne || 0)
    }
  }
  return Object.values(byLabel)
}

/** Agrège des charts {labels[], values[]} en additionnant les valeurs par label */
function aggregateChart(monthArr, getChart) {
  const byLabel = {}
  for (const m of monthArr) {
    const c = getChart(m.data)
    if (!c) continue
    c.labels.forEach((l, i) => {
      byLabel[l] = (byLabel[l] || 0) + (c.values[i] || 0)
    })
  }
  const entries = Object.entries(byLabel).sort((a, b) => b[1] - a[1])
  return { labels: entries.map(([l]) => l), values: entries.map(([, v]) => v) }
}

/**
 * Construit un objet `data` agrégé pour un tableau de mois.
 * @param {Array<{key, data, accent?, rgba?}>} monthArr
 * @returns {object} data
 */
export function buildAggregateData(monthArr) {
  if (!monthArr || monthArr.length === 0) return null

  // Mois unique → retourner data tel quel (rien à agréger)
  if (monthArr.length === 1) return monthArr[0].data

  const first = monthArr[0].data
  const last  = monthArr[monthArr.length - 1].data
  const dataArr = monthArr.map(m => m.data)

  // ── KPIs agrégés ───────────────────────────────────────────────────
  const caTotalFCFA       = sum(dataArr, d => d.kpis.caTotalFCFA)
  const caHuileFCFA       = sum(dataArr, d => d.kpis.caHuileFCFA)
  const caHuileBlancFCFA  = sum(dataArr, d => d.kpis.caHuileBlancFCFA)
  const caHuileNoirFCFA   = sum(dataArr, d => d.kpis.caHuileNoirFCFA)
  const caNoisFCFA        = sum(dataArr, d => d.kpis.caNoisFCFA)
  const caHuileFlorentinFCFA = sum(dataArr, d => d.kpis.caHuileFlorentinFCFA)
  const caBassinFCFA      = sum(dataArr, d => d.kpis.caBassinFCFA)
  const coutMPFCFA        = sum(dataArr, d => d.kpis.coutMPFCFA)
  const chargesExplFCFA   = sum(dataArr, d => d.kpis.chargesExplFCFA)
  const totalTaxesFCFA    = sum(dataArr, d => d.kpis.totalTaxesFCFA)
  const amortissementFCFA = sum(dataArr, d => d.kpis.amortissementFCFA)
  const resultatExplFCFA  = sum(dataArr, d => d.kpis.resultatExplFCFA)
  const resultatNetFCFA   = sum(dataArr, d => d.kpis.resultatNetFCFA)
  const regimesRecusT     = sum(dataArr, d => d.kpis.regimesRecusT)
  const regimesTraitesT   = sum(dataArr, d => d.kpis.regimesTraitesT)
  const huileProduiteT    = sum(dataArr, d => d.kpis.huileProduiteT)
  const huileVendueT      = sum(dataArr, d => d.kpis.huileVendueT)
  const palmisteProduitT  = sum(dataArr, d => d.kpis.palmisteProduitT)
  const palmisteVenduT    = sum(dataArr, d => d.kpis.palmisteVenduT)
  const nbCamions         = sum(dataArr, d => d.kpis.nbCamions)
  const pepContratsFCFA   = sum(dataArr, d => d.kpis.pepContratsFCFA)
  const pepEncaisséFCFA   = sum(dataArr, d => d.kpis.pepEncaisséFCFA)
  const pepResteaFCFA     = sum(dataArr, d => d.kpis.pepResteaFCFA)

  // Moyennes pondérées
  const tauxExtraction    = weightedAvg(dataArr, d => d.kpis.tauxExtraction, d => d.kpis.regimesTraitesT)
  const prixMoyenHuileKg  = weightedAvg(dataArr, d => d.kpis.prixMoyenHuileKg, d => d.kpis.huileVendueT)
  const prixMoyenRegimeKg = weightedAvg(dataArr, d => d.kpis.prixMoyenRegimeKg, d => d.kpis.regimesRecusT)

  // Stock fin mois = dernier mois en date
  const stockFinMoisT     = last.kpis.stockFinMoisT     || 0
  const stockFinMoisFCFA  = last.kpis.stockFinMoisFCFA  || 0

  const margeNette        = caTotalFCFA ? +((resultatNetFCFA / caTotalFCFA) * 100).toFixed(1) : 0

  // ── Étiquettes ETL agrégées ────────────────────────────────────────
  const moisLabel = monthArr.length === 1
    ? first._etl.mois
    : `${shortMois(first._etl.mois)}–${shortMois(last._etl.mois)}`

  const etl = {
    mois:   moisLabel,
    annee:  first._etl.annee,
    source: 'aggregate',
    range:  { from: first._etl.mois, to: last._etl.mois, count: monthArr.length },
  }

  // ── Production agrégée (concat des journées) ────────────────────────
  const dailyKg = concatDaily(monthArr, d => d.production?.grainesDailyLabels, d => d.production?.grainesDailyKg)
  const dailyTE = concatDaily(monthArr, d => d.production?.teDailyLabels,      d => d.production?.teDailyVals)

  // Stock huile (tank) = dernier mois
  const stockHuileKg = last.production?.stockHuileKg || 0
  const tankCapaciteKg = last.production?.tankCapaciteKg || 1_300_000

  // Comparaison annuelle = entrée par mois individuel
  const comparAnnuel = monthArr.map(({ data }) => ({
    label:  `${shortMois(data._etl.mois)} ${data._etl.annee}`,
    values: [
      data.kpis.regimesRecusT  || 0,
      data.kpis.regimesTraitesT|| 0,
      data.kpis.huileProduiteT || 0,
      data.kpis.huileVendueT   || 0,
    ],
  }))

  // ── Revenus agrégés ─────────────────────────────────────────────────
  const dailyCA  = concatDaily(monthArr, d => d.revenus?.caJoursLabels, d => d.revenus?.caJoursVals)
  const dailyTon = concatDaily(monthArr, d => d.revenus?.caJoursLabels, d => d.revenus?.caJoursPoidsT)
  const dailyBlanc = concatDaily(monthArr, d => d.revenus?.caJoursLabels, d => d.revenus?.caJoursBlanc)
  const dailyNoir  = concatDaily(monthArr, d => d.revenus?.caJoursLabels, d => d.revenus?.caJoursNoir)
  const dailySarci = []
  for (const m of monthArr) {
    (m.data.revenus?.caJoursSarciOk || []).forEach(v => dailySarci.push(v))
  }

  // Blanc / Noir cumulés
  const blancCA   = sum(dataArr, d => d.revenus?.blanc?.caFCFA || 0)
  const blancT    = sum(dataArr, d => d.revenus?.blanc?.poidsT || 0)
  const blancGrT  = sum(dataArr, d => d.revenus?.blanc?.grainesT || 0)
  const noirCA    = sum(dataArr, d => d.revenus?.noir?.caFCFA || 0)
  const noirT     = sum(dataArr, d => d.revenus?.noir?.poidsT || 0)
  const noirGrT   = sum(dataArr, d => d.revenus?.noir?.grainesT || 0)
  const blancPrixMoy = blancT > 0 ? blancCA / (blancT * 1000) : 0
  const noirPrixMoy  = noirT  > 0 ? noirCA  / (noirT  * 1000) : 0

  // Liste produits agrégée
  const produitsAgg = aggregateLines(monthArr, d => d.revenus?.produits?.map(p => ({
    label: p.produit,
    total: p.totalFCFA,
    pertonne: 0,
    circuit: p.circuit,
    prixUnitaire: p.prixUnitaire,
  })))
  const revenusProduits = produitsAgg.map(p => ({
    produit:      p.label,
    quantite:     '—',
    prixUnitaire: '—',
    totalFCFA:    p.total,
    circuit:      p.circuit,
  }))

  // ── Charges agrégées ────────────────────────────────────────────────
  const topDepensesMerged = {}
  for (const d of dataArr) {
    for (const dep of (d.charges?.topDepenses || [])) {
      const k = dep.lib
      if (!topDepensesMerged[k]) topDepensesMerged[k] = { ...dep, mt: 0 }
      topDepensesMerged[k].mt += (dep.mt || 0)
    }
  }
  const topDepenses = Object.values(topDepensesMerged).sort((a, b) => b.mt - a.mt)

  // ── Fournisseurs agrégés ────────────────────────────────────────────
  const fournMerged = {}
  for (const d of dataArr) {
    for (const f of (d.fournisseurs?.liste || [])) {
      const k = f.name
      if (!fournMerged[k]) fournMerged[k] = { name: k, poids: 0, montant: 0, prix: 0 }
      fournMerged[k].poids   += (f.poids   || 0)
      fournMerged[k].montant += (f.montant || 0)
    }
  }
  const fournisseursListe = Object.values(fournMerged)
    .map(f => ({ ...f, prix: f.poids > 0 ? Math.round(f.montant / f.poids) : 0 }))
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 10)

  // ── Charts agrégés (caMix, charges) ─────────────────────────────────
  const caMix    = aggregateChart(monthArr, d => d.charts?.caMix)
  const chargesC = aggregateChart(monthArr, d => d.charts?.charges)

  // ── P&L agrégé (lignes par libellé) ─────────────────────────────────
  const produitsPnl       = aggregateLines(monthArr, d => d.pnl?.produits)
  const chargesExpPnl     = aggregateLines(monthArr, d => d.pnl?.chargesExploitation)
  const impotsTaxesPnl    = aggregateLines(monthArr, d => d.pnl?.impotsTaxes)
  const amortissementsPnl = aggregateLines(monthArr, d => d.pnl?.amortissements)
  const bicPnl            = aggregateLines(monthArr, d => d.pnl?.bic)

  const coutMPLine = {
    label:    'Graines/huile vendue (cumul)',
    pertonne: huileProduiteT ? Math.round(-coutMPFCFA / huileProduiteT) : 0,
    total:    -coutMPFCFA,
    blanc:    blancGrT > 0 ? { label: `↳ BLANC — ${blancGrT.toFixed(0)} T régimes estimées`, pertonne: 0, total: -(blancGrT * 1000 * prixMoyenRegimeKg) } : null,
    noir:     noirGrT > 0 ? { label: `↳ NOIR  — ${noirGrT.toFixed(0)} T régimes estimées`,  pertonne: 0, total: -(noirGrT * 1000 * prixMoyenRegimeKg) } : null,
  }

  const margeBrute    = caTotalFCFA - coutMPFCFA
  const ebitda        = margeBrute - chargesExplFCFA
  const totalTaxesExpl = totalTaxesFCFA - bicPnl.reduce((s, b) => s + Math.abs(b.total), 0)

  return {
    _etl: etl,
    kpis: {
      caTotalFCFA, caHuileFCFA, caHuileBlancFCFA, caHuileNoirFCFA,
      caHuileDetail:        `${prixMoyenHuileKg.toFixed(0)} F/kg × ${huileVendueT.toFixed(0)} T livrées (cumul)`,
      caNoisFCFA, caHuileFlorentinFCFA, caBassinFCFA,
      coutMPFCFA,
      coutMPDetail:         `${prixMoyenRegimeKg.toFixed(2)} F/kg (cumul)`,
      chargesExplFCFA, totalTaxesFCFA, amortissementFCFA,
      resultatExplFCFA, resultatNetFCFA, margeNette,
      regimesRecusT, regimesTraitesT, stockFinMoisT, stockFinMoisFCFA,
      huileProduiteT, huileVendueT, tauxExtraction: +tauxExtraction.toFixed(2),
      nbCamions, prixMoyenHuileKg, prixMoyenRegimeKg,
      palmisteProduitT, palmisteVenduT,
      pepContratsFCFA, pepEncaisséFCFA, pepResteaFCFA,
    },
    pnl: {
      baseLabel: `${huileProduiteT} tonnes d'huile produites (cumul)`,
      status:    resultatNetFCFA >= 0 ? 'Excédent (cumul)' : 'Déficit (cumul)',
      produits:  produitsPnl,
      totalProduitsTotal: caTotalFCFA,
      totalProduitsTonne: huileProduiteT ? Math.round(caTotalFCFA / huileProduiteT) : 0,
      coutMP:    coutMPLine,
      margeBruteTotal:  margeBrute,
      margeBruteTonne:  huileProduiteT ? Math.round(margeBrute / huileProduiteT) : 0,
      margeBrutePct:    caTotalFCFA ? +((margeBrute / caTotalFCFA) * 100).toFixed(1) : 0,
      chargesExploitation: chargesExpPnl.sort((a, b) => a.total - b.total).slice(0, 10),
      totalChargesExpTotal: -chargesExplFCFA,
      totalChargesExpTonne: huileProduiteT ? -Math.round(chargesExplFCFA / huileProduiteT) : 0,
      ebitdaTotal:  ebitda,
      ebitdaTonne:  huileProduiteT ? Math.round(ebitda / huileProduiteT) : 0,
      ebitdaPct:    caTotalFCFA ? +((ebitda / caTotalFCFA) * 100).toFixed(1) : 0,
      impotsTaxes:  impotsTaxesPnl,
      totalImpotsTaxesTotal: -totalTaxesExpl,
      totalImpotsTaxesTonne: huileProduiteT ? -Math.round(totalTaxesExpl / huileProduiteT) : 0,
      resultatExplTotal:  resultatExplFCFA,
      resultatExplTonne:  huileProduiteT ? Math.round(resultatExplFCFA / huileProduiteT) : 0,
      resultatExplPct:    caTotalFCFA ? +((resultatExplFCFA / caTotalFCFA) * 100).toFixed(1) : 0,
      amortissements:  amortissementsPnl,
      totalAmortTotal: -amortissementFCFA,
      totalAmortTonne: huileProduiteT ? -Math.round(amortissementFCFA / huileProduiteT) : 0,
      bic:           bicPnl,
      totalBICTotal: bicPnl.reduce((s, b) => s + b.total, 0),
      resultatTotal:  resultatNetFCFA,
      resultatTonne:  huileProduiteT ? Math.round(resultatNetFCFA / huileProduiteT) : 0,
      notes: [
        { label: 'Marge brute',       value: `${caTotalFCFA ? ((margeBrute / caTotalFCFA) * 100).toFixed(1) : 0}%`,         color: 'gold' },
        { label: 'EBITDA',            value: `${caTotalFCFA ? ((ebitda / caTotalFCFA) * 100).toFixed(1) : 0}%`,             color: 'gold' },
        { label: 'Résultat exploit.', value: `${caTotalFCFA ? ((resultatExplFCFA / caTotalFCFA) * 100).toFixed(1) : 0}%`,   color: resultatExplFCFA >= 0 ? 'gold' : 'red' },
        { label: 'Marge nette',       value: `${margeNette}%`,                                                      color: resultatNetFCFA >= 0 ? 'green' : 'red' },
      ],
    },
    alertes: [],
    charts: { caMix, charges: chargesC },
    production: {
      grainesDailyLabels: dailyKg.labels,
      grainesDailyKg:     dailyKg.vals,
      teDailyLabels:      dailyTE.labels,
      teDailyVals:        dailyTE.vals,
      stockHuileKg,
      tankCapaciteKg,
      comparAnnuelLabels: ['Rég. Reçus (T)', 'Rég. Traités (T)', 'Huile Prod. (T)', 'Vente Huile (T)'],
      comparAnnuel,
      qualite: { ffaRate: null, humidite: null, impuretes: null },
    },
    revenus: {
      produits: revenusProduits,
      blanc: { caFCFA: blancCA, poidsT: blancT, grainesT: blancGrT, prixMoyKg: blancPrixMoy },
      noir:  { caFCFA: noirCA,  poidsT: noirT,  grainesT: noirGrT,  prixMoyKg: noirPrixMoy  },
      caJoursLabels:  dailyCA.labels,
      caJoursVals:    dailyCA.vals,
      caJoursPoidsT:  dailyTon.vals,
      caJoursSarciOk: dailySarci,
      caJoursBlanc:   dailyBlanc.vals,
      caJoursNoir:    dailyNoir.vals,
    },
    charges: { topDepenses },
    fournisseurs: {
      totalPoidsKg: fournisseursListe.reduce((s, f) => s + f.poids, 0),
      liste:        fournisseursListe,
    },
    pepiniere: { clients: [] },
  }
}

/**
 * Filtre les mois selon une plage {from, to} (mois inclus).
 * from/to = numéro de mois (1-12) ou null = pas de borne.
 */
export function filterMonthsByRange(monthArr, range) {
  if (!range || (range.from == null && range.to == null)) return monthArr
  const moisIndex = (libelle) => ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'].indexOf((libelle || '').toLowerCase()) + 1
  return monthArr.filter(({ data }) => {
    const mi = moisIndex(data._etl.mois)
    if (range.from != null && mi < range.from) return false
    if (range.to   != null && mi > range.to)   return false
    return true
  })
}
