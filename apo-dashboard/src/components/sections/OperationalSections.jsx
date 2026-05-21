import { useEffect, useRef } from 'react'
import {
  Chart, BarElement, BarController,
  LineElement, LineController, PointElement, Filler,
  CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js'
import { fmt, chartColors, defaultTooltip } from '../../lib/kpiEngine'
import { useDashboardStore } from '../../store/dashboardStore'
import { monthFull } from '../../lib/monthUtils'

Chart.register(
  BarElement, BarController,
  LineElement, LineController, PointElement, Filler,
  CategoryScale, LinearScale, Tooltip, Legend,
)

// ── Palette fournisseurs ──────────────────────────────────────
const F_PALETTE = [
  ['rgba(242,140,40,1)',  'rgba(242,140,40,0.30)'],
  ['rgba(100,190,100,1)','rgba(100,190,100,0.30)'],
  ['rgba(90,155,220,1)', 'rgba(90,155,220,0.30)'],
  ['rgba(210,100,130,1)','rgba(210,100,130,0.30)'],
  ['rgba(160,120,220,1)','rgba(160,120,220,0.30)'],
  ['rgba(60,195,180,1)', 'rgba(60,195,180,0.30)'],
  ['rgba(240,185,60,1)', 'rgba(240,185,60,0.30)'],
  ['rgba(190,130,90,1)', 'rgba(190,130,90,0.30)'],
]

const MONTH_LABELS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
const MONTH_SHORT  = ['jan','fév','mar','avr','mai','juin','juil','aoû','sep','oct','nov','déc']

function toShortMois(libelle) {
  const idx = MONTH_LABELS.indexOf((libelle || '').toLowerCase())
  return idx >= 0 ? MONTH_SHORT[idx] : (libelle ?? '').slice(0, 3)
}

// ── Sparkline SVG (mini inline chart) ────────────────────────
function Sparkline({ values, width = 68, height = 26 }) {
  const nonZero = values.filter(v => v > 0)
  if (nonZero.length < 2) {
    return <svg width={width} height={height}><text x="4" y="17" fill="var(--text-dim)" fontSize="9">—</text></svg>
  }
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const pad = 4
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (width - pad * 2),
    height - pad - ((v - min) / range) * (height - pad * 2),
  ])
  const dLine = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const dArea = `${dLine} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`
  const last   = pts[pts.length - 1]
  const isUp   = values[values.length - 1] >= values[values.length - 2]
  const dotCol = isUp ? 'var(--green)' : 'var(--red)'

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <path d={dArea} fill="rgba(242,140,40,0.12)" />
      <path d={dLine} fill="none" stroke="rgba(242,140,40,0.9)" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill={dotCol} />
    </svg>
  )
}

