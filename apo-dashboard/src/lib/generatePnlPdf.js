// ============================================================
// APO — Générateur PDF Compte de Résultat
// Utilise jsPDF + jspdf-autotable
// Normes comptables françaises : FCFA, parenthèses pour charges
// ============================================================

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoUrl from '../assets/logo_apo.png'

// ── Palette couleurs APO (RGB) ───────────────────────────────
const C = {
  gold:       [200, 106,  16],
  green:      [ 46, 125,  64],
  red:        [192,  57,  43],
  dark:       [ 15,  42,  29],
  textDim:    [107, 120, 101],
  white:      [255, 255, 255],
  border:     [220, 215, 200],
  sectionBg:  [250, 248, 242],
  subtotalBg: [245, 240, 225],
  headerBg:   [ 15,  42,  29],
}

// ── Formatters ────────────────────────────────────────────────
// IMPORTANT : NE PAS utiliser toLocaleString('fr-FR') — jsPDF
// ne supporte pas l'espace fine insécable U+202F → rendu en "/"
// On utilise un regex avec espace ASCII ordinaire.
const USD_RATE = 563
const sep   = (v) => Math.abs(Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// Formateurs sensibles à la devise (injectés après init de currency)
let conv  = (v) => v                        // FCFA → FCFA par défaut
let fNum  = (v) => sep(v)
let fNeg  = (v) => v === 0 ? '-' : `(${sep(v)})`
let fSign = (v) => v >= 0 ? `+${sep(v)}` : `(${sep(Math.abs(v))})`
const fPct  = (v) => `${Number(v).toFixed(1)}%`

function initFormatters(currency) {
  if (currency === 'USD') {
    conv  = (v) => Math.round(v / USD_RATE)
    const pfx = (v) => `$${sep(Math.abs(v))}`
    fNum  = (v) => `$${sep(Math.abs(conv(v)))}`
    fNeg  = (v) => v === 0 ? '-' : `($${sep(Math.abs(conv(v)))})`
    fSign = (v) => {
      const u = conv(v)
      return u >= 0 ? `+$${sep(u)}` : `($${sep(Math.abs(u))})`
    }
  } else {
    conv  = (v) => v
    fNum  = (v) => sep(v)
    fNeg  = (v) => v === 0 ? '-' : `(${sep(v)})`
    fSign = (v) => v >= 0 ? `+${sep(v)}` : `(${sep(Math.abs(v))})`
  }
}

// ── Helpers ───────────────────────────────────────────────────
function setFont(doc, size, style = 'normal', color = [30, 30, 30]) {
  doc.setFontSize(size)
  doc.setFont('helvetica', style)
  doc.setTextColor(...color)
}
function hLine(doc, y, x1, x2, color = C.border, lw = 0.3) {
  doc.setDrawColor(...color)
  doc.setLineWidth(lw)
  doc.line(x1, y, x2, y)
}

// ── Main export ───────────────────────────────────────────────
export function generatePnlPdf(data, currency = 'FCFA', brandNom = 'APO — Agro Palm Oil') {
  const [brandLabel, ...brandRest] = brandNom.split(' — ')
  const brandSub  = brandRest.join(' — ') || 'Agro Palm Oil'
  const brandSlug = brandLabel.replace(/[^A-Za-z0-9]+/g, '_')
  initFormatters(currency)
  const isUSD = currency === 'USD'
  const { pnl, kpis, _etl, alertes = [] } = data
  const mois    = _etl?.mois    ?? 'Mois'
  const annee   = _etl?.annee   ?? ''
  const partiel = _etl?.partiel ?? false
  const dateMaj = _etl?.dateDerniereMaj ?? ''
  const now     = new Date()
  // Formatage manuel pour éviter U+202F dans la date aussi
  const pad2    = (n) => String(n).padStart(2, '0')
  const genDate = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`
  const genTime = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`

  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W      = doc.internal.pageSize.getWidth()   // 210
  const MARGIN = 14
  const COL_W  = W - MARGIN * 2                     // 182

  // Largeurs des 3 colonnes (doivent sommer à COL_W = 182)
  const CW = { label: 108, tonne: 35, total: 39 }   // 108+35+39 = 182

  // ── 1. HEADER — fond blanc, pas de bandeau foncé ────────────
  const logoSize = 22
  const logoX    = MARGIN
  const logoY    = 6
  doc.addImage(logoUrl, 'PNG', logoX, logoY, logoSize, logoSize)

  // Nom société (texte sombre sur fond blanc)
  setFont(doc, 15, 'bold', C.dark)
  doc.text(brandLabel, MARGIN + logoSize + 6, 14)
  setFont(doc, 9, 'normal', C.textDim)
  doc.text(brandSub, MARGIN + logoSize + 6, 20.5)
  setFont(doc, 7.5, 'italic', [160, 160, 155])
  doc.text('Rapport financier confidentiel', MARGIN + logoSize + 6, 26)

  // Date (droite, texte sombre)
  setFont(doc, 7.5, 'normal', C.textDim)
  doc.text(`Genere le ${genDate} a ${genTime}`, W - MARGIN, 14, { align: 'right' })
  doc.text(`${brandLabel} Dashboard ${annee}`, W - MARGIN, 20.5, { align: 'right' })

  // Ligne de séparation fine sous le header
  hLine(doc, 33, MARGIN, W - MARGIN, C.border, 0.4)

  let y = 40

  // ── 2. TITRE ────────────────────────────────────────────────
  setFont(doc, 15, 'bold', C.dark)
  doc.text('COMPTE DE RESULTAT', MARGIN, y)
  y += 6

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
  const periodLabel = `${cap(mois)} ${annee}${partiel ? `  —  donnees au ${dateMaj} (mois partiel)` : ''}`
  setFont(doc, 9, 'normal', C.textDim)
  doc.text(periodLabel, MARGIN, y)
  y += 4
  setFont(doc, 8, 'italic', C.textDim)
  doc.text(`Base de calcul : ${pnl.baseLabel}`, MARGIN, y)
  y += 2
  hLine(doc, y + 2, MARGIN, W - MARGIN, C.gold, 0.6)
  y += 7

  // ── 3. ENCART KPIs ──────────────────────────────────────────
  const kpiBoxH = 20
  doc.setFillColor(...C.sectionBg)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.35)
  doc.roundedRect(MARGIN, y, COL_W, kpiBoxH, 2, 2, 'FD')

  const caLabel  = isUSD ? `$${sep(Math.round(kpis.caTotalFCFA / USD_RATE))}` : `${sep(kpis.caTotalFCFA)} FCFA`
  const resLabel = isUSD ? `$${sep(Math.abs(Math.round(pnl.resultatTotal / USD_RATE)))}` : `${sep(Math.abs(pnl.resultatTotal))} FCFA`
  const kpiItems = [
    { label: "Chiffre d'Affaires", value: caLabel },
    { label: 'Marge Brute',        value: fPct(pnl.margeBrutePct) },
    { label: 'EBITDA',             value: fPct(pnl.ebitdaPct) },
    { label: 'Res. Exploitation',  value: fPct(pnl.resultatExplPct ?? pnl.ebitdaPct), color: (pnl.resultatExplTotal ?? pnl.ebitdaTotal) >= 0 ? C.green : C.red },
    { label: 'Resultat Net',       value: resLabel, color: pnl.resultatTotal >= 0 ? C.green : C.red },
    { label: 'Marge Nette',        value: fPct(kpis.margeNette), color: pnl.resultatTotal >= 0 ? C.green : C.red },
  ]
  const kpiW = COL_W / kpiItems.length
  kpiItems.forEach((k, i) => {
    const kx = MARGIN + i * kpiW + kpiW / 2
    setFont(doc, 6.5, 'normal', C.textDim)
    doc.text(k.label, kx, y + 6, { align: 'center' })
    setFont(doc, 8.5, 'bold', k.color ?? C.dark)
    doc.text(k.value, kx, y + 12.5, { align: 'center' })
    if (i > 0) {
      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.25)
      doc.line(MARGIN + i * kpiW, y + 3, MARGIN + i * kpiW, y + kpiBoxH - 3)
    }
  })
  y += kpiBoxH + 5

  // ── 4. TABLEAU P&L ──────────────────────────────────────────
  const rows      = []
  const styleMap  = {}
  let   r         = 0

  const S = {
    section:      { fillColor: [80, 105, 88],    textColor: [235, 245, 235], fontStyle: 'bold',   fontSize: 8   },
    sectionTax:   { fillColor: [90,  70, 130],   textColor: [240, 235, 255], fontStyle: 'bold',   fontSize: 8   },
    sectionAmort: { fillColor: [70,  90,  90],   textColor: [230, 240, 240], fontStyle: 'bold',   fontSize: 8   },
    detail:       { fillColor: C.white,          textColor: [35,  35,  35],  fontStyle: 'normal', fontSize: 8   },
    total:        { fillColor: C.subtotalBg,     textColor: C.dark,          fontStyle: 'bold',   fontSize: 8   },
    marge:        { fillColor: [242, 232, 212],  textColor: C.gold,          fontStyle: 'bold',   fontSize: 9   },
    ebitda:       { fillColor: [232, 236, 248],  textColor: [35,  60, 115],  fontStyle: 'bold',   fontSize: 9   },
    resultatExpl: { fillColor: [240, 235, 210],  textColor: [140,  90,   0], fontStyle: 'bold',   fontSize: 9   },
    result:       {
      fillColor: pnl.resultatTotal >= 0 ? [225, 245, 230] : [248, 228, 225],
      textColor: pnl.resultatTotal >= 0 ? C.green : C.red,
      fontStyle: 'bold', fontSize: 9.5,
    },
  }

  const addRow = (cells, style) => { rows.push(cells); styleMap[r++] = style }

  // I. CA
  addRow(["I.  CHIFFRE D'AFFAIRES", '', ''], S.section)
  pnl.produits.forEach(p => addRow([
    '   ' + p.label,
    p.pertonne > 0 ? fNum(p.pertonne) : '-',
    p.total    > 0 ? fNum(p.total)    : 'Non facture',
  ], S.detail))
  addRow(['TOTAL CHIFFRE D\'AFFAIRES', fNum(pnl.totalProduitsTonne), fNum(pnl.totalProduitsTotal)], S.total)

  // II. Cout MP
  addRow(['II.  COUT MATIERE PREMIERE', '', ''], S.section)
  addRow([
    '   ' + pnl.coutMP.label,
    fNum(Math.abs(pnl.coutMP.pertonne)),
    fNeg(Math.abs(pnl.coutMP.total)),
  ], S.detail)

  // Marge Brute
  addRow([
    `MARGE BRUTE  (${fPct(pnl.margeBrutePct)} du CA)`,
    fSign(pnl.margeBruteTonne),
    fSign(pnl.margeBruteTotal),
  ], S.marge)

  // III. Charges opérationnelles
  addRow(['III.  CHARGES D\'EXPLOITATION OPERATIONNELLES', '', ''], S.section)
  pnl.chargesExploitation.forEach(c => addRow([
    '   ' + c.label,
    fNum(Math.abs(c.pertonne)),
    fNeg(Math.abs(c.total)),
  ], S.detail))
  addRow([
    'TOTAL CHARGES EXPLOITATION',
    fNeg(Math.abs(pnl.totalChargesExpTonne)),
    fNeg(Math.abs(pnl.totalChargesExpTotal)),
  ], S.total)

  // EBITDA
  addRow([
    `EBE / EBITDA  (${fPct(pnl.ebitdaPct)} du CA)`,
    fSign(pnl.ebitdaTonne),
    fSign(pnl.ebitdaTotal),
  ], S.ebitda)

  // IV. Impôts & Taxes (hors IS)
  if (pnl.impotsTaxes?.length > 0) {
    addRow(['IV.  IMPOTS & TAXES  (hors impot sur benefices)', '', ''], S.sectionTax)
    pnl.impotsTaxes.forEach(t => addRow([
      '   ' + t.label,
      t.pertonne ? fNum(Math.abs(t.pertonne)) : '-',
      fNeg(Math.abs(t.total)),
    ], S.detail))
    if (pnl.impotsTaxes.length > 1) {
      addRow([
        'TOTAL IMPOTS & TAXES',
        fNeg(Math.abs(pnl.totalImpotsTaxesTonne ?? 0)),
        fNeg(Math.abs(pnl.totalImpotsTaxesTotal ?? 0)),
      ], S.total)
    }
    // Résultat d'exploitation
    addRow([
      `RESULTAT D'EXPLOITATION  (${fPct(pnl.resultatExplPct ?? 0)} du CA)`,
      fSign(pnl.resultatExplTonne ?? 0),
      fSign(pnl.resultatExplTotal ?? 0),
    ], S.resultatExpl)
  }

  // V. Amortissements
  addRow(['V.  AMORTISSEMENTS & CHARGES FINANCIERES', '', ''], S.sectionAmort)
  if (!pnl.amortissements?.length || pnl.amortissements.every(a => a.total === 0)) {
    addRow(['   Neant pour cette periode', '-', '-'], S.detail)
  } else {
    pnl.amortissements.forEach(a => addRow([
      '   ' + a.label,
      a.pertonne ? fNum(Math.abs(a.pertonne)) : '-',
      a.total === 0 ? '-' : fNeg(Math.abs(a.total)),
    ], S.detail))
  }

  // VI. BIC (si applicable)
  if (pnl.bic?.length > 0) {
    addRow(['VI.  IMPOT SUR BENEFICES (IS)', '', ''], S.sectionTax)
    pnl.bic.forEach(b => addRow([
      '   ' + b.label,
      b.pertonne ? fNum(Math.abs(b.pertonne)) : '-',
      fNeg(Math.abs(b.total)),
    ], S.detail))
  }

  // Résultat Net
  addRow([
    `RESULTAT NET  (${fPct(kpis.margeNette)} du CA)`,
    fSign(pnl.resultatTonne),
    fSign(pnl.resultatTotal),
  ], S.result)

  autoTable(doc, {
    startY: y,
    head: [[
      { content: 'Libelle',                                   styles: { halign: 'left'  } },
      { content: isUSD ? '$ / tonne' : 'F / tonne',          styles: { halign: 'right' } },
      { content: isUSD ? 'Total (USD)' : 'Total (FCFA)',      styles: { halign: 'right' } },
    ]],
    body: rows,
    columnStyles: {
      0: { cellWidth: CW.label, halign: 'left'  },
      1: { cellWidth: CW.tonne, halign: 'right' },
      2: { cellWidth: CW.total, halign: 'right' },
    },
    headStyles: {
      fillColor: C.dark,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
      lineColor: C.border,
      lineWidth: 0.18,
      overflow: 'linebreak',
    },
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: COL_W,
    didParseCell: (hookData) => {
      if (hookData.section !== 'body') return
      const s = styleMap[hookData.row.index]
      if (!s) return
      hookData.cell.styles.fillColor  = s.fillColor
      hookData.cell.styles.textColor  = s.textColor
      hookData.cell.styles.fontStyle  = s.fontStyle
      hookData.cell.styles.fontSize   = s.fontSize
    },
  })

  y = doc.lastAutoTable.finalY + 7

  // ── 5. NOTES ────────────────────────────────────────────────
  const warnings = alertes.filter(a => a.type === 'warn' || a.type === 'info')
  if (warnings.length > 0) {
    if (y > 238) { doc.addPage(); y = 18 }
    setFont(doc, 8.5, 'bold', C.dark)
    doc.text("Notes & Points d'attention", MARGIN, y)
    y += 4
    hLine(doc, y, MARGIN, W - MARGIN, C.border)
    y += 4

    warnings.forEach(a => {
      if (y > 263) { doc.addPage(); y = 18 }
      const prefix = a.type === 'warn' ? '! ' : 'i '
      setFont(doc, 7.5, 'bold', a.type === 'warn' ? C.gold : C.textDim)
      doc.text(prefix + a.titre, MARGIN, y)
      y += 3.8
      setFont(doc, 7, 'normal', C.textDim)
      const lines = doc.splitTextToSize(a.texte, COL_W - 5)
      doc.text(lines, MARGIN + 4, y)
      y += lines.length * 3.6 + 2.5
    })
  }

  // ── 6. PIED DE PAGE ─────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    const pageY = doc.internal.pageSize.getHeight() - 7
    hLine(doc, pageY - 3, MARGIN, W - MARGIN, C.border, 0.25)
    setFont(doc, 6.5, 'normal', C.textDim)
    doc.text(`${brandLabel} Dashboard  |  Compte de resultat ${mois} ${annee}  |  Genere le ${genDate}`, MARGIN, pageY)
    doc.text(`Page ${p} / ${pageCount}`, W - MARGIN, pageY, { align: 'right' })
    if (partiel) {
      setFont(doc, 6.5, 'italic', C.red)
      doc.text(`Donnees partielles au ${dateMaj}`, W / 2, pageY, { align: 'center' })
    }
  }

  // ── 7. Sauvegarde ────────────────────────────────────────────
  const filename = `${brandSlug}_PnL_${mois}_${annee}${isUSD ? '_USD' : ''}${partiel ? '_partiel' : ''}.pdf`
  doc.save(filename)
}
