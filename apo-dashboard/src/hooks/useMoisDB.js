/**
 * useMoisDB — charge dynamiquement les mois disponibles depuis Supabase.
 * Sources de coûts : caisse_apo + caisse_apo2 + banque_apo
 * Section III (charges exploitation)  : caisse + banque opérationnels
 * Section IV  (amort. & chgs fin.)    : banque amortissement + frais_bancaires
 */

import { useState, useEffect } from 'react'
import { supabase } from '../db/supabase'
import { useAuth } from '../contexts/AuthContext'
import { STATIC_PROD_DAILY } from '../data/staticProdDaily'
// ── Labels d'affichage (nomenclature OHADA — compte de résultat APO) ──────────
export const CAT_LABELS = {
  fournitures_usine:   "Fournitures de l'usine et des bureaux",
  frais_transport:     'Frais de transport',
  services_ext:        'Services extérieurs',
  autres_services_ext: 'Autres services extérieurs',
  autres_charges:      'Autres charges',
  charges_personnel:   'Charges de personnel',
  // Inchangés (sections séparées)
  taxes_fiscales:      'Impôts et taxes',
  frais_bancaires:     'Frais bancaires',
  amortissement:       'Dotations aux amortissements',
}

// Catégories qui vont en Section IV (non opérationnelles)
const CATS_FINANCIERES = new Set(['amortissement', 'frais_bancaires'])

// Mapping catégorie → section OHADA
// Couvre les catégories caisse_apo/caisse_apo2 ET banque_apo
const CAT_TO_SECTION = {
  // caisse_apo / caisse_apo2
  fournitures_usine:   '60',
  frais_transport:     '61',
  services_ext:        '62',
  autres_services_ext: '63',
  autres_charges:      '65',
  charges_personnel:   '66',
  // banque_apo — catégories propres
  materiels:           '60',  // achats matériels, pièces, équipements
  electricite:         '60',  // énergie, fournitures électriques
  eau_fournitures:     '60',  // eau, fournitures diverses
  construction:        '60',  // matériaux construction
  entretien:           '62',  // maintenance, réparations
  assurance:           '62',  // assurances
  vehicules:           '61',  // transport, véhicules
  securite:            '63',  // gardiennage, sécurité
  salaires:            '66',  // charges de personnel
  charges_patronales:  '66',  // cotisations patronales
  frais_relat:         '65',  // relations publiques, frais relationnels
  frais_admin:         '63',  // frais administratifs divers
}

/**
 * Parse le libellé d'une ligne taxes_fiscales → label lisible P&L
 */
function parseTaxLabel(libelle) {
  const l = (libelle || '').toUpperCase()
  if ((l.includes('ITS') || l.includes('FDFP') || l.includes('RIBIC') || l.includes('FIRCA')) &&
      (l.includes('FDFP') || l.includes('RIBIC') || l.includes('FIRCA')))
    return 'ITS / FDFP / RIBIC / FIRCA'
  if (l.includes('TSE'))                                  return 'TSE (Taxe solidarité emplois)'
  if (l.includes('FONCIER'))                              return 'Impôt foncier'
  if (l.includes('PATENTE'))                              return 'Patente professionnelle'
  if (l.includes('BIC'))                                  return 'BIC (acompte trimestriel)'
  if (l.includes('DOMAINE FLUVIAL') || l.includes('AFFAIRES MARITIMES')) return 'Redevance domaine fluvial'
  if (l.includes('PENAL'))                                return 'Pénalités fiscales'
  if (l.includes('REGUL'))                                return 'ITS Régularisation'
  return libelle
}

/**
 * Catégorise un libellé de caisse en clé DB (fallback si categorie non renseignée).
 */
function categorizeLibelle(libelle = '') {
  const l = libelle.toUpperCase()

  if (/SALAIRE|PAIE DU|PAIE DES|PAIE JOUR|PRIME POUR|PRIME DE PRODUCTION|PRIME MOIS|AVANCE SUR SALAIRE|JOUR FERIER|TRAVAILLEURS TEMPORAIRE|PESONNEL JOUR|CNPS|CMU/.test(l))
    return 'charges_personnel'
  if (/CARBURANT|GASOIL|GAZOIL|ESSENCE|ELECTRICIT|CIE|ACHAT EAU|EAU POUR|FOURNITURES|ACHAT DIVERS|ENCRE|FILTRE A EAU|MATERIELS MECANIQUE|MATERIEL MECANIQUE|SOUDURE|CHAUDIERE|ORDINATEUR|INFORMATIQUE|BUREAU.ARMOIRE|MATERIEL ET EQUIPEMENT|REFRIGERATEUR|SPLIT|FRIGO|STARLINK|CABLE.*CABLAGE|CIMENT|GRAVIER|SABLE|FORAGE|DALLE|BRIQUES|CONTRE PLAQUE|BASSIN LAGUNAGE|TUYAUX|CONSTRUCTION|GARAGE ENGIN|BUREAU ANNEXE|CERTIFICAT FONCIER|TERRAIN|LEGALISATION/.test(l))
    return 'fournitures_usine'
  if (/^ACHAT/.test(l))
    return 'fournitures_usine'
  if (/VEHICULE|BULDOZER|BULL|PORTE.CHAR|VISITE TECHNIQUE|BILLET AVION|LAVAGE PICK|LOCATION CAMION|FRAIS DE TRANSPORT|TRANSPORT FOURNISSEUR|ACHAT DE MOTO|AFFAIRES MARITIMES|NIVELEUSE|DEPOT DE RAFFE/.test(l))
    return 'frais_transport'
  if (/REPARATION|REAPARATION|ENTRETIEN|REBOBINAGE|RECHARGEMENT BOUTEILLE|DEPANNAGE|DETRATAGE|NETTOYAGE|TEFLON|FABRICATION|CERVEAU DE FREIN|TAMPON POUR BENNE|DECANTEUR|FLEXIBLE POUR CHARGEUSE|PIECES DE RECHANGE|FILTRE|ASSURANCE/.test(l))
    return 'services_ext'
  if (/MAIN D.O|MAIN DO|MAIN DOEUVRE|ACOMPTE SUR MAIN|SOLDE MAIN|REBOBINEUR|TOURNEUR|MACONNERIE|VITRIER|SECURIT|GARDIEN|VISA|JURIDIQUE|MEDICAUX|PRET|PRÊT|FRAIS DIVERS|MISSION|HEBERGEMENT/.test(l))
    return 'autres_services_ext'
  if (/BAKCHICH|BACKCHICH|BAKHCHICH|FRAIS RELATIONNEL|AIDE FINANCIERE|DON POUR|MOBILE MONEY|RELATIONNEL|ASSISTANCE FUNEBRE|TEE.SHORT|POLOS/.test(l))
    return 'autres_charges'
  return 'autres_services_ext'
}

