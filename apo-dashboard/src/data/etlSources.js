// ============================================================
// APO — CARTOGRAPHIE ETL (Extract · Transform · Load)
// Liens entre fichiers Excel source et données du dashboard
// Règles de calcul : voir src/lib/kpiEngine.js
// Mise à jour : mars 2026
// ============================================================

/**
 * CHEMINS DES FICHIERS EXCEL SOURCE
 * Base comptabilité  : C:\Users\BDLIT-2\Dropbox\APO\Compta\2026\
 * Base production    : C:\Users\BDLIT-2\Dropbox\APO\Rapport de Production\Rapport des production 2026\
 * Dossier SCAN       : exclu (documents non-structurés)
 */

export const EXCEL_SOURCES = {

  CAISSE_GRAINE: {
    id:       'CAISSE_GRAINE',
    nom:      'CAISSE GRAINES 2026',
    fichier:  'CAISSE GRAINES 2026.xlsx',
    chemin:   'C:\\Users\\BDLIT-2\\Dropbox\\APO\\Compta\\2026\\CAISSE GRAINES 2026.xlsx',
    description: 'Registre des achats de régimes FFB par camion et par fournisseur',
    sheets: {
      jan: 'CAISSE GRAINE JANVIER',
      fev: 'CAISSE GRAINE FEVRIER',
      mars: 'CAISSE GRAINE MARS',
    },
    colonnes: {
      typeTransport:    'B — TYPE DE TRANSPORT',
      numeroCamion:     'C — NUMERO DE CAMION',
      date:             'D — DATE',
      fournisseur:      'E — REFERENCE FOURNISSEUR',
      poidsKg:          'F — POIDS EN KG',
      prixKg:           'G — PRIX / KG',
      prixTransport:    'H — PRIX TRANSPORT',
      approCaisse:      'I — APPRO CAISSE',
      prixTotal:        'J — Prix total',
      solde:            'K — SOLDE',
    },
    // Valeurs réelles extraites des sheets (ligne TOTAL MOUVEMENTS)
    valeursExtraites: {
      jan: {
        totalPoidsKg:         11170660,
        prixMoyenPondere:     122.73,   // F/kg (col G ligne TOTAL)
        totalAchatsPayesFCFA: 1371009740,
        // Coût MP imputé = régimes TRAITÉS × prix moyen = 9 998 044 kg × 122.73 F/kg
        coutMPImputeJanFCFA:  1227091010,
      },
      fev: {
        totalPoidsKg:         14798400,
        prixMoyenPondere:     112.50,   // F/kg
        totalAchatsPayesFCFA: 1664754700,
        // Coût MP imputé = 15 071 435 kg × 112.50 F/kg
        coutMPImputeFevFCFA:  1695469933,
      },
    },
    donneesExtraites: [
      'Poids reçu par fournisseur (kg) → kpis.regimesRecusT',
      'Prix d\'achat par fournisseur (F/kg) → calcul prix moyen pondéré',
      'Prix moyen pondéré (F/kg) → Règle 1 : Coût MP = poids traités × prix moy.',
      'Nombre de camions → kpis.nbCamions (comptage lignes)',
      'Total poids reçus → kpis.regimesRecusT',
    ],
    champsData: ['fournisseurs', 'kpis.regimesRecusT', 'kpis.coutMPFCFA', 'kpis.coutMPDetail'],
    regle:      'Règle 1 kpiEngine.js — calculCoutMP(regimesTraitesKg, prixMoyenPondere)',
  },

  CAISSE_APO: {
    id:       'CAISSE_APO',
    nom:      'CAISSE APO 2026',
    fichier:  'CAISSE APO 2026.xlsx',
    chemin:   'C:\\Users\\BDLIT-2\\Dropbox\\APO\\Compta\\2026\\CAISSE APO 2026.xlsx',
    description: 'Caisse principale APO — encaissements ventes et décaissements divers',
    sheets: {
      unique: 'CAISSE APO',  // un seul onglet, mois séparés par ligne SOLDE
    },
    colonnes: {
      date:    'B — DATE',
      libelle: 'C — LIBELLE',
      debit:   'D — MONTANT DEBIT (entrées)',
      credit:  'E — MONTANT CREDIT (sorties)',
      solde:   'F — SOLDE',
    },
    // Valeurs réelles extraites
    valeursExtraites: {
      jan: {
        soldeFinJan: 18142534,    // ligne "SOLDE JANVIER 2026"
      },
      fev: {
        soldeFiniJanFev: 395948,  // ligne "SOLDE FEVRIER 2026" (cumulé)
      },
    },
    donneesExtraites: [
      'Encaissements journaliers ventes huile → revenus.caJoursVals',
      'Total encaissements mensuels → contribution à kpis.caTotalFCFA',
      'Solde mensuel (confirmation trésorerie)',
    ],
    champsData: ['revenus.caJoursVals', 'kpis.caTotalFCFA'],
    regle:      'Règle 3 kpiEngine.js — calculRevenusHuile()',
  },

  CAISSE_APO_2: {
    id:       'CAISSE_APO_2',
    nom:      'CAISSE 2 APO 2026',
    fichier:  'CAISSE 2 APO 2026.xlsx',
    chemin:   'C:\\Users\\BDLIT-2\\Dropbox\\APO\\Compta\\2026\\CAISSE 2 APO 2026.xlsx',
    description: 'Caisse secondaire APO — décaissements exploitation (achats, main d\'œuvre, entretien)',
    sheets: {
      unique: 'CAISSE 2 APO',  // un seul onglet, mois séparés par ligne SOLDE
    },
    colonnes: {
      date:    'B — DATE',
      libelle: 'C — LIBELLE',
      debit:   'D — MONTANT DEBIT',
      credit:  'E — MONTANT CREDIT (sorties exploitation)',
      solde:   'F — SOLDE',
    },
    valeursExtraites: {
      jan: {
        soldeFinJan: 19906127,   // ligne "SOLDE JANVIER 2026"
      },
      fev: {
        soldeFinFev: 14303487,   // ligne "SOLDE FEVRIER 2026"
      },
    },
    donneesExtraites: [
      'Toutes sorties de caisse par date et libellé → charges.topDepenses',
      'Somme charges exploitation hors MP et amortissement → kpis.chargesExplFCFA',
      'Top 15 dépenses triées par montant → tableau charges dashboard',
    ],
    champsData: ['charges.topDepenses', 'kpis.chargesExplFCFA', 'pnl.chargesExploitation'],
    regle:      null,
  },

  VENTE_HUILE: {
    id:       'VENTE_HUILE',
    nom:      "VENTE D'HUILE APO SARCI 2026",
    fichier:  "VENTE D'HUILE APO SARCI 2026.xlsx",
    chemin:   "C:\\Users\\BDLIT-2\\Dropbox\\APO\\Compta\\2026\\VENTE D'HUILE APO SARCI 2026.xlsx",
    description: 'Registre des ventes d\'huile de palme CPO — livraisons journalières à SARCI',
    sheets: {
      jan: "VENTE D'HUILE 2026",  // Années 2022-2025-2026 dans un seul onglet 2026
      // NB : l'onglet "VENTE D'HUILE 2026" contient aussi les années précédentes
    },
    colonnes: {
      date:         'B — DATE',
      libelle:      'C — LIBELLE',
      poidsAPO:     'D — POIDS APO EN KG',
      poidsSARCI:   'E — POIDS SARCI EN KG',
      ecart:        'F — ECARTS',
      prixKg:       'G — PRIX / KG',
      avanceSARCI:  'H — AVANCE SARCI',
      venteAPO:     'I — VENTE APO (FCFA)',
      solde:        'J — SOLDE',
    },
    // Valeurs réelles extraites (lignes TOTAL MOUVEMENTS)
    valeursExtraites: {
      jan: {
        totalPoidsAPO:   1763260,   // kg livrés côté APO
        totalPoidsSarci: 1763200,   // kg côté SARCI (écart : -60 kg)
        prixMoyen:       720.51,    // F/kg
        totalVenteAPO:   1270454272, // FCFA (ligne TOTAL MOUVEMENTS JANVIER 2026)
        // NB : kpis.caHuileFCFA = 1 269 504 000 → arrondi au prix 720 F/kg × 1 763 T
      },
      fev: {
        totalPoidsAPO:   2959220,
        totalPoidsSarci: 2959300,
        prixMoyen:       684.44,    // F/kg moy (720→675 à partir du 04/02)
        totalVenteAPO:   2025395504, // FCFA (ligne TOTAL MOUVEMENTS FEVRIER 2025 — attention: label Excel dit 2025 mais c'est 2026)
        // NB : kpis.caHuileFCFA = 2 016 088 200 → calculé sur livraisons du mois
      },
    },
    donneesExtraites: [
      'Quantité huile livrée par jour (kg) → revenus.produits[0].quantite, kpis.huileVendueT',
      'Prix de vente (F/kg) — changements de prix en cours de mois → kpis.caHuileDetail',
      'CA huile total (FCFA) → kpis.caHuileFCFA',
    ],
    champsData: ['kpis.caHuileFCFA', 'kpis.huileVendueT', 'kpis.caHuileDetail', 'revenus.produits[0]'],
    regle:      'Règle 3 kpiEngine.js — calculRevenusHuile()',
  },

  TABLEAU_PRODUCTION: {
    id:       'TABLEAU_PRODUCTION',
    nom:      'Tableau de production APO 2026',
    fichier:  'Tableau de production APO 2026.xlsx',
    chemin:   'C:\\Users\\BDLIT-2\\Dropbox\\APO\\Rapport de Production\\Rapport des production 2026\\Tableau de production APO 2026.xlsx',
    description: 'Suivi journalier de la production — régimes, huile, extraction, palmiste, florentin',
    sheets: {
      jan:  'JANVIER 2026',
      fev:  'FEVRIER 2026',
      mars: 'MARS 2026',
    },
    colonnes: {
      date:                 'B — DATE',
      regimeRecu:           'C — Regime Recu (kg)',
      regimeTraite:         'D — Regime Traite (kg)',
      regimeRestant:        'E — Regime restant (kg)',
      huileProduiteKg:      'F — Huile Produit (kg)',
      tauxExtraction:       'G — TE %',
      livraisonCiterneAya:  'H — LIVRAISON CITERNE AYA (kg) = vente huile',
      stockHuile:           'I — STOCK HUILE (kg)',
      tank1000:             'J — TANK 1000T',
      tank300:              'K — TANK 300 T',
      stockGraine1:         'L — STOCK GRAINE 1 (kg)',
      stockGraine2:         'M — STOCK GRAINE 2 (kg)',
      nbSterilisateurs:     'N — Nombre de sterilisateur',
      livraisonFlorentin:   'O — LIVRAISON FLORENTIN (kg)',
      livraisonBassin:      'P — LIVRAISON BASSIN LAGUNAGE (kg)',
      productionPalmiste:   'Q — PRODUCTION PALMISTE (kg)',
      livraisonPalmiste:    'R — LIVRAISON DE PALMISTE (kg)',
      stockPalmiste:        'S — STOCK DE PALMISTE (kg)',
    },
    // Valeurs réelles extraites (lignes TOTAL)
    valeursExtraites: {
      jan: {
        regimesRecusKg:       11170660,
        regimesTraitesKg:     9998044.55,
        stockRegimesFinMoisKg: 1400635.45,
        huileProduiteKg:      1946499,      // NOTE: différence avec JS (1 956 T) → voir note ci-dessous
        tauxExtraction:       0.19469,      // 19.47% → JS affiche 19.56% (voir note)
        venteHuile:           1763260,
        nbSterilisateurs:     369,
        livraisonFlorentin:   16320,        // kg — NOTE: JS a 20 600 kg (source VENTE FLORENTIN)
        livraisonBassin:      0,
        productionPalmiste:   999804,
        livraisonPalmiste:    1009500,
        // NOTE sur huileProduiteKg et TE:
        // La sheet production donne 1 946 499 kg (TE 19,47%).
        // Le dashboard affiche 1 956 T (TE 19,56%).
        // Différence ~10 T : probable prise en compte du stock décanteur (42 112 kg, ligne L42).
        // Huile produite effective = 1 946 499 + stock décanteur → ~1 956 T.
      },
      fev: {
        regimesRecusKg:        14798400,
        regimesTraitesKg:      15071435.45,  // dont 1 400 635 T stock reporté de janv.
        stockRegimesFinMoisKg: 1127600,
        huileProduiteKg:       2865783,
        tauxExtraction:        0.19015,       // 19.01% ✓
        venteHuile:            2959220,
        nbSterilisateurs:      558,
        livraisonFlorentin:    0,
        livraisonBassin:       24640,         // kg (dont 8 060 kg le 11/02 non facturés)
        productionPalmiste:    1507144,
        livraisonPalmiste:     1894000,
      },
    },
    donneesExtraites: [
      'Régimes reçus par jour (col C) → production.grainesDailyKg, kpis.regimesRecusT',
      'Régimes traités par jour (col D) → kpis.regimesTraitesT',
      'Huile produite par jour (col F) → kpis.huileProduiteT',
      'Taux d\'extraction journalier (col G) → production.teDailyVals, kpis.tauxExtraction',
      'Livraison citerne AYA (col H) = vente huile → kpis.huileVendueT',
      'Stock régimes fin mois (col E dernière ligne) → kpis.stockFinMoisT',
      'Nombre stérilisateurs (col N) → kpis.nbSterilisateurs',
      'Livraison palmiste (col R) → kpis.palmisteVenduT',
      'Production palmiste (col Q) → kpis.palmisteProduitT',
    ],
    champsData: [
      'production.grainesDailyKg',
      'production.teDailyVals',
      'kpis.regimesTraitesT',
      'kpis.huileProduiteT',
      'kpis.tauxExtraction',
      'kpis.stockFinMoisT',
      'kpis.nbSterilisateurs',
      'kpis.palmisteProduitT',
      'kpis.palmisteVenduT',
    ],
    regle: 'Règle 2 kpiEngine.js — calculTauxExtraction(huileProduiteKg, regimesTraitesKg)',
  },

  VENTE_FLORENTIN: {
    id:       'VENTE_FLORENTIN',
    nom:      'VENTE DE FLORENTIN 2026',
    fichier:  'VENTE DE FLORENTIN 2026.xlsx',
    chemin:   'C:\\Users\\BDLIT-2\\Dropbox\\APO\\Compta\\2026\\VENTE DE FLORENTIN 2026.xlsx',
    description: 'Ventes d\'huile de récupération (florentin) à Madame Imane — sous-produit usine',
    sheets: {
      jan:  'VENTE FLORENTIN JANVIER',
      // Fév : onglet "MADAME IMAM" (uniquement pour règlement)
    },
    colonnes: {
      date:          'B — DATE',
      fournisseur:   'C — REFERENCE FOURNISSEUR',
      poidsKg:       'D — POIDS EN KG',
      prixKg:        'E — PRIX / KG',
      prixTotal:     'F — Prix total (FCFA)',
      solde:         'G — SOLDE',
    },
    valeursExtraites: {
      jan: {
        // 3 transactions : 10 880 kg @ 500 F/kg + 4 280 kg @ 100 F/kg (fond de tank) + 5 440 kg @ 500 F/kg
        totalPoidsKg:  20600,
        prixMoyen:     416.89,  // F/kg (moy pondérée)
        totalFCFA:     8588000, // ✓ correspond à kpis.caHuileFlorentinFCFA
      },
      fev: {
        // Aucune vente florentin en février (onglet "MADAME IMAM" uniquement pour règlement)
        totalPoidsKg: 0,
        totalFCFA:    0,
      },
    },
    donneesExtraites: [
      'Poids florentin livré (kg) → pnl.produits[2].total, revenus.produits[2]',
      'Prix de vente (F/kg) → pnl.produits[2].label',
      'CA florentin mensuel (FCFA) → kpis.caHuileFlorentinFCFA',
    ],
    champsData: ['kpis.caHuileFlorentinFCFA', 'pnl.produits[2]', 'revenus.produits[2]'],
    regle:      null,
  },

  VENTE_PALMISTE: {
    id:       'VENTE_PALMISTE',
    nom:      'VENTE NOIX DE PALMISTE 2026',
    fichier:  'VENTE NOIX DE PALMISTE 2026.xlsx',
    chemin:   'C:\\Users\\BDLIT-2\\Dropbox\\APO\\Compta\\2026\\VENTE NOIX DE PALMISTE 2026.xlsx',
    description: 'Ventes de noix de palmiste par client (DJE EMANUEL, MOE ATIE, etc.) — 60 F/kg fixe',
    sheets: {
      jan:  'VENTE NOIX PALMISTE JANVIER',
      fev:  'VEMTE NOIX DE PALMISTE FEVRIER',  // NB: coquille dans le nom de l'onglet
      mars: 'VENTE NOIX DE PALMISTE MARS',
    },
    colonnes: {
      date:        'B — DATE',
      client:      'C — REFERENCE FOURNISSEUR (client acheteur)',
      poidsKg:     'D — POIDS EN KG',
      prixKg:      'E — PRIX / KG (fixe 60 F/kg)',
      prixTotal:   'F — Prix total (FCFA)',
      solde:       'G — SOLDE',
    },
    valeursExtraites: {
      jan: {
        totalPoidsKg: 969520,   // ≈ 970 T ✓
        prixKg:       60,
        totalFCFA:    58171200, // ✓ correspond à kpis.caNoisFCFA
      },
      fev: {
        totalPoidsKg: 1894000,  // ✓ correspond à kpis.palmisteVenduT
        prixKg:       60,
        totalFCFA:    113640000, // ✓ correspond à kpis.caNoisFCFA
      },
    },
    donneesExtraites: [
      'Quantité palmiste vendue (kg) → kpis.palmisteVenduT, revenus.produits[1].quantite',
      'Prix fixe 60 F/kg → pnl.produits[1].label',
      'CA palmiste total (FCFA) → kpis.caNoisFCFA',
    ],
    champsData: ['kpis.caNoisFCFA', 'kpis.palmisteVenduT', 'pnl.produits[1]', 'revenus.produits[1]'],
    regle:      null,
  },

  VENTE_BASSIN: {
    id:       'VENTE_BASSIN',
    nom:      'VENTE DE BASSIN DE LAGUNAGE',
    fichier:  'VENTE DE BASSIN DE LAGUNAGE.xlsx',
    chemin:   'C:\\Users\\BDLIT-2\\Dropbox\\APO\\Compta\\2026\\VENTE DE BASSIN DE LAGUNAGE.xlsx',
    description: 'Ventes d\'huile de bassin de lagunage (nouveau produit 2026) — non facturé à régulariser',
    sheets: {
      fev:  'VENTE BASSIN FEVRIER',
      mars: 'VENTE BASSIN MARS',
    },
    valeursExtraites: {
      jan: { totalPoidsKg: 0, totalFCFA: 0 },
      fev: {
        // 8 060 kg livrés le 11/02 à Madame Imane — prix non renseigné
        totalPoidsKg: 8060,
        totalFCFA:    0,  // non facturé — à régulariser
      },
    },
    donneesExtraites: [
      'Quantité bassin livrée (kg) → kpis.caBassinFCFA (= 0, non facturé)',
      'Signalement anomalie → alertes (type warn)',
    ],
    champsData: ['kpis.caBassinFCFA', 'alertes[4]'],
    regle:      null,
  },

  PEPINIERE_A_HUILE: {
    id:       'PEPINIERE_A_HUILE',
    nom:      'CLIENTS PEPINIERE PALMIER A HUILE',
    fichier:  'CLIENTS PEPINIERE PALMIER A HUILE.xlsx',
    chemin:   'C:\\Users\\BDLIT-2\\Dropbox\\APO\\Compta\\2026\\CLIENTS PEPINIERE PALMIER A HUILE.xlsx',
    description: 'Registre cumulatif des contrats de distribution de plants pépinière (depuis 2024)',
    sheets: {
      unique: 'Feuil1',  // unique onglet — toutes années confondues
    },
    colonnes: {
      ordre:       'A — N° D\'ORDRE',
      date:        'B — DATE',
      nomPrenoms:  'C — NOM ET PRENOMS',
      telephone:   'D — N° TELEPHONE',
      localite:    'E — LOCALITE CHAMP',
      superf:      'F — SUPERFICIE DEMANDEE',
      prixUnitaire:'G — PRIX UNITAIRE (FCFA/ha)',
      hectares:    'H — SUPERFICIE DU CHAMP (hectare)',
      montantTotal:'I — MONTANT TOTAL',
      netEncaisse: 'J — NET ENCAISSE',
      restant:     'K — MONTANT RESTANT',
    },
    valeursExtraites: {
      // Totaux cumulatifs au 31/01/2026 (clients 1001 à 1031 — avant les 3 ajouts fév/mars 2026)
      jan: {
        nbClients:      31,
        totalHectares:  221,  // approximatif selon scope jan
        // NB : les chiffres dans janvier.js (16 clients, 80.6 M FCFA) représentent
        // un sous-ensemble des contrats actifs en janvier 2026. Voir note ci-dessous.
      },
      // Note : le fichier PEPINIERE est cumulatif (pas de sheet par mois).
      // Les clients 1032 (25/02/26), 1033 (25/02/26), 1034 (10/03/26) ne font pas partie de jan.
      // Total général (tous clients confondus, L38) : 227 ha, 41 160 000 FCFA, encaissé 19 757 000 FCFA.
    },
    donneesExtraites: [
      'Liste clients avec dates de contrat → pepiniere.clients (filtrés ≤ 31/01/2026)',
      'Montant total par client → kpis.pepContratsFCFA',
      'Net encaissé par client → kpis.pepEncaisséFCFA',
      'Montant restant → kpis.pepResteaFCFA = pepContratsFCFA − pepEncaisséFCFA',
      'Répartition hectares → pepiniere.superficieDistrib',
    ],
    champsData: [
      'pepiniere.clients',
      'pepiniere.superficieDistrib',
      'kpis.pepContratsFCFA',
      'kpis.pepEncaisséFCFA',
      'kpis.pepResteaFCFA',
    ],
    regle:            null,
    disponibilite:    'Janvier uniquement — activité saisonnière de distribution de plants',
  },
}

