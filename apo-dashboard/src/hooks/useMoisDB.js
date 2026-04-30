/**
 * useMoisDB — charge dynamiquement les mois disponibles depuis Supabase.
 * Remplace le MONTH_DATA statique de src/data/index.js
 *
 * Pour chaque période présente dans kpis_mensuels :
 *  - construit l'objet `data` attendu par les composants
 *  - récupère les données journalières (production, ventes) pour les graphiques
 */

import { useState, useEffect } from 'react'
import { supabase } from '../db/supabase'
import { MONTH_DATA as MONTH_DATA_STATIC } from '../data/index'

/**
 * Catégorise une ligne caisse_apo2 selon les mêmes catégories que Jan/Fév/Mar.
 * Labels alignés avec ceux des fichiers statiques pour la cohérence du GlobalPanel.
 * Utilisé en fallback si la colonne `categorie` n'est pas renseignée en base.
 */
function categorizeLibelle(libelle = '') {
  const l = libelle.toUpperCase()

  if (/SALAIRE|PAIE DU|PAIE DES|PRIME POUR|AVANCE SUR SALAIRE|PAIE JOUR|JOUR FERIER|TRAVAILLEURS TEMPORAIRE/.test(l))
    return 'Salaires'

  if (/CARBURANT|GASOIL|GAZOIL|ESSENCE/.test(l))
    return 'Carburant'

  if (/MAIN D.O(EUVRE|ŒUVRE)|ACOMPTE SUR MAIN|SOLDE.*MAIN/.test(l))
    return "Main d'œuvre ext."

  if (/REPARATION|REAPARATION|ENTRETIEN|REBOBINAGE|RECHARGEMENT BOUTEILLE|DEPANNAGE/.test(l))
    return 'Entretien & Rép.'

  if (/GRAVIER|CHEVRON|SABLE TRAVAUX|BRIQUES|CONTRE PLAQUE|PASSE-ALLURE|BASSIN LAGUNAGE|FORAGE|DALLE|FABRICATION AUVENT|FABRICATION PIQUES|CIMENT/.test(l))
    return 'Construction'

  if (/LOCATION BULDOZER|LOCATION PORTE-CHAR|VISITE TECHNIQUE|BILLET AVION|LAVAGE PICK|DELAVAGE PICK|PARLLELISME|PARALLISME/.test(l))
    return 'Véhicules'

  if (/FRAIS DE TRANSPORT|TRANSPORT FOURNISSEUR|LOCATION CAMION/.test(l))
    return 'Véhicules'

  if (/^ACHAT EAU|^ACHAT EU |^ACHAT EA |EAU POUR|^ACHAT DIVERS/.test(l))
    return 'Eau/divers'

  if (/FOURNITURES/.test(l))
    return 'Fournitures'

  if (/^ACHAT/.test(l))
    return 'Matériels'

  return 'Frais divers'
}

// Clés des mois déjà couverts par les fichiers statiques
const STATIC_KEYS = new Set(MONTH_DATA_STATIC.map(m => m.key))

// Couleurs par numéro de mois (cyclique)
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

// Clé de navigation : 'jan', 'feb', 'mar', 'apr', ...
const MOIS_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

/**
 * Convertit les lignes Supabase en objet `data` compatible avec les composants React.
 */
