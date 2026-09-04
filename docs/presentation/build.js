const pptxgen = require('pptxgenjs')

// ── Palette : issue de la charte réelle de l'app (gold / green / red sur vert profond)
const C = {
  dark:      '0F2A1D',
  darkCard:  '1A3323',
  gold:      'F28C28',
  goldSoft:  'FDF3E8',
  green:     '3FA34D',
  greenSoft: 'F0F6EF',
  red:       'E05C5C',
  redSoft:   'FCF0F0',
  ink:       '14261C',
  muted:     '6B7865',
  line:      'DCE3D8',
  card:      'F3F7F1',
  white:     'FFFFFF',
  onDark:    'E8EDE6',
  onDarkDim: '9DAF96',
}

const HEAD = 'Cambria'
const BODY = 'Calibri'
const W = 13.333, H = 7.5
const M = 0.7

const pres = new pptxgen()
pres.layout = 'LAYOUT_WIDE'
pres.author = 'Palmeo'
pres.company = 'Palmeo'
pres.title = 'Palmeo — Présentation business'

// ───────────────────────────── helpers ─────────────────────────────

let pageNo = 0

function newSlide(dark = false) {
  const s = pres.addSlide()
  s.background = { color: dark ? C.dark : C.white }
  return s
}

/** En-tête standard d'une slide de contenu : sur-titre gold + titre. */
function header(s, eyebrow, title, dark = false, sub) {
  s.addText(eyebrow.toUpperCase(), {
    x: M, y: 0.40, w: W - 2 * M, h: 0.26,
    fontFace: BODY, fontSize: 11, bold: true, charSpacing: 2,
    color: C.gold, isTextBox: true, margin: 0,
  })
  s.addText(title, {
    x: M, y: 0.68, w: W - 2 * M, h: 0.66,
    fontFace: HEAD, fontSize: 33, bold: true, valign: 'top',
    color: dark ? C.white : C.ink, isTextBox: true, margin: 0,
  })
  if (sub) {
    s.addText(sub, {
      x: M, y: 1.36, w: W - 2 * M - 0.6, h: 0.56,
      fontFace: BODY, fontSize: 14, valign: 'top',
      color: dark ? C.onDarkDim : C.muted, isTextBox: true, margin: 0,
    })
  }
}

/** Pastille ronde pleine — le motif répété du deck. */
function dot(s, x, y, d, fill, label, labelColor, size) {
  s.addShape(pres.ShapeType.ellipse, {
    x, y, w: d, h: d, fill: { color: fill },
  })
  if (label) {
    s.addText(label, {
      x, y: y + 0.02, w: d, h: d - 0.04,
      fontFace: BODY, fontSize: size || 13, bold: true,
      color: labelColor || C.white, align: 'center', valign: 'middle',
      isTextBox: true, margin: 0,
    })
  }
}

function card(s, x, y, w, h, fill, shadow = true) {
  const opts = {
    x, y, w, h, fill: { color: fill },
    rectRadius: 0.11, line: { color: fill, width: 0.5 },
  }
  if (shadow) opts.shadow = { type: 'outer', color: '0F2A1D', opacity: 0.10, blur: 10, offset: 2, angle: 90 }
  s.addShape(pres.ShapeType.roundRect, opts)
}

function footnote(s, txt) {
  s.addText(txt, {
    x: M, y: H - 0.52, w: W - 2 * M, h: 0.26,
    fontFace: BODY, fontSize: 9, italic: true, color: C.muted,
    isTextBox: true, margin: 0,
  })
}

function pageNum(s, dark = false) {
  pageNo += 1
  s.addText(String(pageNo).padStart(2, '0'), {
    x: W - 1.0, y: H - 0.52, w: 0.4, h: 0.26,
    fontFace: BODY, fontSize: 10, bold: true,
    color: dark ? C.onDarkDim : C.line, align: 'right',
    isTextBox: true, margin: 0,
  })
}

// ═══════════════════════════ 1 — COUVERTURE ═══════════════════════════
{
  const s = newSlide(true)

  // Halo décoratif (rappel des "orbes" de la landing)
  s.addShape(pres.ShapeType.ellipse, {
    x: 8.4, y: -1.5, w: 7.2, h: 7.2,
    fill: { color: C.green, transparency: 88 },
  })
  s.addShape(pres.ShapeType.ellipse, {
    x: 10.2, y: 3.4, w: 5.0, h: 5.0,
    fill: { color: C.gold, transparency: 90 },
  })

  dot(s, M, 0.62, 0.52, C.green, 'P', C.white, 20)
  s.addText('palmeo', {
    x: M + 0.68, y: 0.62, w: 3, h: 0.52,
    fontFace: HEAD, fontSize: 22, bold: true, color: C.white,
    valign: 'middle', isTextBox: true, margin: 0,
  })

  s.addText('Pilotez votre huilerie\nen temps réel', {
    x: M, y: 2.05, w: 8.7, h: 1.95,
    fontFace: HEAD, fontSize: 50, bold: true, color: C.white, valign: 'top',
    lineSpacing: 56, isTextBox: true, margin: 0,
  })

  s.addText(
    "La plateforme d'intelligence opérationnelle des huileries de palme :\n" +
    "production, marge et compte de résultat, tous les matins, sur un seul écran.",
    {
      x: M, y: 4.42, w: 9.4, h: 0.9,
      fontFace: BODY, fontSize: 16, color: C.onDarkDim, valign: 'top',
      lineSpacing: 24, isTextBox: true, margin: 0,
    })

  const tags = ['Multi-tenant SaaS', 'IA embarquée', 'Web & mobile', 'FCFA / EUR']
  tags.forEach((t, i) => {
    const x = M + i * 2.42
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 5.55, w: 2.24, h: 0.46, fill: { color: C.darkCard },
      rectRadius: 0.23, line: { color: C.green, width: 0.75 },
    })
    s.addText(t, {
      x, y: 5.55, w: 2.24, h: 0.46, fontFace: BODY, fontSize: 11.5,
      bold: true, color: C.onDark, align: 'center', valign: 'middle',
      isTextBox: true, margin: 0,
    })
  })

  s.addText('Présentation business  ·  Périmètre : plateforme complète  ·  2026', {
    x: M, y: 6.62, w: 9, h: 0.3,
    fontFace: BODY, fontSize: 11, color: C.onDarkDim, isTextBox: true, margin: 0,
  })

  s.addNotes(
    "Palmeo est la plateforme SaaS née du dashboard construit pour APO (Agro Palm Oil, Côte d'Ivoire). " +
    "Le produit est aujourd'hui en production sur ce client fondateur et l'architecture a été " +
    "industrialisée pour accueillir d'autres huileries sans réécrire de code métier."
  )
  pageNo += 1
}

// ═══════════════════════════ 2 — SOMMAIRE ═══════════════════════════
{
  const s = newSlide()
  header(s, 'Sommaire', 'Ce que couvre cette présentation')

  const items = [
    ['01', 'Le problème', 'Pourquoi une huilerie pilote à l\'aveugle'],
    ['02', 'La proposition de valeur', 'Ce que Palmeo change concrètement'],
    ['03', 'Le produit', 'Modules, KPI, compte de résultat, IA'],
    ['04', 'La preuve par les chiffres', 'Trajectoire, coûts, rendement'],
    ['05', 'L\'adaptation à l\'existant', '12 sources de données, 3 modèles'],
    ['06', 'L\'architecture qui scale', 'Multi-tenant, sécurité, accueil client'],
    ['07', 'État d\'avancement', 'Ce qui est livré, ce qui reste'],
    ['08', 'Prochaines étapes', 'Roadmap et décisions à prendre'],
  ]

  items.forEach((it, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = M + col * 6.2
    const y = 1.85 + row * 1.22
    card(s, x, y, 5.8, 1.02, col === 0 ? C.card : C.card, false)
    dot(s, x + 0.26, y + 0.28, 0.46, i % 2 === 0 ? C.green : C.gold, it[0], C.white, 12)
    s.addText(it[1], {
      x: x + 0.88, y: y + 0.17, w: 4.7, h: 0.32,
      fontFace: BODY, fontSize: 14.5, bold: true, color: C.ink,
      isTextBox: true, margin: 0,
    })
    s.addText(it[2], {
      x: x + 0.88, y: y + 0.52, w: 4.7, h: 0.3,
      fontFace: BODY, fontSize: 11.5, color: C.muted,
      isTextBox: true, margin: 0,
    })
  })

  s.addNotes("Huit sections. L'objectif : montrer le produit, le modèle et le niveau de maturité réel.")
  pageNum(s)
}