// Tous les mois sont maintenant servis depuis Supabase — STATIC_KEYS vide
const STATIC_KEYS = new Set()

const ACCENTS = [
  { accent: 'var(--gold)',   rgba: 'rgba(242,140,40,' },
  { accent: 'var(--green)',  rgba: 'rgba(63,163,77,'  },
  { accent: 'var(--accent)', rgba: 'rgba(107,201,122,' },
  { accent: 'var(--blue)',   rgba: 'rgba(88,166,255,'  },
  { accent: 'var(--gold)',   rgba: 'rgba(242,140,40,' },
  { accent: 'var(--green)',  rgba: 'rgba(63,163,77,'  },
  { accent: 'var(--accent)', rgba: 'rgba(107,201,122,' },
  { accent: 'var(--blue)',   rgba: 'rgba(88,166,255,'  },
  { accent: 'var(--gold)',   rgba: 'rgba(242,140,40,' },
  { accent: 'var(--green)',  rgba: 'rgba(63,163,77,'  },
  { accent: 'var(--accent)', rgba: 'rgba(107,201,122,' },
  { accent: 'var(--blue)',   rgba: 'rgba(88,166,255,'  },
]

const MOIS_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

/**
 * Convertit les lignes Supabase en objet `data` compatible avec les composants React.
 * @param {object}   kpis              - ligne kpis_mensuels
 * @param {object}   periode           - ligne periodes jointe
 * @param {array}    prodJour          - production_journaliere
 * @param {array}    ventesHuile       - ventes_huile
 * @param {array}    caisseRows        - caisse_apo + caisse_apo2 (débits filtrés)
 * @param {array}    topFournisseurs
 * @param {array}    amortRows         - amortissement_bancaire (table dédiée)
 * @param {array}    banqueRows        - banque_apo (SGCI + BDA, toutes catégories)
 * @param {number}   tankCapaciteKg
 * @param {array}    achatsRegimesRaw  - achats_regimes (date_achat, prix_kg, poids_kg)
 */
