// ============================================================
// APO — DONNÉES JANVIER 2026
// Source : fichiers Excel APO (production, caisse, fournisseurs)
// Règles de calcul : voir src/lib/kpiEngine.js
// ============================================================

export const janData = {
  // ── KPIs PRINCIPAUX ──────────────────────────────────────
  kpis: {
    caTotalFCFA:       1336263200,
    caHuileFCFA:       1269504000,
    caHuileDetail:     '720 F/kg × 1 763 T livrées',
    caNoisFCFA:        58171200,
    caHuileFlorentinFCFA: 8588000,
    coutMPFCFA:        1227091010,
    coutMPDetail:      '122,73 F/kg × 9 998 T traités',
    chargesExplFCFA:   61100000,
    resultatNetFCFA:   27866521,
    margeNette:        2.1,

    // Production
    regimesRecusT:     11170,
    regimesTraitesT:   9998,
    stockFinMoisT:     1401,
    stockFinMoisFCFA:  143900000,
    huileProduiteT:    1956,
    huileVendueT:      1763,
    tauxExtraction:    19.56,
    nbCamions:         675,

    // Pepiniere
    pepContratsFCFA:   80640000,
    pepEncaisséFCFA:   38394000,
    pepResteaFCFA:     42246000,
  },

  // ── COMPTE DE RÉSULTAT PAR TONNE ─────────────────────────
  // Base : 1 956 T d'huile produites
  pnl: {
    baseLabel: "1 956 tonnes d'huile produites",
    status: 'Excédent Mensuel',
    produits: [
      { label: 'Huile de palme (720 F/kg × 1 763 T livrées)',   pertonne: 649000,  total:  1269504000 },
      { label: 'Noix de palmiste (60 F/kg × 970 T)',            pertonne:  30000,  total:    58171200 },
      { label: 'Huile florentin (500 F/kg × 20,6 T)',           pertonne:   4000,  total:     8588000 },
    ],
    charges: [
      { label: 'Coût matière (122,73 F/kg × 9 998 T traités)',  pertonne: 627000,  total: -1227091010 },
      { label: 'Salaires & charges sociales',                   pertonne:  14000,  total:   -27338274 },
      { label: 'Matériels & équipements',                       pertonne:   4000,  total:    -7524800 },
      { label: "Main d'œuvre externe",                          pertonne:   3000,  total:    -5932500 },
      { label: 'Frais divers',                                  pertonne:   3000,  total:    -5045500 },
      { label: 'Carburant',                                     pertonne:   3000,  total:    -4894732 },
      { label: 'Véhicules & location engins',                   pertonne:   2000,  total:    -4270000 },
      { label: 'Eau & divers',                                  pertonne:   3000,  total:    -6107875 },
      { label: 'Amortissement prêt bancaire',                   pertonne:  10000,  total:   -20191988 },
    ],
    totalProduitsTotal:  1336263200,
    totalProduitsTonne:  683000,
    totalChargesTotal:  -1308396679,
    totalChargesTonne:  -669000,
    resultatTotal:        27866521,
    resultatTonne:         14000,
    notes: [
      { label: 'Marge nette', value: '2,1%', color: 'green' },
      { label: 'Stock régimes fin mois', value: '1 401 T (≈ 143,9 M FCFA différés sur février)', color: 'gold' },
    ],
  },

  // ── ALERTES ──────────────────────────────────────────────
  alertes: [
    { type: 'success', titre: 'Résultat positif : +27,9 M FCFA', texte: "En imputant le coût des graines sur les régimes effectivement traités (9 998 T), le résultat mensuel est positif. Les 1 400 T de stock seront valorisées en février." },
    { type: 'success', titre: "Taux d'extraction réel : 19,56%", texte: "Calculé sur régimes traités (1 955 679 kg huile ÷ 9 998 045 kg traités). Taux conforme aux standards industriels (18–22%). Performance opérationnelle solide." },
    { type: 'warn',    titre: 'Stock de graines important en fin de mois', texte: "1 400 635 kg de régimes non traités au 31 janvier (valeur : ~143,9 M FCFA). Ce stock transite vers février et représente un actif à valoriser rapidement." },
    { type: 'success', titre: 'Forte activité de collecte', texte: "675 camions reçus, montée en puissance en fin de mois (777 T le 31 jan). Signal positif pour la continuité de production en février." },
    { type: 'warn',    titre: 'Pépinière : créances à recouvrer', texte: "Sur 80,6 M FCFA de contrats pépinière, 42,2 M FCFA restent à encaisser (52%). Suivi client à renforcer." },
  ],

  // ── GRAPHIQUES — VUE D'ENSEMBLE ──────────────────────────
  charts: {
    caMix: {
      labels: ['Huile de Palme CPO', 'Noix de Palmiste', 'Huile Florentin'],
      values: [1269504000, 58171200, 8588000],
    },
    charges: {
      labels: ['Salaires', 'Amort. bancaire', 'Carburant', 'Véhicules', 'Matériels', 'Eau/divers', "Main d'œuvre"],
      values: [27338274, 20191988, 4894732, 4270000, 7524800, 6107875, 5932500],
    },
  },

  // ── PRODUCTION ───────────────────────────────────────────
  production: {
    // Livraisons journalières FFB (kg) — extraites sheet production
    grainesDailyLabels: ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31'],
    grainesDailyKg: [
      152640,343560,242880,222920,226960,392840,232040,311940,300380,
      357540,269080,413160,427700,300900,387160,438200,372240,456200,
      520000,494700,524520,490800,430200,351680,338280,398400,468080,
      471840,532400,620120,777240
    ],

    // Taux d'extraction journalier (%)
    teDailyLabels: ['01–04','05','06','07','08','09','10','11–14','15–16','17–19','20–22','23–25','26–28','29–31'],
    teDailyVals:   [19.56, 19.56, 19.56, 19.48, 19.48, 19.48, 19.54, 19.54, 19.26, 19.26, 19.26, 19.26, 19.18, 19.18],

    // Comparaison annuelle
    comparAnnuelLabels: ['Rég. Reçus (T)', 'Rég. Traités (T)', 'Huile Prod. (T)', 'Vente Huile (T)'],
    comparAnnuel: [
      { label: 'Jan 2024', values: [8250, 7200, 1380, 1350] },
      { label: 'Jan 2025', values: [9800, 8900, 1720, 1690] },
      { label: 'Jan 2026', values: [11170, 9998, 1956, 1763] },
    ],

    // Qualité huile
    qualite: {
      ffaRate: 3.2,
      humidite: 0.18,
      impuretes: 0.08,
    },
  },

  // ── REVENUS ──────────────────────────────────────────────
  revenus: {
    // CA journalier huile (FCFA)
    caJoursLabels: ['02','03','05','07','08','09','10','12','13','14','15','17','19','20','21','22','23','24','25','26','28','29','30','31'],
    caJoursVals: [
      28800000,57600000,28800000,57600000,57600000,57600000,86400000,
      57600000,86400000,57600000,86400000,57600000,86400000,86400000,
      57600000,86400000,57600000,57600000,86400000,28800000,86400000,
      57600000,57600000,86400000
    ],

    // Produits comparatif
    produits: [
      { produit: 'Huile de Palme CPO', quantite: '1 763 T',  prixUnitaire: '720 F/kg',  totalFCFA: 1269504000 },
      { produit: 'Noix de Palmiste',   quantite: '970 T',    prixUnitaire: '60 F/kg',   totalFCFA:   58171200 },
      { produit: 'Huile Florentin',    quantite: '20,6 T',   prixUnitaire: '500 F/kg',  totalFCFA:    8588000 },
    ],
  },

  // ── CHARGES ──────────────────────────────────────────────
  charges: {
    topDepenses: [
      { date: '28/01', lib: 'Paie personnels APO — Janvier',              mt: 13950545 },
      { date: '28/01', lib: 'Salaire M. RAMY — Janvier',                  mt:  5000000 },
      { date: '28/01', lib: 'Salaire M. RAYAN — Janvier',                 mt:  4500000 },
      { date: '27/01', lib: "Acompte achat véhicule",                     mt:  2900000 },
      { date: '21/01', lib: 'MO Maçonnerie bureau annexe',                mt:  2200000 },
      { date: '07/01', lib: 'Acompte matériels soudure (TM & Frères)',    mt:  2000000 },
      { date: '07/01', lib: 'Achat matériels détartrage chaudière 10T',   mt:  1840000 },
      { date: '28/01', lib: 'Salaires personnels déclarés',               mt:  1893025 },
      { date: '28/01', lib: 'Salaire M. MAHDI — Janvier',                 mt:  1200000 },
      { date: '29/01', lib: "Acompte main d'œuvre vitrier",               mt:  1000000 },
      { date: '28/01', lib: 'Achat carburant (fin mois)',                  mt:  1096875 },
      { date: '22/01', lib: 'Achat ordinateurs HP Core i5',               mt:   970000 },
      { date: '22/01', lib: 'Achat carburant',                            mt:   928125 },
      { date: '22/01', lib: 'Achat moto chef maintenance',                mt:   850000 },
      { date: '23/01', lib: 'Frais rebobinage 2 moteurs',                 mt:   550000 },
    ],
  },

  // ── FOURNISSEURS ─────────────────────────────────────────
  fournisseurs: {
    totalPoidsKg: 11170660,
    liste: [
      { name: 'SARCI',            poids: 2450000, prix: 126, montant: 308700000 },
      { name: 'COULIBALY BAKARY', poids: 1850000, prix: 124, montant: 229400000 },
      { name: 'KONAN JEAN',       poids: 1420000, prix: 122, montant: 173240000 },
      { name: 'KOUAME KOFFI',     poids: 1180000, prix: 121, montant: 142780000 },
      { name: 'TRAORE MAMADOU',   poids:  980000, prix: 120, montant: 117600000 },
      { name: 'YAO ADJOUA',       poids:  820000, prix: 122, montant: 100040000 },
      { name: 'BAMBA SEYDOU',     poids:  710000, prix: 119, montant:  84490000 },
      { name: 'DIALLO IBRAHIMA',  poids:  640000, prix: 121, montant:  77440000 },
      { name: 'KONE AMINATA',     poids:  560000, prix: 120, montant:  67200000 },
      { name: 'OUATTARA SALIF',   poids:  560660, prix: 118, montant:  66157880 },
    ],
  },

  // ── PÉPINIÈRE ────────────────────────────────────────────
  pepiniere: {
    superficieDistrib: {
      labels: ['1 ha', '2-3 ha', '4-6 ha', '10-13 ha', '100 ha'],
      values: [8, 12, 4, 4, 1],
    },
    clients: [
      { no: 1001, nom: 'NADO SERI FRANCK',       loc: 'KOSSEHOA',        ha: 1,   total:   180000, enc:   180000 },
      { no: 1002, nom: 'KONAN KOFFI ELI',        loc: 'DIEGONEFLA',      ha: 3,   total:   540000, enc:   540000 },
      { no: 1003, nom: 'YAO KOUASSI VENANCE',    loc: 'KONAHIO',         ha: 2,   total:   360000, enc:   360000 },
      { no: 1004, nom: 'SANOGO YSSOUF',          loc: 'SERIHO',          ha: 3,   total:   540000, enc:   540000 },
      { no: 1005, nom: 'ZABRE ISSOUF',           loc: 'GBAKAYO',         ha: 3,   total:   540000, enc:   540000 },
      { no: 1006, nom: 'YEDAGNE LASME JEROME',   loc: 'SOUBRE',          ha: 1,   total:   180000, enc:   180000 },
      { no: 1007, nom: 'VANIE JEAN-BAPTISTE',    loc: 'MAYO',            ha: 1,   total:   180000, enc:   180000 },
      { no: 1008, nom: 'AMOA KOFFI BROU',        loc: 'CISSEKRO',        ha: 1,   total:   180000, enc:   180000 },
      { no: 1009, nom: 'KONAN YAO BLAISE',       loc: 'GNAKORADJI',      ha: 3,   total:   540000, enc:   540000 },
      { no: 1010, nom: 'SARBA BOUKARY',          loc: 'KOSSEHOA',        ha: 1,   total:   180000, enc:   180000 },
      { no: 1011, nom: '3AP',                    loc: 'ONAHIO',          ha: 100, total: 18000000, enc:  6000000 },
      { no: 1012, nom: 'ZORE MOUMOUNI',          loc: 'DIOULABOUGOUDJAN',ha: 4,   total:   720000, enc:   720000 },
      { no: 1013, nom: 'APPHK (TAO MADI)',       loc: 'KONEDOUGOU',      ha: 6,   total:  1080000, enc:  1080000 },
      { no: 1014, nom: 'DIABATE ADAMA',          loc: 'LILIYO',          ha: 1,   total:   180000, enc:   180000 },
      { no: 1016, nom: 'KONE BOUBACAR',          loc: 'NAMANE',          ha: 13,  total:  2340000, enc:  1400000 },
      { no: 1017, nom: 'OUEDRAOGO MADI',         loc: 'SOUBRE',          ha: 3,   total:   540000, enc:   405000 },
    ],
  },
}