// ═══════════════════════════ 3 — LE PROBLÈME ═══════════════════════════
{
  const s = newSlide()
  header(s, '01 · Le problème', "Les données existent. Elles arrivent trop tard.",
    false,
    "Une huilerie de palme produit chaque jour des dizaines d'indicateurs. Ils finissent dans des classeurs Excel, des cahiers et des messages WhatsApp — jamais dans une décision.")

  const pains = [
    [C.red, 'Le mois se clôture en retard',
      "Le compte de résultat arrive plusieurs semaines après la fin du mois. Quand le dirigeant découvre une marge dégradée, le trimestre est déjà entamé."],
    [C.gold, 'Le rendement n\'est pas suivi',
      "Le taux d'extraction est l'indicateur de marge n°1. Un point de TE perdu sur un mois, c'est des dizaines de tonnes d'huile qui n'existent pas — invisible dans un classeur."],
    [C.green, 'La donnée est éclatée',
      "Production, caisse, banque, achats de régimes, ventes : autant de fichiers, autant de saisies, autant de risques d'écart. Personne ne consolide en temps réel."],
  ]

  pains.forEach((p, i) => {
    const x = M + i * 4.13
    card(s, x, 2.55, 3.83, 2.55, C.card, false)
    dot(s, x + 0.32, 2.85, 0.42, p[0])
    s.addText(p[1], {
      x: x + 0.32, y: 3.42, w: 3.2, h: 0.62,
      fontFace: BODY, fontSize: 15, bold: true, color: C.ink, valign: 'top',
      isTextBox: true, margin: 0,
    })
    s.addText(p[2], {
      x: x + 0.32, y: 4.06, w: 3.22, h: 0.92,
      fontFace: BODY, fontSize: 11.5, color: C.muted, lineSpacing: 15,
      valign: 'top', isTextBox: true, margin: 0,
    })
  })

  // Bandeau chiffre
  card(s, M, 5.42, W - 2 * M, 1.18, C.goldSoft, false)
  s.addText('8', {
    x: M + 0.35, y: 5.6, w: 0.85, h: 0.82,
    fontFace: HEAD, fontSize: 44, bold: true, color: C.gold,
    align: 'center', valign: 'middle', isTextBox: true, margin: 0,
  })
  s.addText(
    "fichiers Excel distincts alimentaient le pilotage du client fondateur — production, caisse graine, " +
    "caisse charges, banque, ventes huile, palmiste, florentin, pépinière.",
    {
      x: M + 1.38, y: 5.66, w: 10.2, h: 0.72,
      fontFace: BODY, fontSize: 13, color: C.ink, lineSpacing: 18,
      valign: 'middle', isTextBox: true, margin: 0,
    })

  s.addNotes(
    "Le point de départ réel du projet : 8 classeurs Excel synchronisés sur Dropbox. " +
    "C'est le cas type du secteur — la donnée existe, elle est juste inexploitable en l'état."
  )
  pageNum(s)
}

// ═══════════════════════════ 4 — AVANT / APRÈS ═══════════════════════════
{
  const s = newSlide()
  header(s, '02 · Proposition de valeur', 'Ce que Palmeo change, concrètement')

  const rows = [
    ['Compte de résultat', 'Reconstitué à la main, 3 à 4 semaines après la clôture', 'Généré automatiquement, disponible en continu'],
    ['Taux d\'extraction', 'Calculé a posteriori, parfois jamais', 'Suivi jour par jour, alerte sous le seuil'],
    ['Trésorerie & charges', 'Éclatées entre caisses et banques', 'Consolidées et catégorisées automatiquement'],
    ['Décision terrain', 'Sur intuition et souvenirs', 'Sur chiffre daté, sourcé, comparable'],
    ['Accès à l\'information', 'Un poste, un classeur, une personne', 'Web et mobile, par rôle, où que soit le dirigeant'],
  ]

  // En-têtes de colonnes
  s.addText('SANS PALMEO', {
    x: 4.55, y: 1.62, w: 4.0, h: 0.3,
    fontFace: BODY, fontSize: 10.5, bold: true, charSpacing: 1.4,
    color: C.red, isTextBox: true, margin: 0,
  })
  s.addText('AVEC PALMEO', {
    x: 8.85, y: 1.62, w: 4.0, h: 0.3,
    fontFace: BODY, fontSize: 10.5, bold: true, charSpacing: 1.4,
    color: C.green, isTextBox: true, margin: 0,
  })

  rows.forEach((r, i) => {
    const y = 2.02 + i * 0.98
    if (i % 2 === 0) card(s, M, y, W - 2 * M, 0.88, C.card, false)
    s.addText(r[0], {
      x: M + 0.28, y: y + 0.24, w: 3.5, h: 0.4,
      fontFace: BODY, fontSize: 13.5, bold: true, color: C.ink,
      valign: 'middle', isTextBox: true, margin: 0,
    })
    dot(s, 4.55, y + 0.35, 0.16, C.red)
    s.addText(r[1], {
      x: 4.82, y: y + 0.18, w: 3.85, h: 0.54,
      fontFace: BODY, fontSize: 11.5, color: C.muted, lineSpacing: 14,
      valign: 'middle', isTextBox: true, margin: 0,
    })
    dot(s, 8.85, y + 0.35, 0.16, C.green)
    s.addText(r[2], {
      x: 9.12, y: y + 0.18, w: 3.5, h: 0.54,
      fontFace: BODY, fontSize: 11.5, bold: true, color: C.ink, lineSpacing: 14,
      valign: 'middle', isTextBox: true, margin: 0,
    })
  })

  s.addNotes(
    "La valeur n'est pas « un beau dashboard » : c'est le raccourcissement du délai entre un fait " +
    "d'usine et la décision qu'il devrait déclencher."
  )
  pageNum(s)
}

// ═══════════════════════════ 5 — LE PRODUIT / MODULES ═══════════════════════════
{
  const s = newSlide(true)
  header(s, '03 · Le produit', 'Sept modules, un seul écran', true,
    "L'application livrée au client : cinq modules de pilotage, les documents comptables, et la console d'exploitation réservée à l'opérateur de la plateforme.")

  const mods = [
    [C.gold,  "Vue d'ensemble", "CA, marge brute, résultat net, huile produite, marge nette, revenu net à la tonne — plus l'évolution multi-mois."],
    [C.green, 'Production & graines', "Régimes reçus, traités, huile produite, taux d'extraction journalier, stocks cuve, stérilisateurs."],
    [C.gold,  'Revenus & ventes', "Ventes huile CPO par circuit, palmiste, florentin, bassin — volumes, prix moyens, écarts de pesée."],
    [C.green, 'Charges & coûts', "Caisse, banque, amortissements : charges catégorisées automatiquement selon le plan comptable."],
    [C.gold,  'Fournisseurs', "Camions, tonnages, prix moyen au kilo, classement des transporteurs et coopératives."],
    [C.green, 'Compte de résultat', "Un P&L par mois, au format OHADA, exportable en PDF — total et ramené à la tonne d'huile."],
    [C.gold,  'Console admin', "Réservée aux super-admins : parc clients, intégrations, utilisateurs, plan comptable, journal d'audit."],
  ]

  mods.forEach((m, i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    const x = M + col * 3.11
    const y = 2.42 + row * 2.28
    const w = 2.87
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w, h: 2.1, fill: { color: C.darkCard }, rectRadius: 0.11,
      line: { color: '2A4633', width: 0.75 },
    })
    dot(s, x + 0.26, y + 0.26, 0.34, m[0])
    s.addText(m[1], {
      x: x + 0.26, y: y + 0.68, w: w - 0.52, h: 0.4,
      fontFace: BODY, fontSize: 13.5, bold: true, color: C.white, valign: 'top',
      isTextBox: true, margin: 0,
    })
    s.addText(m[2], {
      x: x + 0.26, y: y + 1.12, w: w - 0.46, h: 0.9,
      fontFace: BODY, fontSize: 10, color: C.onDarkDim, lineSpacing: 13,
      valign: 'top', isTextBox: true, margin: 0,
    })
  })

  // Encart libre à droite de la 2e ligne
  s.addShape(pres.ShapeType.roundRect, {
    x: M + 3 * 3.11, y: 4.70, w: 2.87, h: 2.1,
    fill: { color: C.green, transparency: 82 }, rectRadius: 0.11,
    line: { color: C.green, width: 1 },
  })
  s.addText('Et partout :', {
    x: M + 3 * 3.11 + 0.26, y: 4.92, w: 2.4, h: 0.28,
    fontFace: BODY, fontSize: 11, bold: true, color: C.gold,
    isTextBox: true, margin: 0,
  })
  s.addText(
    [
      { text: 'Bascule FCFA ⇄ EUR instantanée', options: { bullet: true, breakLine: true } },
      { text: 'Thème clair / sombre', options: { bullet: true, breakLine: true } },
      { text: 'Application installable (PWA)', options: { bullet: true, breakLine: true } },
      { text: 'Filtre de période multi-mois', options: { bullet: true } },
    ],
    {
      x: M + 3 * 3.11 + 0.26, y: 5.26, w: 2.5, h: 1.4,
      fontFace: BODY, fontSize: 10, color: C.onDark, lineSpacing: 13,
      paraSpaceAfter: 4, isTextBox: true, margin: 0,
    })

  s.addNotes(
    "La navigation réelle de l'app : Pilotage (5 modules), Documents (comptes de résultat mensuels), " +
    "Plateforme (console admin, visible uniquement pour les super-admins)."
  )
  pageNum(s, true)
}

