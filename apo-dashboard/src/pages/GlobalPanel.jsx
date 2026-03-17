import { useEffect, useRef } from 'react'
import {
  Chart, BarElement, BarController, LineElement, LineController,
  PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js'
import KPICard from '../components/kpi/KPICard'
import { fmt, buildGlobalKPIs, chartColors, defaultTooltip } from '../lib/kpiEngine'
import { useDashboardStore } from '../store/dashboardStore'
import { janData } from '../data/janvier'
import { febData } from '../data/fevrier'

Chart.register(BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

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

    // CA par mois
    charts.current.ca = new Chart(refCA.current, {
      type: 'bar',
      data: {
        labels: ['Janvier 2026', 'Février 2026'],
        datasets: [
          { label: 'Huile CPO',     data: [janData.kpis.caHuileFCFA / 1e6, febData.kpis.caHuileFCFA / 1e6], backgroundColor: chartColors.goldAlpha, borderRadius: 4 },
          { label: 'Noix Palmiste', data: [janData.kpis.caNoisFCFA / 1e6, febData.kpis.caNoisFCFA / 1e6], backgroundColor: chartColors.greenAlpha, borderRadius: 4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 12 } } }, tooltip: { ...defaultTooltip, callbacks: { label: c => fmt.millions(c.raw * 1e6) + ' FCFA' } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(200,150,62,0.06)' }, ticks: { callback: v => v + ' M' } } },
      },
    })

    // Résultat net
    charts.current.result = new Chart(refResult.current, {
      type: 'bar',
      data: {
        labels: ['Janvier 2026', 'Février 2026'],
        datasets: [{
          label: 'Résultat Net',
          data: [janData.kpis.resultatNetFCFA / 1e6, febData.kpis.resultatNetFCFA / 1e6],
          backgroundColor: [chartColors.goldAlpha, chartColors.greenAlpha],
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...defaultTooltip, callbacks: { label: c => '+' + fmt.millions(c.raw * 1e6) + ' FCFA' } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(200,150,62,0.06)' }, ticks: { callback: v => v + ' M' } } },
      },
    })

    // Production
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
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(200,150,62,0.06)' }, ticks: { callback: v => v + 'T' } } },
      },
    })

    // Coûts top 5
    charts.current.costs = new Chart(refCosts.current, {
      type: 'bar',
      data: {
        labels: ['Mat. Première', 'Salaires', 'Amort. bancaire', 'Matériels', 'Carburant'],
        datasets: [
          { label: 'Janvier', data: [janData.kpis.coutMPFCFA / 1e6, 27.3, 20.2, 7.5, 4.9], backgroundColor: chartColors.goldAlpha, borderRadius: 3 },
          { label: 'Février', data: [febData.kpis.coutMPFCFA / 1e6, 30.1, 20.2, 13.6, 7.6], backgroundColor: chartColors.greenAlpha, borderRadius: 3 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 12 } } }, tooltip: { ...defaultTooltip, callbacks: { label: c => c.raw.toFixed(1) + ' M FCFA' } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(200,150,62,0.06)' }, ticks: { callback: v => v + ' M' } } },
      },
    })

    return () => Object.values(charts.current).forEach(c => c?.destroy())
  }, [])

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
            ['Chiffre d\'Affaires',   fmt.millions(janData.kpis.caTotalFCFA) + ' FCFA', 'var(--gold)'],
            ['Coût Matière Première', fmt.millions(janData.kpis.coutMPFCFA) + ' FCFA',  'var(--red)'],
            ['Charges Exploitation',  fmt.millions(janData.kpis.chargesExplFCFA) + ' FCFA', 'var(--red)'],
            ['Résultat Net',          '+ ' + fmt.millions(janData.kpis.resultatNetFCFA) + ' FCFA', 'var(--green)'],
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
            ['Chiffre d\'Affaires',   fmt.millions(febData.kpis.caTotalFCFA) + ' FCFA', 'var(--gold)'],
            ['Coût Matière Première', fmt.millions(febData.kpis.coutMPFCFA) + ' FCFA',  'var(--red)'],
            ['Charges Exploitation',  fmt.millions(febData.kpis.chargesExplFCFA) + ' FCFA', 'var(--red)'],
            ['Résultat Net',          '+ ' + fmt.millions(febData.kpis.resultatNetFCFA) + ' FCFA', 'var(--green)'],
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
        <KPICard label="Évolution CA Fév/Jan"           value={'+'  + global.evolutionCA.toFixed(1) + '%'}                valueColor="green" sub="2 129,7 M vs 1 336 M FCFA" accent="accent-green" />
        <KPICard label="Résultat Cumulé"                value={'+ ' + fmt.kpiValue(global.resultatCumule, currency)} valueColor="green" sub={currency + ' · 27,9 M + 329,0 M'} accent="accent-green" />
        <KPICard label="Évolution Résultat Fév/Jan"     value={'×' + global.evolutionResultat.toFixed(1)}                  valueColor="green" sub="+329 M vs +27,9 M FCFA" accent="accent-green" />
        <KPICard label="Huile Produite Cumulée"         value={fmt.tonnes(global.huileProduiteTotal)}                       valueColor="gold"  sub="1 956 T + 2 866 T" />
        <KPICard label="Évolution Production Fév/Jan"   value={'+' + global.evolutionProduction.toFixed(1) + '%'}           valueColor="green" sub="2 866 T vs 1 956 T" accent="accent-green" />
      </div>

      {/* Charts comparaison */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Évolution du CA</div>
          <div className="chart-subtitle">Chiffre d'affaires mensuel par produit (M FCFA)</div>
          <div className="chart-container" style={{ height: 300 }}>
            <canvas ref={refCA} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Évolution du Résultat</div>
          <div className="chart-subtitle">Résultat net mensuel (M FCFA)</div>
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
          <div className="chart-title">Structure de Coûts</div>
          <div className="chart-subtitle">Top 5 postes de dépenses (M FCFA)</div>
          <div className="chart-container" style={{ height: 240 }}>
            <canvas ref={refCosts} />
          </div>
        </div>
      </div>
    </div>
  )
}
