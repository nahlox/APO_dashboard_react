import { useEffect, useRef } from 'react'
import {
  Chart, BarElement, BarController, LineElement, LineController,
  PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler,
  ArcElement, PieController
} from 'chart.js'
import KPICard from '../components/kpi/KPICard'
import { fmt, buildGlobalKPIs, chartColors, defaultTooltip } from '../lib/kpiEngine'
import { useDashboardStore } from '../store/dashboardStore'
import { janData } from '../data/janvier'
import { febData } from '../data/fevrier'

Chart.register(BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler, ArcElement, PieController)

const PIE_COLORS = [
  'rgba(200,150,62,0.92)', 'rgba(224,92,92,0.85)', 'rgba(76,175,122,0.85)',
  'rgba(160,120,220,0.80)', 'rgba(255,165,80,0.80)', 'rgba(138,154,142,0.80)',
  'rgba(126,200,164,0.85)', 'rgba(90,160,210,0.80)',
]

function buildCombinedCharges() {
  const merged = {}
  for (const d of [janData, febData]) {
    d.charts.charges.labels.forEach((lbl, i) => {
      merged[lbl] = (merged[lbl] || 0) + d.charts.charges.values[i]
    })
  }
  return { labels: Object.keys(merged), values: Object.values(merged) }
}
const combinedCharges = buildCombinedCharges()

