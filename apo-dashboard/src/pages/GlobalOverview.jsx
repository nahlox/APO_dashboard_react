import { useEffect, useRef } from 'react'
import {
  Chart, BarElement, BarController, LineElement, LineController,
  PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler,
  ArcElement, PieController, RadialLinearScale
} from 'chart.js'
import KPICard from '../components/kpi/KPICard'
import { fmt, buildGlobalKPIs, chartColors, defaultTooltip } from '../lib/kpiEngine'
import { useDashboardStore } from '../store/dashboardStore'
import { monthLabel } from '../lib/monthUtils'
import { useCpoPrices } from '../hooks/useCpoPrices'

Chart.register(BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler, ArcElement, PieController, RadialLinearScale)

// Palette homogène — gold + green uniquement, opacité décroissante
const PIE_COLORS = [
  'rgba(242,140,40,0.90)', 'rgba(63,163,77,0.82)',
  'rgba(242,140,40,0.62)', 'rgba(63,163,77,0.56)',
  'rgba(242,140,40,0.40)', 'rgba(63,163,77,0.36)',
  'rgba(242,140,40,0.22)', 'rgba(63,163,77,0.20)',
  'rgba(242,140,40,0.12)', 'rgba(63,163,77,0.12)',
]

const BAR_COLORS = chartColors.series

function buildCombinedCharges(monthData) {
  const merged = {}
  for (const { data } of monthData) {
    data.charts?.charges?.labels?.forEach((lbl, i) => {
      merged[lbl] = (merged[lbl] || 0) + data.charts.charges.values[i]
    })
  }
  const sorted = Object.entries(merged).sort((a, b) => b[1] - a[1]).slice(0, 10)
  return { labels: sorted.map(([l]) => l), values: sorted.map(([, v]) => v) }
}

/**
 * Vue Globale = vue multi-mois avec cartes par mois + comparatifs.
 * `filteredMois` = mois déjà filtrés par la plage.
 * `aggregatedData` = données déjà agrégées (sert pour les KPIs cumulés).
 */