// ═══════════════════════════ 6 — LES KPI DU DIRIGEANT ═══════════════════════════
{
  const s = newSlide()
  header(s, '03 · Le produit', 'Le mois entier, en six chiffres',
    false,
    "La page d'accueil de l'application : ce que le dirigeant voit en ouvrant Palmeo le matin.")

  const kpis = [
    ["Chiffre d'affaires", '398,6 M', 'FCFA · soit 607 660 €', C.gold],
    ['Marge brute', '39,1 %', 'après coût matière première', C.green],
    ['Résultat net', '+ 53,8 M', 'FCFA · soit + 82 018 €', C.green],
    ['Huile produite', '497 T', 'CPO, sur le mois', C.gold],
    ['Marge nette', '13,5 %', 'résultat / CA total', C.green],
    ['Revenu net / tonne', '108 250', 'FCFA par tonne produite', C.gold],
  ]

  kpis.forEach((k, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = M + col * 4.13
    const y = 2.10 + row * 2.12
    card(s, x, y, 3.83, 1.92, C.card, false)
    dot(s, x + 0.3, y + 0.32, 0.14, k[3])
    s.addText(k[0], {
      x: x + 0.56, y: y + 0.22, w: 3.0, h: 0.32,
      fontFace: BODY, fontSize: 11.5, bold: true, color: C.muted,
      charSpacing: 0.6, isTextBox: true, margin: 0,
    })
    s.addText(k[1], {
      x: x + 0.3, y: y + 0.62, w: 3.3, h: 0.78,
      fontFace: HEAD, fontSize: 38, bold: true, color: k[3],
      isTextBox: true, margin: 0,
    })
    s.addText(k[2], {
      x: x + 0.32, y: y + 1.42, w: 3.3, h: 0.3,
      fontFace: BODY, fontSize: 10.5, color: C.muted,
      isTextBox: true, margin: 0,
    })
  })

  footnote(s, "Jeu de démonstration anonymisé (« Huilerie Sédia », juin 2026) — aucune donnée client réelle. Conversion au taux fixe XOF/EUR de 655,957.")
  s.addNotes(
    "Six cartes, une seule lecture. Le « revenu net par tonne » est l'indicateur que les dirigeants " +
    "d'huilerie utilisent spontanément pour se comparer : Palmeo le calcule sur les tonnes produites, " +
    "pas livrées — c'est la règle de calcul officielle inscrite dans le moteur de KPI."
  )
  pageNum(s)
}

// ═══════════════════════════ 7 — GRAPHIQUE TRAJECTOIRE ═══════════════════════════
{
  const s = newSlide()
  header(s, '04 · La preuve par les chiffres', 'Six mois de trajectoire, sans ressaisie',
    false,
    "Chaque barre est reconstituée automatiquement depuis les fichiers de l'usine. Le creux de mai est ce qu'un dirigeant doit voir le 1ᵉʳ juin — pas fin juillet.")

  const labels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin']
  s.addChart(
    [
      {
        type: pres.ChartType.bar,
        data: [{ name: "Chiffre d'affaires", labels, values: [277.5, 312.1, 355.2, 375.2, 342.3, 398.6] }],
        options: { chartColors: [C.gold], barGapWidthPct: 60 },
      },
      {
        type: pres.ChartType.line,
        data: [{ name: 'Résultat net', labels, values: [31.2, 38.6, 47.1, 52.4, 34.9, 53.8] }],
        options: {
          chartColors: [C.green], lineSize: 3, lineSmooth: false,
          lineDataSymbol: 'circle', lineDataSymbolSize: 8,
          lineDataSymbolLineColor: C.green, lineDataSymbolLineSize: 1,
          dataLabelColor: 'FFFFFF', dataLabelFontSize: 10, dataLabelFontBold: true,
        },
      },
    ],
    {
      x: M, y: 2.42, w: W - 2 * M, h: 3.85,
      showTitle: true, title: 'Chiffre d\'affaires et résultat net — en millions de FCFA',
      titleFontFace: BODY, titleFontSize: 12, titleColor: C.muted, titleAlign: 'left',
      showValue: true, dataLabelPosition: 'outEnd',
      dataLabelFontFace: BODY, dataLabelFontSize: 9, dataLabelColor: C.ink,
      dataLabelFormatCode: '#,##0.0',
      showLegend: true, legendPos: 'b', legendFontFace: BODY, legendFontSize: 11,
      legendColor: C.muted,
      catAxisLabelFontFace: BODY, catAxisLabelFontSize: 11, catAxisLabelColor: C.muted,
      valAxisLabelFontFace: BODY, valAxisLabelFontSize: 10, valAxisLabelColor: C.muted,
      valAxisMaxVal: 460, valAxisMinVal: 0,
      valGridLine: { color: C.line, size: 0.75 },
      catGridLine: { style: 'none' },
      valAxisLineShow: false, catAxisLineShow: false,
    })

  footnote(s, "Jeu de démonstration anonymisé (« Huilerie Sédia », janvier → juin 2026). Le creux de mai illustre un incident de production analysé slide 10.")
  s.addNotes(
    "Un graphique combiné natif PowerPoint : barres = CA, courbe = résultat net, même axe (M FCFA). " +
    "Dans l'application, les mêmes séries se recalculent à chaque import ETL."
  )
  pageNum(s)
}

// ═══════════════════════════ 8 — STRUCTURE DES DÉPENSES ═══════════════════════════
{
  const s = newSlide()
  header(s, '04 · La preuve par les chiffres', 'Où part réellement l\'argent',
    false,
    "Hors matière première, les charges d'exploitation d'un mois sont ventilées automatiquement par le plan comptable — plus aucun poste ne se cache dans « divers ».")

  // Ordre inversé : PowerPoint trace la première catégorie en bas d'un graphe en barres
  s.addChart(pres.ChartType.bar, [{
    name: 'Part des charges',
    labels: ['Divers', 'Frais bancaires', 'Administratif', 'Consommables', 'Maintenance', 'Transport', 'Carburant & énergie', 'Salaires'],
    values: [3.1, 3.3, 3.8, 6.1, 11.0, 13.8, 21.9, 37.1],
  }], {
    x: M, y: 2.42, w: 7.7, h: 3.9,
    barDir: 'bar', barGapWidthPct: 45,
    chartColors: [C.green, C.green, C.green, C.green, C.green, C.green, C.gold, C.gold],
    showTitle: true, title: "Charges d'exploitation de juin — répartition en %",
    titleFontFace: BODY, titleFontSize: 12, titleColor: C.muted, titleAlign: 'left',
    showValue: true, dataLabelPosition: 'outEnd',
    dataLabelFontFace: BODY, dataLabelFontSize: 10, dataLabelColor: C.ink,
    dataLabelFormatCode: '0.0"%"',
    showLegend: false,
    catAxisLabelFontFace: BODY, catAxisLabelFontSize: 11, catAxisLabelColor: C.ink,
    valAxisLabelFontFace: BODY, valAxisLabelFontSize: 10, valAxisLabelColor: C.muted,
    valAxisMinVal: 0, valAxisMaxVal: 40, valAxisMajorUnit: 10,
    valGridLine: { color: C.line, size: 0.75 },
    catGridLine: { style: 'none' },
    valAxisLineShow: false, catAxisLineShow: false,
  })

  // Colonne de lecture business
  card(s, 8.7, 2.42, 3.93, 3.9, C.card, false)
  s.addText('Ce que ça permet', {
    x: 9.0, y: 2.68, w: 3.4, h: 0.34,
    fontFace: BODY, fontSize: 14, bold: true, color: C.ink,
    isTextBox: true, margin: 0,
  })
  const reads = [
    ['84,2 M FCFA', "de charges d'exploitation sur le mois, hors achat de régimes."],
    ['59 %', "du total concentré sur deux postes seulement : masse salariale et énergie."],
    ['0 saisie', "manuelle : la ventilation vient du mapping plan comptable → catégories P&L."],
  ]
  reads.forEach((r, i) => {
    const y = 3.16 + i * 1.02
    s.addText(r[0], {
      x: 9.0, y, w: 3.4, h: 0.36,
      fontFace: HEAD, fontSize: 21, bold: true, color: i === 2 ? C.green : C.gold,
      isTextBox: true, margin: 0,
    })
    s.addText(r[1], {
      x: 9.0, y: y + 0.36, w: 3.4, h: 0.6,
      fontFace: BODY, fontSize: 10.5, color: C.muted, lineSpacing: 13.5,
      isTextBox: true, margin: 0,
    })
  })

  footnote(s, "Jeu de démonstration anonymisé (« Huilerie Sédia », juin 2026). Les catégories proviennent des défauts SYSCOHADA de la plateforme, surchargeables par client.")
  s.addNotes(
    "Point business clé : la ventilation n'est pas paramétrée à la main par client. " +
    "La table compte_mappings porte les défauts SYSCOHADA au niveau plateforme ; " +
    "un client Sage n'a qu'à surcharger ses exceptions."
  )
  pageNum(s)
}

