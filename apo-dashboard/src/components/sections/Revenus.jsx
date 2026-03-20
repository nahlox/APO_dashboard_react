import { useEffect, useRef } from 'react'
import { Chart, BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js'
import KPICard from '../kpi/KPICard'
import { fmt, chartColors, defaultTooltip } from '../../lib/kpiEngine'
import { useDashboardStore } from '../../store/dashboardStore'

Chart.register(BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

export default function Revenus({ data, month }) {
  const { currency } = useDashboardStore()
  const { kpis, revenus } = data
  const isJan = month === 'jan'
  const refCA = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    chartRef.current?.destroy()
    chartRef.current = new Chart(refCA.current, {
      type: 'line',
      data: {
        labels: revenus.caJoursLabels,
        datasets: [{
          label: `CA Huile (${currency})`,
          data: currency === 'USD'
            ? revenus.caJoursVals.map(v => fmt.toUSD(v))
            : revenus.caJoursVals,
          borderColor: chartColors.gold, backgroundColor: 'rgba(200,150,62,0.08)',
          fill: true, tension: 0.4,
          pointBackgroundColor: chartColors.gold, pointRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...defaultTooltip, callbacks: { label: c => fmt.money(currency === 'USD' ? c.raw * 563 : c.raw, currency) } } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(200,150,62,0.06)' }, ticks: { callback: v => fmt.money(currency === 'USD' ? v * 563 : v, currency) } },
        },
      },
    })
    return () => chartRef.current?.destroy()
  }, [month, currency])

  return (
    <section>
      <div className="section-title">Revenus & Ventes</div>
      <div className="section-subtitle">Analyse détaillée du chiffre d'affaires — {isJan ? 'Janvier' : 'Février'} 2026</div>

      <div className="kpi-grid">
        <KPICard label="CA Total"           value={fmt.kpiValue(kpis.caTotalFCFA, currency)}  valueColor="green" sub={currency} accent="accent-green" />
        <KPICard label="CA Huile de Palme"  value={fmt.kpiValue(kpis.caHuileFCFA, currency)}  valueColor="gold"  sub={`${currency} · ${(kpis.caHuileFCFA / kpis.caTotalFCFA * 100).toFixed(1)}% du CA`} />
        <KPICard label="CA Noix Palmiste"   value={fmt.kpiValue(kpis.caNoisFCFA, currency)}   sub={`${currency} · ${(kpis.caNoisFCFA / kpis.caTotalFCFA * 100).toFixed(1)}% du CA`} />
        <KPICard label="Huile Vendue"       value={fmt.tonnes(kpis.huileVendueT)}              sub="tonnes livrées" />
      </div>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title">CA Journalier Huile</div>
        <div className="chart-subtitle">Chiffre d'affaires huile par jour de livraison ({currency})</div>
        <div className="chart-container" style={{ height: 260 }}>
          <canvas ref={refCA} />
        </div>
      </div>

      {/* Tableau produits */}
      <div className="chart-card">
        <div className="chart-title">Détail des Ventes par Produit</div>
        <div className="chart-subtitle">Récapitulatif {isJan ? 'Janvier' : 'Février'} 2026</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix Unitaire</th>
              <th style={{ textAlign: 'right' }}>Total {currency}</th>
              <th style={{ textAlign: 'right' }}>% CA</th>
            </tr>
          </thead>
          <tbody>
            {revenus.produits.map((p, i) => (
              <tr key={i}>
                <td>{p.produit}</td>
                <td>{p.quantite}</td>
                <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 13 }}>{p.prixUnitaire}</td>
                <td className="num" style={{ color: 'var(--gold)' }}>
                  {p.totalFCFA > 0 ? fmt.currency(p.totalFCFA, currency) : '—'}
                </td>
                <td className="num" style={{ color: 'var(--text-dim)' }}>
                  {p.totalFCFA > 0 ? (p.totalFCFA / kpis.caTotalFCFA * 100).toFixed(1) + '%' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
