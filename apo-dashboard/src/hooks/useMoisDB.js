/**
 * useMoisDB — charge dynamiquement les mois disponibles depuis Supabase.
 * Sources de coûts : caisse_apo + caisse_apo2 + banque_apo
 * Section III (charges exploitation)  : caisse + banque opérationnels
 * Section IV  (amort. & chgs fin.)    : banque amortissement + frais_bancaires
 */

import { useState, useEffect } from 'react'
import { supabase } from '../db/supabase'
import { MONTH_DATA as MONTH_DATA_STATIC } from '../data/index'

// ── Labels d'affichage (caisse + banque) ─────────────────────────────────────
export const CAT_LABELS = {
  // Caisse (existants)
  salaires:           'Salaires & Primes',
  carburant:          'Carburant',
  main_oeuvre:        "Main d'œuvre ext.",
  entretien:          'Entretien & Réparation',
  construction:       'Construction & Travaux',
  vehicules:          'Véhicules & Transport',
  materiels:          'Matériels & Équipements',
  eau_fournitures:    'Eau & Fournitures',
  frais_relat:        'Relations institutionnelles',
  frais_admin:        'Frais administratifs',
  autre:              'Autres dépenses',
  // Banque (nouveaux)
  electricite:        'Électricité (CIE)',
  assurance:          'Assurances',
  securite:           'Sécurité & Gardiennage',
  charges_patronales: 'Charges patronales (CNPS/CMU)',
  taxes_fiscales:     'Taxes & Impôts',
  frais_bancaires:    'Frais & charges financières',
}

// Catégories qui vont en Section IV (non opérationnelles)
const CATS_FINANCIERES = new Set(['amortissement', 'frais_bancaires'])

/**
 * Catégorise un libellé de caisse en clé DB (fallback si categorie non renseignée).
 */
function categorizeLibelle(libelle = '') {
  const l = libelle.toUpperCase()

  if (/SALAIRE|PAIE DU|PAIE DES|PAIE JOUR|PRIME POUR|PRIME DE PRODUCTION|PRIME MOIS|AVANCE SUR SALAIRE|JOUR FERIER|TRAVAILLEURS TEMPORAIRE|PESONNEL JOUR/.test(l))
    return 'salaires'
  if (/CARBURANT|GASOIL|GAZOIL|ESSENCE/.test(l))
    return 'carburant'
  if (/MAIN D.O|MAIN DO|MAIN DOEUVRE|ACOMPTE SUR MAIN|SOLDE MAIN|REBOBINEUR|TOURNEUR|MACONNERIE|VITRIER/.test(l))
    return 'main_oeuvre'
  if (/REPARATION|REAPARATION|ENTRETIEN|REBOBINAGE|RECHARGEMENT BOUTEILLE|DEPANNAGE|DETRATAGE|NETTOYAGE|TEFLON|FABRICATION|CERVEAU DE FREIN|TAMPON POUR BENNE|DECANTEUR|FLEXIBLE POUR CHARGEUSE|PIECES DE RECHANGE|FILTRE/.test(l))
    return 'entretien'
  if (/CIMENT|GRAVIER|SABLE|FORAGE|DALLE|BRIQUES|CONTRE PLAQUE|BASSIN LAGUNAGE|TUYAUX|CONSTRUCTION|GARAGE ENGIN|BUREAU ANNEXE|CERTIFICAT FONCIER|TERRAIN|LEGALISATION/.test(l))
    return 'construction'
  if (/VEHICULE|BULDOZER|BULL|PORTE.CHAR|VISITE TECHNIQUE|TAXE|BILLET AVION|LAVAGE PICK|LOCATION CAMION|FRAIS DE TRANSPORT|TRANSPORT FOURNISSEUR|ACHAT DE MOTO|AFFAIRES MARITIMES|NIVELEUSE|DEPOT DE RAFFE/.test(l))
    return 'vehicules'
  if (/MATERIELS MECANIQUE|MATERIEL MECANIQUE|SOUDURE|CHAUDIERE|ORDINATEUR|INFORMATIQUE|BUREAU.ARMOIRE|MATERIEL ET EQUIPEMENT|REFRIGERATEUR|SPLIT|FRIGO|STARLINK|CABLE.*CABLAGE/.test(l))
    return 'materiels'
  if (/ACHAT EAU|EAU POUR|FOURNITURES|ACHAT DIVERS|ENCRE|FILTRE A EAU/.test(l))
    return 'eau_fournitures'
  if (/BAKCHICH|BACKCHICH|BAKHCHICH|FRAIS RELATIONNEL|AIDE FINANCIERE|DON POUR|MOBILE MONEY|RELATIONNEL|ASSISTANCE FUNEBRE|TEE.SHORT|POLOS/.test(l))
    return 'frais_relat'
  if (/VISA|JURIDIQUE|MEDICAUX|PRET|PRÊT|FRAIS DIVERS/.test(l))
    return 'frais_admin'
  if (/^ACHAT/.test(l))
    return 'materiels'
  return 'autre'
}