export default function GlobalOverview({ filteredMois, aggregatedData }) {
  const { currency, eurRate } = useDashboardStore()

  const combinedCharges = buildCombinedCharges(filteredMois)
  const global = buildGlobalKPIs(...filteredMois.map(m => m.data))

  const { prices: cpoPrices, latest: cpoLatest, pctChange: cpoPct } = useCpoPrices(18)

  const refCA     = useRef(null)
  const refResult = useRef(null)
  const refProd   = useRef(null)
  const refCosts  = useRef(null)
  const refPrix   = useRef(null)
  const refCpo    = useRef(null)
  const charts    = useRef({})

  const shortLabels = filteredMois.map(m => monthLabel(m.data))
  const year        = filteredMois[0]?.data._etl.annee ?? ''

  useEffect(() => {
    Object.values(charts.current).forEach(c => c?.destroy())
    charts.current = {}

    const cur = currency
    const div = cur === 'EUR' ? eurRate : 1e6
    const yTick = (v) => {
      if (cur === 'EUR') {
        if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + ' M€'
        return Math.round(v / 1e3).toLocaleString('fr-FR') + ' K€'
      }
      return v.toLocaleString('fr-FR') + ' M'
    }

    charts.current.ca = new Chart(refCA.current, {
      type: 'bar',
      data: {
        labels: shortLabels,
        datasets: [
          {
            label: 'Huile CPO',
            data: filteredMois.map(m => m.data.kpis.caHuileFCFA / div),
            backgroundColor: chartColors.goldAlpha, borderRadius: 4,
          },
          {
            label: 'Noix Palmiste',
            data: filteredMois.map(m => m.data.kpis.caNoisFCFA / div),
            backgroundColor: chartColors.greenAlpha, borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 12 } } }, tooltip: { ...defaultTooltip, callbacks: { label: c => fmt.money(c.raw * div, cur, eurRate) } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(242,140,40,0.06)' }, ticks: { callback: yTick } } },
      },
    })

    charts.current.result = new Chart(refResult.current, {
      type: 'bar',
      data: {
        labels: shortLabels,
        datasets: [{
          label: 'Résultat Net',
          data: filteredMois.map(m => m.data.kpis.resultatNetFCFA / div),
          backgroundColor: filteredMois.map(m => m.data.kpis.resultatNetFCFA >= 0 ? 'rgba(63,163,77,0.75)' : 'rgba(224,92,92,0.70)'),
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...defaultTooltip, callbacks: { label: c => fmt.money(c.raw * div, cur, eurRate) } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(242,140,40,0.06)' }, ticks: { callback: yTick } } },
      },
    })

    charts.current.prod = new Chart(refProd.current, {
      type: 'bar',
      data: {
        labels: ['Régimes Reçus', 'Régimes Traités', 'Huile Produite', 'Huile Vendue'],
        datasets: filteredMois.map(({ data }, i) => ({
          label: monthLabel(data),
          data: [data.kpis.regimesRecusT, data.kpis.regimesTraitesT, data.kpis.huileProduiteT, data.kpis.huileVendueT],
          backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
          borderRadius: 3,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 12 } } }, tooltip: { ...defaultTooltip, callbacks: { label: c => fmt.full(Math.round(c.raw)) + ' T' } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(242,140,40,0.06)' }, ticks: { callback: v => v + ' T' } } },
      },
    })

    const totalCharges = combinedCharges.values.reduce((a, b) => a + b, 0)
    charts.current.costs = new Chart(refCosts.current, {
      type: 'pie',
      data: {
        labels: combinedCharges.labels,
        datasets: [{
          data: combinedCharges.values,
          backgroundColor: PIE_COLORS,
          borderColor: '#132519', borderWidth: 2, hoverOffset: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        layout: { padding: 10 },
        plugins: {
          legend: { display: false },
          tooltip: { ...defaultTooltip, callbacks: { label: c => ` ${fmt.money(c.raw, cur, eurRate)} (${(c.raw / totalCharges * 100).toFixed(1)}%)` } },
        },
      },
    })

    const isDaily = filteredMois.length === 1

    // ── Revenu Net & Rentabilité / Tonne ─────────────────────────────────────
    let rentLabels, dsPrixCPOT, dsMargeBruteT, dsCoutMPT, dsRevNetT
    if (isDaily) {
      const daily   = filteredMois[0].data.prixDaily || {}
      rentLabels    = daily.labels   || []
      dsPrixCPOT    = daily.prixCPOT || []
      dsCoutMPT     = daily.coutMPT  || []
      dsMargeBruteT = daily.margeT   || []
      dsRevNetT     = null
    } else {
      rentLabels    = shortLabels
      dsPrixCPOT    = filteredMois.map(m => Math.round((m.data.kpis.prixMoyenHuileKg || 0) * 1000))
      dsCoutMPT     = filteredMois.map(m => {
        const hp = m.data.kpis.huileProduiteT || 0
        return hp > 0 ? Math.round((m.data.kpis.coutMPFCFA || 0) / hp) : 0
      })
      dsMargeBruteT = filteredMois.map(m => {
        const hp = m.data.kpis.huileProduiteT || 0
        return hp > 0 ? Math.round(((m.data.kpis.caTotalFCFA || 0) - (m.data.kpis.coutMPFCFA || 0)) / hp) : 0
      })
      dsRevNetT     = filteredMois.map(m => m.data.kpis.revenuNetParTonne || 0)
    }

    const fmtT = v => v !== null ? ` ${Math.round(v / 1000).toLocaleString('fr-FR')} K F/T` : ''
    const tickT = v => (v / 1000).toFixed(0) + ' K'

    const datasetsRent = isDaily ? [
      { label: 'Prix CPO/T (F/T)',    data: dsPrixCPOT,    borderColor: chartColors.gold,      backgroundColor: 'rgba(242,140,40,0.08)', pointBackgroundColor: chartColors.gold,      borderWidth: 2, pointRadius: 3, tension: 0.3, fill: false, spanGaps: true },
      { label: 'Coût MP/T (F/T)',     data: dsCoutMPT,     borderColor: 'rgba(224,92,92,0.9)', backgroundColor: 'rgba(224,92,92,0.07)',  pointBackgroundColor: 'rgba(224,92,92,0.9)', borderWidth: 2, pointRadius: 3, tension: 0.3, fill: false, spanGaps: true },
      { label: 'Marge Brute/T (F/T)', data: dsMargeBruteT, borderColor: chartColors.green,     backgroundColor: 'rgba(63,163,77,0.12)',  pointBackgroundColor: chartColors.green,     borderWidth: 2, pointRadius: 3, tension: 0.3, fill: true,  spanGaps: true },
    ] : [
      { label: 'Prix CPO/T (F/T)',     data: dsPrixCPOT,    borderColor: chartColors.gold,           backgroundColor: 'rgba(242,140,40,0.08)', pointBackgroundColor: chartColors.gold,           borderWidth: 2.5, pointRadius: 5, tension: 0.3, fill: false },
      { label: 'Coût MP/T (F/T)',      data: dsCoutMPT,     borderColor: 'rgba(224,92,92,0.9)',      backgroundColor: 'rgba(224,92,92,0.07)',  pointBackgroundColor: 'rgba(224,92,92,0.9)',      borderWidth: 2,   pointRadius: 5, tension: 0.3, fill: false },
      { label: 'Marge Brute/T (F/T)',  data: dsMargeBruteT, borderColor: 'rgba(88,166,255,0.9)',     backgroundColor: 'rgba(88,166,255,0.08)', pointBackgroundColor: 'rgba(88,166,255,0.9)',     borderWidth: 2,   pointRadius: 5, tension: 0.3, fill: false },
      { label: 'Revenu Net/T (F/T)',   data: dsRevNetT,     borderColor: chartColors.green,          backgroundColor: 'rgba(63,163,77,0.12)',  pointBackgroundColor: chartColors.green,          borderWidth: 2.5, pointRadius: 5, tension: 0.3, fill: true  },
    ]

    charts.current.prix = new Chart(refPrix.current, {
      type: 'line',
      data: { labels: rentLabels, datasets: datasetsRent },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { font: { size: 11 }, boxWidth: 14 } },
          tooltip: { ...defaultTooltip, callbacks: { label: c => c.raw !== null ? fmtT(c.raw) : '' } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: isDaily ? 10 : 12 }, maxRotation: isDaily ? 45 : 0 } },
          y: { grid: { color: 'rgba(242,140,40,0.06)' }, ticks: { callback: tickT } },
        },
      },
    })

    return () => Object.values(charts.current).forEach(c => c?.destroy())
  }, [currency, eurRate, filteredMois.length])

  // Graphique CPO prix international
  useEffect(() => {
    if (!refCpo.current || cpoPrices.length < 2) return
    charts.current.cpo?.destroy()
    const labels = cpoPrices.map(p => {
      const d = new Date(p.date)
      return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    })
    const values = cpoPrices.map(p => p.prix_usd_tonne)
    charts.current.cpo = new Chart(refCpo.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'CPO (USD/t)',
          data: values,
          borderColor: 'rgba(242,140,40,0.9)',
          backgroundColor: 'rgba(242,140,40,0.08)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: 'rgba(242,140,40,0.9)',
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...defaultTooltip,
            callbacks: {
              label: c => ` ${c.raw.toFixed(0)} USD/t`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            grid: { color: 'rgba(242,140,40,0.06)' },
            ticks: { callback: v => v.toFixed(0) + '$' },
          },
        },
      },
    })
  }, [cpoPrices, filteredMois.length, currency, eurRate])

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid">
        {(() => {
          const isSingle     = filteredMois.length === 1
          const margeBrute   = global.caCumule > 0 ? ((global.caCumule - global.coutMPCumule) / global.caCumule * 100).toFixed(1) : '—'
          const margeNette   = global.caCumule > 0 ? (global.resultatCumule / global.caCumule * 100).toFixed(1) : '—'
          const revNetTonne  = global.huileProduiteTotal > 0 ? Math.round(global.resultatCumule / global.huileProduiteTotal) : 0
          const huileLabel   = isSingle ? 'Huile Produite' : 'Huile Produite Cumulée'
          const caLabel      = isSingle ? 'CA' : 'CA Cumulé'
          const resultLabel  = isSingle ? 'Résultat Net' : 'Résultat Cumulé'
          return (<>
            <KPICard label={caLabel}      value={fmt.kpiValue(global.caCumule, currency, eurRate)}    valueColor="gold" />
            <KPICard label="Marge Brute"  value={margeBrute + '%'}                                    valueColor="green" accent="accent-green" />
            <KPICard label={resultLabel}  value={(global.resultatCumule >= 0 ? '+ ' : '– ') + fmt.kpiValue(Math.abs(global.resultatCumule), currency, eurRate)} valueColor={global.resultatCumule >= 0 ? 'green' : 'red'} accent={global.resultatCumule >= 0 ? 'accent-green' : 'accent-red'} />
            <KPICard label={huileLabel}   value={fmt.tonnes(global.huileProduiteTotal)}               valueColor="gold" />
            <KPICard label="Marge Nette"  value={margeNette + '%'}                                    valueColor={global.resultatCumule >= 0 ? 'green' : 'red'} accent={global.resultatCumule >= 0 ? 'accent-green' : 'accent-red'} />
            <KPICard label="Revenu Net / Tonne" value={fmt.kpiValue(Math.abs(revNetTonne), currency, eurRate)} valueColor={revNetTonne >= 0 ? 'green' : 'red'} sub={`${currency}/T · ${Math.round(global.huileProduiteTotal)} T produites`} accent={revNetTonne >= 0 ? 'accent-green' : 'accent-red'} />
          </>)
        })()}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">{filteredMois.length === 1 ? 'Chiffre d\'Affaires par Produit' : 'Évolution du CA'}</div>
          <div className="chart-subtitle">CA par produit {year} ({currency})</div>
          <div className="chart-container" style={{ height: 300 }}>
            <canvas ref={refCA} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">{filteredMois.length === 1 ? 'Résultat Net' : 'Évolution du Résultat'}</div>
          <div className="chart-subtitle">Résultat net {year} ({currency})</div>
          <div className="chart-container" style={{ height: 300 }}>
            <canvas ref={refResult} />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Volumes de Production</div>
          <div className="chart-subtitle">Régimes traités, huile produite et vendue (tonnes)</div>
          <div className="chart-container" style={{ height: 240 }}>
            <canvas ref={refProd} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Structure des Dépenses</div>
          <div className="chart-subtitle">{year} — hors matières premières</div>
          <div className="chart-container" style={{ height: 240 }}>
            <canvas ref={refCosts} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 12px', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {combinedCharges.labels.map((lbl, i) => {
              const total = combinedCharges.values.reduce((a, b) => a + b, 0)
              const pct = (combinedCharges.values[i] / total * 100).toFixed(1)
              return (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#b0b8b4' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0, display: 'inline-block' }} />
                  {lbl} <span style={{ color: '#e8d5a0', fontWeight: 600 }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 'clamp(18px, 2vw, 28px)' }}>
        <div className="chart-title">Revenu Net & Rentabilité / Tonne</div>
        <div className="chart-subtitle">
          {filteredMois.length === 1
            ? `Vue journalière · Prix CPO/T · Coût MP/T · Marge Brute/T (FCFA/T)`
            : 'Prix CPO/T · Coût MP/T · Marge Brute/T · Revenu Net/T (FCFA/T)'}
        </div>
        <div className="chart-container" style={{ height: 300 }}>
          <canvas ref={refPrix} />
        </div>
      </div>

      {/* Prix CPO international */}
      {cpoPrices.length > 0 && (
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <div>
              <div className="chart-title" style={{ marginBottom: 2 }}>Prix CPO — Marché International</div>
              <div className="chart-subtitle">USD / tonne · Source : FMI via FRED · Mise à jour mensuelle</div>
            </div>
            {cpoLatest && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
                    {Math.round(cpoLatest.prix_usd_tonne).toLocaleString('fr-FR')} <span style={{ fontSize: 13, fontWeight: 400 }}>USD/t</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                    {new Date(cpoLatest.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                {cpoPct !== null && (
                  <div style={{
                    fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                    background: parseFloat(cpoPct) >= 0 ? 'rgba(63,163,77,0.12)' : 'rgba(224,92,92,0.12)',
                    color: parseFloat(cpoPct) >= 0 ? 'var(--green)' : 'var(--red)',
                    border: `1px solid ${parseFloat(cpoPct) >= 0 ? 'rgba(63,163,77,0.25)' : 'rgba(224,92,92,0.25)'}`,
                  }}>
                    {parseFloat(cpoPct) >= 0 ? '+' : ''}{cpoPct}% vs mois préc.
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="chart-container" style={{ height: 220 }}>
            <canvas ref={refCpo} />
          </div>
        </div>
      )}

    </div>
  )
}