function buildData(kpis, periode, prodJour, ventesHuile, topCharges, topFournisseurs) {
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
  const amort       = kpis.amortissement_fcfa  || 0

  // Charges calculées depuis les enregistrements filtrés (caisse 1 + caisse 2, hors transferts)
  // plutôt que depuis kpis.charges_exploitation qui peut inclure des virements inter-caisses
  const parCategorie = {}
  for (const r of topCharges) {
    const cat = r.categorie || categorizeLibelle(r.libelle || '')
    parCategorie[cat] = (parCategorie[cat] || 0) + (r.credit_fcfa || 0)
  }
  const charges = Object.values(parCategorie).reduce((s, v) => s + v, 0)
  const resultat    = caTotal - coutMP - charges - amort
  const margeBrute  = caTotal - coutMP
  const ebitda      = margeBrute - charges

  const prixHuile   = kpis.prix_moyen_huile_kg || 0
  const prixRegime  = kpis.prix_moyen_regime_kg|| 0
  const te          = (kpis.taux_extraction    || 0) * 100

  // Graphique production journalière
  const grainesDailyLabels = prodJour.map(r => r.date_production?.slice(8, 10))
  const grainesDailyKg     = prodJour.map(r => r.regime_recu_kg || 0)
  const teDailyLabels      = prodJour.map(r => r.date_production?.slice(8, 10))
  const teDailyVals        = prodJour.map(r => ((r.taux_extraction || 0) * 100).toFixed(2))

  // Graphique CA journalier huile — une entrée par jour (somme si plusieurs livraisons)
  const caParJour = {}
  for (const r of ventesHuile) {
    const d = r.date_vente || ''
    caParJour[d] = (caParJour[d] || 0) + (r.montant_fcfa || 0)
  }
  const caJoursLabels = Object.keys(caParJour).sort().map(d => d.slice(8, 10))
  const caJoursVals   = Object.keys(caParJour).sort().map(d => caParJour[d])

  // Tri des catégories agrégées (calculées en tête de fonction)
  const topDepenses = Object.entries(parCategorie)
    .map(([lib, mt]) => ({ lib, mt, date: '' }))
    .sort((a, b) => b.mt - a.mt)

  // Top fournisseurs — format identique aux fichiers statiques
  const fournisseursItems = topFournisseurs.map(r => ({
    name:    r.nom || r.reference,
    poids:   r.poids_total_kg     || 0,
    prix:    Math.round(r.prix_moyen_kg   || 0),
    montant: r.montant_total_fcfa || 0,
  }))

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
      produits: [
        { label: `Huile de palme CPO (${prixHuile.toFixed(0)} F/kg × ${huileVendueT} T)`, pertonne: huileProduiteT ? Math.round(caHuile / huileProduiteT) : 0, total: caHuile },
        { label: `Noix de palmiste (60 F/kg × ${palmisteVendT} T)`,                        pertonne: huileProduiteT ? Math.round(caPalmiste / huileProduiteT) : 0, total: caPalmiste },
        { label: `Huile florentin`,                                                         pertonne: huileProduiteT ? Math.round(caFlorentin / huileProduiteT) : 0, total: caFlorentin },
        ...(caBassin > 0 ? [{ label: 'Huile bassin lagunage', pertonne: huileProduiteT ? Math.round(caBassin / huileProduiteT) : 0, total: caBassin }] : []),
      ],
      totalProduitsTotal: caTotal,
      totalProduitsTonne: huileProduiteT ? Math.round(caTotal / huileProduiteT) : 0,
      coutMP: {
        label:    `Régimes traités (${prixRegime.toFixed(2)} F/kg × ${regTraitesT} T)`,
        pertonne: huileProduiteT ? Math.round(coutMP / huileProduiteT) : 0,
        total:    -coutMP,
      },
      margeBruteTotal:      margeBrute,
      margeBruteTonne:      huileProduiteT ? Math.round(margeBrute / huileProduiteT) : 0,
      margeBrutePct:        caTotal ? +((margeBrute / caTotal) * 100).toFixed(1) : 0,
      chargesExploitation:  topDepenses.slice(0, 7).map(d => ({
        label:    d.lib,
        pertonne: huileProduiteT ? Math.round(d.mt / huileProduiteT) : 0,
        total:    -d.mt,
      })),
      totalChargesExpTotal: -charges,
      totalChargesExpTonne: huileProduiteT ? -Math.round(charges / huileProduiteT) : 0,
      ebitdaTotal:  ebitda,
      ebitdaTonne:  huileProduiteT ? Math.round(ebitda / huileProduiteT) : 0,
      ebitdaPct:    caTotal ? +((ebitda / caTotal) * 100).toFixed(1) : 0,
      amortissements: amort > 0 ? [{ label: 'Amortissement', pertonne: huileProduiteT ? Math.round(amort / huileProduiteT) : 0, total: -amort }] : [],
      totalAmortTotal: -amort,
      totalAmortTonne: huileProduiteT ? -Math.round(amort / huileProduiteT) : 0,
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
        labels: topDepenses.slice(0, 7).map(d => d.lib),
        values: topDepenses.slice(0, 7).map(d => d.mt),
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

export function useMoisDB() {
  const [moisData, setMoisData]   = useState([])   // tableau de { key, data, accent, rgba }
  const [loading,  setLoading]    = useState(true)
  const [error,    setError]      = useState(null)

  useEffect(() => {
    async function fetchTout() {
      try {
        // 1. Récupère uniquement les mois NON couverts par les fichiers statiques
        const { data: kpisRows, error: e1 } = await supabase
          .from('kpis_mensuels')
          .select('*, periodes(id, annee, mois, libelle)')
          .order('periode_id')

        if (e1) throw e1

        // Filtre : garde seulement les mois absents du statique
        const kpisFiltres = kpisRows.filter(r => {
          const key = MOIS_KEYS[(r.periodes?.mois ?? 1) - 1]
          return !STATIC_KEYS.has(key)
        })

        const resultats = await Promise.all(kpisFiltres.map(async (kpis) => {
          const periode   = kpis.periodes
          const periodeId = periode.id

          // 2. Données journalières en parallèle
          const [prodJour, ventesHuile, topCharges, topFournisseurs] = await Promise.all([
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

            // Toutes les écritures du mois — caisse 1 + caisse 2, agrégées par catégorie
            // caisse_apo  : pas de colonne categorie → select sans
            // caisse_apo2 : a la colonne categorie
            Promise.all([
              supabase.from('caisse_apo')
                .select('date_mouvement, libelle, credit_fcfa')
                .eq('periode_id', periodeId)
                .gt('credit_fcfa', 0)
                .not('libelle', 'ilike', 'TRANSFERT%')
                .not('libelle', 'ilike', 'VIREMENT%')
                .not('libelle', 'ilike', 'VERSEMENT%')
                .not('libelle', 'ilike', 'DEPOT%')
                .not('libelle', 'ilike', 'APPRO%')
                .order('date_mouvement')
                .then(r => (r.data || []).map(row => ({ ...row, categorie: null }))),
              supabase.from('caisse_apo2')
                .select('date_mouvement, libelle, credit_fcfa, categorie')
                .eq('periode_id', periodeId)
                .gt('credit_fcfa', 0)
                .not('libelle', 'ilike', 'TRANSFERT%')
                .not('libelle', 'ilike', 'VIREMENT%')
                .not('libelle', 'ilike', 'VERSEMENT%')
                .not('libelle', 'ilike', 'DEPOT%')
                .not('libelle', 'ilike', 'APPRO%')
                .order('date_mouvement')
                .then(r => r.data || []),
            ]).then(([c1, c2]) => {
              const all = [...c1, ...c2]
              // DEBUG — à supprimer après diagnostic
              console.table(
                [...all].sort((a, b) => (b.credit_fcfa || 0) - (a.credit_fcfa || 0))
                  .slice(0, 20)
                  .map(r => ({ libelle: r.libelle, credit_fcfa: r.credit_fcfa, source: c1.includes(r) ? 'caisse1' : 'caisse2' }))
              )
              return all
            }),

            supabase.from('vue_top_fournisseurs')
              .select('nom, reference, poids_total_kg, prix_moyen_kg, montant_total_fcfa, nb_camions')
              .eq('annee', periode.annee)
              .eq('mois', periode.mois)
              .limit(10)
              .then(r => r.data || []),
          ])

          const idx = (periode.mois - 1) % 12
          return {
            key:    MOIS_KEYS[periode.mois - 1],
            data:   buildData(kpis, periode, prodJour, ventesHuile, topCharges, topFournisseurs),
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