// Clés des mois déjà couverts par les fichiers statiques
const STATIC_KEYS = new Set(MONTH_DATA_STATIC.map(m => m.key))

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
 * @param {object}   kpis           - ligne kpis_mensuels
 * @param {object}   periode        - ligne periodes jointe
 * @param {array}    prodJour       - production_journaliere
 * @param {array}    ventesHuile    - ventes_huile
 * @param {array}    caisseRows     - caisse_apo + caisse_apo2 (débits filtrés)
 * @param {array}    topFournisseurs
 * @param {array}    amortRows      - amortissement_bancaire (table dédiée)
 * @param {array}    banqueRows     - banque_apo (SGCI + BDA, toutes catégories)
 */
function buildData(kpis, periode, prodJour, ventesHuile, caisseRows, topFournisseurs, amortRows, banqueRows) {
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
  const banqueOp     = {}   // catégorie → montant (opérationnels)
  const banqueAmort  = []   // rows catégorie='amortissement'
  const banqueFraisFin = [] // rows catégorie='frais_bancaires'

  for (const r of (banqueRows || [])) {
    const cat = r.categorie || 'frais_admin'
    const mt  = r.montant_fcfa || 0
    if (cat === 'amortissement') {
      banqueAmort.push(r)
    } else if (cat === 'frais_bancaires') {
      banqueFraisFin.push(r)
    } else {
      banqueOp[cat] = (banqueOp[cat] || 0) + mt
    }
  }

  // Fusion caisse + banque opérationnelle par catégorie
  for (const [cat, mt] of Object.entries(banqueOp)) {
    parCat[cat] = (parCat[cat] || 0) + mt
  }

  const charges = Object.values(parCat).reduce((s, v) => s + v, 0)

  // ── Amortissement (Section IV — source: banque_apo en priorité) ───────────
  const amortFromBanque = banqueAmort.reduce((s, r) => s + (r.montant_fcfa || 0), 0)
  const amortFromTable  = (amortRows  || []).reduce((s, r) => s + (r.montant_fcfa || 0), 0)
  const amort           = amortFromBanque || amortFromTable || (kpis.amortissement_fcfa || 0)

  // ── Frais financiers banque (agios, etc.) ─────────────────────────────────
  const fraisFin = banqueFraisFin.reduce((s, r) => s + (r.montant_fcfa || 0), 0)

  // ── Résultats ─────────────────────────────────────────────────────────────
  const margeBrute = caTotal - coutMP
  const ebitda     = margeBrute - charges
  const resultat   = ebitda - amort - fraisFin

  // ── Top dépenses (caisse + banque opérationnelle) ─────────────────────────
  const topDepenses = Object.entries(parCat)
    .map(([cat, mt]) => ({ lib: CAT_LABELS[cat] || cat, mt, date: '' }))
    .sort((a, b) => b.mt - a.mt)

  // ── Graphiques journaliers ────────────────────────────────────────────────
  const grainesDailyLabels = prodJour.map(r => r.date_production?.slice(8, 10))
  const grainesDailyKg     = prodJour.map(r => r.regime_recu_kg || 0)
  const teDailyLabels      = prodJour.map(r => r.date_production?.slice(8, 10))
  const teDailyVals        = prodJour.map(r => ((r.taux_extraction || 0) * 100).toFixed(2))

  const caParJour = {}
  for (const r of ventesHuile) {
    const d = r.date_vente || ''
    caParJour[d] = (caParJour[d] || 0) + (r.montant_fcfa || 0)
  }
  const caJoursLabels = Object.keys(caParJour).sort().map(d => d.slice(8, 10))
  const caJoursVals   = Object.keys(caParJour).sort().map(d => caParJour[d])

  // ── Top fournisseurs ──────────────────────────────────────────────────────
  const fournisseursItems = topFournisseurs.map(r => ({
    name:    r.nom || r.reference,
    poids:   r.poids_total_kg     || 0,
    prix:    Math.round(r.prix_moyen_kg   || 0),
    montant: r.montant_total_fcfa || 0,
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
      caHuileDetail:        `${prixHuile.toFixed(0)} F/kg × ${huileVendueT} T livrées`,
      caNoisFCFA:           caPalmiste,
      caHuileFlorentinFCFA: caFlorentin,
      caBassinFCFA:         caBassin,
      coutMPFCFA:           coutMP,
      coutMPDetail:         `${prixRegime.toFixed(2)} F/kg × ${regTraitesT} T traités`,
      chargesExplFCFA:      charges,
      amortissementFCFA:    totalAmortFin,
      resultatNetFCFA:      resultat,
      margeNette:           caTotal ? +((resultat / caTotal) * 100).toFixed(1) : 0,
      regimesRecusT:        regRecusT,
      regimesTraitesT:      regTraitesT,
      stockFinMoisT:        stockFinT,
      stockFinMoisFCFA:     stockFinT * (prixRegime || 0),
      huileProduiteT,
      huileVendueT,
      tauxExtraction:       +te.toFixed(2),
      nbCamions:            kpis.nb_camions || 0,
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
        { label: `Huile de palme CPO (${prixHuile.toFixed(0)} F/kg × ${huileVendueT} T)`, pertonne: huileProduiteT ? Math.round(caHuile / huileProduiteT) : 0, total: caHuile },
        { label: `Noix de palmiste (60 F/kg × ${palmisteVendT} T)`,                        pertonne: huileProduiteT ? Math.round(caPalmiste / huileProduiteT) : 0, total: caPalmiste },
        { label: 'Huile florentin',                                                         pertonne: huileProduiteT ? Math.round(caFlorentin / huileProduiteT) : 0, total: caFlorentin },
        ...(caBassin > 0 ? [{ label: 'Huile bassin lagunage', pertonne: huileProduiteT ? Math.round(caBassin / huileProduiteT) : 0, total: caBassin }] : []),
      ],
      totalProduitsTotal: caTotal,
      totalProduitsTonne: huileProduiteT ? Math.round(caTotal / huileProduiteT) : 0,

      // ── II. COÛT MP ────────────────────────────────────────────────────────
      coutMP: {
        label:    `Régimes traités (${prixRegime.toFixed(2)} F/kg × ${regTraitesT} T)`,
        pertonne: huileProduiteT ? Math.round(coutMP / huileProduiteT) : 0,
        total:    -coutMP,
      },
      margeBruteTotal:  margeBrute,
      margeBruteTonne:  huileProduiteT ? Math.round(margeBrute / huileProduiteT) : 0,
      margeBrutePct:    caTotal ? +((margeBrute / caTotal) * 100).toFixed(1) : 0,

      // ── III. CHARGES EXPLOITATION (caisse + banque opérationnelle) ─────────
      chargesExploitation: topDepenses.slice(0, 10).map(d => ({
        label:    d.lib,
        pertonne: huileProduiteT ? Math.round(d.mt / huileProduiteT) : 0,
        total:    -d.mt,
      })),
      totalChargesExpTotal: -charges,
      totalChargesExpTonne: huileProduiteT ? -Math.round(charges / huileProduiteT) : 0,

      // ── EBE / EBITDA ───────────────────────────────────────────────────────
      ebitdaTotal:  ebitda,
      ebitdaTonne:  huileProduiteT ? Math.round(ebitda / huileProduiteT) : 0,
      ebitdaPct:    caTotal ? +((ebitda / caTotal) * 100).toFixed(1) : 0,

      // ── IV. AMORTISSEMENTS & CHARGES FINANCIÈRES ───────────────────────────
      amortissements:  amortissementsSection,
      totalAmortTotal: -totalAmortFin,
      totalAmortTonne: huileProduiteT ? -Math.round(totalAmortFin / huileProduiteT) : 0,

      // ── RÉSULTAT NET ───────────────────────────────────────────────────────
      resultatTotal:  resultat,
      resultatTonne:  huileProduiteT ? Math.round(resultat / huileProduiteT) : 0,

      notes: [
        { label: 'Marge brute',  value: `${caTotal ? ((margeBrute / caTotal) * 100).toFixed(1) : 0}%`, color: 'gold' },
        { label: 'EBITDA',       value: `${caTotal ? ((ebitda / caTotal) * 100).toFixed(1) : 0}%`,     color: 'gold' },
        { label: 'Marge nette',  value: `${caTotal ? ((resultat / caTotal) * 100).toFixed(1) : 0}%`,   color: resultat >= 0 ? 'green' : 'red' },
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
      comparAnnuelLabels: ['Rég. Reçus (T)', 'Rég. Traités (T)', 'Huile Prod. (T)', 'Vente Huile (T)'],
      comparAnnuel: [{ label: `${periode.libelle} ${periode.annee}`, values: [regRecusT, regTraitesT, huileProduiteT, huileVendueT] }],
      qualite: { ffaRate: null, humidite: null, impuretes: null },
    },
    revenus: {
      produits: [
        { produit: 'Huile de Palme CPO', quantite: `${huileVendueT.toLocaleString('fr-FR')} T`,  prixUnitaire: `${prixHuile.toFixed(0)} F/kg`, totalFCFA: caHuile    },
        { produit: 'Noix de Palmiste',   quantite: `${palmisteVendT.toLocaleString('fr-FR')} T`, prixUnitaire: '60 F/kg',                      totalFCFA: caPalmiste },
        ...(caFlorentin > 0 ? [{ produit: 'Huile Florentin', quantite: '—', prixUnitaire: '—', totalFCFA: caFlorentin }] : []),
        ...(caBassin    > 0 ? [{ produit: 'Huile Bassin',    quantite: '—', prixUnitaire: '—', totalFCFA: caBassin    }] : []),
      ],
      caJoursLabels,
      caJoursVals,
    },
    charges: { topDepenses },
    fournisseurs: {
      totalPoidsKg: fournisseursItems.reduce((s, f) => s + f.poids, 0),
      liste:        fournisseursItems,
    },
    pepiniere: { clients: [] },
  }
}

// ── Hook principal ────────────────────────────────────────────────────────────

export function useMoisDB() {
  const [moisData, setMoisData] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    async function fetchTout() {
      try {
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

          const [prodJour, ventesHuile, caisseRows, topFournisseurs, amortRows, banqueRows] =
            await Promise.all([

              supabase.from('production_journaliere')
                .select('date_production, regime_recu_kg, taux_extraction')
                .eq('periode_id', periodeId)
                .order('date_production')
                .then(r => r.data || []),

              supabase.from('ventes_huile')
                .select('date_vente, montant_fcfa')
                .eq('periode_id', periodeId)
                .order('date_vente')
                .then(r => r.data || []),

              // Caisse 1 + Caisse 2 (débits, hors transferts internes)
              Promise.all([
                supabase.from('caisse_apo')
                  .select('libelle, credit_fcfa, categorie')
                  .eq('periode_id', periodeId)
                  .gt('credit_fcfa', 0)
                  .not('libelle', 'ilike', 'TRANSFERT%')
                  .not('libelle', 'ilike', 'VIREMENT%')
                  .not('libelle', 'ilike', 'VERSEMENT%')
                  .not('libelle', 'ilike', 'DEPOT%')
                  .not('libelle', 'ilike', 'APPRO%')
                  .then(r => r.data || []),
                supabase.from('caisse_apo2')
                  .select('libelle, credit_fcfa, categorie')
                  .eq('periode_id', periodeId)
                  .gt('credit_fcfa', 0)
                  .not('libelle', 'ilike', 'TRANSFERT%')
                  .not('libelle', 'ilike', 'VIREMENT%')
                  .not('libelle', 'ilike', 'VERSEMENT%')
                  .not('libelle', 'ilike', 'DEPOT%')
                  .not('libelle', 'ilike', 'APPRO%')
                  .then(r => r.data || []),
              ]).then(([c1, c2]) => [...c1, ...c2]),

              supabase.from('vue_top_fournisseurs')
                .select('nom, reference, poids_total_kg, prix_moyen_kg, montant_total_fcfa, nb_camions')
                .eq('annee', periode.annee)
                .eq('mois', periode.mois)
                .limit(10)
                .then(r => r.data || []),

              // Table amortissement_bancaire (fallback si pas dans banque_apo)
              supabase.from('amortissement_bancaire')
                .select('libelle, montant_fcfa, type')
                .eq('periode_id', periodeId)
                .then(r => r.data || []),

              // Banque APO (SGCI + BDA) — toutes catégories
              supabase.from('banque_apo')
                .select('libelle, montant_fcfa, categorie')
                .eq('periode_id', periodeId)
                .then(r => r.data || []),
            ])

          const idx = (periode.mois - 1) % 12
          return {
            key:    MOIS_KEYS[periode.mois - 1],
            data:   buildData(kpis, periode, prodJour, ventesHuile, caisseRows, topFournisseurs, amortRows, banqueRows),
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
  }, [])

  return { moisData, loading, error }
}
