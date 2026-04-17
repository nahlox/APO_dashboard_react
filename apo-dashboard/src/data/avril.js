// ============================================================
// APO — DONNÉES AVRIL 2026  ⚠️ MOIS PARTIEL (données au 16/04)
// ── SOURCES EXCEL ──────────────────────────────────────────
//  Compta   : ~/Dropbox/APO/Compta/2026/
//   ├─ CAISSE GRAINES 2026.xlsx           (sheet: CAISSE GRAINE AVRIL)
//   ├─ CAISSE APO 2026.xlsx               (sheet: CAISSE APO)
//   ├─ CAISSE 2 APO 2026.xlsx             (sheet: CAISSE 2 APO)
//   ├─ VENTE D'HUILE APO SARCI 2026.xlsx  (sheet: VENTE D'HUILE 2026)
//   └─ VENTE NOIX DE PALMISTE 2026.xlsx   (sheet: VENTE PALMISTE AVRIL)
//  Production: ~/Dropbox/APO/Rapport de Production/Rapport des production 2026/
//   └─ Tableau de production APO 2026.xlsx (sheet: AVRIL 2026)
// NB : Prix huile baissé de 620 → 560 F/kg à partir du 04/04
// NB : 40 780 kg huile acidité élevée vendus à 560 F/kg hors SARCI le 02/04
// NB : Livraisons du 15/04 (247 540 kg APO) en attente de pesée SARCI → CA non comptabilisé
// NB : Salaires du mois pas encore payés (fin avril) → charges temporairement basses
// ── DOCS ───────────────────────────────────────────────────
// Cartographie ETL complète : voir src/data/etlSources.js
// Règles de calcul         : voir src/lib/kpiEngine.js
// ============================================================

