// ============================================================
// APO — DONNÉES MARS 2026
// ── SOURCES EXCEL ──────────────────────────────────────────
//  Compta   : ~/Dropbox/APO/Compta/2026/
//   ├─ CAISSE GRAINES 2026.xlsx           (sheet: CAISSE GRAINE MARS)
//   ├─ CAISSE APO 2026.xlsx               (sheet: CAISSE APO)
//   ├─ CAISSE 2 APO 2026.xlsx             (sheet: CAISSE 2 APO)
//   ├─ VENTE D'HUILE APO SARCI 2026.xlsx  (sheet: VENTE D'HUILE 2026)
//   ├─ VENTE NOIX DE PALMISTE 2026.xlsx   (sheet: VENTE NOIX DE PALMISTE MARS)
//   └─ VENTE DE BASSIN DE LAGUNAGE.xlsx   (sheet: VENTE BASSIN MARS)
//  Production: ~/Dropbox/APO/Rapport de Production/Rapport des production 2026/
//   └─ Tableau de production APO 2026.xlsx (sheet: MARS 2026)
// NB : VENTE DE FLORENTIN 2026.xlsx — aucune livraison florentin en mars
// NB : CLIENTS PEPINIERE — activité saisonnière (janvier uniquement)
// NB : 46 980 kg huile à acidité élevée vendus à 560–600 F/kg (hors SARCI)
// ── DOCS ───────────────────────────────────────────────────
// Cartographie ETL complète : voir src/data/etlSources.js
// Règles de calcul         : voir src/lib/kpiEngine.js
// ============================================================

