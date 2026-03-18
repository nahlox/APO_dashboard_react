import { useEffect, useRef } from 'react'
import { Chart, ArcElement, DoughnutController, PieController, Tooltip, Legend } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import KPICard from '../kpi/KPICard'
import AlertBox from '../kpi/AlertBox'
import PnLTable from '../pnl/PnLTable'
import { fmt, chartColors, defaultTooltip } from '../../lib/kpiEngine'
import { useDashboardStore } from '../../store/dashboardStore'
import { janData } from '../../data/janvier'
import { febData as fevData } from '../../data/fevrier'

Chart.register(ArcElement, DoughnutController, PieController, Tooltip, Legend, ChartDataLabels)

// Charges combinées Jan + Fév, hors MP
const CHARGE_COLORS = [
  'rgba(200,150,62,0.92)',
  'rgba(224,92,92,0.85)',
  'rgba(76,175,122,0.85)',
  'rgba(160,120,220,0.80)',
  'rgba(255,165,80,0.80)',
  'rgba(138,154,142,0.80)',
  'rgba(126,200,164,0.85)',
  'rgba(90,160,210,0.80)',
]

function buildCombinedCharges() {
  const merged = {}
  for (const d of [janData, fevData]) {
    d.charts.charges.labels.forEach((lbl, i) => {
      merged[lbl] = (merged[lbl] || 0) + d.charts.charges.values[i]
    })
  }
  return { labels: Object.keys(merged), values: Object.values(merged) }
}

const combinedCharges = buildCombinedCharges()

export default function VueEnsemble({ data, month }) {
  const { currency } = useDashboardStore()
  const { kpis, pnl, alertes, charts } = data

  const refCA      = useRef(null)
  const refCharges = useRef(null)
  const chartCA      = useRef(null)
  const chartCharges = useRef(null)

  useEffect(() => {
    if (chartCA.current)      { chartCA.current.destroy();      chartCA.current = null }
    if (chartCharges.current) { chartCharges.current.destroy(); chartCharges.current = null }

    const totalCharges = combinedCharges.values.reduce((a, b) => a + b, 0)

    // CA Mix — doughnut (inchangé)
    chartCA.current = new Chart(refCA.current, {
      type: 'doughnut',
      data: {
        labels: charts.caMix.labels,
        datasets: [{
          data: charts.caMix.values,
          backgroundColor: [chartColors.goldAlpha, chartColors.greenAlpha, chartColors.dim],
          borderColor: '#161A18', borderWidth: 3, hoverOffset: 8,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { padding: 16, font: { size: 12 }, color: '#c8c8c8' } },
          tooltip: { ...defaultTooltip, callbacks: { label: c => ` ${fmt.millions(c.raw)} FCFA (${(c.raw / kpis.caTotalFCFA * 100).toFixed(1)}%)` } },
          datalabels: { display: false },
        },
      },
    })

    // Charges — pie avec étiquettes Jan+Fév combinés, hors MP
    chartCharges.current = new Chart(refCharges.current, {
      type: 'pie',
      data: {
        labels: combinedCharges.labels,
        datasets: [{
          data: combinedCharges.values,
          backgroundColor: CHARGE_COLORS,
          borderColor: '#161A18', borderWidth: 2, hoverOffset: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        layout: { padding: 20 },
        plugins: {
          legend: { display: false },
          tooltip: { ...defaultTooltip, callbacks: { label: c => ` ${fmt.millions(c.raw)} FCFA (${(c.raw / totalCharges * 100).toFixed(1)}%)` } },
          datalabels: {
            display: false,
            color: '#fff',
            font: { size: 11, weight: 'bold' },
            formatter: (value, ctx) => {
              const pct = (value / totalCharges * 100)
              if (pct < 5) return ''
              return `${pct.toFixed(0)}%\n${ctx.chart.data.labels[ctx.dataIndex].split(' ')[0]}`
            },
            textAlign: 'center',
            textShadowBlur: 4,
            textShadowColor: 'rgba(0,0,0,0.8)',
          },
        },
      },
    })

    return () => {
      chartCA.current?.destroy()
      chartCharges.current?.destroy()
    }
  }, [month])

  const isJan = month === 'jan'

  return (
    <section>
      <div className="section-title">Vue d'Ensemble</div>
      <div className="section-subtitle">Synthèse stratégique — {isJan ? 'Janvier' : 'Février'} 2026</div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPICard label="Chiffre d'Affaires Total"  value={fmt.kpiValue(kpis.caTotalFCFA, currency)}   valueColor="gold"  sub={`${currency} · tous produits confondus`} />
        <KPICard label="CA Huile de Palme"         value={fmt.kpiValue(kpis.caHuileFCFA, currency)}   valueColor="green" sub={`${currency} · ${kpis.caHuileDetail}`} accent="accent-green" />
        <KPICard label="CA Noix de Palmiste"       value={fmt.kpiValue(kpis.caNoisFCFA, currency)}    sub={`${currency} · sous-produit`} />
        <KPICard label="Coût Matière Première"     value={fmt.kpiValue(kpis.coutMPFCFA, currency)}    valueColor="green" sub={`${currency} · ${kpis.coutMPDetail}`} accent="accent-green" />
        <KPICard label="Résultat Net Estimé"       value={'+ ' + fmt.kpiValue(kpis.resultatNetFCFA, currency)} valueColor="green" sub={`${currency} · marge nette ~${kpis.margeNette}%`} accent="accent-green" />
        <KPICard label="Taux d'Extraction"         value={fmt.pct(kpis.tauxExtraction)}                      valueColor="green" sub="huile produite ÷ régimes traités" accent="accent-green" />
      </div>

      {/* P&L */}
      <PnLTable pnl={pnl} />

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Répartition du Chiffre d'Affaires</div>
          <div className="chart-subtitle">Par produit — {isJan ? 'Janvier' : 'Février'} 2026</div>
          <div className="chart-container" style={{ height: 260 }}>
            <canvas ref={refCA} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Structure des Charges Opérationnelles</div>
          <div className="chart-subtitle">Jan + Fév 2026 combinés — hors matières premières</div>
          <div className="chart-container" style={{ height: 280 }}>
            <canvas ref={refCharges} />
          </div>
          {/* Légende manuelle sous le pie */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {combinedCharges.labels.map((lbl, i) => {
              const total = combinedCharges.values.reduce((a, b) => a + b, 0)
              const pct = (combinedCharges.values[i] / total * 100).toFixed(1)
              return (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#b0b8b4' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: CHARGE_COLORS[i], flexShrink: 0, display: 'inline-block' }} />
                  {lbl} <span style={{ color: '#e8d5a0', fontWeight: 600 }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Alertes — en bas */}
      <div style={{ marginTop: 24 }}>
        <div className="chart-title" style={{ marginBottom: 12 }}>Alertes & Points d'Attention</div>
        {alertes.map((a, i) => <AlertBox key={i} {...a} />)}
      </div>
    </section>
  )
}