function buildData(kpis, periode, prodJour, ventesHuile, caisseRows, topFournisseurs, amortRows, banqueRows, tankCapaciteKg = 1_300_000, achatsRegimesRaw = []) {
  const huileProduiteT = Math.round((kpis.huile_produite_kg  || 0) / 1000)
  const huileVendueT   = Math.round((kpis.huile_vendue_kg    || 0) / 1000)
  const regRecusT      = Math.round((kpis.regimes_recus_kg   || 0) / 1000)
  const regTraitesT    = Math.round((kpis.regimes_traites_kg || 0) / 1000)
  const stockFinT      = Math.round((kpis.stock_fin_mois_kg  || 0) / 1000)
  const palmisteProdT  = Math.round((kpis.palmiste_produit_kg|| 0) / 1000)
  const palmisteVendT  = Math.round((kpis.palmiste_vendu_kg  || 0) / 1000)

  const caTotal     = kpis.ca_total_fcfa       || 0
  const caHuile     = kpis.ca_huile_fcfa       || 0
  const caPalmiste  = kpis.ca_palmiste_fcfa    || 0
  const caFlorentin = kpis.ca_florentin_fcfa   || 0
  const caBassin    = kpis.ca_bassin_fcfa      || 0
  const coutMP      = kpis.cout_mp_fcfa        || 0
  const prixHuile   = kpis.prix_moyen_huile_kg || 0
  const prixRegime  = kpis.prix_moyen_regime_kg|| 0
  const te          = (kpis.taux_extraction    || 0) * 100

  // ── Charges caisse (opérationnelles) ─────────────────────────────────────
  const parCat = {}
  for (const r of (caisseRows || [])) {
    const cat = r.categorie || categorizeLibelle(r.libelle || '')
    parCat[cat] = (parCat[cat] || 0) + (r.credit_fcfa || 0)
  }

  // ── Charges banque — séparées selon type ─────────────────────────────────
  // operational → Section III  |  amortissement + frais_bancaires → Section IV
  // taxes_fiscales → Section III mais chaque ligne individuelle (pas agrégée)
  const banqueOp      = {}   // catégorie → montant (opérationnels, hors taxes)
  const banqueAmort   = []   // rows catégorie='amortissement'
  const banqueFraisFin= []   // rows catégorie='frais_bancaires'
  const taxByLabel    = {}   // label parsé → montant (taxes individualisées)

  for (const r of (banqueRows || [])) {
    const cat = r.categorie || 'frais_admin'
    const mt  = r.montant_fcfa || 0
    if (cat === 'amortissement') {
      banqueAmort.push(r)
    } else if (cat === 'frais_bancaires') {
      banqueFraisFin.push(r)
    } else if (cat === 'taxes_fiscales') {
      const label = parseTaxLabel(r.libelle)
      taxByLabel[label] = (taxByLabel[label] || 0) + mt
    } else {
      banqueOp[cat] = (banqueOp[cat] || 0) + mt
    }
  }

  // Fusion caisse + banque opérationnelle par catégorie
  for (const [cat, mt] of Object.entries(banqueOp)) {
    parCat[cat] = (parCat[cat] || 0) + mt
  }

  // BIC séparé (impôt sur bénéfices — après résultat d'exploitation)
  const BIC_LABEL = 'BIC (acompte trimestriel)'
  const bicMt     = taxByLabel[BIC_LABEL] || 0
  const taxesExpl = Object.entries(taxByLabel).filter(([l]) => l !== BIC_LABEL)
  const totalTaxesExpl = taxesExpl.reduce((s, [, v]) => s + v, 0)

  const charges = Object.values(parCat).reduce((s, v) => s + v, 0)

  // ── Amortissement (Section IV — source: banque_apo en priorité) ───────────
  const amortFromBanque = banqueAmort.reduce((s, r) => s + (r.montant_fcfa || 0), 0)
  const amortFromTable  = (amortRows  || []).reduce((s, r) => s + (r.montant_fcfa || 0), 0)
  const amort           = amortFromBanque || amortFromTable || (kpis.amortissement_fcfa || 0)

  // ── Frais financiers banque (agios, etc.) ─────────────────────────────────
  const fraisFin = banqueFraisFin.reduce((s, r) => s + (r.montant_fcfa || 0), 0)

  // ── Résultats ─────────────────────────────────────────────────────────────
  const margeBrute    = caTotal - coutMP
  const ebitda        = margeBrute - charges
  const resultatExpl  = ebitda - totalTaxesExpl
  const resultat      = resultatExpl - amort - fraisFin - bicMt

  // ── Top dépenses (caisse + banque opérationnelle, hors taxes) ──────────────
  const topDepenses = Object.entries(parCat)
    .map(([cat, mt]) => ({ lib: CAT_LABELS[cat] || cat, cat, mt, date: '' }))
    .sort((a, b) => b.mt - a.mt)

  // ── Détails par catégorie — lignes individuelles (Feature 3) ──────────────
  const detailsParCat = {}
  for (const r of (caisseRows || [])) {
    const cat = r.categorie || categorizeLibelle(r.libelle || '')
    if (!detailsParCat[cat]) detailsParCat[cat] = []
    detailsParCat[cat].push({
      lib:  r.libelle        || '',
      date: r.date_mouvement || '',
      mt:   r.credit_fcfa    || 0,
    })
  }
  for (const cat of Object.keys(detailsParCat)) {
    detailsParCat[cat].sort((a, b) => b.mt - a.mt)
  }

  // ── Décaissements par jour — heatmap (Feature 4) ──────────────────────────
  const validMonthPrefix = `${periode.annee}-${String(periode.mois).padStart(2, '0')}-`
  const decaissementsParJour = {}
  const depensesParJour = {}
  for (const r of (caisseRows || [])) {
    if (!r.date_mouvement) continue
    const dk = r.date_mouvement.slice(0, 10)
    if (!dk.startsWith(validMonthPrefix)) continue
    decaissementsParJour[dk] = (decaissementsParJour[dk] || 0) + (r.credit_fcfa || 0)
    if (!depensesParJour[dk]) depensesParJour[dk] = []
    depensesParJour[dk].push({
      lib: r.libelle || '',
      mt:  r.credit_fcfa || 0,
      cat: r.categorie || categorizeLibelle(r.libelle || ''),
    })
  }
  for (const dk of Object.keys(depensesParJour)) {
    depensesParJour[dk].sort((a, b) => b.mt - a.mt)
  }

  // ── Graphiques journaliers ────────────────────────────────────────────────
  // Fallback statique pour les mois antérieurs où production_journaliere est vide
  const staticKey      = `${periode.annee}-${periode.mois}`
  const staticFallback = STATIC_PROD_DAILY[staticKey]
  const useFallback    = prodJour.length === 0 && staticFallback

  let grainesDailyLabels, grainesDailyKg, teDailyLabels, teDailyVals, stockHuileKg
  if (useFallback) {
    grainesDailyLabels = staticFallback.grainesDailyLabels
    grainesDailyKg     = staticFallback.grainesDailyKg
    teDailyLabels      = staticFallback.teDailyLabels
    teDailyVals        = staticFallback.teDailyVals.map(v => v.toFixed(2))
    stockHuileKg       = staticFallback.stockHuileKg ?? 0
  } else {
    grainesDailyLabels = prodJour.map(r => r.date_production?.slice(8, 10))
    grainesDailyKg     = prodJour.map(r => r.regime_recu_kg || 0)
    teDailyLabels      = prodJour.map(r => r.date_production?.slice(8, 10))
    teDailyVals        = prodJour.map(r => ((r.taux_extraction || 0) * 100).toFixed(2))
    // Stock huile : dernière ligne avec stock renseigné (≠ 0)
    const lastProdJourAvecStock = [...prodJour].reverse().find(r => (r.stock_huile_kg || 0) > 0)
    stockHuileKg = lastProdJourAvecStock?.stock_huile_kg || 0
  }
  const TANK_CAPACITE_KG = tankCapaciteKg

  // ── Blanc / Noir split ────────────────────────────────────────────────────
  const ventesHuileBloc = { blanc: [], noir: [] }
  for (const r of ventesHuile) {
    const c = r.circuit === 'blanc' ? 'blanc' : 'noir'
    ventesHuileBloc[c].push(r)
  }
  const calcCA = rows => rows.reduce((s, r) => {
    const p = r.poids_sarci_kg > 0 ? r.poids_sarci_kg : r.poids_apo_kg
    return s + p * (r.prix_kg || 0)
  }, 0)
  const calcPoidsT = rows => rows.reduce((s, r) => s + (r.poids_apo_kg || 0), 0) / 1000

  const caHuileBlancFCFA = calcCA(ventesHuileBloc.blanc)
  const caHuileNoirFCFA  = calcCA(ventesHuileBloc.noir)
  const poidsHuileBlancT = calcPoidsT(ventesHuileBloc.blanc)
  const poidsHuileNoirT  = calcPoidsT(ventesHuileBloc.noir)

  // Graines correspondantes (via TE) : blanc_graines = huile_blanc / TE
  const teRatio         = te > 0 ? te / 100 : 0
  const grainesBlancT   = teRatio > 0 ? +(poidsHuileBlancT / teRatio).toFixed(1) : 0
  const grainesNoirT    = teRatio > 0 ? +(poidsHuileNoirT  / teRatio).toFixed(1) : 0
  const prixMoyBlancKg  = ventesHuileBloc.blanc.length
    ? ventesHuileBloc.blanc.reduce((s, r) => s + (r.prix_kg || 0), 0) / ventesHuileBloc.blanc.length
    : 0
  const prixMoyNoirKg   = ventesHuileBloc.noir.length
    ? ventesHuileBloc.noir.reduce((s, r) => s + (r.prix_kg || 0), 0) / ventesHuileBloc.noir.length
    : 0

  // CA journalier : agrégat par jour avec suivi confirmation SARCI
  const joursData = {}
  for (const r of ventesHuile) {
    const d = r.date_vente || ''
    if (!joursData[d]) joursData[d] = { ca: 0, poidsApo: 0, sarciOk: true, blanc: 0, noir: 0 }
    const poidsApo   = r.poids_apo_kg   || 0
    const poidsSarci = r.poids_sarci_kg || 0
    const prix       = r.prix_kg        || 0
    const sarciConfirme = poidsSarci > 0
    const caLigne = sarciConfirme ? poidsSarci * prix : poidsApo * prix
    joursData[d].ca       += caLigne
    joursData[d].poidsApo += poidsApo
    if (!sarciConfirme) joursData[d].sarciOk = false
    if (r.circuit === 'blanc') joursData[d].blanc += caLigne
    else                       joursData[d].noir  += caLigne
  }
  const caJoursSorted  = Object.keys(joursData).sort()
  const caJoursLabels  = caJoursSorted.map(d => d.slice(8, 10))
  const caJoursVals    = caJoursSorted.map(d => joursData[d].ca)
  const caJoursPoidsT  = caJoursSorted.map(d => joursData[d].poidsApo / 1000)
  const caJoursSarciOk = caJoursSorted.map(d => joursData[d].sarciOk)
  const caJoursBlanc   = caJoursSorted.map(d => joursData[d].blanc)
  const caJoursNoir    = caJoursSorted.map(d => joursData[d].noir)

  // ── Prix & Marge journaliers ─────────────────────────────────────────────
  const achatJoursMap = {}
  for (const r of (achatsRegimesRaw || [])) {
    const d = r.date_achat || ''
    if (!d) continue
    if (!achatJoursMap[d]) achatJoursMap[d] = { prixSum: 0, poidsSum: 0 }
    const p = r.poids_kg || 0
    achatJoursMap[d].prixSum  += (r.prix_kg || 0) * p
    achatJoursMap[d].poidsSum += p
  }
  const cpoJoursMap = {}
  for (const r of ventesHuile) {
    const d = r.date_vente || ''
    if (!d) continue
    if (!cpoJoursMap[d]) cpoJoursMap[d] = { prixSum: 0, poidsSum: 0 }
    const p = r.poids_apo_kg || 0
    cpoJoursMap[d].prixSum  += (r.prix_kg || 0) * p
    cpoJoursMap[d].poidsSum += p
  }
  const teJourMap = {}
  for (const r of prodJour) {
    const d = r.date_production || ''
    if (d) teJourMap[d] = r.taux_extraction || 0
  }
  // Tous les jours du mois → axe X complet du 01 au dernier jour
  const monthPrefix    = `${periode.annee}-${String(periode.mois).padStart(2, '0')}-`
  const daysInMonth    = new Date(periode.annee, periode.mois, 0).getDate()
  const allPrixDates   = Array.from({ length: daysInMonth }, (_, i) =>
    `${monthPrefix}${String(i + 1).padStart(2, '0')}`
  )
  const prixDailyLabels  = allPrixDates.map(d => d.slice(8, 10))
  const prixDailyCPO     = allPrixDates.map(d => {
    const j = cpoJoursMap[d]
    return j && j.poidsSum > 0 ? +(j.prixSum / j.poidsSum).toFixed(0) : null
  })
  const prixDailyRegimes = allPrixDates.map(d => {
    const j = achatJoursMap[d]
    return j && j.poidsSum > 0 ? +(j.prixSum / j.poidsSum).toFixed(0) : null
  })
  const teRatioFallback = te / 100
  const margeDailyKg = allPrixDates.map((d, i) => {
    const pCPO = prixDailyCPO[i]
    const pReg = prixDailyRegimes[i]
    const teJour = teJourMap[d] || teRatioFallback
    if (pCPO === null || pReg === null) return null
    return +(pCPO * teJour - pReg).toFixed(1)
  })
  // En F/T huile pour le graphique Revenu & Rentabilité/Tonne
  const prixCPOTDaily = allPrixDates.map((_, i) =>
    prixDailyCPO[i] !== null ? Math.round(prixDailyCPO[i] * 1000) : null
  )
  const coutMPTDaily = allPrixDates.map((d, i) => {
    const pReg  = prixDailyRegimes[i]
    const teJour = teJourMap[d] || teRatioFallback
    if (pReg === null || teJour <= 0) return null
    // Coût régimes pour produire 1T huile = prixRégime/kg ÷ TE × 1000
    return Math.round(pReg / teJour * 1000)
  })
  const margeTDaily = allPrixDates.map((d, i) => {
    const pCPO  = prixDailyCPO[i]
    const pReg  = prixDailyRegimes[i]
    const teJour = teJourMap[d] || teRatioFallback
    if (pCPO === null || pReg === null || teJour <= 0) return null
    return Math.round((pCPO - pReg / teJour) * 1000)
  })

  // ── Top fournisseurs ──────────────────────────────────────────────────────
  const fournisseursItems = topFournisseurs.map(r => ({
    name:      r.nom || r.reference,
    poids:     r.poids_total_kg     || 0,
    prix:      Math.round(r.prix_moyen_kg   || 0),
    montant:   r.montant_total_fcfa || 0,
    nbCamions: r.nb_camions         || 0,
  }))

  // ── Section IV — amortissements ───────────────────────────────────────────
  // Source prioritaire : banque_apo (catégorie='amortissement')
  // Fallback : amortissement_bancaire table → simple row
  let amortissementsSection
  if (banqueAmort.length > 0) {
    // Agréger par libellé épuré (une ligne par échéance)
    amortissementsSection = [
      {
        label:    'Amortissement prêt bancaire (SGCI)',
        pertonne: huileProduiteT ? Math.round(amortFromBanque / huileProduiteT) : 0,
        total:    -amortFromBanque,
      },
    ]
  } else if (amortRows && amortRows.length > 0) {
    amortissementsSection = amortRows.map(r => ({
      label:    r.libelle || 'Amortissement prêt bancaire',
      pertonne: huileProduiteT ? Math.round((r.montant_fcfa || 0) / huileProduiteT) : 0,
      total:    -(r.montant_fcfa || 0),
    }))
  } else if (amort > 0) {
    amortissementsSection = [
      { label: 'Amortissement prêt bancaire', pertonne: huileProduiteT ? Math.round(amort / huileProduiteT) : 0, total: -amort },
    ]
  } else {
    amortissementsSection = []
  }

  // Ajouter les frais financiers banque (agios, frais de tenue, etc.)
  if (fraisFin > 0) {
    amortissementsSection.push({
      label:    'Agios & frais financiers (SGCI/BDA)',
      pertonne: huileProduiteT ? Math.round(fraisFin / huileProduiteT) : 0,
      total:    -fraisFin,
    })
  }

  const totalAmortFin = amort + fraisFin

  return {
    _etl: {
      mois:   periode.libelle,
      annee:  periode.annee,
      source: 'supabase',
    },
    kpis: {
      caTotalFCFA:          caTotal,
      caHuileFCFA:          caHuile,
      caHuileBlancFCFA:     caHuileBlancFCFA,
      caHuileNoirFCFA:      caHuileNoirFCFA,
      caHuileDetail:        `${prixHuile.toFixed(0)} F/kg × ${huileVendueT} T livrées`,
      caNoisFCFA:           caPalmiste,
      caHuileFlorentinFCFA: caFlorentin,
      caBassinFCFA:         caBassin,
      coutMPFCFA:           coutMP,
      coutMPDetail:         `${prixRegime.toFixed(2)} F/kg × ${huileVendueT ? Math.round(huileVendueT / (te / 100)) : regTraitesT} T (graines/huile vendue)`,
      chargesExplFCFA:      charges,
      totalTaxesFCFA:       totalTaxesExpl + bicMt,
      amortissementFCFA:    totalAmortFin,
      resultatExplFCFA:     resultatExpl,
      resultatNetFCFA:      resultat,
      margeNette:           caTotal ? +((resultat / caTotal) * 100).toFixed(1) : 0,
      revenuNetParTonne:    huileProduiteT > 0 ? Math.round(resultat / huileProduiteT) : 0,
      regimesRecusT:        regRecusT,
      regimesTraitesT:      regTraitesT,
      stockFinMoisT:        stockFinT,
      stockFinMoisFCFA:     stockFinT * (prixRegime || 0),
      huileProduiteT,
      huileVendueT,
      tauxExtraction:       +te.toFixed(2),
      nbCamions:            kpis.nb_camions || 0,
      prixMoyenHuileKg:     prixHuile,
      prixMoyenRegimeKg:    prixRegime,
      palmisteProduitT:     palmisteProdT,
      palmisteVenduT:       palmisteVendT,
      pepContratsFCFA:      kpis.pepiniere_contrats_fcfa || 0,
      pepEncaisséFCFA:      kpis.pepiniere_encaisse_fcfa || 0,
      pepResteaFCFA:        kpis.pepiniere_restant_fcfa  || 0,
    },
    pnl: {
      baseLabel: `${huileProduiteT} tonnes d'huile produites`,
      status:    resultat >= 0 ? 'Excédent Mensuel' : 'Déficit Mensuel',

      // ── I. CA ──────────────────────────────────────────────────────────────
      produits: [
        ...(caHuileBlancFCFA > 0 ? [{ label: `↳ BLANC — chèque SARCI (${prixMoyBlancKg.toFixed(0)} F/kg × ${poidsHuileBlancT.toFixed(1)} T)`, pertonne: huileProduiteT ? Math.round(caHuileBlancFCFA / huileProduiteT) : 0, total: caHuileBlancFCFA, circuit: 'blanc' }] : []),
        ...(caHuileNoirFCFA  > 0 ? [{ label: `↳ NOIR  — autres règlements (${prixMoyNoirKg.toFixed(0)} F/kg × ${poidsHuileNoirT.toFixed(1)} T)`,  pertonne: huileProduiteT ? Math.round(caHuileNoirFCFA  / huileProduiteT) : 0, total: caHuileNoirFCFA,  circuit: 'noir'  }] : []),
        { label: `Noix de palmiste (60 F/kg × ${palmisteVendT} T)`,  pertonne: huileProduiteT ? Math.round(caPalmiste / huileProduiteT) : 0, total: caPalmiste },
        { label: 'Huile florentin',                                    pertonne: huileProduiteT ? Math.round(caFlorentin / huileProduiteT) : 0, total: caFlorentin },
        ...(caBassin > 0 ? [{ label: 'Huile bassin lagunage',         pertonne: huileProduiteT ? Math.round(caBassin / huileProduiteT) : 0,    total: caBassin }] : []),
      ],
      totalProduitsTotal: caTotal,
      totalProduitsTonne: huileProduiteT ? Math.round(caTotal / huileProduiteT) : 0,

      // ── II. COÛT MP ────────────────────────────────────────────────────────
      coutMP: {
        label:    `Graines/huile vendue (${prixRegime.toFixed(2)} F/kg × ${huileVendueT && te ? Math.round(huileVendueT / (te / 100)) : regTraitesT} T)`,
        pertonne: huileProduiteT ? Math.round(coutMP / huileProduiteT) : 0,
        total:    -coutMP,
        // Répartition BLANC / NOIR via TE
        blanc: grainesBlancT > 0 ? { label: `↳ BLANC — ${grainesBlancT.toFixed(0)} T régimes estimées`, pertonne: huileProduiteT ? Math.round((grainesBlancT * 1000 * prixRegime) / huileProduiteT) : 0, total: -(grainesBlancT * 1000 * prixRegime) } : null,
        noir:  grainesNoirT  > 0 ? { label: `↳ NOIR  — ${grainesNoirT.toFixed(0)} T régimes estimées`,  pertonne: huileProduiteT ? Math.round((grainesNoirT  * 1000 * prixRegime) / huileProduiteT) : 0, total: -(grainesNoirT  * 1000 * prixRegime) } : null,
      },
      margeBruteTotal:  margeBrute,
      margeBruteTonne:  huileProduiteT ? Math.round(margeBrute / huileProduiteT) : 0,
      margeBrutePct:    caTotal ? +((margeBrute / caTotal) * 100).toFixed(1) : 0,

      // ── III. CHARGES EXPLOITATION (caisse + banque opérationnelle, hors taxes)
      chargesExploitation: topDepenses.slice(0, 10).map(d => ({
        label:    d.lib,
        section:  CAT_TO_SECTION[d.cat] || '65',
        pertonne: huileProduiteT ? Math.round(d.mt / huileProduiteT) : 0,
        total:    -d.mt,
      })),
      totalChargesExpTotal: -charges,
      totalChargesExpTonne: huileProduiteT ? -Math.round(charges / huileProduiteT) : 0,

      // ── EBE / EBITDA (hors taxes, hors amort) ─────────────────────────────
      ebitdaTotal:  ebitda,
      ebitdaTonne:  huileProduiteT ? Math.round(ebitda / huileProduiteT) : 0,
      ebitdaPct:    caTotal ? +((ebitda / caTotal) * 100).toFixed(1) : 0,

      // ── IV. IMPÔTS & TAXES (hors IS/BIC) ──────────────────────────────────
      impotsTaxes: taxesExpl.map(([label, mt]) => ({
        label,
        pertonne: huileProduiteT ? Math.round(mt / huileProduiteT) : 0,
        total:    -mt,
      })),
      totalImpotsTaxesTotal: -totalTaxesExpl,
      totalImpotsTaxesTonne: huileProduiteT ? -Math.round(totalTaxesExpl / huileProduiteT) : 0,

      // ── RÉSULTAT D'EXPLOITATION ────────────────────────────────────────────
      resultatExplTotal:  resultatExpl,
      resultatExplTonne:  huileProduiteT ? Math.round(resultatExpl / huileProduiteT) : 0,
      resultatExplPct:    caTotal ? +((resultatExpl / caTotal) * 100).toFixed(1) : 0,

      // ── V. AMORTISSEMENTS & CHARGES FINANCIÈRES ────────────────────────────
      amortissements:  amortissementsSection,
      totalAmortTotal: -totalAmortFin,
      totalAmortTonne: huileProduiteT ? -Math.round(totalAmortFin / huileProduiteT) : 0,

      // ── VI. IMPÔT SUR BÉNÉFICES (BIC) ─────────────────────────────────────
      bic: bicMt > 0 ? [{ label: 'BIC — acompte trimestriel (25% bénéfice imposable)', pertonne: huileProduiteT ? Math.round(bicMt / huileProduiteT) : 0, total: -bicMt }] : [],
      totalBICTotal: -bicMt,

      // ── RÉSULTAT NET ───────────────────────────────────────────────────────
      resultatTotal:  resultat,
      resultatTonne:  huileProduiteT ? Math.round(resultat / huileProduiteT) : 0,

      notes: [
        { label: 'Marge brute',       value: `${caTotal ? ((margeBrute / caTotal) * 100).toFixed(1) : 0}%`,    color: 'gold' },
        { label: 'EBITDA',            value: `${caTotal ? ((ebitda / caTotal) * 100).toFixed(1) : 0}%`,        color: 'gold' },
        { label: 'Résultat exploit.', value: `${caTotal ? ((resultatExpl / caTotal) * 100).toFixed(1) : 0}%`, color: resultatExpl >= 0 ? 'gold' : 'red' },
        { label: 'Marge nette',       value: `${caTotal ? ((resultat / caTotal) * 100).toFixed(1) : 0}%`,      color: resultat >= 0 ? 'green' : 'red' },
      ],
    },
    alertes: [],
    charts: {
      caMix: {
        labels: ['Huile CPO', 'Palmiste', 'Florentin', 'Bassin'].filter((_, i) => [caHuile, caPalmiste, caFlorentin, caBassin][i] > 0),
        values: [caHuile, caPalmiste, caFlorentin, caBassin].filter(v => v > 0),
      },
      charges: {
        labels: topDepenses.slice(0, 8).map(d => d.lib),
        values: topDepenses.slice(0, 8).map(d => d.mt),
      },
    },
    production: {
      grainesDailyLabels,
      grainesDailyKg,
      teDailyLabels,
      teDailyVals,
      stockHuileKg,
      tankCapaciteKg: TANK_CAPACITE_KG,
      comparAnnuelLabels: ['Rég. Reçus (T)', 'Rég. Traités (T)', 'Huile Prod. (T)', 'Vente Huile (T)'],
      comparAnnuel: [
        ...(staticFallback?.comparAnnuel || []),
        { label: `${periode.libelle.slice(0,3)} ${periode.annee}`, values: [regRecusT, regTraitesT, huileProduiteT, huileVendueT] },
      ],
      qualite: { ffaRate: null, humidite: null, impuretes: null },
    },
    revenus: {
      produits: [
        { produit: 'Huile CPO — BLANC (chèque SARCI)', quantite: `${poidsHuileBlancT.toFixed(1)} T`, prixUnitaire: prixMoyBlancKg > 0 ? `${prixMoyBlancKg.toFixed(0)} F/kg` : '—', totalFCFA: caHuileBlancFCFA, circuit: 'blanc' },
        { produit: 'Huile CPO — NOIR (autres)',         quantite: `${poidsHuileNoirT.toFixed(1)} T`,  prixUnitaire: prixMoyNoirKg  > 0 ? `${prixMoyNoirKg.toFixed(0)} F/kg`  : '—', totalFCFA: caHuileNoirFCFA,  circuit: 'noir'  },
        { produit: 'Noix de Palmiste',                  quantite: `${palmisteVendT.toLocaleString('fr-FR')} T`, prixUnitaire: '60 F/kg', totalFCFA: caPalmiste },
        ...(caFlorentin > 0 ? [{ produit: 'Huile Florentin', quantite: '—', prixUnitaire: '—', totalFCFA: caFlorentin }] : []),
        ...(caBassin    > 0 ? [{ produit: 'Huile Bassin',    quantite: '—', prixUnitaire: '—', totalFCFA: caBassin    }] : []),
      ],
      blanc: { caFCFA: caHuileBlancFCFA, poidsT: poidsHuileBlancT, grainesT: grainesBlancT, prixMoyKg: prixMoyBlancKg },
      noir:  { caFCFA: caHuileNoirFCFA,  poidsT: poidsHuileNoirT,  grainesT: grainesNoirT,  prixMoyKg: prixMoyNoirKg  },
      caJoursLabels,
      caJoursVals,
      caJoursPoidsT,
      caJoursSarciOk,
      caJoursBlanc,
      caJoursNoir,
    },
    prixDaily: {
      labels:   prixDailyLabels,
      prixCPO:  prixDailyCPO,
      regimes:  prixDailyRegimes,
      marge:    margeDailyKg,
      prixCPOT: prixCPOTDaily,
      coutMPT:  coutMPTDaily,
      margeT:   margeTDaily,
    },
    charges: { topDepenses, detailsParCat, decaissementsParJour, depensesParJour },
    fournisseurs: {
      totalPoidsKg: fournisseursItems.reduce((s, f) => s + f.poids, 0),
      nbActifs:     fournisseursItems.length,
      liste:        fournisseursItems.slice(0, 10),   // top 10 pour les graphiques
      allListe:     fournisseursItems,                // tous pour les KPIs
    },
    pepiniere: { clients: [] },
  }
}

