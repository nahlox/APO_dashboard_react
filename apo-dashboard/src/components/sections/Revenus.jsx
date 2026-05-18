import { useEffect, useRef } from 'react'
import { Chart, BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js'
import KPICard from '../kpi/KPICard'
import { fmt, chartColors, defaultTooltip } from '../../lib/kpiEngine'
import { useDashboardStore } from '../../store/dashboardStore'
import { monthFull } from '../../lib/monthUtils'

Chart.register(BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

export default function Revenus({ data, month }) {
  const { currency, eurRate } = useDashboardStore()
  const { kpis, revenus } = data
  const refCA = useRef(null)
  const chartRef = useRef(null)

  const labels    = revenus.caJoursLabels  ?? []
  const caVals    = revenus.caJoursVals    ?? []
  const poidsT    = revenus.caJoursPoidsT  ?? []
  const sarciOk   = revenus.caJoursSarciOk ?? []

  useEffect(() => {
    chartRef.current?.destroy()
    if (!refCA.current) return

    const caDisplay = currency === 'EUR'
      ? caVals.map(v => +(v / eurRate).toFixed(0))
      : caVals

    chartRef.current = new Chart(refCA.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            // Axe gauche : tonnes APO livrées
            label: 'Tonnes livrées (APO)',
            data: poidsT,
            backgroundColor: sarciOk.map(ok => ok ? 'rgba(242,140,40,0.55)' : 'rgba(242,140,40,0.22)'),
            borderColor:     sarciOk.map(ok => ok ? 'rgba(242,140,40,0.9)' : 'rgba(242,140,40,0.5)'),
            borderWidth: 1,
            borderRadius: 3,
            yAxisID: 'yPoids',
            order: 2,
          },
          {
            // Axe droit : CA
            type: 'line',
            label: `CA Huile (${currency})`,
            data: caDisplay,
            borderColor: chartColors.green,
            backgroundColor: 'rgba(63,163,77,0.06)',
            fill: true, tension: 0.35,
            pointBackgroundColor: sarciOk.map(ok => ok ? chartColors.green : 'rgba(242,140,40,0.7)'),
            pointRadius: 5,
            pointStyle: sarciOk.map(ok => ok ? 'circle' : 'triangle'),
            yAxisID: 'yCA',
            order: 1,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { font: { size: 11 } } },
          tooltip: {
            ...defaultTooltip,
            callbacks: {
              label: c => {
                if (c.datasetIndex === 0) return `Livré APO : ${c.raw.toFixed(1)} T`
                const fcfa = currency === 'EUR' ? c.raw * eurRate : c.raw
                const confirmed = sarciOk[c.dataIndex]
                return `CA : ${fmt.currency(fcfa, currency, eurRate)}${confirmed ? '' : ' ⏳ poids SARCI en attente'}`
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          yPoids: {
            position: 'left',
            grid: { color: 'rgba(242,140,40,0.06)' },
            ticks: { callback: v => v.toFixed(0) + ' T' },
          },
          yCA: {
            position: 'right',
            grid: { display: false },
            ticks: { callback: v => currency === 'EUR' ? v.toFixed(0) + ' €' : (v / 1_000_000).toFixed(1) + ' M' },
          },
        },
      },
    })
    return () => chartRef.current?.destroy()
  }, [month, currency, eurRate])

  return (
    <section>
      <div className="section-title">Revenus & Ventes</div>
      <div className="section-subtitle">Analyse détaillée du chiffre d'affaires — {monthFull(data)}</div>

      <div className="kpi-grid">
        <KPICard label="CA Total"           value={fmt.kpiValue(kpis.caTotalFCFA, currency, eurRate)}  valueColor="green" sub={currency} accent="accent-green" />
        <KPICard label="CA Huile de Palme"  value={fmt.kpiValue(kpis.caHuileFCFA, currency, eurRate)}  valueColor="gold"  sub={`${currency} · ${(kpis.caHuileFCFA / kpis.caTotalFCFA * 100).toFixed(1)}% du CA`} />
        <KPICard label="CA Noix Palmiste"   value={fmt.kpiValue(kpis.caNoisFCFA, currency, eurRate)}   sub={`${currency} · ${(kpis.caNoisFCFA / kpis.caTotalFCFA * 100).toFixed(1)}% du CA`} />
        <KPICard label="Huile Vendue"       value={fmt.tonnes(kpis.huileVendueT)}              sub="tonnes livrées" />
      </div>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title">Livraisons & CA Journalier Huile</div>
        <div className="chart-subtitle">Barres = tonnes livrées (poids APO) · Ligne = CA ({currency}) · ⏳ triangle = poids SARCI en attente</div>
        <div className="chart-container" style={{ height: 260 }}>
          <canvas ref={refCA} />
        </div>
      </div>

      {/* Tableau produits */}
      <div className="chart-card">
        <div className="chart-title">Détail des Ventes par Produit</div>
        <div className="chart-subtitle">Récapitulatif {monthFull(data)}</div>
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
                  {p.totalFCFA > 0 ? fmt.currency(p.totalFCFA, currency, eurRate) : '—'}
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
