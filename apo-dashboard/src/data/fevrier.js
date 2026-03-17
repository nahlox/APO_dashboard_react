// ============================================================
// APO — DONNÉES FÉVRIER 2026
// Source : fichiers Excel APO (production, caisse, fournisseurs)
// Règles de calcul : voir src/lib/kpiEngine.js
// ============================================================

export const febData = {
  // ── KPIs PRINCIPAUX ──────────────────────────────────────
  kpis: {
    caTotalFCFA:       2129728200,
    caHuileFCFA:       2016088200,
    caHuileDetail:     '681 F/kg moy × 2 959 T livrées (720→675 à partir du 4 fév)',
    caNoisFCFA:        113640000,
    caBassinFCFA:      0,   // non facturé — à régulariser
    coutMPFCFA:        1695469933,
    coutMPDetail:      '112,50 F/kg × 15 071 T traités',
    chargesExplFCFA:   105216408,
    amortissementFCFA: 20191988,
    resultatNetFCFA:   329041859,
    margeNette:        15.4,

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
  // Base : 2 866 T d'huile produites (2 865 783 kg)
  pnl: {
    baseLabel: "2 866 tonnes d'huile produites",
    status: 'Résultat Exceptionnel',
    produits: [
      { label: 'Huile de palme CPO (681 F/kg moy × 2 959 T livrées)', pertonne: 703000, total:  2016088200 },
      { label: 'Noix de palmiste (60 F/kg × 1 894 T)',                 pertonne:  40000, total:   113640000 },
      { label: 'Bassin de lagunage (8 060 kg — non facturé)',          pertonne:      0, total:           0 },
    ],
    charges: [
      { label: 'Coût MP (112,50 F/kg × 15 071 T traités)',            pertonne: 592000, total: -1695469933 },
      { label: 'Salaires & charges sociales',                          pertonne:  10000, total:   -30052695 },
      { label: 'Matériels & équipements',                              pertonne:   5000, total:   -13608500 },
      { label: 'Véhicules & location engins',                          pertonne:   4000, total:   -10926500 },
      { label: 'Frais divers & administratifs',                        pertonne:   5000, total:   -14696000 },
      { label: 'Carburant',                                            pertonne:   3000, total:    -7583250 },
      { label: "Main d'œuvre externe",                                 pertonne:   1000, total:    -4046000 },
      { label: 'Eau & électricité',                                    pertonne:   1000, total:    -4111475 },
      { label: 'Amortissement prêt bancaire & intérêts',               pertonne:   7000, total:   -20191988 },
    ],
    totalProduitsTotal:  2129728200,
    totalProduitsTonne:  743000,
    totalChargesTotal:  -1800686341,
    totalChargesTonne:  -628000,
    resultatTotal:        329041859,
    resultatTonne:         115000,
    notes: [
      { label: 'Marge nette', value: '15,4%', color: 'green' },
      { label: 'Prix vente moy. huile', value: '681 F/kg (720→675 à partir du 4 fév)', color: 'gold' },
      { label: 'Stock régimes fin mois', value: '1 128 T', color: 'gold' },
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
      labels: ['Salaires', 'Amort. bancaire', 'Matériels', 'Véhicules', 'Frais divers', 'Carburant', 'Eau/Électricité', "Main d'œuvre ext."],
      values: [30052695, 20191988, 13608500, 10926500, 14696000, 7583250, 4111475, 4046000],
    },
  },

  // ── PRODUCTION ───────────────────────────────────────────
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
  charges: {
    topDepenses: [
      { date: '28/02', lib: 'Paie personnels APO — Février',                mt: 14800000 },
      { date: '28/02', lib: 'Salaire M. RAMY — Février',                    mt:  5000000 },
      { date: '28/02', lib: 'Salaire M. RAYAN — Février',                   mt:  4500000 },
      { date: '15/02', lib: 'Achat pièces moteur broyeur',                  mt:  3200000 },
      { date: '10/02', lib: 'Réparation groupe électrogène',                mt:  2800000 },
      { date: '20/02', lib: "Location engin chantier",                      mt:  2500000 },
      { date: '05/02', lib: 'Achat carburant (lot)',                        mt:  2100000 },
      { date: '28/02', lib: 'Salaires personnels déclarés',                 mt:  1952695 },
      { date: '28/02', lib: 'Salaire M. MAHDI — Février',                   mt:  1300000 },
      { date: '18/02', lib: 'Travaux maintenance tuyauteries',              mt:  1200000 },
      { date: '25/02', lib: 'Achat carburant (fin mois)',                   mt:  1100000 },
      { date: '12/02', lib: 'Frais déplacement & réceptions',              mt:   980000 },
      { date: '08/02', lib: 'Achat produits chimiques traitement',          mt:   850000 },
      { date: '22/02', lib: 'Réparation véhicule livraison',                mt:   750000 },
      { date: '14/02', lib: 'Achat matières consommables atelier',         mt:   600000 },
    ],
  },

  // ── FOURNISSEURS ─────────────────────────────────────────
  fournisseurs: {
    totalPoidsKg: 14798400,
    liste: [
      { name: 'GTPPNV',           poids: 1712000, prix: 115, montant: 196880000 },
      { name: 'SARCI',            poids: 1580000, prix: 113, montant: 178540000 },
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
