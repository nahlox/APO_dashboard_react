import { useEffect, useRef } from 'react'
import { Chart, ArcElement, DoughnutController, Tooltip, Legend } from 'chart.js'
import KPICard from '../kpi/KPICard'
import AlertBox from '../kpi/AlertBox'
import PnLTable from '../pnl/PnLTable'
import { fmt, chartColors, defaultTooltip } from '../../lib/kpiEngine'
import { useDashboardStore } from '../../store/dashboardStore'

Chart.register(ArcElement, DoughnutController, Tooltip, Legend)

export default function VueEnsemble({ data, month }) {
  const { currency } = useDashboardStore()
  const { kpis, pnl, alertes, charts } = data

  const refCA      = useRef(null)
  const refCharges = useRef(null)
  const chartCA      = useRef(null)
  const chartCharges = useRef(null)

  useEffect(() => {
    // Détruire les instances précédentes si elles existent
    if (chartCA.current)      { chartCA.current.destroy();      chartCA.current = null }
    if (chartCharges.current) { chartCharges.current.destroy(); chartCharges.current = null }

    // CA Mix doughnut
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
          legend: { position: 'right', labels: { padding: 16, font: { size: 12 } } },
          tooltip: { ...defaultTooltip, callbacks: { label: c => ` ${fmt.millions(c.raw)} FCFA (${(c.raw / kpis.caTotalFCFA * 100).toFixed(1)}%)` } },
        },
      },
    })

    // Charges doughnut
    chartCharges.current = new Chart(refCharges.current, {
      type: 'doughnut',
      data: {
        labels: charts.charges.labels,
        datasets: [{
          data: charts.charges.values,
          backgroundColor: [
            'rgba(200,150,62,0.9)', 'rgba(224,92,92,0.8)', 'rgba(76,175,122,0.8)', 'rgba(200,150,62,0.5)',
            'rgba(224,92,92,0.5)', 'rgba(138,154,142,0.7)', 'rgba(76,175,122,0.4)', 'rgba(126,200,164,0.8)',
          ],
          borderColor: '#161A18', borderWidth: 2, hoverOffset: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { padding: 12, font: { size: 11 } } },
          tooltip: { ...defaultTooltip, callbacks: { label: c => ` ${fmt.millions(c.raw)} FCFA` } },
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
        <KPICard label="Chiffre d'Affaires Total"  value={fmt.kpiValue(kpis.caTotalFCFA, currency) + ' M'}   valueColor="gold"  sub={`${currency} · tous produits confondus`} />
        <KPICard label="CA Huile de Palme"         value={fmt.kpiValue(kpis.caHuileFCFA, currency) + ' M'}   valueColor="green" sub={`${currency} · ${kpis.caHuileDetail}`} accent="accent-green" />
        <KPICard label="CA Noix de Palmiste"       value={fmt.kpiValue(kpis.caNoisFCFA, currency) + ' M'}    sub={`${currency} · sous-produit`} />
        <KPICard label="Coût Matière Première"     value={fmt.kpiValue(kpis.coutMPFCFA, currency) + ' M'}    valueColor="green" sub={`${currency} · ${kpis.coutMPDetail}`} accent="accent-green" />
        <KPICard label="Résultat Net Estimé"       value={'+ ' + fmt.kpiValue(kpis.resultatNetFCFA, currency) + ' M'} valueColor="green" sub={`${currency} · marge nette ~${kpis.margeNette}%`} accent="accent-green" />
        <KPICard label="Taux d'Extraction"         value={fmt.pct(kpis.tauxExtraction)}                      valueColor="green" sub="huile produite ÷ régimes traités" accent="accent-green" />
      </div>

      {/* P&L */}
      <PnLTable pnl={pnl} />

      {/* Alertes */}
      <div style={{ marginBottom: 24 }}>
        <div className="chart-title" style={{ marginBottom: 12 }}>Alertes & Points d'Attention</div>
        {alertes.map((a, i) => <AlertBox key={i} {...a} />)}
      </div>

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
          <div className="chart-title">Structure des Charges</div>
          <div className="chart-subtitle">Répartition opérationnelle (hors graines)</div>
          <div className="chart-container" style={{ height: 260 }}>
            <canvas ref={refCharges} />
          </div>
        </div>
      </div>
    </section>
  )
}
