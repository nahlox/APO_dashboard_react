import { useEffect, useRef } from 'react'
import {
  Chart, BarElement, BarController,
  LineElement, LineController, PointElement, Filler,
  CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js'
import { fmt, defaultTooltip } from '../../lib/kpiEngine'
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

// ── Badge computation ─────────────────────────────────────────
function getBadge(name, rankIndex, allMois) {
  if (!allMois || allMois.length === 0) return null
  const total       = allMois.length
  const appearances = allMois.filter(m =>
    m.data?.fournisseurs?.liste?.some(f => f.name === name)
  ).length
  const pct = appearances / total

  // Trend check: last vs second-to-last month appearance
  const history = allMois
    .map(m => m.data?.fournisseurs?.liste?.find(f => f.name === name))
    .filter(Boolean)
  let atRisk = false
  if (history.length >= 2) {
    const last = history[history.length - 1].poids
    const prev = history[history.length - 2].poids
    if (prev > 0 && last < prev * 0.60) atRisk = true
  }

  if (atRisk)          return { emoji: '⚠️', label: 'À risque',  cls: 'badge-risk' }
  if (rankIndex === 0) return { emoji: '🥇', label: 'Top',       cls: 'badge-top' }
  if (rankIndex <= 2 && pct >= 0.75) return { emoji: '💎', label: 'Premium',  cls: 'badge-premium' }
  if (pct >= 0.65)     return { emoji: '🔄', label: 'Régulier',  cls: 'badge-regular' }
  if (appearances <= 1) return { emoji: '🆕', label: 'Nouveau',  cls: 'badge-new' }
  return null
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

  return (
    <section>
      <div className="section-title">Fournisseurs</div>
      <div className="section-subtitle">Analyse multi-dimensionnelle — {monthFull(data)}</div>

      {/* ── Item 5 : Tableau enrichi badges + sparklines ── */}
      <div className="chart-card">
        <div className="chart-title">Top Fournisseurs — Tableau Enrichi</div>
        <div className="chart-subtitle">Badges de profil · tendance sparkline · volume et montant</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fournisseur</th>
                <th>Profil</th>
                {allMois.length >= 2 && <th style={{ textAlign: 'center' }}>Tendance</th>}
                <th style={{ textAlign: 'right' }}>Poids (kg)</th>
                <th style={{ textAlign: 'right' }}>Prix F/kg</th>
                <th style={{ textAlign: 'right' }}>Montant {currency}</th>
                <th>Part</th>
              </tr>
            </thead>
            <tbody>
              {fournisseurs.liste.map((f, i) => {
                const pct       = (f.poids / fournisseurs.totalPoidsKg * 100).toFixed(1)
                const badge     = getBadge(f.name, i, allMois)
                const sparkVals = allMois.map(m =>
                  m.data?.fournisseurs?.liste?.find(x => x.name === f.name)?.poids || 0
                )
                return (
                  <tr key={i}>
                    <td className="rank">{i + 1}</td>
                    <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </td>
                    <td>
                      {badge && (
                        <span className={`fourn-badge ${badge.cls}`}>
                          {badge.emoji} {badge.label}
                        </span>
                      )}
                    </td>
                    {allMois.length >= 2 && (
                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <Sparkline values={sparkVals} />
                      </td>
                    )}
                    <td className="num">{fmt.full(f.poids)}</td>
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

      {/* ── Item 4 : Stacked area chart mensuel ── */}
      <StackedAreaChart fournisseurs={fournisseurs} allMois={allMois} month={month} />

      {/* ── Item 3 : Heatmap fournisseur × mois ── */}
      <HeatmapGrid fournisseurs={fournisseurs} allMois={allMois} />
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
