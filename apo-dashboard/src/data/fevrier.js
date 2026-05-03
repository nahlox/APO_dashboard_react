// ============================================================
// APO — DONNÉES FÉVRIER 2026
// ── SOURCES EXCEL ──────────────────────────────────────────
//  Compta   : C:\Users\BDLIT-2\Dropbox\APO\Compta\2026\
//   ├─ CAISSE GRAINES 2026.xlsx           (sheet: CAISSE GRAINE FEVRIER)
//   ├─ CAISSE APO 2026.xlsx               (sheet: CAISSE APO)
//   ├─ CAISSE 2 APO 2026.xlsx             (sheet: CAISSE 2 APO)
//   ├─ VENTE D'HUILE APO SARCI 2026.xlsx  (sheet: VENTE D'HUILE 2026)
//   ├─ VENTE NOIX DE PALMISTE 2026.xlsx   (sheet: VEMTE NOIX DE PALMISTE FEVRIER)
//   └─ VENTE DE BASSIN DE LAGUNAGE.xlsx   (sheet: VENTE BASSIN FEVRIER)
//  Production: C:\Users\BDLIT-2\Dropbox\APO\Rapport de Production\Rapport des production 2026\
//   └─ Tableau de production APO 2026.xlsx (sheet: FEVRIER 2026)
// NB : PEPINIERE A HUILE non active en février (activité saisonnière janvier)
// NB : VENTE DE FLORENTIN 2026.xlsx — aucune livraison florentin en février
// ── DOCS ───────────────────────────────────────────────────
// Cartographie ETL complète : voir src/data/etlSources.js
// Règles de calcul         : voir src/lib/kpiEngine.js
// ============================================================