export default function GlobalPanel() {
  const { setActiveMonth, currency } = useDashboardStore()
  const global = buildGlobalKPIs(janData, febData)

  const refCA     = useRef(null)
  const refResult = useRef(null)
  const refProd   = useRef(null)
  const refCosts  = useRef(null)
  const charts    = useRef({})

  useEffect(() => {
    Object.values(charts.current).forEach(c => c?.destroy())
    charts.current = {}

    const cur = currency
    const div = cur === 'USD' ? (1e6 / fmt.toUSD(1e6)) : 1e6 // scale factor for chart axes
    const axisLabel = cur === 'USD' ? ' K$' : ' M'

    // CA par mois
    charts.current.ca = new Chart(refCA.current, {
      type: 'bar',
      data: {
        labels: ['Janvier 2026', 'Février 2026'],
        datasets: [
          { label: 'Huile CPO',     data: [janData.kpis.caHuileFCFA / div, febData.kpis.caHuileFCFA / div], backgroundColor: chartColors.goldAlpha, borderRadius: 4 },
          { label: 'Noix Palmiste', data: [janData.kpis.caNoisFCFA  / div, febData.kpis.caNoisFCFA  / div], backgroundColor: chartColors.greenAlpha, borderRadius: 4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 12 } } }, tooltip: { ...defaultTooltip, callbacks: { label: c => fmt.money(c.raw * div, cur) } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(200,150,62,0.06)' }, ticks: { callback: v => v.toFixed(0) + axisLabel } } },
      },
    })

    // Résultat net
    charts.current.result = new Chart(refResult.current, {
      type: 'bar',
      data: {
        labels: ['Janvier 2026', 'Février 2026'],
        datasets: [{
          label: 'Résultat Net',
          data: [janData.kpis.resultatNetFCFA / div, febData.kpis.resultatNetFCFA / div],
          backgroundColor: [chartColors.goldAlpha, chartColors.greenAlpha],
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...defaultTooltip, callbacks: { label: c => fmt.money(c.raw * div, cur) } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(200,150,62,0.06)' }, ticks: { callback: v => v.toFixed(0) + axisLabel } } },
      },
    })

    // Production (pas de devise — en tonnes)
    charts.current.prod = new Chart(refProd.current, {
      type: 'bar',
      data: {
        labels: ['Régimes Reçus', 'Régimes Traités', 'Huile Produite', 'Huile Vendue'],
        datasets: [
          { label: 'Janvier', data: [janData.kpis.regimesRecusT, janData.kpis.regimesTraitesT, janData.kpis.huileProduiteT, janData.kpis.huileVendueT], backgroundColor: chartColors.goldAlpha, borderRadius: 3 },
          { label: 'Février', data: [febData.kpis.regimesRecusT, febData.kpis.regimesTraitesT, febData.kpis.huileProduiteT, febData.kpis.huileVendueT], backgroundColor: chartColors.greenAlpha, borderRadius: 3 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 12 } } }, tooltip: { ...defaultTooltip, callbacks: { label: c => fmt.full(Math.round(c.raw)) + ' T' } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(200,150,62,0.06)' }, ticks: { callback: v => v + ' T' } } },
      },
    })

    // Dépenses pie
    const totalCharges = combinedCharges.values.reduce((a, b) => a + b, 0)
    charts.current.costs = new Chart(refCosts.current, {
      type: 'pie',
      data: {
        labels: combinedCharges.labels,
        datasets: [{
          data: combinedCharges.values,
          backgroundColor: PIE_COLORS,
          borderColor: '#161A18', borderWidth: 2, hoverOffset: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        layout: { padding: 10 },
        plugins: {
          legend: { display: false },
          tooltip: { ...defaultTooltip, callbacks: { label: c => ` ${fmt.money(c.raw, cur)} (${(c.raw / totalCharges * 100).toFixed(1)}%)` } },
        },
      },
    })

    return () => Object.values(charts.current).forEach(c => c?.destroy())
  }, [currency])

  return (
    <div>
      <div className="section-title">Vue Globale — Performance Annuelle</div>
      <div className="section-subtitle">
        Comparaison mensuelle Janvier vs Février 2026 &nbsp;·&nbsp; Cliquez sur un mois pour accéder au détail complet
      </div>

      {/* Cartes résumé Jan / Fév */}
      <div className="global-compare-grid">
        {/* Janvier */}
        <div className="month-summary-card jan">
          <div className="month-summary-title">
            <span className="month-badge badge-jan">Janvier</span>2026
          </div>
          {[
            ['Chiffre d\'Affaires',   fmt.currency(janData.kpis.caTotalFCFA, currency),       'var(--gold)'],
            ['Coût Matière Première', fmt.currency(janData.kpis.coutMPFCFA, currency),         'var(--red)'],
            ['Charges Exploitation',  fmt.currency(janData.kpis.chargesExplFCFA, currency),    'var(--red)'],
            ['Résultat Net',          '+ ' + fmt.currency(janData.kpis.resultatNetFCFA, currency), 'var(--green)'],
            ['Marge Nette',           janData.kpis.margeNette + '%', 'var(--green)'],
            ['Régimes Traités',       fmt.tonnes(janData.kpis.regimesTraitesT), null],
            ['Huile Produite',        fmt.tonnes(janData.kpis.huileProduiteT), null],
            ['Huile Vendue',          fmt.tonnes(janData.kpis.huileVendueT), null],
            ["Taux d'Extraction",     fmt.pct(janData.kpis.tauxExtraction), null],
          ].map(([label, val, color], i) => (
            <div className="compare-row" key={i}>
              <span className="compare-label">{label}</span>
              <span className="compare-val" style={color ? { color } : {}}>{val}</span>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setActiveMonth('jan')}
              style={{ background: 'rgba(200,150,62,0.15)', border: '1px solid rgba(200,150,62,0.4)', color: 'var(--gold)', padding: '8px 18px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: 1 }}
            >
              Voir détail Janvier →
            </button>
          </div>
        </div>

        {/* Février */}
        <div className="month-summary-card feb">
          <div className="month-summary-title">
            <span className="month-badge badge-feb">Février</span>2026
          </div>
          {[
            ['Chiffre d\'Affaires',   fmt.currency(febData.kpis.caTotalFCFA, currency),       'var(--gold)'],
            ['Coût Matière Première', fmt.currency(febData.kpis.coutMPFCFA, currency),         'var(--red)'],
            ['Charges Exploitation',  fmt.currency(febData.kpis.chargesExplFCFA, currency),    'var(--red)'],
            ['Résultat Net',          '+ ' + fmt.currency(febData.kpis.resultatNetFCFA, currency), 'var(--green)'],
            ['Marge Nette',           febData.kpis.margeNette + '%', 'var(--green)'],
            ['Régimes Traités',       fmt.tonnes(febData.kpis.regimesTraitesT), null],
            ['Huile Produite',        fmt.tonnes(febData.kpis.huileProduiteT), null],
            ['Huile Vendue',          fmt.tonnes(febData.kpis.huileVendueT), null],
            ["Taux d'Extraction",     fmt.pct(febData.kpis.tauxExtraction), null],
          ].map(([label, val, color], i) => (
            <div className="compare-row" key={i}>
              <span className="compare-label">{label}</span>
              <span className="compare-val" style={color ? { color } : {}}>{val}</span>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setActiveMonth('feb')}
              style={{ background: 'rgba(76,175,122,0.15)', border: '1px solid rgba(76,175,122,0.4)', color: 'var(--green)', padding: '8px 18px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: 1 }}
            >
              Voir détail Février →
            </button>
          </div>
        </div>
      </div>

      {/* KPIs évolution cumulée */}
      <div className="kpi-grid">
        <KPICard label="CA Cumulé Jan–Fév"             value={fmt.kpiValue(global.caCumule, currency)}           valueColor="gold"  sub={currency + ' · Jan + Fév'} />
        <KPICard label="Évolution CA Fév/Jan"           value={'+'  + global.evolutionCA.toFixed(1) + '%'}                valueColor="green" sub={`${fmt.currency(febData.kpis.caTotalFCFA, currency)} vs ${fmt.currency(janData.kpis.caTotalFCFA, currency)}`} accent="accent-green" />
        <KPICard label="Résultat Cumulé"                value={'+ ' + fmt.kpiValue(global.resultatCumule, currency)} valueColor="green" sub={`${currency} · Jan + Fév`} accent="accent-green" />
        <KPICard label="Évolution Résultat Fév/Jan"     value={'×' + global.evolutionResultat.toFixed(1)}                  valueColor="green" sub={`${fmt.currency(febData.kpis.resultatNetFCFA, currency)} vs ${fmt.currency(janData.kpis.resultatNetFCFA, currency)}`} accent="accent-green" />
        <KPICard label="Huile Produite Cumulée"         value={fmt.tonnes(global.huileProduiteTotal)}                       valueColor="gold"  sub="1 956 T + 2 866 T" />
        <KPICard label="Évolution Production Fév/Jan"   value={'+' + global.evolutionProduction.toFixed(1) + '%'}           valueColor="green" sub="2 866 T vs 1 956 T" accent="accent-green" />
      </div>

      {/* Charts comparaison */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Évolution du CA</div>
          <div className="chart-subtitle">Chiffre d'affaires mensuel par produit ({currency})</div>
          <div className="chart-container" style={{ height: 300 }}>
            <canvas ref={refCA} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Évolution du Résultat</div>
          <div className="chart-subtitle">Résultat net mensuel ({currency})</div>
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
          <div className="chart-subtitle">Jan + Fév 2026 — hors matières premières</div>
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
    </div>
  )
}
