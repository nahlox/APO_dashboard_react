import { useEffect, useRef } from 'react'
import { Chart, BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js'
import KPICard from '../kpi/KPICard'
import { fmt, chartColors, defaultTooltip } from '../../lib/kpiEngine'
import { useDashboardStore } from '../../store/dashboardStore'

Chart.register(BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

export default function Revenus({ data, month }) {
  const { currency, eurRate } = useDashboardStore()
  const { kpis, revenus } = data
  const refCA   = useRef(null)
  const chartRef = useRef(null)

  const labels    = revenus.caJoursLabels  ?? []
  const caVals    = revenus.caJoursVals    ?? []
  const poidsT    = revenus.caJoursPoidsT  ?? []
  const sarciOk   = revenus.caJoursSarciOk ?? []
  const blanc     = revenus.blanc ?? {}
  const noir      = revenus.noir  ?? {}

  const C_BLANC = { bg: 'rgba(242,140,40,0.55)', border: 'rgba(242,140,40,0.90)', text: 'rgba(242,140,40,0.95)' }
  const C_NOIR  = { bg: 'rgba(63,163,77,0.45)',  border: 'rgba(63,163,77,0.80)',  text: 'rgba(63,163,77,0.95)'  }

  useEffect(() => {
    chartRef.current?.destroy()
    if (!refCA.current) return

    const blancVals = (revenus.caJoursBlanc ?? []).map(v => currency === 'EUR' ? +(v / eurRate).toFixed(0) : v)
    const noirVals  = (revenus.caJoursNoir  ?? []).map(v => currency === 'EUR' ? +(v / eurRate).toFixed(0) : v)

    chartRef.current = new Chart(refCA.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'BLANC — chèque SARCI',
            data: blancVals,
            backgroundColor: C_BLANC.bg,
            borderColor: C_BLANC.border,
            borderWidth: 1, borderRadius: 3,
            yAxisID: 'yCA', order: 2,
          },
          {
            label: 'NOIR — autres règlements',
            data: noirVals,
            backgroundColor: C_NOIR.bg,
            borderColor: C_NOIR.border,
            borderWidth: 1, borderRadius: 3,
            yAxisID: 'yCA', order: 2,
          },
          {
            type: 'line',
            label: 'Tonnes livrées (APO)',
            data: poidsT,
            borderColor: chartColors.gold,
            backgroundColor: 'rgba(242,140,40,0.06)',
            fill: false, tension: 0.35,
            pointBackgroundColor: sarciOk.map(ok => ok ? chartColors.gold : 'rgba(255,165,0,0.45)'),
            pointRadius: sarciOk.map(ok => ok ? 4 : 6),
            pointStyle: sarciOk.map(ok => ok ? 'circle' : 'triangle'),
            yAxisID: 'yPoids', order: 1,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { font: { size: 11 } } },
          tooltip: {
            ...defaultTooltip,
            callbacks: {
              label: c => {
                if (c.datasetIndex === 2) return `Tonnes : ${c.raw.toFixed(1)} T`
                const fcfa = currency === 'EUR' ? c.raw * eurRate : c.raw
                const tag  = c.datasetIndex === 0 ? '✓ BLANC' : '○ NOIR'
                return `${tag} : ${fmt.currency(fcfa, currency, eurRate)}`
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false }, stacked: true },
          yCA: {
            position: 'left', stacked: true,
            grid: { color: 'rgba(242,140,40,0.06)' },
            ticks: { callback: v => currency === 'EUR' ? (v/1000).toFixed(0)+'k€' : (v/1_000_000).toFixed(0)+' M' },
          },
          yPoids: {
            position: 'right', grid: { display: false },
            ticks: { callback: v => v.toFixed(0) + ' T', font: { size: 10 } },
          },
        },
      },
    })
    return () => chartRef.current?.destroy()
  }, [month, currency, eurRate])

  const totalHuileCalc = (blanc.caFCFA ?? 0) + (noir.caFCFA ?? 0)
  const pctBlanc = totalHuileCalc > 0 ? (blanc.caFCFA / totalHuileCalc * 100).toFixed(1) : 0
  const pctNoir  = totalHuileCalc > 0 ? (noir.caFCFA  / totalHuileCalc * 100).toFixed(1) : 0

  return (
    <section>

      <div className="kpi-grid">
        <KPICard label="CA Total"          value={fmt.kpiValue(kpis.caTotalFCFA, currency, eurRate)}        valueColor="green" accent="accent-green" />
        <KPICard label="CA Huile BLANC"    value={fmt.kpiValue(blanc.caFCFA ?? 0, currency, eurRate)}        valueColor="green" accent="accent-green" />
        <KPICard label="CA Huile NOIR"     value={fmt.kpiValue(noir.caFCFA ?? 0, currency, eurRate)}         valueColor="gold" />
        <KPICard label="Huile Vendue"      value={fmt.tonnes(kpis.huileVendueT)} />
        <KPICard label="CA Palmiste" value={fmt.kpiValue(kpis.caNoisFCFA ?? 0, currency, eurRate)} valueColor="gold" />
      </div>

      {/* Graines correspondantes */}
      {(blanc.grainesT > 0 || noir.grainesT > 0) && (
        <div className="chart-card" style={{ marginBottom: 16, padding: '12px 20px' }}>
          <div className="chart-title" style={{ marginBottom: 8 }}>Graines correspondantes (via TE {kpis.tauxExtraction?.toFixed(1)}%)</div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: 13 }}>
            <span>
              <span style={{ color: C_BLANC.text, fontWeight: 700 }}>BLANC</span>
              {' — '}<strong>{(blanc.grainesT ?? 0).toFixed(0)} T</strong> de régimes
              {blanc.prixMoyKg > 0 && <span style={{ color: 'var(--text-dim)' }}> · à {blanc.prixMoyKg.toFixed(0)} F/kg huile</span>}
            </span>
            <span>
              <span style={{ color: C_NOIR.text, fontWeight: 700 }}>NOIR</span>
              {' — '}<strong>{(noir.grainesT ?? 0).toFixed(0)} T</strong> de régimes
              {noir.prixMoyKg > 0 && <span style={{ color: 'var(--text-dim)' }}> · à {noir.prixMoyKg.toFixed(0)} F/kg huile</span>}
            </span>
          </div>
        </div>
      )}

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title">CA Journalier — BLANC vs NOIR</div>
        <div className="chart-subtitle">Barres empilées = CA par circuit · Ligne = tonnes livrées (APO)</div>
        <div className="chart-container" style={{ height: 260 }}>
          <canvas ref={refCA} />
        </div>
      </div>

      {/* Tableau produits */}
      <div className="chart-card">
        <div className="chart-title">Détail des Ventes par Produit</div>
        <div className="chart-subtitle">Récapitulatif</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix Moyen</th>
              <th style={{ textAlign: 'right' }}>Total {currency}</th>
              <th style={{ textAlign: 'right' }}>% CA Huile</th>
            </tr>
          </thead>
          <tbody>
            {revenus.produits.map((p, i) => (
              <tr key={i} style={p.circuit ? { borderLeft: `3px solid ${p.circuit === 'blanc' ? C_BLANC.border : C_NOIR.border}` } : {}}>
                <td style={{ fontWeight: p.circuit ? 600 : 400 }}>{p.produit}</td>
                <td>{p.quantite}</td>
                <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{p.prixUnitaire}</td>
                <td className="num" style={{ color: p.circuit === 'blanc' ? C_BLANC.text : p.circuit === 'noir' ? C_NOIR.text : 'var(--gold)' }}>
                  {p.totalFCFA > 0 ? fmt.currency(p.totalFCFA, currency, eurRate) : '—'}
                </td>
                <td className="num" style={{ color: 'var(--text-dim)' }}>
                  {p.totalFCFA > 0 && kpis.caHuileFCFA > 0 ? (p.totalFCFA / kpis.caHuileFCFA * 100).toFixed(1) + '%' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