// ═══════════════════════════ 9 — TAUX D'EXTRACTION ═══════════════════════════
{
  const s = newSlide()
  header(s, '04 · La preuve par les chiffres', "Le levier n° 1 : le taux d'extraction",
    false,
    "Le TE est le rapport entre l'huile produite et les régimes traités. C'est la variable qui décide de la marge — et celle que personne ne suit au jour le jour.")

  const days = Array.from({ length: 30 }, (_, i) => String(i + 1))
  const te = [21.8, 21.5, 22.1, 20.9, 21.4, 22.3, 21.7, 20.6, 21.9, 22.0, 21.2, 21.6, 22.4, 21.1, 20.8,
              21.5, 22.2, 21.3, 21.8, 22.0, 21.4, 20.7, 21.9, 22.1, 21.6, 21.0, 21.7, 22.3, 21.5, 21.2]

  s.addChart(pres.ChartType.line, [
    { name: "Taux d'extraction journalier", labels: days, values: te },
    { name: 'Seuil d\'alerte (19 %)', labels: days, values: days.map(() => 19) },
  ], {
    x: M, y: 2.48, w: 8.05, h: 3.3,
    chartColors: [C.green, C.red],
    lineSize: 2.5, lineSmooth: true,
    lineDataSymbol: 'none',
    showTitle: true, title: "TE journalier de juin — en %  ·  moyenne du mois : 21,5 %",
    titleFontFace: BODY, titleFontSize: 12, titleColor: C.muted, titleAlign: 'left',
    showValue: false,
    showLegend: true, legendPos: 'b', legendFontFace: BODY, legendFontSize: 10.5,
    legendColor: C.muted,
    catAxisLabelFontFace: BODY, catAxisLabelFontSize: 8.5, catAxisLabelColor: C.muted,
    valAxisLabelFontFace: BODY, valAxisLabelFontSize: 10, valAxisLabelColor: C.muted,
    valAxisMinVal: 18, valAxisMaxVal: 23, valAxisMajorUnit: 1,
    valGridLine: { color: C.line, size: 0.75 },
    catGridLine: { style: 'none' },
    valAxisLineShow: false, catAxisLineShow: false,
  })

  // Barème métier (embarqué dans l'IA de l'app)
  card(s, 9.05, 2.48, 3.58, 3.3, C.card, false)
  s.addText("Le barème métier embarqué", {
    x: 9.32, y: 2.70, w: 3.05, h: 0.5,
    fontFace: BODY, fontSize: 13.5, bold: true, color: C.ink, lineSpacing: 17,
    valign: 'top', isTextBox: true, margin: 0,
  })
  const grades = [
    [C.green, 'Excellent', '> 23 %'],
    [C.green, 'Bon', '21 – 23 %'],
    [C.gold,  'Correct', '19 – 21 %'],
    [C.red,   'À traiter', '< 19 %'],
  ]
  grades.forEach((g, i) => {
    const y = 3.30 + i * 0.44
    dot(s, 9.32, y + 0.09, 0.16, g[0])
    s.addText(g[1], {
      x: 9.6, y, w: 1.7, h: 0.34,
      fontFace: BODY, fontSize: 12, bold: true, color: C.ink,
      valign: 'middle', isTextBox: true, margin: 0,
    })
    s.addText(g[2], {
      x: 11.15, y, w: 1.25, h: 0.34,
      fontFace: BODY, fontSize: 12, color: C.muted, align: 'right',
      valign: 'middle', isTextBox: true, margin: 0,
    })
  })
  s.addText("Ces seuils pilotent les alertes push, l'email du matin et les réponses de l'assistant IA.", {
    x: 9.32, y: 5.16, w: 3.05, h: 0.56,
    fontFace: BODY, fontSize: 10, italic: true, color: C.muted, lineSpacing: 13,
    valign: 'top', isTextBox: true, margin: 0,
  })

  // Bandeau enjeu
  card(s, M, 5.95, W - 2 * M, 0.7, C.goldSoft, false)
  s.addText(
    "Enjeu : sur 2 310 tonnes de régimes traités dans le mois, 1 point de TE représente 23 tonnes d'huile — soit environ 18 M FCFA de chiffre d'affaires.",
    {
      x: M + 0.3, y: 5.95, w: W - 2 * M - 0.6, h: 0.7,
      fontFace: BODY, fontSize: 12.5, bold: true, color: C.ink,
      valign: 'middle', isTextBox: true, margin: 0,
    })

  footnote(s, "Jeu de démonstration anonymisé. Ordre de grandeur du bandeau calculé au prix de vente moyen implicite du mois (386,8 M FCFA pour 497 T).")
  s.addNotes(
    "C'est le meilleur argument commercial du produit : le TE est directement monétisable. " +
    "Un client qui récupère un demi-point de TE rembourse largement l'abonnement."
  )
  pageNum(s)
}