// ── Hook principal ────────────────────────────────────────────────────────────

export function useMoisDB() {
  const [moisData, setMoisData] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const { tenantId } = useAuth()

  useEffect(() => {
    if (!tenantId) return   // attendre que le tenant soit connu avant de fetcher

    async function fetchTout() {
      try {
        // 0. Charger la config tenant depuis Supabase
        const { data: configRow } = await supabase
          .from('tenant_config')
          .select('config')
          .eq('tenant_id', tenantId)
          .single()
        const tenantConfig    = configRow?.config || {}
        const tankCapaciteKg  = tenantConfig.tank_capacite_kg || 1_300_000
        const skipCaisse      = tenantConfig.skip_caisse      || ['TRANSFERT', 'VIREMENT', 'VERSEMENT', 'DEPOT', 'APPRO']
        const skipBanque      = tenantConfig.skip_banque      || ['APPRO CAISSE', 'COMPENSATION CHQ', 'VIREMENT', 'VERSEMENT', 'APPRO SARCI']

        const { data: kpisRows, error: e1 } = await supabase
          .from('kpis_mensuels')
          .select('*, periodes(id, annee, mois, libelle)')
          .order('periode_id')
        if (e1) throw e1

        const kpisFiltres = kpisRows.filter(r => {
          const key = MOIS_KEYS[(r.periodes?.mois ?? 1) - 1]
          return !STATIC_KEYS.has(key)
        })

        const resultats = await Promise.all(kpisFiltres.map(async (kpis) => {
          const periode   = kpis.periodes
          const periodeId = periode.id

          // Construction dynamique des filtres caisse depuis config
          const buildCaisseQuery = (table) => {
            let q = supabase.from(table)
              .select('libelle, credit_fcfa, categorie, date_mouvement')
              .eq('periode_id', periodeId)
              .gt('credit_fcfa', 0)
            for (const pattern of skipCaisse) {
              q = q.not('libelle', 'ilike', `${pattern}%`)
            }
            return q.then(r => r.data || [])
          }

          // Construction dynamique des filtres banque depuis config
          const buildBanqueQuery = () => {
            let q = supabase.from('banque_apo')
              .select('libelle, montant_fcfa, categorie')
              .eq('periode_id', periodeId)
            for (const pattern of skipBanque) {
              q = q.not('libelle', 'ilike', `%${pattern}%`)
            }
            return q.then(r => r.data || [])
          }

          const [prodJour, ventesHuile, caisseRows, topFournisseurs, amortRows, banqueRows, achatsRegimesRaw] =
            await Promise.all([

              supabase.from('production_journaliere')
                .select('date_production, regime_recu_kg, taux_extraction, stock_huile_kg')
                .eq('periode_id', periodeId)
                .order('date_production')
                .then(r => r.data || []),

              supabase.from('ventes_huile')
                .select('date_vente, montant_fcfa, poids_apo_kg, poids_sarci_kg, prix_kg, circuit')
                .eq('periode_id', periodeId)
                .order('date_vente')
                .then(r => r.data || []),

              // Caisse 1 + Caisse 2 — filtres depuis tenant_config
              Promise.all([
                buildCaisseQuery('caisse_apo'),
                buildCaisseQuery('caisse_apo2'),
              ]).then(([c1, c2]) => [...c1, ...c2]),

              supabase.from('vue_top_fournisseurs')
                .select('nom, reference, poids_total_kg, prix_moyen_kg, montant_total_fcfa, nb_camions')
                .eq('annee', periode.annee)
                .eq('mois', periode.mois)
                .order('montant_total_fcfa', { ascending: false })
                .then(r => r.data || []),

              // Table amortissement_bancaire (fallback si pas dans banque_apo)
              supabase.from('amortissement_bancaire')
                .select('libelle, montant_fcfa, type')
                .eq('periode_id', periodeId)
                .then(r => r.data || []),

              // Banque APO — filtres depuis tenant_config
              buildBanqueQuery(),

              supabase.from('achats_regimes')
                .select('date_achat, prix_kg, poids_kg')
                .eq('periode_id', periodeId)
                .order('date_achat')
                .then(r => r.data || []),
            ])

          const idx = (periode.mois - 1) % 12
          return {
            key:    MOIS_KEYS[periode.mois - 1],
            data:   buildData(kpis, periode, prodJour, ventesHuile, caisseRows, topFournisseurs, amortRows, banqueRows, tankCapaciteKg, achatsRegimesRaw),
            accent: ACCENTS[idx].accent,
            rgba:   ACCENTS[idx].rgba,
          }
        }))

        setMoisData(resultats)
      } catch (err) {
        console.error('useMoisDB error:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTout()
  }, [tenantId])

  return { moisData, loading, error }
}