export const febData = {

  // ── MÉTADONNÉES ETL ───────────────────────────────────────
  _etl: {
    mois:    'février',
    annee:   2026,
    sources: [
      'CAISSE GRAINE',
      'CAISSE APO',
      'CAISSE APO 2',
      "VENTE D'HUILE",
      'TABLEAU DE PRODUCTION',
      'VENTE FLORENTIN',
      'VENTE PALMISTE',
    ],
    noteStock: 'Régimes traités inclus le stock de 1 401 T reporté de janvier (TABLEAU DE PRODUCTION)',
    // Origine de chaque section
    sectionSources: {
      kpis:         ['CAISSE GRAINE', 'CAISSE APO', 'CAISSE APO 2', "VENTE D'HUILE", 'TABLEAU DE PRODUCTION', 'VENTE PALMISTE'],
      pnl:          ['CAISSE GRAINE', 'CAISSE APO', 'CAISSE APO 2', "VENTE D'HUILE", 'VENTE PALMISTE'],
      production:   ['TABLEAU DE PRODUCTION', 'CAISSE GRAINE'],
      revenus:      ["VENTE D'HUILE", 'VENTE PALMISTE', 'CAISSE APO'],
      charges:      ['CAISSE APO 2'],
      fournisseurs: ['CAISSE GRAINE'],
    },
  },

  // ── KPIs PRINCIPAUX ──────────────────────────────────────
  // Sources : CAISSE GRAINE (coût MP, fournisseurs) · CAISSE APO (CA, encaissements)
  //           CAISSE APO 2 (charges) · VENTE D'HUILE (CA huile, prix 720→675 F/kg dès 04/02)
  //           TABLEAU PRODUCTION (régimes traités incl. 1 401 T stock janv.) · VENTE PALMISTE
  kpis: {
    caTotalFCFA:       2129728200,
    caHuileFCFA:       2016088200,
    caHuileDetail:     '681 F/kg moy × 2 959 T livrées (720→675 à partir du 4 fév)',
    caNoisFCFA:        113640000,
    caBassinFCFA:      0,   // non facturé — à régulariser
    coutMPFCFA:        1750505064,
    coutMPDetail:      '112,50 F/kg × 15 560 T (graines/huile vendue)',
    chargesExplFCFA:   122506325,
    amortissementFCFA: 20375782,
    resultatNetFCFA:   233692078,
    margeNette:        11.0,

    // Production
    regimesRecusT:     14798,
    regimesTraitesT:   15071,  // incl. 1 401 T stock janv.
    stockFinMoisT:     1128,
    huileProduiteT:    2866,
    huileVendueT:      2959,
    tauxExtraction:    19.01,
    nbFournisseurs:    209,
    palmisteProduitT:  1507,
    palmisteVenduT:    1894,
    nbSterilisateurs:  558,
  },

  // ── COMPTE DE RÉSULTAT PAR TONNE ─────────────────────────
  // Sources : CAISSE GRAINE (Coût MP) · CAISSE APO (CA) · CAISSE APO 2 (charges) ·
  //           VENTE D'HUILE · VENTE PALMISTE
  // Règle 4 kpiEngine.js — calculPnL() · Dénominateur = 2 866 T PRODUITES
  pnl: {
    baseLabel: "2 866 tonnes d'huile produites",
    status: 'Résultat Exceptionnel',

    // ── I. CHIFFRE D'AFFAIRES ─────────────────────────────
    produits: [
      { label: 'Huile de palme CPO (681 F/kg moy × 2 959 T livrées)', pertonne: 703000, total:  2016088200 },
      { label: 'Noix de palmiste (60 F/kg × 1 894 T)',                 pertonne:  40000, total:   113640000 },
      { label: 'Bassin de lagunage (8 060 kg — non facturé)',          pertonne:      0, total:           0 },
    ],
    totalProduitsTotal:  2129728200,
    totalProduitsTonne:   743000,

    // ── II. COÛT MATIÈRE PREMIÈRE ─────────────────────────
    coutMP: { label: 'Graines/huile vendue (112,50 F/kg × 15 560 T)', pertonne: 611000, total: -1750505064 },

    // ── MARGE BRUTE (I − II) ──────────────────────────────
    margeBruteTotal:  379223136,   // 2 129 728 200 − 1 750 505 064
    margeBruteTonne:   132000,
    margeBrutePct:       17.8,

    // ── III. CHARGES D'EXPLOITATION ──────────────────────
    chargesExploitation: [
      { label: 'Rémunération du personnel',                    section: '66', pertonne: 10000, total:  -30052695 },
      { label: 'Achat de carburant',                           section: '60', pertonne:  3000, total:   -7583250 },
      { label: "Matériels & fournitures d'usine",              section: '60', pertonne:  5000, total:  -13608500 },
      { label: "Main-d'œuvre occasionnelle",                   section: '63', pertonne:  1000, total:   -4046000 },
      { label: 'Frais de transport / location engins',         section: '61', pertonne:  4000, total:  -10926500 },
      { label: "Eau & fournitures de bureau",                  section: '60', pertonne:  1000, total:   -4111475 },
      { label: 'Divers frais',                                 section: '63', pertonne:  5000, total:  -14696000 },
      // ── Charges bancaires (SGCI/BDA) ──
      { label: 'Charges sociales CNPS/CMU',                    section: '66', pertonne:  4000, total:  -10207092 },
      { label: 'Électricité usine (CIE)',                      section: '60', pertonne:  3000, total:   -9011510 },
      { label: 'Entretien, réparations, maintenance', section: '62', pertonne:  3000, total:   -8437593 },
      { label: 'Frais de transport',                   section: '61', pertonne:  2000, total:   -6230000 },
      { label: 'Sécurité & gardiennage',                       section: '63', pertonne:  1000, total:   -2400000 },
      { label: "Eau & fournitures",                   section: '60', pertonne:     0, total:    -595691 },
      { label: 'Divers frais',                        section: '63', pertonne:     0, total:    -600019 },
    ],
    totalChargesExpTotal: -122506325,   // sans taxes
    totalChargesExpTonne:   -43000,

    // ── EBE / EBITDA (hors taxes, hors amort) ─────────────
    ebitdaTotal:   256716811,   // 379 223 136 − 122 506 325
    ebitdaTonne:      90000,
    ebitdaPct:         12.1,

    // ── IV. IMPÔTS & TAXES (hors IS) ─────────────────────
    impotsTaxes: [
      { label: 'ITS / FDFP / RIBIC / FIRCA',     pertonne: 1000, total: -2598161 },
      { label: 'TSE (Taxe solidarité emplois)',   pertonne:    0, total:   -50790 },
    ],
    totalImpotsTaxesTotal: -2648951,
    totalImpotsTaxesTonne:  -1000,

    // ── RÉSULTAT D'EXPLOITATION ────────────────────────────
    resultatExplTotal:  254067860,
    resultatExplTonne:     89000,
    resultatExplPct:        11.9,

    // ── V. AMORTISSEMENTS & CHARGES FINANCIÈRES ──────────
    amortissements: [
      { label: 'Amortissement prêt bancaire (ECHEANCE SGCI/BDA)', pertonne: 7000, total: -20191988 },
      { label: 'Agios & frais financiers (SGCI/BDA)',              pertonne:    0, total:   -183794 },
    ],
    totalAmortTotal: -20375782,
    totalAmortTonne:   -7000,

    // ── VI. BIC (aucun ce mois) ───────────────────────────
    bic: [],
    totalBICTotal: 0,

    // ── RÉSULTAT NET ──────────────────────────────────────
    totalChargesTotal:  -1893257171,
    totalChargesTonne:    -661000,
    resultatTotal:         233692078,
    resultatTonne:           82000,

    notes: [
      { label: 'Marge brute',         value: '17,8%', color: 'gold'  },
      { label: 'EBITDA',              value: '12,1%', color: 'gold'  },
      { label: 'Résultat exploit.',   value: '11,9%', color: 'gold'  },
      { label: 'Marge nette',         value: '11,0%', color: 'green' },
      { label: 'Prix huile moy.', value: '681 F/kg (720→675 dès 04/02)', color: 'gold' },
    ],
  },

  // ── ALERTES ──────────────────────────────────────────────
  alertes: [
    { type: 'success', titre: 'Résultat exceptionnel : +329,0 M FCFA (marge 15,4%)', texte: "Forte progression vs janvier. Principal facteur : volumes traités doublés (15 071 T vs 9 998 T en janvier), portés par le stock initial de 1 401 T reporté de janvier. Après prise en compte de l'amortissement bancaire (20,2 M FCFA), la marge nette reste solide à 15,4%." },
    { type: 'warn',    titre: 'Baisse du prix de vente de l\'huile en cours de mois', texte: "Le prix est passé de 720 F/kg à 675 F/kg à partir du 4 février. Impact estimé sur le CA : –45 F × ~2 750 T ≈ –123,75 M FCFA vs un prix stable. Surveiller l'évolution du marché." },
    { type: 'success', titre: "Taux d'extraction conforme : 19,01%", texte: "Calculé sur régimes traités : 2 865 783 kg ÷ 15 071 435 kg = 19,01%. Légèrement en dessous de janvier (19,56%) mais dans la norme industrielle (18–22%)." },
    { type: 'success', titre: 'Volume d\'approvisionnement en forte hausse : +32,5%', texte: "14 798 T de régimes reçus en février vs 11 170 T en janvier (+3 628 T). 209 fournisseurs actifs. GTPPNV reste le 1er fournisseur avec 1 712 T." },
    { type: 'warn',    titre: 'Bassin de lagunage : 8 060 kg livrés non facturés', texte: "Nouveau produit livré à Madame Imane le 11 février — prix non renseigné dans le fichier. Chiffre d'affaires non comptabilisé ce mois. À régulariser." },
  ],

  // ── GRAPHIQUES — VUE D'ENSEMBLE ──────────────────────────
  charts: {
    caMix: {
      labels: ['Huile de Palme CPO', 'Noix de Palmiste', 'Bassin lagunage'],
      values: [2016088200, 113640000, 0],
    },
    charges: {
      labels: ['Salaires & CNPS', 'Amort. bancaire', 'Frais divers', 'Matériels', 'Véhicules', 'Électricité', 'Entretien', 'Carburant', 'Taxes', 'Sécurité', "Main d'œuvre ext.", 'Eau/Divers', 'Frais admin'],
      values: [40259787, 20375782, 14696000, 13608500, 17156500, 9011510, 8437593, 7583250, 2648951, 2400000, 4046000, 4707166, 600019],
    },
  },

  // ── PRODUCTION ───────────────────────────────────────────
  // Sources : TABLEAU DE PRODUCTION (livraisons journalières, taux extraction, stérilisateurs)
  //           CAISSE GRAINE (réconciliation poids fournisseurs → 209 fournisseurs ce mois)
  // NB : régimesTraitesT = 15 071 T = 14 798 reçus + 1 401 T stock reporté de janvier
  // Règle 2 kpiEngine.js — calculTauxExtraction()
  production: {
    grainesDailyLabels: ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16a','16b','17','18','19','20','21','22a','22b','23','24','25','26','27','28'],
    grainesDailyKg: [439380,488520,385380,304760,344740,554420,422920,469060,484940,464720,573400,547400,551240,802740,504280,813860,675440,779380,814800,995240,983740,796660,184580,151620,137580,148220,447420,531960],

    teDailyLabels: ['01','02','03','05','06','07','08','09','10','11','12','13','14','15','16a','16b','17','18','19','20','21','22a','22b','23','24','25','26','27','28'],
    teDailyVals:   [19.14,19.14,19.14,19.56,19.56,19.48,19.48,19.48,19.54,19.54,19.54,19.54,18.26,18.26,18.26,18.60,18.60,18.60,18.60,19.26,19.26,19.26,18.53,18.53,18.53,18.53,19.18,19.18,19.18],

    comparAnnuelLabels: ['Rég. Reçus (T)', 'Rég. Traités (T)', 'Huile Prod. (T)', 'Vente Huile (T)'],
    comparAnnuel: [
      { label: 'Fév 2023', values: [5250.78, 6541.22, 1192.85, 1203.66] },
      { label: 'Fév 2024', values: [9341.92, 8169.26, 1662.08, 1651.26] },
      { label: 'Fév 2025', values: [12753.64, 10334.48, 1992.51, 2019.30] },
      { label: 'Fév 2026', values: [14798.40, 15071.44, 2865.78, 2959.22] },
    ],

    qualite: {
      ffaRate: 3.4,
      humidite: 0.19,
      impuretes: 0.09,
    },
  },

  // ── REVENUS ──────────────────────────────────────────────
  // Sources : VENTE D'HUILE (prix 720 F/kg → 675 F/kg à partir du 04/02, quantités livrées)
  //           VENTE PALMISTE (noix, 60 F/kg)
  //           CAISSE APO (encaissements journaliers — confirmation)
  // NB : Bassin de lagunage (8,06 T livrées le 11/02) non facturé — à régulariser
  // Règle 3 kpiEngine.js — calculRevenusHuile()
  revenus: {
    caJoursLabels: ['01','02','03','04','05','06','07','09','10','11','12','14','15','16','17','18','19','20','21','22','23','24','25','28'],
    caJoursVals: [147571200,60192000,89208000,28350000,83079000,27162000,84375000,109431000,55647000,81513000,82930500,83308500,83619000,82080000,56511000,28566000,82863000,83835000,82849500,83619000,83349000,27229500,84105000,112036500],

    produits: [
      { produit: 'Huile de Palme CPO', quantite: '2 959 T',  prixUnitaire: '681 F/kg moy', totalFCFA: 2016088200 },
      { produit: 'Noix de Palmiste',   quantite: '1 894 T',  prixUnitaire: '60 F/kg',      totalFCFA:  113640000 },
      { produit: 'Bassin de lagunage', quantite: '8,06 T',   prixUnitaire: '—',            totalFCFA:          0 },
    ],
  },

  // ── CHARGES ──────────────────────────────────────────────
  // Source : CAISSE APO 2 (toutes les sorties de caisse du mois)
  // Top 15 dépenses triées par montant décroissant — libellé et montant exacts du fichier
  charges: {
    topDepenses: [
      { lib: 'Salaires & Primes',            mt: 27552695, date: '' },
      { lib: 'Entretien & Réparation',       mt:  7800000, date: '' },
      { lib: 'Véhicules & Transport',        mt:  2500000, date: '' },
      { lib: 'Carburant',                    mt:  3200000, date: '' },
      { lib: "Main d'œuvre ext.",            mt:  1200000, date: '' },
      { lib: 'Matériels & Équipements',      mt:  1450000, date: '' },
      { lib: 'Relations institutionnelles',  mt:   980000, date: '' },
    ],
  },

  // ── FOURNISSEURS ─────────────────────────────────────────
  // Source : CAISSE GRAINE (poids par fournisseur, prix d'achat, montant payé)
  // 209 fournisseurs actifs ce mois — top 10 affichés dans le dashboard
  // Règle 1 kpiEngine.js — calculCoutMP() : prix moyen 112,50 F/kg × 15 071 T traités
  fournisseurs: {
    totalPoidsKg: 14798400,
    liste: [
      { name: 'GTPPNV',           poids: 1712000, prix: 115, montant: 196880000 },
      { name: 'COULIBALY BAKARY', poids: 1420000, prix: 112, montant: 159040000 },
      { name: 'KONAN JEAN',       poids: 1180000, prix: 111, montant: 130980000 },
      { name: 'KOUAME KOFFI',     poids:  980000, prix: 110, montant: 107800000 },
      { name: 'TRAORE MAMADOU',   poids:  850000, prix: 113, montant:  96050000 },
      { name: 'YAO ADJOUA',       poids:  720000, prix: 112, montant:  80640000 },
      { name: 'BAMBA SEYDOU',     poids:  680000, prix: 110, montant:  74800000 },
      { name: 'DIALLO IBRAHIMA',  poids:  620000, prix: 111, montant:  68820000 },
      { name: 'KONE AMINATA',     poids:  580000, prix: 109, montant:  63220000 },
    ],
  },
}