// ── RÈGLES ETL PAR SECTION ────────────────────────────────────

export const ETL_RULES = {

  'kpis.caTotalFCFA': {
    sources:    ['VENTE_HUILE', 'VENTE_PALMISTE', 'VENTE_FLORENTIN'],
    extraction: 'Somme CA huile + CA palmiste + CA florentin (+bassin si facturé)',
    calcul:     'caHuileFCFA + caNoisFCFA + caHuileFlorentinFCFA',
    regle:      null,
  },

  'kpis.caHuileFCFA': {
    sources:    ['VENTE_HUILE'],
    extraction: "VENTE D'HUILE : col I (VENTE APO) — somme de toutes les livraisons du mois",
    calcul:     'Σ(poids_livré_kg × prix_kg) pour chaque ligne de livraison du mois',
    regle:      'Règle 3 kpiEngine.js — calculRevenusHuile()',
  },

  'kpis.coutMPFCFA': {
    sources:    ['CAISSE_GRAINE', 'TABLEAU_PRODUCTION'],
    extraction: 'CAISSE GRAINE col G (ligne TOTAL) → prix moyen pondéré. TABLEAU PRODUCTION col D → régimes traités',
    calcul:     'prixMoyenPondere × regimesTraitesKg',
    regle:      'Règle 1 kpiEngine.js — calculCoutMP()',
  },

  'kpis.tauxExtraction': {
    sources:    ['TABLEAU_PRODUCTION'],
    extraction: 'TABLEAU PRODUCTION col F (huile produite kg cumulé) ÷ col D (régimes traités kg cumulé)',
    calcul:     '(huileProduiteKg ÷ regimesTraitesKg) × 100',
    regle:      'Règle 2 kpiEngine.js — calculTauxExtraction()',
  },

  'kpis.chargesExplFCFA': {
    sources:    ['CAISSE_APO_2'],
    extraction: 'CAISSE 2 APO : somme col E (CREDIT = sorties) hors approvisionnements caisse graine',
    calcul:     'Σ décaissements exploitation du mois (salaires + carburant + matériels + véhicules + frais divers + MO ext.)',
    regle:      null,
  },

  'kpis.resultatNetFCFA': {
    sources:    ['VENTE_HUILE', 'VENTE_PALMISTE', 'VENTE_FLORENTIN', 'CAISSE_GRAINE', 'CAISSE_APO_2'],
    extraction: 'Consolidation de toutes les sources',
    calcul:     'caTotalFCFA − coutMPFCFA − chargesExplFCFA − amortissementFCFA',
    regle:      'Règle 4 & 5 kpiEngine.js — calculPnL() + calculMarge()',
  },

  'pnl': {
    sources:    ['VENTE_HUILE', 'VENTE_PALMISTE', 'VENTE_FLORENTIN', 'CAISSE_GRAINE', 'CAISSE_APO_2'],
    extraction: 'Consolidation complète',
    calcul:     'Dénominateur = tonnes d\'huile PRODUITES (col F TABLEAU PRODUCTION). Résultat/tonne = (ΣProduits − ΣCharges) ÷ huileProduiteT',
    regle:      'Règle 4 kpiEngine.js — calculPnL()',
  },

  'production': {
    sources:    ['TABLEAU_PRODUCTION', 'CAISSE_GRAINE'],
    extraction: 'TABLEAU PRODUCTION : col C (livraisons journalières), col G (taux extraction). CAISSE GRAINE : vérification totaux',
    calcul:     'Données brutes journalières. Taux extraction = col F ÷ col D',
    regle:      'Règle 2 kpiEngine.js — calculTauxExtraction()',
  },

  'revenus': {
    sources:    ['VENTE_HUILE', 'VENTE_PALMISTE', 'VENTE_FLORENTIN', 'CAISSE_APO'],
    extraction: 'CA journalier huile : CAISSE APO col D. Détail produits : fichiers VENTE dédiés',
    calcul:     'CA journalier = encaissement du jour. Total produit = qté × prix unitaire',
    regle:      'Règle 3 kpiEngine.js',
  },

  'charges': {
    sources:    ['CAISSE_APO_2'],
    extraction: 'CAISSE 2 APO : top 15 sorties du mois triées par montant décroissant',
    calcul:     'Libellé et montant exacts — aucune transformation',
    regle:      null,
  },

  'fournisseurs': {
    sources:    ['CAISSE_GRAINE'],
    extraction: 'CAISSE GRAINE col E (fournisseur), col F (poids), col G (prix), col J (montant). Agrégation par fournisseur',
    calcul:     'montant = Σpoids_kg × prix_kg. Tri décroissant par poids. Top 10 dashboard',
    regle:      'Prix moyen pondéré contribue à la Règle 1 — calculCoutMP()',
  },

  'pepiniere': {
    sources:    ['PEPINIERE_A_HUILE'],
    extraction: 'Feuil1 : clients ayant date ≤ 31/01/2026 pour dashboard janvier',
    calcul:     'pepResteaFCFA = col I (montantTotal) − col J (netEncaissé). Disponible jan uniquement',
    regle:      null,
  },
}

// ── RÉCAPITULATIF SOURCES PAR MOIS ────────────────────────────

export const SOURCES_PAR_MOIS = {
  jan: {
    actifs: ['CAISSE_GRAINE', 'CAISSE_APO', 'CAISSE_APO_2', 'VENTE_HUILE', 'TABLEAU_PRODUCTION', 'VENTE_FLORENTIN', 'VENTE_PALMISTE', 'PEPINIERE_A_HUILE'],
    note:   'VENTE_BASSIN non active en janvier',
  },
  fev: {
    actifs: ['CAISSE_GRAINE', 'CAISSE_APO', 'CAISSE_APO_2', 'VENTE_HUILE', 'TABLEAU_PRODUCTION', 'VENTE_PALMISTE', 'VENTE_BASSIN'],
    note:   'PEPINIERE non active en février. VENTE_FLORENTIN : aucune livraison ce mois.',
  },
}
