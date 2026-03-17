import { useEffect, useRef } from 'react'
import {
  Chart, BarElement, BarController, LineElement, LineController,
  PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js'
import KPICard from '../kpi/KPICard'
import { fmt, chartColors, defaultTooltip } from '../../lib/kpiEngine'

Chart.register(BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

export default function Production({ data, month }) {
  const { kpis, production } = data
  const isJan = month === 'jan'

  const refDaily   = useRef(null)
  const refTE      = useRef(null)
  const refCompar  = useRef(null)
  const charts     = useRef({})

  useEffect(() => {
    Object.values(charts.current).forEach(c => c?.destroy())
    charts.current = {}

    // Graphique FFB journalier
    charts.current.daily = new Chart(refDaily.current, {
      type: 'bar',
      data: {
        labels: production.grainesDailyLabels,
        datasets: [{
          label: 'Régimes reçus (kg)',
          data: production.grainesDailyKg,
          backgroundColor: production.grainesDailyKg.map(v =>
            v > 700000 ? chartColors.gold : v > 0 ? 'rgba(200,150,62,0.5)' : 'rgba(200,150,62,0.15)'
          ),
          borderRadius: 3,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...defaultTooltip, callbacks: { label: c => `${fmt.full(c.raw)} kg` } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: 'rgba(200,150,62,0.06)' }, ticks: { callback: v => (v / 1000).toFixed(0) + 'T' } },
        },
      },
    })

    // Taux d'extraction
    charts.current.te = new Chart(refTE.current, {
      type: 'line',
      data: {
        labels: production.teDailyLabels,
        datasets: [
          {
            label: 'TE%', data: production.teDailyVals,
            borderColor: chartColors.gold, backgroundColor: 'rgba(200,150,62,0.08)',
            fill: true, tension: 0.3,
            pointBackgroundColor: production.teDailyVals.map(v => v >= 19.5 ? chartColors.green : v >= 18 ? chartColors.gold : chartColors.red),
            pointRadius: 4,
          },
          { label: 'Min 18%', data: Array(production.teDailyLabels.length).fill(18), borderColor: 'rgba(224,92,92,0.5)', borderDash: [4, 4], pointRadius: 0, fill: false },
          { label: 'Cible 22%', data: Array(production.teDailyLabels.length).fill(22), borderColor: 'rgba(76,175,122,0.4)', borderDash: [4, 4], pointRadius: 0, fill: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 12 } } }, tooltip: { ...defaultTooltip, callbacks: { label: c => c.raw.toFixed(2) + '%' } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9 } } },
          y: { min: 17, max: 23, grid: { color: 'rgba(200,150,62,0.06)' }, ticks: { callback: v => v + '%' } },
        },
      },
    })

    // Comparaison annuelle
    const bgColors = ['rgba(138,154,142,0.4)', 'rgba(200,150,62,0.5)', 'rgba(76,175,122,0.5)', chartColors.gold]
    charts.current.compar = new Chart(refCompar.current, {
      type: 'bar',
      data: {
        labels: production.comparAnnuelLabels,
        datasets: production.comparAnnuel.map((entry, i) => ({
          label: entry.label,
          data: entry.values,
          backgroundColor: bgColors[i] || chartColors.dim,
          borderRadius: 3,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 12 } } }, tooltip: { ...defaultTooltip, callbacks: { label: c => fmt.full(Math.round(c.raw)) + ' T' } } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(200,150,62,0.06)' }, ticks: { callback: v => v + 'T' } },
        },
      },
    })

    return () => Object.values(charts.current).forEach(c => c?.destroy())
  }, [month])

  return (
    <section>
      <div className="section-title">Production & Approvisionnement</div>
      <div className="section-subtitle">Collecte de régimes FFB et indicateurs de production — {isJan ? 'Janvier' : 'Février'} 2026</div>

      <div className="kpi-grid">
        <KPICard label="Régimes Reçus (FFB)"     value={fmt.tonnes(kpis.regimesRecusT)}   valueColor="gold"  sub={`kg achetés · ${isJan ? kpis.nbCamions + ' camions' : kpis.nbFournisseurs + ' fournisseurs'}`} />
        <KPICard label="Régimes Traités"          value={fmt.tonnes(kpis.regimesTraitesT)} valueColor="green" sub="kg effectivement traités · base coût MP" accent="accent-green" />
        <KPICard label="Stock Régimes Fin Mois"   value={fmt.tonnes(kpis.stockFinMoisT)}   sub={`kg en stock au ${isJan ? '31/01' : '28/02'} · reportés mois suiv.`} />
        <KPICard label="Huile Brute Produite"     value={fmt.tonnes(kpis.huileProduiteT)}  valueColor="green" sub={`kg produits · ${fmt.tonnes(kpis.huileVendueT)} livrés`} accent="accent-green" />
        <KPICard label="Taux d'Extraction Réel"   value={fmt.pct(kpis.tauxExtraction)}     valueColor="green" sub="Huile produite ÷ Régimes traités" accent="accent-green" />
      </div>

      {/* Indicateurs TE */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title">Indicateur : Taux d'Extraction (TE)</div>
        <div className="chart-subtitle">Calculé sur régimes traités</div>
        <div className="gauge-row" style={{ marginTop: 16 }}>
          <div className="gauge-item">
            <div className="gauge-label">TE APO {isJan ? 'Janvier' : 'Février'}</div>
            <div className="gauge-value" style={{ color: 'var(--gold)' }}>{fmt.pct(kpis.tauxExtraction)}</div>
            <div className="gauge-unit">huile / régimes traités</div>
            <span className="kpi-badge badge-neutral" style={{ marginTop: 8 }}>Dans la norme</span>
          </div>
          <div className="gauge-item">
            <div className="gauge-label">Standard Minimum</div>
            <div className="gauge-value" style={{ color: 'var(--gold)' }}>18,0%</div>
            <div className="gauge-unit">huile / régimes</div>
            <span className="kpi-badge badge-neutral" style={{ marginTop: 8 }}>Référence basse</span>
          </div>
          <div className="gauge-item">
            <div className="gauge-label">Cible Optimale</div>
            <div className="gauge-value" style={{ color: 'var(--green)' }}>22,0%</div>
            <div className="gauge-unit">huile / régimes</div>
            <span className="kpi-badge badge-up" style={{ marginTop: 8 }}>Objectif long terme</span>
          </div>
          <div className="gauge-item">
            <div className="gauge-label">Gain Potentiel (+3%)</div>
            <div className="gauge-value" style={{ color: 'var(--accent)' }}>{fmt.tonnes(kpis.regimesTraitesT * 0.03)}</div>
            <div className="gauge-unit">huile supplémentaire</div>
            <span className="kpi-badge badge-up" style={{ marginTop: 8 }}>≈ revenus additionnels</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid col1" style={{ marginBottom: 24 }}>
        <div className="chart-card">
          <div className="chart-title">Réception Journalière des Régimes FFB</div>
          <div className="chart-subtitle">Tonnage reçu par jour (source: Tableau de Production)</div>
          <div className="chart-container" style={{ height: 240 }}>
            <canvas ref={refDaily} />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Taux d'Extraction Journalier</div>
          <div className="chart-subtitle">TE% par journée (huile produite ÷ régimes traités)</div>
          <div className="chart-container" style={{ height: 260 }}>
            <canvas ref={refTE} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Comparaison Annuelle — Volumes Clés</div>
          <div className="chart-subtitle">Données historiques {isJan ? 'Janvier' : 'Février'}</div>
          <div className="chart-container" style={{ height: 260 }}>
            <canvas ref={refCompar} />
          </div>
        </div>
      </div>
    </section>
  )
}