// ═══════════════════════════ 10 — PALMEO AI ═══════════════════════════
{
  const s = newSlide(true)
  header(s, '03 · Le produit', 'Palmeo AI : il ne devine pas, il lit vos données', true,
    "L'assistant écrit lui-même la requête SQL, l'exécute sur la base du client et répond avec des chiffres sourcés. Aucune réponse n'est inventée.")

  // Conversation
  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 2.42, w: 7.0, h: 4.05, fill: { color: C.darkCard },
    rectRadius: 0.14, line: { color: '2A4633', width: 0.75 },
  })
  s.addText('PALMAI  ·  Assistant huilerie', {
    x: M + 0.3, y: 2.62, w: 4.5, h: 0.3,
    fontFace: BODY, fontSize: 10.5, bold: true, charSpacing: 1.2, color: C.gold,
    isTextBox: true, margin: 0,
  })

  s.addShape(pres.ShapeType.roundRect, {
    x: M + 2.2, y: 3.02, w: 4.5, h: 0.48,
    fill: { color: C.green, transparency: 55 }, rectRadius: 0.14, line: { color: C.green, width: 0.5 },
  })
  s.addText('Pourquoi ma marge a baissé en mai ?', {
    x: M + 2.35, y: 3.02, w: 4.2, h: 0.48,
    fontFace: BODY, fontSize: 12, bold: true, color: C.white,
    valign: 'middle', isTextBox: true, margin: 0,
  })

  s.addText(
    [
      { text: 'Marge nette mai : 10,2 %', options: { bold: true, color: C.gold } },
      { text: ' contre 14,0 % en avril.\n', options: {} },
      { text: '\nTrois causes, par ordre d\'impact :\n', options: {} },
      { text: "· Taux d'extraction à ", options: {} },
      { text: '19,8 %', options: { bold: true, color: C.gold } },
      { text: " (vs 21,4 %) — 4 jours d'arrêt du stérilisateur\n", options: {} },
      { text: '· Prix moyen du régime à ', options: {} },
      { text: '111 F/kg', options: { bold: true, color: C.gold } },
      { text: ', + 6 % vs avril\n', options: {} },
      { text: '· Charges carburant ', options: {} },
      { text: '+ 8,4 M FCFA', options: { bold: true, color: C.gold } },
      { text: ' (groupe électrogène)\n', options: {} },
      { text: '\nÀ TE constant, mai aurait dégagé ', options: {} },
      { text: '48 M FCFA', options: { bold: true, color: C.green } },
      { text: ' au lieu de 34,9 M.', options: {} },
    ],
    {
      x: M + 0.3, y: 3.68, w: 6.4, h: 2.6,
      fontFace: BODY, fontSize: 12, color: C.onDark, lineSpacing: 17,
      isTextBox: true, margin: 0,
    })

  // Colonne « pourquoi c'est différent »
  const points = [
    ['Requête réelle, pas résumé', "L'IA dispose d'un outil SQL en lecture seule sur les tables métier du client."],
    ['Cloisonné par construction', "Chaque requête est filtrée sur les périodes du tenant ; tables système et tables d'identité bloquées."],
    ['Coût maîtrisé', 'Quota de 60 messages par utilisateur et par jour, tracé en base.'],
    ['Expertise sectorielle', 'Les seuils TE et marge du métier sont intégrés à son prompt.'],
  ]
  points.forEach((p, i) => {
    const y = 2.42 + i * 1.03
    dot(s, 8.05, y + 0.06, 0.3, i % 2 ? C.green : C.gold, String(i + 1), C.white, 11)
    s.addText(p[0], {
      x: 8.48, y, w: 4.2, h: 0.32,
      fontFace: BODY, fontSize: 12.5, bold: true, color: C.white,
      isTextBox: true, margin: 0,
    })
    s.addText(p[1], {
      x: 8.48, y: y + 0.33, w: 4.2, h: 0.62,
      fontFace: BODY, fontSize: 10, color: C.onDarkDim, lineSpacing: 13,
      isTextBox: true, margin: 0,
    })
  })

  footnote(s, "Échange illustratif construit sur le jeu de démonstration anonymisé — cohérent avec les chiffres des slides précédentes.")
  s.addNotes(
    "Différenciateur central face à un simple outil de BI : l'assistant génère du SQL, l'exécute et " +
    "cite ses chiffres. Sécurité : SELECT uniquement, liste noire de tables système, filtrage tenant forcé, quota journalier."
  )
  pageNum(s, true)
}

// ═══════════════════════════ 11 — LA JOURNÉE TYPE ═══════════════════════════
{
  const s = newSlide()
  header(s, '03 · Le produit', "Le produit travaille sans qu'on l'ouvre",
    false,
    "L'essentiel de la valeur est poussé vers le dirigeant : il n'a rien à demander pour être informé.")

  const steps = [
    ['07:00', 'Notification push', "Sur le téléphone : production de la veille, TE du jour, alertes de seuil. Aucune application à ouvrir.", C.gold],
    ['07:00', 'Rapport par email', "Synthèse rédigée par l'IA, six cartes KPI, courbe des 7 derniers jours, encadré d'alerte, lien direct vers le dashboard.", C.green],
    ['Journée', 'Dashboard temps réel', "Consultation web ou mobile, bascule FCFA/EUR, question libre à l'assistant, comparaison au cours mondial du CPO.", C.gold],
    ['Fin de mois', 'Compte de résultat', "Le P&L du mois se compose seul et s'exporte en PDF au format attendu par le comptable et la banque.", C.green],
  ]

  steps.forEach((st, i) => {
    const x = M + i * 3.11
    card(s, x, 2.30, 2.87, 3.20, C.card, false)
    dot(s, x + 0.3, 2.58, 0.44, st[3], String(i + 1), C.white, 13)
    s.addText(st[0], {
      x: x + 0.86, y: 2.62, w: 1.9, h: 0.36,
      fontFace: HEAD, fontSize: 17, bold: true, color: st[3],
      valign: 'middle', isTextBox: true, margin: 0,
    })
    s.addText(st[1], {
      x: x + 0.3, y: 3.22, w: 2.35, h: 0.6,
      fontFace: BODY, fontSize: 14, bold: true, color: C.ink, lineSpacing: 17,
      valign: 'top', isTextBox: true, margin: 0,
    })
    s.addText(st[2], {
      x: x + 0.3, y: 3.92, w: 2.35, h: 1.7,
      fontFace: BODY, fontSize: 11, color: C.muted, lineSpacing: 15,
      valign: 'top', isTextBox: true, margin: 0,
    })
  })

  card(s, M, 5.80, W - 2 * M, 0.68, C.greenSoft, false)
  s.addText(
    "Conséquence commerciale : l'usage ne dépend pas de la discipline de connexion du client — le produit se rappelle à lui deux fois par jour.",
    {
      x: M + 0.3, y: 5.80, w: W - 2 * M - 0.6, h: 0.68,
      fontFace: BODY, fontSize: 12.5, bold: true, color: C.ink,
      valign: 'middle', isTextBox: true, margin: 0,
    })

  s.addNotes(
    "Push web (VAPID) + email transactionnel (Resend), tous deux déclenchés par cron. " +
    "C'est ce qui distingue un outil utilisé d'un outil abandonné après trois semaines."
  )
  pageNum(s)
}

// ═══════════════════════════ 12 — COMPTE DE RÉSULTAT ═══════════════════════════
{
  const s = newSlide()
  header(s, '03 · Le produit', 'Le compte de résultat, généré tout seul',
    false,
    "Un document mensuel prêt pour le comptable, la banque et l'actionnaire — en FCFA ou en euros, avec la colonne « par tonne » que le secteur utilise pour se comparer.")

  const rows = [
    [{ text: 'Ligne' }, { text: 'Total FCFA' }, { text: 'Par tonne' }],
  ]
  const body = [
    ['Ventes Huile CPO', '386 800 000', '778 270', false],
    ['Ventes Noix Palmiste', '11 800 000', '23 742', false],
    ['Total Produits', '398 600 000', '802 012', true],
    ['Coût Matière Première', '– 242 600 000', '488 129', false],
    ["Charges d'Exploitation", '– 84 200 000', '169 416', false],
    ['Amortissements', '– 18 000 000', '36 217', false],
    ['Total Charges', '– 344 800 000', '693 762', true],
    ['RÉSULTAT NET', '+ 53 800 000', '108 250', 'final'],
  ]
  body.forEach(r => {
    const isFinal = r[3] === 'final'
    const isTot = r[3] === true || isFinal
    rows.push([
      { text: r[0], options: { bold: isTot, color: isFinal ? C.white : C.ink } },
      { text: r[1], options: { bold: isTot, align: 'right', color: isFinal ? C.white : (r[1].startsWith('–') ? C.red : C.ink) } },
      { text: r[2], options: { bold: isTot, align: 'right', color: isFinal ? C.white : C.muted } },
    ])
  })

  s.addTable(rows, {
    x: M, y: 2.30, w: 7.7,
    colW: [3.5, 2.3, 1.9],
    rowH: 0.36,
    fontFace: BODY, fontSize: 12,
    border: { type: 'solid', color: C.line, pt: 0.5 },
    fill: { color: C.white },
    valign: 'middle',
    margin: [3, 8, 3, 8],
  })
  // Mise en forme de l'en-tête et des lignes de total
  s.addShape(pres.ShapeType.rect, { x: M, y: 2.30, w: 7.7, h: 0.36, fill: { color: C.dark } })
  s.addText([
    { text: 'Ligne', options: { bold: true, color: C.white } },
  ], { x: M + 0.11, y: 2.30, w: 3.3, h: 0.36, fontFace: BODY, fontSize: 11, valign: 'middle', isTextBox: true, margin: 0 })
  s.addText('Total FCFA', { x: M + 3.5, y: 2.30, w: 2.2, h: 0.36, fontFace: BODY, fontSize: 11, bold: true, color: C.white, align: 'right', valign: 'middle', isTextBox: true, margin: 0 })
  s.addText('Par tonne', { x: M + 5.8, y: 2.30, w: 1.8, h: 0.36, fontFace: BODY, fontSize: 11, bold: true, color: C.white, align: 'right', valign: 'middle', isTextBox: true, margin: 0 })

  // Ligne résultat net en vert plein
  s.addShape(pres.ShapeType.rect, { x: M, y: 2.30 + 8 * 0.36, w: 7.7, h: 0.36, fill: { color: C.green } })
  s.addText('RÉSULTAT NET', { x: M + 0.11, y: 2.30 + 8 * 0.36, w: 3.3, h: 0.36, fontFace: BODY, fontSize: 11.5, bold: true, color: C.white, valign: 'middle', isTextBox: true, margin: 0 })
  s.addText('+ 53 800 000', { x: M + 3.5, y: 2.30 + 8 * 0.36, w: 2.2, h: 0.36, fontFace: BODY, fontSize: 11.5, bold: true, color: C.white, align: 'right', valign: 'middle', isTextBox: true, margin: 0 })
  s.addText('108 250', { x: M + 5.8, y: 2.30 + 8 * 0.36, w: 1.8, h: 0.36, fontFace: BODY, fontSize: 11.5, bold: true, color: C.white, align: 'right', valign: 'middle', isTextBox: true, margin: 0 })

  // Colonne droite
  const facts = [
    ['Format OHADA', 'Structuré selon le plan comptable SYSCOHADA, celui qu\'attendent les cabinets de la zone franc.'],
    ['Export PDF', 'Document mis en page, logo et couleurs du client, badge « document officiel ».'],
    ['Triple devise', 'FCFA, euro et dollar — le même P&L pour la direction locale et un investisseur étranger.'],
    ['Non-régression testée', 'Un test « golden » verrouille les chiffres du compte de résultat : aucune évolution de code ne peut les déplacer en silence.'],
  ]
  facts.forEach((f, i) => {
    const y = 2.30 + i * 1.10
    dot(s, 8.75, y + 0.05, 0.3, i % 2 ? C.gold : C.green, '✓', C.white, 12)
    s.addText(f[0], {
      x: 9.18, y, w: 3.45, h: 0.3,
      fontFace: BODY, fontSize: 13, bold: true, color: C.ink,
      isTextBox: true, margin: 0,
    })
    s.addText(f[1], {
      x: 9.18, y: y + 0.31, w: 3.45, h: 0.72,
      fontFace: BODY, fontSize: 10.5, color: C.muted, lineSpacing: 13.5,
      isTextBox: true, margin: 0,
    })
  })

  footnote(s, "Jeu de démonstration anonymisé (« Huilerie Sédia », juin 2026) — 497 tonnes d'huile produites. Marge nette : 13,5 %.")
  s.addNotes(
    "Le compte de résultat est le livrable qui justifie l'abonnement auprès du dirigeant ET de son " +
    "comptable. Le dénominateur « par tonne » est celui des tonnes produites, pas livrées — règle métier verrouillée par test."
  )
  pageNum(s)
}