export const avrilData = {

  // ── MÉTADONNÉES ETL ───────────────────────────────────────
  _etl: {
    mois:    'avril',
    annee:   2026,
    partiel: true,
    dateDerniereMaj: '2026-04-16',
    sources: [
      'CAISSE GRAINE',
      'CAISSE APO',
      'CAISSE APO 2',
      "VENTE D'HUILE",
      'TABLEAU DE PRODUCTION',
      'VENTE PALMISTE',
    ],
    noteStock: 'Stock régimes reporté de mars : 1 072 T. Stock huile reporté de mars : 300 T (1 000 T + 300 T tank).',
    notePrix:  'Prix CPO baissé de 620 F/kg (jan–mars, 01-03/04) à 560 F/kg à partir du 04/04.',
    notePendant: '247 540 kg livrés le 15/04 sans pesée SARCI confirmée → revenus non inclus.',
    sectionSources: {
      kpis:         ['CAISSE GRAINE', 'CAISSE APO', 'CAISSE APO 2', "VENTE D'HUILE", 'TABLEAU DE PRODUCTION', 'VENTE PALMISTE'],
      pnl:          ['CAISSE GRAINE', 'CAISSE APO', 'CAISSE APO 2', "VENTE D'HUILE", 'VENTE PALMISTE'],
      production:   ['TABLEAU DE PRODUCTION', 'CAISSE GRAINE'],
      revenus:      ["VENTE D'HUILE", 'VENTE PALMISTE'],
      charges:      ['CAISSE APO', 'CAISSE APO 2'],
      fournisseurs: ['CAISSE GRAINE'],
    },
  },

  // ── KPIs PRINCIPAUX ──────────────────────────────────────
  // Sources : CAISSE GRAINE (coût MP, fournisseurs) · CAISSE APO (charges)
  //           CAISSE APO 2 (charges, main d'œuvre) · VENTE D'HUILE (CA huile)
  //           TABLEAU PRODUCTION · VENTE PALMISTE
  // NB : Données au 16/04 — salaires et charges fin de mois non encore enregistrés
  // NB : Prix CPO 560 F/kg dès le 04/04 (vs 620 F/kg en mars) → baisse CA/T
  // NB : MP à 82,38 F/kg (vs 91,13 en mars) — poursuite de la baisse
  kpis: {
    caTotalFCFA:        799110000,
    caHuileFCFA:        734425200,
    caHuileDetail:      '575 F/kg moy × 1 277 T (620 F/kg 01–02/04, 560 F/kg dès 04/04)',
    caNoisFCFA:          64684800,
    caBassinFCFA:               0,   // aucune livraison bassin enregistrée au 16/04
    caHuileFlorentinFCFA:       0,   // aucune livraison florentin au 16/04
    coutMPFCFA:         529540380,
    coutMPDetail:       '82,38 F/kg × 6 428 T achetées (caisse graines au 16/04)',
    chargesExplFCFA:     19290628,
    amortissementFCFA:          0,   // non encore enregistré (mois partiel)
    resultatNetFCFA:    250278992,
    margeNette:               31.3,  // ⚠️ élevée car salaires fin de mois non payés

    // Production (données au 16/04)
    regimesRecusT:          7214,    // 7 213 940 kg reçus (production)
    regimesTraitesT:        7197,    // 7 197 337 kg traités
    stockFinMoisT:          1089,    // 1 088 865 kg régimes restants au 16/04
    stockFinMoisFCFA:    89700000,   // valorisé à 82,38 F/kg
    huileProduiteT:         1476,    // 1 475 614 kg produits
    huileVendueT:           1604,    // 1 604 480 kg livrés (incl. stock mars reporté)
    stockHuileT:             171,    // 171 281 kg en tank au 16/04
    tauxExtraction:         20.50,
    nbCamions:               445,
    palmisteProduitT:        720,    // 719 706 kg produits
    palmisteVenduT:         1078,    // 1 078 080 kg vendus (incl. stock mars)
    nbSterilisateurs:        267,
  },

  // ── COMPTE DE RÉSULTAT PAR TONNE ─────────────────────────
  // Règle 4 kpiEngine.js — calculPnL() · Dénominateur = 1 476 T PRODUITES
  // ⚠️ Mois partiel au 16/04 — salaires et amortissements non inclus
  pnl: {
    baseLabel: "1 476 tonnes d'huile produites (au 16/04)",
    status:    'Mois en cours',

    // ── I. CHIFFRE D'AFFAIRES ─────────────────────────────
    produits: [
      { label: 'Huile de palme CPO (575 F/kg moy × 1 277 T)',              pertonne: 497000, total:  734425200 },
      { label: 'Noix de palmiste (60 F/kg × 1 078 T)',                     pertonne:  44000, total:   64684800 },
    ],
    totalProduitsTotal:   799110000,
    totalProduitsTonne:     541000,

    // ── II. COÛT MATIÈRE PREMIÈRE ─────────────────────────
    coutMP: { label: 'Régimes achetés (82,38 F/kg × 6 428 T)', pertonne: 359000, total: -529540380 },

    // ── MARGE BRUTE (I − II) ──────────────────────────────
    margeBruteTotal:    269569620,   // 799 110 000 − 529 540 380
    margeBruteTonne:      183000,
    margeBrutePct:           33.7,

    // ── III. CHARGES D'EXPLOITATION ──────────────────────
    // ⚠️ Salaires fin de mois non payés → charges sous-estimées
    chargesExploitation: [
      { label: 'Salaires & charges sociales (acomptes/fête)',  pertonne:  1000, total:    -989978 },
      { label: 'Carburant',                                    pertonne:  2000, total:   -3106000 },
      { label: 'Entretien & réparation matériels',             pertonne:  4000, total:   -6205150 },
      { label: 'Travaux & construction (garage, bâtiment)',    pertonne:  2000, total:   -3551000 },
      { label: 'Frais divers & administratifs',                pertonne:  4000, total:   -5438500 },
    ],
    totalChargesExpTotal: -19290628,
    totalChargesExpTonne:   -13000,

    // ── EBE / EBITDA ──────────────────────────────────────
    ebitdaTotal:   250278992,
    ebitdaTonne:      170000,
    ebitdaPct:           31.3,

    // ── IV. AMORTISSEMENTS ────────────────────────────────
    amortissements: [
      { label: 'Amortissement prêt bancaire (non encore enregistré)', pertonne: 0, total: 0 },
    ],
    totalAmortTotal: 0,
    totalAmortTonne: 0,

    // ── RÉSULTAT NET ──────────────────────────────────────
    totalChargesTotal:  -548831008,
    totalChargesTonne:    -372000,
    resultatTotal:        250278992,
    resultatTonne:         170000,

    notes: [
      { label: 'Marge brute',      value: '33,7%',                               color: 'green' },
      { label: 'Marge nette',      value: '31,3% (⚠️ mois partiel)',             color: 'gold'  },
      { label: 'Prix huile moy.',  value: '575 F/kg (620→560 F/kg en cours)',    color: 'warn'  },
      { label: 'Prix MP',          value: '82,38 F/kg (record bas 2026)',        color: 'green' },
    ],
  },

  // ── ALERTES ──────────────────────────────────────────────
  alertes: [
    { type: 'info',    titre: '⚠️ Données partielles au 16/04/2026', texte: "Ce tableau de bord affiche les données comptables enregistrées jusqu'au 16 avril 2026. Les salaires de fin de mois, les charges à venir et les livraisons du 15/04 (247 540 kg) non encore pesées par SARCI ne sont pas inclus. Les KPIs seront consolidés en fin de mois." },
    { type: 'warn',    titre: 'Prix CPO baissé à 560 F/kg dès le 04/04', texte: "Le prix de vente de l'huile CPO à SARCI est passé de 620 F/kg à 560 F/kg à partir du 4 avril (−9,7%). Cela impacte directement le CA par tonne. Les 3 premières livraisons d'avril (168 T) ont encore été vendues à 620 F/kg." },
    { type: 'success', titre: "Prix régimes au plus bas : 82,38 F/kg (vs 91,13 mars)", texte: "Le coût matière première continue de baisser. À 82,38 F/kg, c'est le niveau le plus bas depuis début 2026. Cette baisse compense partiellement la réduction du prix de vente. Marge brute de 33,7% maintenue malgré la pression sur les prix CPO." },
    { type: 'success', titre: 'Production forte : TE moyen 20,50%', texte: "Le taux d'extraction démarre fort en avril à 22,16% (1-2 avril) puis se stabilise autour de 19-21%. Production de 1 476 T d'huile sur les 16 premiers jours. Le stock de 300 T reporté de mars a été intégralement traité." },
    { type: 'warn',    titre: '247 T livrées le 15/04 sans confirmation SARCI', texte: "6 camions livrés le 15/04 (42 000+40 980+40 680+41 760+41 340+40 780 kg = 247 540 kg APO) sont en attente de pesée SARCI. Le montant (~138,6 M FCFA à 560 F/kg) sera comptabilisé à la prochaine mise à jour." },
  ],

  // ── GRAPHIQUES — VUE D'ENSEMBLE ──────────────────────────
  charts: {
    caMix: {
      labels: ['Huile de Palme CPO', 'Noix de Palmiste'],
      values: [734425200, 64684800],
    },
    charges: {
      labels: ['Entretien & Matériels', 'Carburant', 'Travaux & Construction', 'Frais divers', 'Salaires (acomptes)'],
      values: [6205150, 3106000, 3551000, 5438500, 989978],
    },
  },

  // ── PRODUCTION ───────────────────────────────────────────
  // Source : TABLEAU DE PRODUCTION (colonnes C–R, sheet AVRIL 2026)
  //          CAISSE GRAINE AVRIL (445 camions, 6 428 280 kg achetés)
  // NB : Données du 01/04 au 16/04 uniquement
  // NB : Certains jours ont deux lignes (2 stérilisateurs) → agrégées
  production: {
    grainesDailyLabels: ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30'],
    grainesDailyKg:     [409880,567520,617960,464200,366180,238760,484120,476300,352040,436660,506640,428480,524480,473660,81400,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],

    teDailyLabels: ['01–02','03a','03b–04','05a','05b–07','08–09','10a','10b–11a','11b–13a','13b–16'],
    teDailyVals:   [22.16, 22.16, 19.21, 19.21, 19.93, 20.55, 20.55, 18.56, 20.72, 21.68],

    comparAnnuelLabels: ['Rég. Reçus (T)', 'Rég. Traités (T)', 'Huile Prod. (T)', 'Vente Huile (T)'],
    comparAnnuel: [
      { label: 'Avril 2023', values: [10200, 9800, 1850, 1900] },
      { label: 'Avril 2024', values: [11500, 11200, 2150, 2100] },
      { label: 'Avril 2025', values: [14200, 13800, 2650, 2580] },
      { label: 'Avril 2026 (16j)', values: [7214, 7197, 1476, 1604] },
    ],

    qualite: {
      ffaRate:   2.5,
      humidite:  0.20,
      impuretes: 0.09,
    },
  },

  // ── REVENUS ──────────────────────────────────────────────
  // Sources : VENTE D'HUILE 2026 (après TOTAL MARS ligne r322)
  //           Huile SARCI : 711 588 400 FCFA (01–13 avril, hors 15/04 pending)
  //           Huile acidité : 22 836 800 FCFA (40 780 kg × 560 F/kg, 02/04)
  //           VENTE PALMISTE AVRIL : 1 078 080 kg × 60 F/kg = 64 684 800 FCFA
  revenus: {
    caJoursLabels: ['01','02','04','05','07','10','11','12','13'],
    caJoursVals:   [105052800, 48814800, 121312800, 23688000, 136348800, 46468800, 139171200, 45169600, 68398400],

    produits: [
      { produit: 'Huile de Palme CPO',  quantite: '1 277 T',  prixUnitaire: '575 F/kg moy (620→560)', totalFCFA: 734425200 },
      { produit: 'Noix de Palmiste',    quantite: '1 078 T',  prixUnitaire: '60 F/kg',               totalFCFA:  64684800 },
    ],
  },

  // ── CHARGES ──────────────────────────────────────────────
  // Sources : CAISSE APO 2 (sorties caisse, hors appros inter-caisses)
  //           CAISSE APO (carburant, entretien, petits achats)
  // ⚠️ Salaires du mois non encore payés (fin avril) — données partielles
  charges: {
    topDepenses: [
      { date: '16/04', lib: 'Achat carburant (lot 09-15 avril)',                        mt: 1485000 },
      { date: '14/04', lib: 'Achat fournitures diverses (atelier)',                     mt: 1183000 },
      { date: '09/04', lib: 'Achat carburant (lot 31/03-08 avril)',                     mt: 1215000 },
      { date: '02/04', lib: "Acompte main d'œuvre maçonnerie garage engins",           mt: 1000000 },
      { date: '16/04', lib: "Acompte main d'œuvre maçonnerie garage engins (2ème)",    mt: 1000000 },
      { date: '09/04', lib: 'Achat téflon (Chinois Touré)',                             mt:  900000 },
      { date: '09/04', lib: 'Paie personnel jour férié 06/04/2026',                    mt:  789978 },
      { date: '09/04', lib: 'Travaux bassin de lagunage',                              mt:  690000 },
      { date: '13/04', lib: 'Achat matériels dalle maison DG usine APO',               mt:  612000 },
      { date: '02/04', lib: 'Entretien pont bascule usine APO',                        mt:  600000 },
      { date: '10/04', lib: 'Achat gravier travaux nouveau garage',                    mt:  450000 },
      { date: '07/04', lib: 'Achat ciment travaux garage engins (Caisse 1)',           mt:  475000 },
      { date: '14/04', lib: 'Achat câble & accessoires câblage téléphone',             mt:  435150 },
      { date: '07/04', lib: 'Don pour forage village Emilkro (1er)',                   mt:  400000 },
      { date: '14/04', lib: 'Don pour forage village Emilkro (2ème)',                  mt:  400000 },
    ],
  },

  // ── FOURNISSEURS ─────────────────────────────────────────
  // Source : CAISSE GRAINE AVRIL (445 camions, 6 428 280 kg, 529 540 380 FCFA)
  // Prix moyen pondéré : 82,38 F/kg — baisse vs 91,13 F/kg en mars
  fournisseurs: {
    totalPoidsKg: 6428280,
    liste: [
      { name: 'GTPPNV',               poids:  915640, prix:  86, montant:  78433140 },
      { name: 'SOCAYAB',              poids:  725980, prix:  78, montant:  56626440 },
      { name: '3AP',                  poids:  462180, prix:  82, montant:  37946440 },
      { name: 'ZORE HAMADOU',         poids:  402220, prix:  86, montant:  34494520 },
      { name: 'WENDE TRANSPORT',      poids:  278360, prix:  78, montant:  21712080 },
      { name: 'PALM IVOIRE',          poids:  256180, prix:  86, montant:  22033860 },
      { name: 'SCOOPAKAM',            poids:  232500, prix:  78, montant:  18135000 },
      { name: 'KOUSSOUBE BOUREIMA',   poids:  211800, prix:  84, montant:  17768080 },
      { name: 'COULIBALY YAYA',       poids:  187400, prix:  85, montant:  16006040 },
      { name: 'BENIELLE',             poids:  177660, prix:  81, montant:  14303440 },
    ],
  },
}