export const marsData = {

  // ── MÉTADONNÉES ETL ───────────────────────────────────────
  _etl: {
    mois:    'mars',
    annee:   2026,
    sources: [
      'CAISSE GRAINE',
      'CAISSE APO',
      'CAISSE APO 2',
      "VENTE D'HUILE",
      'TABLEAU DE PRODUCTION',
      'VENTE PALMISTE',
      'VENTE BASSIN',
    ],
    noteStock: 'Régimes traités inclus le stock de 1 128 T reporté de février (TABLEAU DE PRODUCTION)',
    sectionSources: {
      kpis:         ['CAISSE GRAINE', 'CAISSE APO', 'CAISSE APO 2', "VENTE D'HUILE", 'TABLEAU DE PRODUCTION', 'VENTE PALMISTE', 'VENTE BASSIN'],
      pnl:          ['CAISSE GRAINE', 'CAISSE APO', 'CAISSE APO 2', "VENTE D'HUILE", 'VENTE PALMISTE', 'VENTE BASSIN'],
      production:   ['TABLEAU DE PRODUCTION', 'CAISSE GRAINE'],
      revenus:      ["VENTE D'HUILE", 'VENTE PALMISTE', 'VENTE BASSIN'],
      charges:      ['CAISSE APO', 'CAISSE APO 2'],
      fournisseurs: ['CAISSE GRAINE'],
    },
  },

  // ── KPIs PRINCIPAUX ──────────────────────────────────────
  // Sources : CAISSE GRAINE (coût MP, fournisseurs) · CAISSE APO (charges opérat.)
  //           CAISSE APO 2 (charges, salaires) · VENTE D'HUILE (CA huile 620 F/kg)
  //           TABLEAU PRODUCTION · VENTE PALMISTE · VENTE BASSIN
  // NB : Prix MP tombé à 91,13 F/kg (vs 112,50 fév, 122,73 janv) → marge record
  // NB : 46 980 kg huile acide vendus à 560–600 F/kg (TOTAL HUILE ACIDE feuille prod.)
  kpis: {
    caTotalFCFA:       1554896400,
    caHuileFCFA:       1481616000,
    caHuileDetail:     '619 F/kg moy × 2 395 T (620 F/kg SARCI, 560–600 F/kg huile acide)',
    caNoisFCFA:           66440400,
    caBassinFCFA:          6840000,   // 34 860 kg livrés, avg 196 F/kg
    caHuileFlorentinFCFA:         0,  // aucune livraison florentin en mars
    coutMPFCFA:        1203191000,
    coutMPDetail:      '91,13 F/kg × 13 204 T traités',
    chargesExplFCFA:    152005913,
    amortissementFCFA:   20517611,
    resultatNetFCFA:    179181876,
    margeNette:              11.5,

    // Production
    regimesRecusT:        13148,   // 13 148 400 kg reçus (825 camions)
    regimesTraitesT:      13204,   // 13 203 741 kg traités (incl. 1 128 T stock fév.)
    stockFinMoisT:         1072,   // 1 072 259 kg régimes restants fin mars
    stockFinMoisFCFA:  97700000,   // valorisé à 91,13 F/kg
    huileProduiteT:        2538,   // 2 537 951 kg
    huileVendueT:          2395,   // 2 395 420 kg (livraisons citerne SARCI + acide)
    stockHuileT:            300,   // 300 232 kg en tank fin mars (1000T + 300T)
    tauxExtraction:        19.22,
    nbCamions:              825,
    palmisteProduitT:      1320,   // 1 320 374 kg
    palmisteVenduT:        1137,   // 1 136 900 kg
    nbSterilisateurs:       489,
  },

  // ── COMPTE DE RÉSULTAT PAR TONNE ─────────────────────────
  // Règle 4 kpiEngine.js — calculPnL() · Dénominateur = 2 538 T PRODUITES
  pnl: {
    baseLabel: "2 538 tonnes d'huile produites",
    status:    'Résultat Exceptionnel',

    // ── I. CHIFFRE D'AFFAIRES ─────────────────────────────
    produits: [
      { label: 'Huile de palme CPO (619 F/kg moy × 2 395 T)',           pertonne: 584000, total:  1481616000 },
      { label: 'Noix de palmiste (60 F/kg × 1 107 T)',                   pertonne:  26000, total:    66440400 },
      { label: 'Bassin de lagunage (196 F/kg moy × 34,9 T)',             pertonne:   3000, total:     6840000 },
    ],
    totalProduitsTotal:  1554896400,
    totalProduitsTonne:    613000,

    // ── II. COÛT MATIÈRE PREMIÈRE ─────────────────────────
    coutMP: { label: 'Régimes traités (91,13 F/kg × 13 204 T)', pertonne: 474000, total: -1203191000 },

    // ── MARGE BRUTE (I − II) ──────────────────────────────
    margeBruteTotal:   351705400,   // 1 554 896 400 − 1 203 191 000
    margeBruteTonne:     139000,
    margeBrutePct:         22.6,

    // ── III. CHARGES D'EXPLOITATION ──────────────────────
    chargesExploitation: [
      { label: 'Salaires & charges sociales',       pertonne: 12000, total:  -30206582 },
      { label: 'Carburant',                         pertonne:  3000, total:   -8892788 },
      { label: 'Entretien & réparation',            pertonne:  5000, total:  -11496000 },
      { label: 'Fournitures & matériaux',           pertonne:  2000, total:   -5362500 },
      { label: 'Frais divers & administratifs',     pertonne: 10000, total:  -24831668 },
      // ── Charges bancaires (SGCI/BDA) ──
      { label: 'Entretien & réparation (banque)',    pertonne:  6000, total:  -14103894 },
      { label: 'Électricité (CIE)',                  pertonne:  5000, total:  -12843850 },
      { label: 'Salaires & CNPS (banque)',           pertonne:  4000, total:  -10806754 },
      { label: 'Matériels & équipements (banque)',   pertonne:  4000, total:   -9927983 },
      { label: 'Assurances (banque)',                pertonne:  3000, total:   -8809053 },
      { label: 'Véhicules & engins (banque)',        pertonne:  3000, total:   -6930000 },
      { label: 'Taxes & impôts',                    pertonne:  2000, total:   -3883950 },
      { label: 'Frais admin & relationnels (banque)',pertonne:  2000, total:   -3910891 },
    ],
    totalChargesExpTotal: -152005913,
    totalChargesExpTonne:   -60000,

    // ── EBE / EBITDA (Marge Brute − Charges exploitation) ─
    ebitdaTotal:   199699487,   // 351 705 400 − 152 005 913
    ebitdaTonne:      79000,
    ebitdaPct:          12.8,

    // ── IV. AMORTISSEMENTS & CHARGES FINANCIÈRES ─────────
    amortissements: [
      { label: 'Amortissement prêt bancaire (ECHEANCE SGCI/BDA)', pertonne: 8000, total: -20191988 },
      { label: 'Agios & frais financiers (SGCI/BDA)',              pertonne:    0, total:   -325623 },
    ],
    totalAmortTotal: -20517611,
    totalAmortTonne:    -8000,

    // ── RÉSULTAT NET (EBITDA − Amortissements) ────────────
    totalChargesTotal:  -1375714524,
    totalChargesTonne:     -542000,
    resultatTotal:          179181876,
    resultatTonne:            71000,

    notes: [
      { label: 'Marge brute',     value: '22,6%',                          color: 'green' },
      { label: 'EBITDA',          value: '12,8%',                          color: 'gold'  },
      { label: 'Marge nette',     value: '11,5%',                          color: 'green' },
      { label: 'Prix huile moy.', value: '619 F/kg (majorit. 620 SARCI)', color: 'gold'  },
    ],
  },

  // ── ALERTES ──────────────────────────────────────────────
  alertes: [
    { type: 'success', titre: 'Résultat net +250,7 M FCFA — marge nette 16,1%', texte: "Meilleure marge nette de l'exercice 2026, portée par la forte baisse du prix des régimes à 91,13 F/kg (vs 112,50 en février, soit −18,9%). Malgré un volume traité inférieur à février, la rentabilité est exceptionnelle. Résultat cumulé jan–mars : 628,6 M FCFA." },
    { type: 'success', titre: 'Prix matière première au plus bas : 91,13 F/kg', texte: "Baisse significative du coût des régimes par rapport à février (112,50 F/kg) et janvier (122,73 F/kg). Ce recul explique à lui seul la progression de la marge brute de 20,4% → 22,6%. À surveiller : durabilité de ce niveau de prix au T2." },
    { type: 'warn',    titre: 'Production en recul vs février : −328 T huile (−11,4%)', texte: "2 538 T produites en mars contre 2 866 T en février. Les régimes reçus ont reculé à 13 148 T (vs 14 798 T). Le stock reporté de février (1 128 T) a partiellement compensé. Stock fin mars : 1 072 T régimes + 300 T huile en tank." },
    { type: 'warn',    titre: 'Huile à acidité élevée : 46 980 kg vendus hors SARCI', texte: "46 980 kg d'huile à acidité élevée écoulés à 560–600 F/kg (vs 620 F/kg prix standard SARCI), soit un manque à gagner estimé à 940 000 – 2 990 000 FCFA vs prix normal. À surveiller : qualité des régimes approvisionnés et paramètres de la chaîne d'extraction." },
    { type: 'success', titre: "Taux d'extraction amélioré en fin de mois : 22,16%", texte: "Le TE est passé de 18,16% début mars à 22,16% fin mars, progressant régulièrement au cours du mois. Moyenne mensuelle 19,22% (dans la norme industrielle 18–22%). Progression notable par rapport à janvier (19,56%) et février (19,01%)." },
  ],

  // ── GRAPHIQUES — VUE D'ENSEMBLE ──────────────────────────
  charts: {
    caMix: {
      labels: ['Huile de Palme CPO', 'Noix de Palmiste', 'Bassin de lagunage'],
      values: [1481616000, 66440400, 6840000],
    },
    charges: {
      labels: ['Salaires & CNPS', 'Amort. bancaire', 'Frais divers', 'Entretien & Rép.', 'Électricité', 'Matériels', 'Assurances', 'Véhicules', 'Carburant', 'Fournitures', 'Taxes', 'Frais admin'],
      values: [41013336, 20517611, 24831668, 25599894, 12843850, 9927983, 8809053, 6930000, 8892788, 5362500, 3883950, 3910891],
    },
  },

  // ── PRODUCTION ───────────────────────────────────────────
  // Sources : TABLEAU DE PRODUCTION (colonnes C–R, sheet MARS 2026)
  //           CAISSE GRAINE (825 camions, 13 037 440 kg achetés)
  // NB : Certains jours ont deux lignes (répartition entre 2 stérilisateurs)
  //      → valeurs agrégées par date pour les graphiques journaliers
  // Règle 2 kpiEngine.js — calculTauxExtraction()
  production: {
    grainesDailyLabels: ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31'],
    grainesDailyKg:     [565440,1092720,732720,271960,420360,564960,490900,787020,463980,607080,570180,359840,163740,207980,627200,215240,386760,263880,383860,133840,211300,160560,251780,136460,239480,273800,446460,509760,469480,594840,544820],

    teDailyLabels: ['01–03','04a','04b–09','10a','10b–13a','13b–14','15a','15b–19a','19b–21','23–24','26–28a','28b–30a','30b–31'],
    teDailyVals:   [18.16, 18.16, 18.00, 18.08, 18.08, 18.78, 18.78, 21.23, 21.70, 21.77, 19.25, 19.74, 22.16],

    comparAnnuelLabels: ['Rég. Reçus (T)', 'Rég. Traités (T)', 'Huile Prod. (T)', 'Vente Huile (T)'],
    comparAnnuel: [
      { label: 'Mars 2023', values: [11680, 10848, 2050, 2111] },
      { label: 'Mars 2024', values: [10250, 11114, 2338, 2336] },
      { label: 'Mars 2025', values: [16547, 16182, 2927, 2869] },
      { label: 'Mars 2026', values: [13148, 13204, 2538, 2395] },
    ],

    qualite: {
      ffaRate:   3.8,   // huile acide (46 980 kg vendus séparément) → légère dégradation
      humidite:  0.20,
      impuretes: 0.09,
    },
  },

  // ── REVENUS ──────────────────────────────────────────────
  // Sources : VENTE D'HUILE (TOTAL MOUVEMENTS MARS : 2 395 420 kg, 1 481 616 000 FCFA)
  //           VENTE PALMISTE (1 107 340 kg × 60 F/kg = 66 440 400 FCFA)
  //           VENTE BASSIN (34 860 kg, avg 196 F/kg = 6 840 000 FCFA)
  // Règle 3 kpiEngine.js — calculRevenusHuile()
  revenus: {
    caJoursLabels: ['01','02','03','07','08','10','11','12','14','15','16','18','22','23','24','25','26','28','29','30','31'],
    caJoursVals:   [24638800,50778000,129022000,100898800,75478800,76185600,51894000,50641600,126368400,76235200,79524400,25668000,128761600,77624000,51174800,25544000,127521600,103354000,51968400,25060400,23273600],

    produits: [
      { produit: 'Huile de Palme CPO',     quantite: '2 395 T',  prixUnitaire: '619 F/kg moy', totalFCFA: 1481616000 },
      { produit: 'Noix de Palmiste',       quantite: '1 107 T',  prixUnitaire: '60 F/kg',      totalFCFA:   66440400 },
      { produit: 'Bassin de lagunage',     quantite: '34,9 T',   prixUnitaire: '196 F/kg moy', totalFCFA:    6840000 },
    ],
  },

  // ── CHARGES ──────────────────────────────────────────────
  // Sources : CAISSE APO 2 (sorties caisse — hors transferts inter-caisses)
  //           CAISSE APO (carburant, entretien, petits achats)
  // Top 15 dépenses réelles (hors virements inter-caisses de 200 M FCFA)
  charges: {
    topDepenses: [
      { lib: 'Salaires & Primes',            mt: 29474525, date: '' },
      { lib: 'Carburant',                    mt:  5377525, date: '' },
      { lib: 'Matériels & Équipements',      mt:  3000000, date: '' },
      { lib: 'Véhicules & Transport',        mt:  2900000, date: '' },
      { lib: 'Construction & Travaux',       mt:  2500000, date: '' },
      { lib: 'Relations institutionnelles',  mt:  4000000, date: '' },
      { lib: "Main d'œuvre ext.",            mt:  1400000, date: '' },
      { lib: 'Entretien & Réparation',       mt:   800000, date: '' },
    ],
  },

  // ── FOURNISSEURS ─────────────────────────────────────────
  // Source : CAISSE GRAINE MARS (825 camions, 13 037 440 kg achetés, 1 188 038 020 FCFA)
  // Prix moyen pondéré : 91,13 F/kg — baisse marquée vs 112,50 F/kg en février
  // Top 10 affichés sur les 825 fournisseurs/transporteurs actifs
  // Règle 1 kpiEngine.js — calculCoutMP()
  fournisseurs: {
    totalPoidsKg: 13148400,
    liste: [
      { name: 'GTPPNV',                       poids: 1285500, prix:  94, montant: 121157800 },
      { name: '3AP',                           poids: 1212800, prix:  89, montant: 107567440 },
      { name: 'ZORE HAMADOU',                  poids:  839900, prix:  93, montant:  78457560 },
      { name: 'PALM IVOIRE',                   poids:  748540, prix:  91, montant:  68149540 },
      { name: 'WENDE TRANSPORT',               poids:  678800, prix:  87, montant:  58979600 },
      { name: 'SOCAYAB',                       poids:  673740, prix:  85, montant:  56948840 },
      { name: 'SAWADOGO AMIDOU GNONGBOYO',     poids:  664560, prix:  98, montant:  64819920 },
      { name: 'BENIELLE',                      poids:  617340, prix:  89, montant:  54908380 },
      { name: 'KABORE PHILEMON',               poids:  334980, prix:  97, montant:  32394300 },
      { name: 'COULIBALY YAYA',                poids:  314240, prix:  90, montant:  28409760 },
    ],
  },
}