// ═══════════════════════════ 13 — S'ADAPTE À L'EXISTANT ═══════════════════════════
{
  const s = newSlide(true)
  header(s, "05 · L'adaptation à l'existant", "Palmeo s'adapte au client, pas l'inverse", true,
    "L'obstacle numéro un à la vente n'est pas le prix : c'est la peur de changer de système. Palmeo se branche sur ce qui existe déjà.")

  const models = [
    [C.gold, 'Données internes', 'Excel, CSV, Google Sheets, Dropbox, fichiers maison',
      "Import et normalisation des fichiers existants. Aucun ERP requis, aucune réorganisation de l'équipe."],
    [C.green, 'Intégration ERP', 'Odoo, Sage, SAP, Dynamics 365, Cegid, EBP, QuickBooks, API',
      "Synchronisation automatique depuis le système comptable en place. Zéro double saisie."],
    [C.gold, 'Sur mesure', 'Architecture dédiée, modules spécifiques, intégration terrain',
      "Pour les huileries à processus atypique : conception et développement dédiés."],
  ]

  models.forEach((m, i) => {
    const x = M + i * 4.13
    const featured = i === 1
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 2.55, w: 3.83, h: 3.25,
      fill: { color: C.darkCard }, rectRadius: 0.12,
      line: { color: featured ? C.green : '2A4633', width: featured ? 1.75 : 0.75 },
    })
    if (featured) {
      s.addShape(pres.ShapeType.roundRect, {
        x: x + 1.02, y: 2.34, w: 1.8, h: 0.34, fill: { color: C.green }, rectRadius: 0.17,
      })
      s.addText('LE PLUS COURANT', {
        x: x + 1.02, y: 2.34, w: 1.8, h: 0.34,
        fontFace: BODY, fontSize: 9, bold: true, color: C.white, charSpacing: 0.6,
        align: 'center', valign: 'middle', isTextBox: true, margin: 0,
      })
    }
    dot(s, x + 0.32, 2.86, 0.36, m[0])
    s.addText(m[1], {
      x: x + 0.32, y: 3.34, w: 3.2, h: 0.36,
      fontFace: BODY, fontSize: 15, bold: true, color: C.white,
      isTextBox: true, margin: 0,
    })
    s.addText(m[2], {
      x: x + 0.32, y: 3.76, w: 3.22, h: 0.72,
      fontFace: BODY, fontSize: 10, color: m[0], lineSpacing: 13,
      valign: 'top', isTextBox: true, margin: 0,
    })
    s.addText(m[3], {
      x: x + 0.32, y: 4.56, w: 3.22, h: 1.1,
      fontFace: BODY, fontSize: 10.5, color: C.onDarkDim, lineSpacing: 14,
      valign: 'top', isTextBox: true, margin: 0,
    })
  })

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 6.05, w: W - 2 * M, h: 0.72,
    fill: { color: C.green, transparency: 85 }, rectRadius: 0.12,
    line: { color: C.green, width: 0.75 },
  })
  s.addText(
    "12 sources de données annoncées commercialement  ·  connecteur Excel/Dropbox et connecteur Sage on-site déjà écrits  ·  les autres passent par un script d'import dédié",
    {
      x: M + 0.3, y: 6.05, w: W - 2 * M - 0.6, h: 0.72,
      fontFace: BODY, fontSize: 12, color: C.onDark,
      valign: 'middle', isTextBox: true, margin: 0,
    })

  s.addNotes(
    "Honnêteté requise en avant-vente : le formulaire d'onboarding documente la source, il ne la branche pas " +
    "automatiquement. Excel/Dropbox et Sage sont outillés ; tout le reste demande un script d'import dédié, " +
    "à chiffrer dans la proposition."
  )
  pageNum(s, true)
}

// ═══════════════════════════ 14 — ARCHITECTURE MULTI-TENANT ═══════════════════════════
{
  const s = newSlide()
  header(s, "06 · L'architecture qui scale", 'Un client de plus, pas un produit de plus',
    false,
    "La plateforme a été refondue en quatre étapes pour que l'ajout d'une huilerie soit une opération de configuration, pas de développement.")

  const pillars = [
    [C.green, 'Isolation par construction',
      ["Chaque table porte l'identifiant du client",
       'Cloisonnement appliqué par la base elle-même',
       'Aucune donnée client en dur dans le code']],
    [C.gold, 'Accès par rôle',
      ['Propriétaire, gestionnaire, lecteur',
       'Super-admins plateforme distincts des clients',
       'Invitation par email, activation obligatoire']],
    [C.green, 'Ingestion sécurisée',
      ["Clé d'ingestion propre à chaque client",
       'Seule son empreinte est stockée',
       "Le client est imposé côté serveur : une clé volée chez A n'écrit pas chez B"]],
    [C.gold, 'Exploitation outillée',
      ['Migrations de schéma versionnées',
       "Battements de cœur des agents d'import",
       "Journal d'audit de toutes les actions admin"]],
  ]

  pillars.forEach((p, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = M + col * 6.2
    const y = 2.30 + row * 2.20
    card(s, x, y, 5.8, 2.0, C.card, false)
    dot(s, x + 0.3, y + 0.28, 0.36, p[0])
    s.addText(p[1], {
      x: x + 0.78, y: y + 0.28, w: 4.7, h: 0.36,
      fontFace: BODY, fontSize: 14.5, bold: true, color: C.ink,
      valign: 'middle', isTextBox: true, margin: 0,
    })
    s.addText(
      p[2].map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < p[2].length - 1 } })),
      {
        x: x + 0.78, y: y + 0.76, w: 4.75, h: 1.1,
        fontFace: BODY, fontSize: 11, color: C.muted, lineSpacing: 14.5,
        paraSpaceAfter: 3, isTextBox: true, margin: 0,
      })
  })

  s.addNotes(
    "Traduction business : le coût marginal d'un client supplémentaire est un coût d'onboarding, " +
    "pas un coût de développement — condition nécessaire pour vendre autre chose que du sur-mesure."
  )
  pageNum(s)
}