// ── Stacked area chart — évolution mensuelle ─────────────────
function StackedAreaChart({ fournisseurs, allMois, month }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  const topNames = fournisseurs.liste.slice(0, Math.min(6, fournisseurs.liste.length)).map(f => f.name)

  useEffect(() => {
    chartRef.current?.destroy()
    if (!canvasRef.current || topNames.length === 0 || allMois.length < 2) return

    const labels   = allMois.map(m => toShortMois(m.data._etl?.mois))
    const datasets = topNames.map((name, i) => ({
      label:           name.length > 20 ? name.slice(0, 20) + '…' : name,
      data:            allMois.map(m => {
        const f = m.data?.fournisseurs?.liste?.find(f => f.name === name)
        return f ? +(f.poids / 1000).toFixed(1) : 0
      }),
      borderColor:     F_PALETTE[i % F_PALETTE.length][0],
      backgroundColor: F_PALETTE[i % F_PALETTE.length][1],
      fill:            true,
      tension:         0.4,
      borderWidth:     2,
      pointRadius:     3,
      pointHoverRadius: 5,
    }))

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display:  true,
            position: 'top',
            labels: { color: 'var(--text-dim)', font: { size: 11 }, padding: 10, boxWidth: 12 },
          },
          tooltip: {
            ...defaultTooltip,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('fr-FR')} T`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'var(--text-dim)', font: { size: 11 } },
          },
          y: {
            stacked: true,
            grid:    { color: 'rgba(242,140,40,0.06)' },
            ticks: {
              color:    'var(--text-dim)',
              callback: v => v.toLocaleString('fr-FR') + ' T',
            },
          },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [month, allMois.length])

  if (allMois.length < 2) return null

  return (
    <div className="chart-card">
      <div className="chart-title">Évolution Mensuelle — Top Fournisseurs</div>
      <div className="chart-subtitle">Volume livré mois par mois (en tonnes) — empilé par fournisseur</div>
      <div className="chart-container" style={{ height: 280 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

// ── Heatmap fournisseur × mois ────────────────────────────────
function HeatmapGrid({ fournisseurs, allMois }) {
  if (allMois.length < 2) return null

  const topNames = fournisseurs.liste.slice(0, Math.min(8, fournisseurs.liste.length)).map(f => f.name)
  const months   = allMois.map(m => toShortMois(m.data._etl?.mois))

  const maxByRow = topNames.map(name =>
    Math.max(1, ...allMois.map(m => m.data?.fournisseurs?.liste?.find(f => f.name === name)?.poids || 0))
  )

  return (
    <div className="chart-card">
      <div className="chart-title">Heatmap Fournisseurs × Mois</div>
      <div className="chart-subtitle">Intensité relative par fournisseur — valeur en tonnes</div>
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <div style={{
          display:               'grid',
          gridTemplateColumns:   `minmax(110px,160px) repeat(${months.length}, minmax(40px,1fr))`,
          gap:                   3,
          minWidth:              months.length * 52 + 170,
        }}>
          {/* Header */}
          <div />
          {months.map((m, ci) => (
            <div key={ci} style={{
              fontSize: 10, color: 'var(--text-dim)', textAlign: 'center',
              padding: '3px 2px', fontFamily: "'DM Mono', monospace",
            }}>
              {m}
            </div>
          ))}

          {/* Rows */}
          {topNames.map((name, ri) => (
            <>
              <div
                key={`lbl-${ri}`}
                title={name}
                style={{
                  fontSize: 11, color: 'var(--text-primary)',
                  padding: '6px 8px 6px 0', alignSelf: 'center',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {name.length > 20 ? name.slice(0, 20) + '…' : name}
              </div>
              {allMois.map((m, ci) => {
                const val       = m.data?.fournisseurs?.liste?.find(f => f.name === name)?.poids || 0
                const intensity = val / maxByRow[ri]
                const alpha     = intensity > 0 ? 0.15 + intensity * 0.72 : 0
                return (
                  <div
                    key={`cell-${ri}-${ci}`}
                    title={`${name} — ${toShortMois(m.data._etl?.mois)}: ${Math.round(val / 1000)} T`}
                    style={{
                      height:          34,
                      borderRadius:    5,
                      background:      intensity > 0
                        ? `rgba(242,140,40,${alpha.toFixed(2)})`
                        : 'rgba(255,255,255,0.03)',
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      fontSize:        9,
                      color:           intensity > 0.55 ? 'rgba(255,255,255,0.92)' : 'var(--text-dim)',
                      fontFamily:      "'DM Mono', monospace",
                      cursor:          'default',
                      transition:      'background 0.15s',
                    }}
                  >
                    {val > 0 ? Math.round(val / 1000) + 'T' : '—'}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Bar chart horizontal (camions ou poids/camion) ────────────
function HBarChart({ title, subtitle, labels, values, unit, color, month }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    chartRef.current?.destroy()
    if (!canvasRef.current || labels.length === 0) return

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data:            values,
          backgroundColor: color ?? 'rgba(242,140,40,0.75)',
          borderRadius:    4,
          borderWidth:     0,
        }],
      },
      options: {
        indexAxis:           'y',
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...defaultTooltip,
            callbacks: {
              label: ctx => `${ctx.parsed.x.toLocaleString('fr-FR')} ${unit}`,
            },
          },
        },
        scales: {
          x: {
            grid:  { color: 'rgba(242,140,40,0.06)' },
            ticks: { color: 'var(--text-dim)', font: { size: 10 }, callback: v => v.toLocaleString('fr-FR') },
          },
          y: {
            grid:  { display: false },
            ticks: { color: 'var(--text-primary)', font: { size: 10 } },
          },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [month, JSON.stringify(values)])

  const h = Math.max(180, labels.length * 32 + 40)

  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <div className="chart-subtitle">{subtitle}</div>
      <div className="chart-container" style={{ height: h }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

// ── Line chart — fournisseurs actifs par mois ─────────────────
function ActiveSuppliersChart({ allMois, month }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    chartRef.current?.destroy()
    if (!canvasRef.current || allMois.length < 2) return

    const labels = allMois.map(m => toShortMois(m.data._etl?.mois))
    const counts = allMois.map(m => m.data?.fournisseurs?.liste?.length || 0)

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label:           'Fournisseurs actifs',
          data:            counts,
          borderColor:     'rgba(90,155,220,1)',
          backgroundColor: 'rgba(90,155,220,0.15)',
          fill:            true,
          tension:         0.3,
          borderWidth:     2,
          pointRadius:     4,
          pointHoverRadius: 6,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...defaultTooltip,
            callbacks: { label: ctx => `${ctx.parsed.y} fournisseurs` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: 'var(--text-dim)', font: { size: 11 } } },
          y: {
            grid:       { color: 'rgba(242,140,40,0.06)' },
            ticks:      { color: 'var(--text-dim)', stepSize: 1 },
            beginAtZero: true,
          },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [month, allMois.length])

  if (allMois.length < 2) return null

  return (
    <div className="chart-card">
      <div className="chart-title">Nombre de Fournisseurs Actifs par Mois</div>
      <div className="chart-subtitle">Évolution du panel fournisseurs dans la base de données</div>
      <div className="chart-container" style={{ height: 200 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

// ── CHARGES ──────────────────────────────────────────────────
export function Charges({ data, month }) {
  const { currency, eurRate } = useDashboardStore()
  const { charges, kpis } = data
  const refWaterfall = useRef(null)
  const chartRef     = useRef(null)

  const isCategorized = charges.topDepenses.length > 0 && charges.topDepenses[0].date === ''
  const total = charges.topDepenses.reduce((s, r) => s + r.mt, 0)

  useEffect(() => {
    chartRef.current?.destroy()
    if (!refWaterfall.current || !isCategorized) return

    const ca      = kpis.caTotalFCFA       || 0
    const coutMP  = kpis.coutMPFCFA        || 0
    const amort   = kpis.amortissementFCFA || 0
    const taxes   = kpis.totalTaxesFCFA    || 0
    const resultat= kpis.resultatNetFCFA   || 0

    // Build waterfall steps: CA → -coutMP → -each charge cat → -amort → -taxes → Résultat
    const steps = [
      { label: "CA",              value:  ca,      color: chartColors.green },
      { label: "Coût MP",         value: -coutMP,  color: 'rgba(224,92,92,0.85)' },
      ...charges.topDepenses.map(r => ({ label: r.lib.replace("Fournitures de l'usine et des bureaux", "Fournitures").replace("Autres services extérieurs", "Autres serv. ext.").replace("Services extérieurs", "Services ext."), value: -r.mt, color: 'rgba(224,92,92,0.75)' })),
      ...(amort  > 0 ? [{ label: "Amort. & frais fin.", value: -amort,  color: 'rgba(224,92,92,0.65)' }] : []),
      ...(taxes  > 0 ? [{ label: "Impôts & taxes",      value: -taxes,  color: 'rgba(224,92,92,0.65)' }] : []),
      { label: "Résultat Net",    value:  resultat, color: resultat >= 0 ? chartColors.green : 'rgba(224,92,92,0.9)' },
    ]

    // Floating bar: [base, base+value] for each step
    let running = 0
    const bases  = []
    const values = []
    const colors = []
    for (const s of steps) {
      if (s.label === "CA" || s.label === "Résultat Net") {
        bases.push(0)
        values.push(Math.abs(s.value))
      } else {
        const top = running + s.value
        bases.push(Math.min(running, top))
        values.push(Math.abs(s.value))
      }
      colors.push(s.color)
      if (s.label !== "Résultat Net") running += s.value
    }

    const div = currency === 'EUR' ? eurRate : 1e6

    chartRef.current = new Chart(refWaterfall.current, {
      type: 'bar',
      data: {
        labels: steps.map(s => s.label),
        datasets: [
          {
            // invisible base
            data: bases.map(b => b / div),
            backgroundColor: 'transparent',
            borderWidth: 0,
            stack: 'waterfall',
          },
          {
            // visible bar
            data: values.map(v => v / div),
            backgroundColor: colors,
            borderRadius: 3,
            stack: 'waterfall',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...defaultTooltip,
            callbacks: {
              label: (ctx) => {
                if (ctx.datasetIndex === 0) return null
                const step = steps[ctx.dataIndex]
                const sign = step.value < 0 ? '− ' : '+ '
                return sign + fmt.money(Math.abs(step.value), currency, eurRate)
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false }, stacked: true, ticks: { font: { size: 10 }, maxRotation: 30 } },
          y: {
            stacked: true,
            grid: { color: 'rgba(242,140,40,0.06)' },
            ticks: {
              callback: v => {
                if (currency === 'EUR') return Math.round(v / 1e3).toLocaleString('fr-FR') + ' K€'
                return v.toLocaleString('fr-FR') + ' M'
              },
            },
          },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [month, currency, eurRate, isCategorized])

  return (
    <section>
      <div className="section-title">Charges & Coûts</div>
      <div className="section-subtitle">Dépenses opérationnelles — {monthFull(data)}</div>

      {isCategorized && (
        <div className="chart-card">
          <div className="chart-title">Du CA au Résultat Net</div>
          <div className="chart-subtitle">Décomposition des coûts — de la recette brute au bénéfice ({currency})</div>
          <div className="chart-container" style={{ height: 300 }}>
            <canvas ref={refWaterfall} />
          </div>
        </div>
      )}

      <div className="chart-card">
        <div className="chart-title">{isCategorized ? 'Répartition par Catégorie' : 'Top Dépenses du Mois'}</div>
        <div className="chart-subtitle">
          {isCategorized
            ? "Charges d'exploitation classées par catégorie (hors achats graines)"
            : 'Classées par montant décroissant (hors achats graines)'}
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{isCategorized ? 'Catégorie' : 'Libellé'}</th>
              {!isCategorized && <th>Date</th>}
              {isCategorized && <th style={{ textAlign: 'right' }}>Part</th>}
              <th style={{ textAlign: 'right' }}>Montant {currency}</th>
            </tr>
          </thead>
          <tbody>
            {charges.topDepenses.map((r, i) => (
              <tr key={i}>
                <td className="rank">{i + 1}</td>
                <td>{r.lib}</td>
                {!isCategorized && (
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-dim)' }}>{r.date}</td>
                )}
                {isCategorized && (
                  <td className="num" style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                    {total > 0 ? (r.mt / total * 100).toFixed(1) + '%' : '—'}
                  </td>
                )}
                <td className="num" style={{ color: 'var(--red)' }}>– {fmt.currency(r.mt, currency, eurRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ── FOURNISSEURS ──────────────────────────────────────────────
export function Fournisseurs({ data, month, allMois = [] }) {
  const { currency, eurRate } = useDashboardStore()
  const { fournisseurs } = data

  // ── Section 3 — métriques activité / fréquence ──────────────
  const totalCamions    = fournisseurs.liste.reduce((s, f) => s + (f.nbCamions || 0), 0)
  const poidsMoyKg      = totalCamions > 0 ? Math.round(fournisseurs.totalPoidsKg / totalCamions) : 0
  const nbMoisCovered   = Math.max(1, allMois.length)
  // Approx fréquence moyenne (jours entre 2 livraisons) par fournisseur sur la période
  const avgCamionsPFourn = fournisseurs.liste.length > 0
    ? totalCamions / fournisseurs.liste.length
    : 0
  const freqMoyJours    = avgCamionsPFourn > 0
    ? Math.round((nbMoisCovered * 30) / avgCamionsPFourn)
    : null
  // % fournisseurs livrant >1×/semaine (approx : nb_camions > nb_semaines)
  const nbSemaines      = nbMoisCovered * 4.3
  const nbFrequents     = fournisseurs.liste.filter(f => (f.nbCamions || 0) > nbSemaines).length
  const pctFrequents    = fournisseurs.liste.length > 0
    ? Math.round(nbFrequents / fournisseurs.liste.length * 100)
    : 0

  // Bar camions — sorted by nbCamions desc
  const sortedByCamions = [...fournisseurs.liste]
    .filter(f => (f.nbCamions || 0) > 0)
    .sort((a, b) => (b.nbCamions || 0) - (a.nbCamions || 0))
    .slice(0, 10)
  const camionsLabels = sortedByCamions.map(f => f.name.length > 22 ? f.name.slice(0, 22) + '…' : f.name)
  const camionsVals   = sortedByCamions.map(f => f.nbCamions || 0)

  // Bar poids/camion — sorted desc
  const sortedByPCam = [...fournisseurs.liste]
    .filter(f => (f.nbCamions || 0) > 0)
    .map(f => ({ ...f, poidsPCam: Math.round(f.poids / f.nbCamions) }))
    .sort((a, b) => b.poidsPCam - a.poidsPCam)
    .slice(0, 10)
  const pCamLabels = sortedByPCam.map(f => f.name.length > 22 ? f.name.slice(0, 22) + '…' : f.name)
  const pCamVals   = sortedByPCam.map(f => f.poidsPCam)

  // ── Section 4 — métriques évolution temporelle ──────────────
  const hasMulti = allMois.length >= 2
  const lastMoisList  = allMois[allMois.length - 1]?.data?.fournisseurs?.liste || []
  const prevMoisList  = allMois[allMois.length - 2]?.data?.fournisseurs?.liste || []
  const lastNames = new Set(lastMoisList.map(f => f.name))
  const prevNames = new Set(prevMoisList.map(f => f.name))
  const allNames  = new Set(allMois.flatMap(m => (m.data?.fournisseurs?.liste || []).map(f => f.name)))

  // Nouveaux : dans le dernier mois mais absents de TOUS les mois précédents
  const nouveaux = hasMulti
    ? [...lastNames].filter(n => allMois.slice(0, -1).every(m =>
        !m.data?.fournisseurs?.liste?.some(f => f.name === n)
      )).length
    : 0
  // Perdus : dans avant-dernier mois mais absents du dernier
  const perdus = hasMulti
    ? [...prevNames].filter(n => !lastNames.has(n)).length
    : 0
  // Taux fidélité : % fournisseurs présents dans ≥ 3 mois (sur allMois)
  const fidels = [...allNames].filter(name =>
    allMois.filter(m => m.data?.fournisseurs?.liste?.some(f => f.name === name)).length >= 3
  ).length
  const tauxFidelite = allNames.size > 0 ? Math.round(fidels / allNames.size * 100) : 0

  return (
    <section>
      <div className="section-title">Fournisseurs</div>
      <div className="section-subtitle">Analyse multi-dimensionnelle — {monthFull(data)}</div>

      {/* ── Tableau principal avec sparklines ── */}
      <div className="chart-card">
        <div className="chart-title">Top Fournisseurs par Volume</div>
        <div className="chart-subtitle">
          Poids, prix, montant et tendance multi-mois
          {allMois.length >= 2 ? ` (${allMois.length} mois)` : ''}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fournisseur</th>
                {allMois.length >= 2 && <th style={{ textAlign: 'center' }}>Tendance</th>}
                <th style={{ textAlign: 'right' }}>Poids (kg)</th>
                <th style={{ textAlign: 'right' }}>Camions</th>
                <th style={{ textAlign: 'right' }}>Prix F/kg</th>
                <th style={{ textAlign: 'right' }}>Montant {currency}</th>
                <th>Part</th>
              </tr>
            </thead>
            <tbody>
              {fournisseurs.liste.map((f, i) => {
                const pct       = (f.poids / fournisseurs.totalPoidsKg * 100).toFixed(1)
                const sparkVals = allMois.map(m =>
                  m.data?.fournisseurs?.liste?.find(x => x.name === f.name)?.poids || 0
                )
                return (
                  <tr key={i}>
                    <td className="rank">{i + 1}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </td>
                    {allMois.length >= 2 && (
                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <Sparkline values={sparkVals} />
                      </td>
                    )}
                    <td className="num">{fmt.full(f.poids)}</td>
                    <td className="num" style={{ color: 'var(--text-dim)' }}>
                      {f.nbCamions || '—'}
                    </td>
                    <td className="num">{f.prix} F/kg</td>
                    <td className="num" style={{ color: 'var(--gold)' }}>
                      {fmt.currency(f.montant, currency, eurRate)}
                    </td>
                    <td>
                      <div className="mini-bar-wrap" style={{ minWidth: 100 }}>
                        <div className="mini-bar">
                          <div className="mini-bar-fill" style={{ width: pct + '%' }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", width: 38 }}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3 — Activité & Fréquence ── */}
      <div className="section-divider" style={{ margin: '28px 0 18px', borderTop: '1px solid rgba(242,140,40,0.12)', paddingTop: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
          📦 Activité &amp; Fréquence
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Livraisons (camions)</div>
          <div className="kpi-value gold">{totalCamions.toLocaleString('fr-FR')}</div>
          <div className="kpi-sub">{fournisseurs.liste.length} fournisseurs actifs</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Poids Moyen / Camion</div>
          <div className="kpi-value gold">{(poidsMoyKg / 1000).toFixed(1)} T</div>
          <div className="kpi-sub">{poidsMoyKg.toLocaleString('fr-FR')} kg par livraison</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Fréquence Moyenne</div>
          <div className="kpi-value gold">{freqMoyJours !== null ? `${freqMoyJours}j` : '—'}</div>
          <div className="kpi-sub">entre 2 livraisons (approx.)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">&gt;1 livraison/semaine</div>
          <div className="kpi-value gold">{pctFrequents}%</div>
          <div className="kpi-sub">{nbFrequents} / {fournisseurs.liste.length} fournisseurs</div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 16 }}>
        {camionsVals.length > 0 && (
          <HBarChart
            title="Camions par Fournisseur"
            subtitle="Nombre total de livraisons — trié décroissant"
            labels={camionsLabels}
            values={camionsVals}
            unit="camions"
            color="rgba(242,140,40,0.75)"
            month={month}
          />
        )}
        {pCamVals.length > 0 && (
          <HBarChart
            title="Poids Moyen par Livraison"
            subtitle="kg / camion — identifier sous-chargements et livraisons exceptionnelles"
            labels={pCamLabels}
            values={pCamVals}
            unit="kg / camion"
            color="rgba(100,190,100,0.75)"
            month={month}
          />
        )}
      </div>

      {/* ── Section 4 — Évolution temporelle ── */}
      {hasMulti && (
        <>
          <div className="section-divider" style={{ margin: '28px 0 18px', borderTop: '1px solid rgba(242,140,40,0.12)', paddingTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
              📈 Évolution Temporelle
            </div>
          </div>

          <div className="kpi-grid" style={{ marginBottom: 24 }}>
            <div className="kpi-card">
              <div className="kpi-label">Fournisseurs Actifs</div>
              <div className="kpi-value gold">{lastNames.size}</div>
              <div className="kpi-sub">dernier mois disponible</div>
            </div>
            <div className="kpi-card accent-green">
              <div className="kpi-label">Nouveaux Fournisseurs</div>
              <div className="kpi-value green">{nouveaux > 0 ? `+${nouveaux}` : '0'}</div>
              <div className="kpi-sub">apparus ce dernier mois</div>
            </div>
            <div className="kpi-card accent-red">
              <div className="kpi-label">Fournisseurs Perdus</div>
              <div className="kpi-value red">{perdus > 0 ? `−${perdus}` : '0'}</div>
              <div className="kpi-sub">absents du dernier mois</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Taux de Fidélité</div>
              <div className="kpi-value gold">{tauxFidelite}%</div>
              <div className="kpi-sub">présents ≥ 3 mois sur {allMois.length}</div>
            </div>
          </div>

          <ActiveSuppliersChart allMois={allMois} month={month} />
          <StackedAreaChart fournisseurs={fournisseurs} allMois={allMois} month={month} />
          <HeatmapGrid fournisseurs={fournisseurs} allMois={allMois} />
        </>
      )}
    </section>
  )
}

// ── PÉPINIÈRE ─────────────────────────────────────────────────
export function Pepiniere({ data, month }) {
  const { currency, eurRate } = useDashboardStore()
  const { kpis, pepiniere } = data
  if (!pepiniere) return null

  return (
    <section>
      <div className="section-title">Pépinière</div>
      <div className="section-subtitle">Suivi des ventes de plants et encaissements — {monthFull(data)}</div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Contrats Totaux</div>
          <div className="kpi-value gold">{fmt.kpiValue(kpis.pepContratsFCFA, currency, eurRate)}</div>
          <div className="kpi-sub">{currency} · {pepiniere.clients.length} clients</div>
        </div>
        <div className="kpi-card accent-green">
          <div className="kpi-label">Encaissé</div>
          <div className="kpi-value green">{fmt.kpiValue(kpis.pepEncaisséFCFA, currency, eurRate)}</div>
          <div className="kpi-sub">{currency} · {(kpis.pepEncaisséFCFA / kpis.pepContratsFCFA * 100).toFixed(0)}% collecté</div>
        </div>
        <div className="kpi-card accent-red">
          <div className="kpi-label">Reste à Percevoir</div>
          <div className="kpi-value red">{fmt.kpiValue(kpis.pepResteaFCFA, currency, eurRate)}</div>
          <div className="kpi-sub">{currency} · créances à recouvrer</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Détail Clients Pépinière</div>
        <div className="chart-subtitle">Statut de règlement par client</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nom Client</th>
              <th>Localité</th>
              <th style={{ textAlign: 'right' }}>Ha</th>
              <th style={{ textAlign: 'right' }}>Total {currency}</th>
              <th style={{ textAlign: 'right' }}>Encaissé</th>
              <th style={{ textAlign: 'right' }}>Reste</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {pepiniere.clients.map((r) => {
              const reste = r.total - r.enc
              return (
                <tr key={r.no}>
                  <td className="rank">{r.no}</td>
                  <td>{r.nom}</td>
                  <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{r.loc}</td>
                  <td className="num">{r.ha} ha</td>
                  <td className="num">{fmt.currency(r.total, currency, eurRate)}</td>
                  <td className="num" style={{ color: 'var(--green)' }}>{fmt.currency(r.enc, currency, eurRate)}</td>
                  <td className="num" style={{ color: reste > 0 ? 'var(--red)' : 'var(--text-dim)' }}>
                    {reste > 0 ? '–' + fmt.currency(reste, currency, eurRate) : '0'}
                  </td>
                  <td>
                    <span className={`kpi-badge ${reste === 0 ? 'badge-up' : 'badge-down'}`}>
                      {reste === 0 ? 'Soldé' : 'Solde dû'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