// ═══════════════════════════ 15 — ONBOARDING ═══════════════════════════
{
  const s = newSlide()
  header(s, "06 · L'architecture qui scale", "De la signature à la première donnée",
    false,
    "Le parcours d'accueil d'une nouvelle huilerie, tel qu'il est documenté et outillé aujourd'hui.")

  const steps = [
    ['Créer le client', "Dans la console : identifiant, nom, pays, plan, couleurs de marque, expéditeur des rapports, capacité de cuve, premier utilisateur.", 'Console admin', C.green],
    ['Déclarer les sources', "Une entrée par source de données : type, emplacement, moyen d'accès, fréquence, notes pour l'intégrateur.", 'Console admin', C.gold],
    ['Brancher l\'import', "Excel/Dropbox : réutilisation du connecteur existant, simulation à blanc puis import réel. Sage : clé d'ingestion et agent on-site. Autres : script dédié.", 'Technique', C.green],
    ['Vérifier & activer', "Invitation reçue, marque affichée, cloisonnement des données contrôlé, rapport quotidien testé, puis activation du cron.", 'Checklist', C.gold],
  ]

  steps.forEach((st, i) => {
    const y = 2.20 + i * 1.10
    dot(s, M + 0.1, y + 0.22, 0.5, st[3], String(i + 1), C.white, 15)
    s.addText(st[0], {
      x: M + 0.82, y: y + 0.1, w: 2.9, h: 0.34,
      fontFace: BODY, fontSize: 14.5, bold: true, color: C.ink,
      isTextBox: true, margin: 0,
    })
    s.addShape(pres.ShapeType.roundRect, {
      x: M + 0.82, y: y + 0.52, w: 1.34, h: 0.28,
      fill: { color: st[3], transparency: 85 }, rectRadius: 0.14,
      line: { color: st[3], width: 0.6 },
    })
    s.addText(st[2], {
      x: M + 0.82, y: y + 0.52, w: 1.34, h: 0.28,
      fontFace: BODY, fontSize: 9, bold: true, color: C.ink,
      align: 'center', valign: 'middle', isTextBox: true, margin: 0,
    })
    s.addText(st[1], {
      x: M + 3.9, y: y + 0.06, w: 4.65, h: 0.94,
      fontFace: BODY, fontSize: 11, color: C.muted, lineSpacing: 14,
      valign: 'top', isTextBox: true, margin: 0,
    })
  })

  // Encart à droite
  card(s, 9.55, 2.20, 3.08, 4.3, C.goldSoft, false)
  s.addText('Le point de friction restant', {
    x: 9.83, y: 2.46, w: 2.55, h: 0.66,
    fontFace: BODY, fontSize: 13.5, bold: true, color: C.ink, lineSpacing: 17,
    valign: 'top', isTextBox: true, margin: 0,
  })
  s.addText(
    "L'étape 3 n'est automatique que pour Excel/Dropbox et Sage. Toute autre source demande encore " +
    "du développement — et la planification récurrente de l'import se règle client par client.",
    {
      x: 9.83, y: 3.24, w: 2.55, h: 1.7,
      fontFace: BODY, fontSize: 11, color: C.muted, lineSpacing: 15,
      valign: 'top', isTextBox: true, margin: 0,
    })
  s.addText('À industrialiser en priorité pour vendre au-delà du premier cercle.', {
    x: 9.83, y: 5.45, w: 2.55, h: 0.8,
    fontFace: BODY, fontSize: 11, bold: true, italic: true, color: C.gold, lineSpacing: 14,
    valign: 'top', isTextBox: true, margin: 0,
  })

  s.addNotes(
    "Le délai d'onboarding réel dépend presque entièrement de l'étape 3. C'est le levier n°1 " +
    "pour réduire le coût d'acquisition et raccourcir le time-to-value."
  )
  pageNum(s)
}

// ═══════════════════════════ 16 — CONSOLE OPÉRATEUR ═══════════════════════════
{
  const s = newSlide()
  header(s, "06 · L'architecture qui scale", "La console qui rend l'exploitation tenable",
    false,
    "Vendre à dix huileries suppose de savoir, sans ouvrir un terminal, laquelle est en panne d'import ce matin.")

  const feats = [
    ['Parc clients', "Chaque huilerie, son plan, son état d'activité et la fraîcheur de ses données en un coup d'œil — les clients silencieux depuis plus de sept jours ressortent seuls."],
    ['Intégrations', "Sources déclarées, clés d'ingestion actives ou révoquées, historique des exécutions d'import et de leurs erreurs."],
    ['Utilisateurs', "Invitation, changement de rôle, retrait — sans intervention en base de données."],
    ['Plan comptable', "Défauts SYSCOHADA au niveau plateforme, surcharges par client : plus aucune règle comptable codée en dur."],
    ["Journal d'audit", "Qui a changé quoi, sur quel client, quand — les actions sensibles sont marquées."],
  ]

  feats.forEach((f, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = M + col * 4.13
    const y = 2.25 + row * 2.20
    card(s, x, y, 3.83, 2.0, C.card, false)
    dot(s, x + 0.3, y + 0.3, 0.32, i % 2 ? C.gold : C.green)
    s.addText(f[0], {
      x: x + 0.74, y: y + 0.28, w: 2.85, h: 0.36,
      fontFace: BODY, fontSize: 14, bold: true, color: C.ink,
      valign: 'middle', isTextBox: true, margin: 0,
    })
    s.addText(f[1], {
      x: x + 0.3, y: y + 0.78, w: 3.25, h: 1.1,
      fontFace: BODY, fontSize: 11, color: C.muted, lineSpacing: 14.5,
      valign: 'top', isTextBox: true, margin: 0,
    })
  })

  // Bloc coût de service
  card(s, M + 2 * 4.13, 4.45, 3.83, 2.0, C.dark, false)
  s.addText('Ce que ça vaut', {
    x: M + 2 * 4.13 + 0.3, y: 4.72, w: 3.2, h: 0.32,
    fontFace: BODY, fontSize: 11, bold: true, charSpacing: 1.2, color: C.gold,
    isTextBox: true, margin: 0,
  })
  s.addText("Le support ne consomme plus de temps de développeur : l'opérateur diagnostique et corrige depuis l'interface.", {
    x: M + 2 * 4.13 + 0.3, y: 5.10, w: 3.25, h: 1.1,
    fontFace: BODY, fontSize: 11.5, color: C.onDark, lineSpacing: 15,
    isTextBox: true, margin: 0,
  })

  s.addNotes(
    "La console admin est la vraie condition du passage à l'échelle : sans elle, chaque incident client " +
    "remonte au développeur et la marge brute du SaaS s'effondre."
  )
  pageNum(s)
}

// ═══════════════════════════ 17 — ÉTAT D'AVANCEMENT ═══════════════════════════
{
  const s = newSlide()
  header(s, "07 · État d'avancement", "Où en est réellement le produit",
    false,
    "Un client fondateur en production, une plateforme multi-tenant prête, et un chantier d'industrialisation clairement identifié.")

  const stats = [
    ['1', 'client en production', "APO, Côte d'Ivoire — le client fondateur, données réelles"],
    ['26', 'tables métier', 'production, ventes, caisses, banque, achats, KPI, référentiels'],
    ['8', 'services applicatifs', 'IA, rapports, alertes, ingestion, cours du marché, administration'],
    ['~17 700', 'lignes de code', "application, console, imports, services et site vitrine"],
  ]
  stats.forEach((st, i) => {
    const x = M + i * 3.11
    card(s, x, 2.20, 2.87, 1.55, C.card, false)
    s.addText(st[0], {
      x: x + 0.26, y: 2.34, w: 2.4, h: 0.6,
      fontFace: HEAD, fontSize: 32, bold: true, color: i % 2 ? C.green : C.gold,
      isTextBox: true, margin: 0,
    })
    s.addText(st[1], {
      x: x + 0.26, y: 2.94, w: 2.4, h: 0.28,
      fontFace: BODY, fontSize: 12, bold: true, color: C.ink,
      isTextBox: true, margin: 0,
    })
    s.addText(st[2], {
      x: x + 0.26, y: 3.22, w: 2.4, h: 0.46,
      fontFace: BODY, fontSize: 9.5, color: C.muted, lineSpacing: 12,
      isTextBox: true, margin: 0,
    })
  })

  // Deux colonnes : livré / à faire
  s.addText('LIVRÉ ET EN SERVICE', {
    x: M, y: 4.05, w: 5.8, h: 0.3,
    fontFace: BODY, fontSize: 10.5, bold: true, charSpacing: 1.4, color: C.green,
    isTextBox: true, margin: 0,
  })
  const done = [
    'Dashboard complet, web et mobile, en production',
    'Compte de résultat mensuel et export PDF',
    'Assistant IA connecté aux données du client',
    'Rapport quotidien par email et alertes push',
    'Socle multi-tenant, rôles et cloisonnement',
    'Console admin et accueil client par formulaire',
  ]
  s.addText(done.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < done.length - 1 } })), {
    x: M, y: 4.40, w: 5.7, h: 2.0,
    fontFace: BODY, fontSize: 11.5, color: C.ink, lineSpacing: 15,
    paraSpaceAfter: 5, isTextBox: true, margin: 0,
  })

  s.addText('À TERMINER AVANT LE PREMIER CLIENT PAYANT SUIVANT', {
    x: 6.9, y: 4.05, w: 5.8, h: 0.3,
    fontFace: BODY, fontSize: 10.5, bold: true, charSpacing: 1.4, color: C.gold,
    isTextBox: true, margin: 0,
  })
  const todo = [
    "Planification automatique des imports pour un nouveau client",
    "Rapports automatiques étendus à tous les clients actifs",
    "Neutraliser les libellés hérités du client fondateur dans l'interface",
    "Connecteur générique pour logiciels comptables et API",
    "Sous-domaine et logo par client (hébergement d'image)",
    "Trancher le nom de l'assistant : « PALMAI » ou « Palmeo AI »",
  ]
  s.addText(todo.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < todo.length - 1 } })), {
    x: 6.9, y: 4.40, w: 5.7, h: 2.0,
    fontFace: BODY, fontSize: 11.5, color: C.ink, lineSpacing: 15,
    paraSpaceAfter: 5, isTextBox: true, margin: 0,
  })

  s.addNotes(
    "Slide volontairement honnête : les six points de droite sont les limites documentées dans le dépôt. " +
    "Aucun n'est bloquant pour une démonstration ; tous le sont pour une vente en volume."
  )
  pageNum(s)
}

// ═══════════════════════════ 18 — MODÈLE ÉCONOMIQUE ═══════════════════════════
{
  const s = newSlide()
  header(s, '08 · Modèle', 'Comment Palmeo se monétise',
    false,
    "Trois paliers d'abonnement sont déjà inscrits dans la plateforme. La grille tarifaire reste à arbitrer — c'est la principale décision commerciale ouverte.")

  const plans = [
    ['Starter', "L'huilerie qui part d'Excel", ['Dashboard complet', 'Compte de résultat mensuel', 'Rapport quotidien par email', 'Import fichiers'], C.green],
    ['Business', 'Le cœur de cible', ['Tout Starter', 'Assistant IA sur les données', 'Alertes push et seuils', 'Connecteur ERP ou agent on-site'], C.gold],
    ['Enterprise', 'Groupe ou processus atypique', ['Tout Business', 'Modules et rapports sur mesure', 'Intégration terrain dédiée', 'Accompagnement de bout en bout'], C.green],
  ]

  plans.forEach((p, i) => {
    const x = M + i * 4.13
    const featured = i === 1
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 2.35, w: 3.83, h: 3.35,
      fill: { color: featured ? C.goldSoft : C.card }, rectRadius: 0.12,
      line: { color: featured ? C.gold : C.card, width: featured ? 1.75 : 0.5 },
    })
    s.addText(p[0], {
      x: x + 0.32, y: 2.62, w: 3.2, h: 0.42,
      fontFace: HEAD, fontSize: 22, bold: true, color: p[3],
      isTextBox: true, margin: 0,
    })
    s.addText(p[1], {
      x: x + 0.32, y: 3.06, w: 3.2, h: 0.3,
      fontFace: BODY, fontSize: 11, italic: true, color: C.muted,
      isTextBox: true, margin: 0,
    })
    s.addText('Tarif à définir', {
      x: x + 0.32, y: 3.44, w: 3.2, h: 0.3,
      fontFace: BODY, fontSize: 11, bold: true, color: C.ink,
      isTextBox: true, margin: 0,
    })
    s.addText(
      p[2].map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < p[2].length - 1 } })),
      {
        x: x + 0.32, y: 3.88, w: 3.25, h: 1.6,
        fontFace: BODY, fontSize: 11, color: C.ink, lineSpacing: 15,
        paraSpaceAfter: 5, isTextBox: true, margin: 0,
      })
  })

  card(s, M, 5.95, W - 2 * M, 0.78, C.card, false)
  s.addText(
    [
      { text: 'Décision ouverte : ', options: { bold: true, color: C.ink } },
      { text: "les trois paliers existent en base ; les prix, la répartition abonnement / frais de mise en service et le coût du connecteur sur mesure ne sont encore arbitrés nulle part.", options: { color: C.muted } },
    ],
    {
      x: M + 0.3, y: 5.95, w: W - 2 * M - 0.6, h: 0.78,
      fontFace: BODY, fontSize: 12, lineSpacing: 16,
      valign: 'middle', isTextBox: true, margin: 0,
    })

  s.addNotes(
    "Ne pas annoncer de prix : rien dans la plateforme n'en fixe. Les paliers starter / business / enterprise " +
    "sont réels (contrainte de base de données) ; la grille est à construire, en tenant compte du coût réel " +
    "d'intégration qui varie fortement selon la source de données."
  )
  pageNum(s)
}

// ═══════════════════════════ 19 — PROCHAINES ÉTAPES ═══════════════════════════
{
  const s = newSlide(true)

  s.addShape(pres.ShapeType.ellipse, {
    x: 9.0, y: -1.2, w: 6.4, h: 6.4,
    fill: { color: C.green, transparency: 88 },
  })

  header(s, '08 · Prochaines étapes', 'Trois décisions, puis on vend', true)

  const acts = [
    ['Industrialiser', "Planification automatique des imports et rapports pour tout nouveau client, et neutralisation des libellés hérités.", "Condition d'un accueil client sans développeur"],
    ['Décider la grille', "Fixer les prix des trois paliers et le coût d'intégration selon la source de données.", 'Condition de la première proposition commerciale'],
    ['Ouvrir la démo', "Client de démonstration anonymisé déjà spécifié, avec jeu de données et vidéo de 60 secondes.", 'Condition de la mise en ligne du site'],
  ]

  acts.forEach((a, i) => {
    const y = 2.20 + i * 1.38
    dot(s, M, y + 0.18, 0.56, i === 1 ? C.gold : C.green, String(i + 1), C.white, 17)
    s.addText(a[0], {
      x: M + 0.86, y: y + 0.04, w: 3.2, h: 0.38,
      fontFace: HEAD, fontSize: 20, bold: true, color: C.white, valign: 'top',
      isTextBox: true, margin: 0,
    })
    s.addText(a[1], {
      x: M + 0.86, y: y + 0.48, w: 6.4, h: 0.7,
      fontFace: BODY, fontSize: 12, color: C.onDarkDim, lineSpacing: 16,
      valign: 'top', isTextBox: true, margin: 0,
    })
    s.addText(a[2], {
      x: 8.1, y: y + 0.18, w: 4.5, h: 0.5,
      fontFace: BODY, fontSize: 11, bold: true, italic: true,
      color: i === 1 ? C.gold : C.green, valign: 'middle',
      isTextBox: true, margin: 0,
    })
  })

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 6.30, w: W - 2 * M, h: 0.62,
    fill: { color: C.darkCard }, rectRadius: 0.12, line: { color: C.gold, width: 0.9 },
  })
  s.addText('palmeo.co   ·   app.palmeo.co   ·   contact@palmeo.co', {
    x: M, y: 6.30, w: W - 2 * M, h: 0.62,
    fontFace: BODY, fontSize: 13, bold: true, color: C.gold,
    align: 'center', valign: 'middle', isTextBox: true, margin: 0,
  })

  s.addNotes(
    "Fin. Le produit existe et tourne ; ce qui manque relève de l'industrialisation et de la décision " +
    "commerciale, pas de la faisabilité technique."
  )
  pageNum(s, true)
}

pres.writeFile({ fileName: 'Palmeo-presentation-business.pptx' })
  .then(f => console.log('OK →', f))
  .catch(e => { console.error(e); process.exit(1) })
