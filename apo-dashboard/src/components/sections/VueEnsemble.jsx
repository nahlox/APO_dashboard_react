import { useEffect, useRef } from 'react'
import { Chart, ArcElement, DoughnutController, PieController, Tooltip, Legend } from 'chart.js'
import KPICard from '../kpi/KPICard'
import AlertBox from '../kpi/AlertBox'
import { fmt, chartColors, defaultTooltip } from '../../lib/kpiEngine'
import { useDashboardStore } from '../../store/dashboardStore'
import { monthFull, monthLabel } from '../../lib/monthUtils'

Chart.register(ArcElement, DoughnutController, PieController, Tooltip, Legend)

const CHARGE_COLORS = [
  'rgba(242,140,40,0.92)',
  'rgba(224,92,92,0.85)',
  'rgba(63,163,77,0.85)',
  'rgba(160,120,220,0.80)',
  'rgba(255,165,80,0.80)',
  'rgba(138,154,142,0.80)',
  'rgba(107,201,122,0.85)',
  'rgba(90,160,210,0.80)',
]

export default function VueEnsemble({ data, month }) {
  const { currency, eurRate, moisData, setActivePnlMonth } = useDashboardStore()
  const { kpis, alertes, charts } = data
  // Détection : data agrégée ou mois unique ?
  const isAggregate = data?._etl?.source === 'aggregate'
  // Si mois unique, on trouve la clé pour pouvoir ouvrir le P&L détaillé via Documents
  const singleMonthEntry = !isAggregate
    ? moisData.find(m => m.data._etl.mois === data._etl.mois && m.data._etl.annee === data._etl.annee)
    : null

  // Utilise directement les charges du mois (ou agrégées) plutôt que d'aller chercher ailleurs
  const combinedCharges = charts?.charges ?? { labels: [], values: [] }
  const chargesSubtitle = `${monthFull(data)} — hors matières premières`

  const refCA      = useRef(null)
  const refCharges = useRef(null)
  const chartCA      = useRef(null)
  const chartCharges = useRef(null)

  useEffect(() => {
    if (chartCA.current)      { chartCA.current.destroy();      chartCA.current = null }
    if (chartCharges.current) { chartCharges.current.destroy(); chartCharges.current = null }

    const cur = currency
    const combinedCharges = charts?.charges ?? { labels: [], values: [] }
    const totalCharges = combinedCharges.values.reduce((a, b) => a + b, 0)

    // CA Mix — doughnut
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
          tooltip: { ...defaultTooltip, callbacks: { label: c => ` ${fmt.money(c.raw, cur, eurRate)} (${(c.raw / kpis.caTotalFCFA * 100).toFixed(1)}%)` } },
        },
      },
    })

    // Charges — pie Jan+Fév combinés, hors MP
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
          tooltip: { ...defaultTooltip, callbacks: { label: c => ` ${fmt.money(c.raw, cur, eurRate)} (${(c.raw / totalCharges * 100).toFixed(1)}%)` } },
        },
      },
    })

    return () => {
      chartCA.current?.destroy()
      chartCharges.current?.destroy()
    }
  }, [month, currency])

  return (
    <section>
      <div className="section-title">Vue d'Ensemble</div>
      <div className="section-subtitle">Synthèse stratégique — {monthFull(data)}</div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPICard label="Chiffre d'Affaires Total"  value={fmt.kpiValue(kpis.caTotalFCFA, currency, eurRate)}   valueColor="gold"  sub={`${currency} · tous produits confondus`} />
        <KPICard label="CA Huile de Palme"         value={fmt.kpiValue(kpis.caHuileFCFA, currency, eurRate)}   valueColor="green" sub={`${currency} · ${kpis.caHuileDetail}`} accent="accent-green" />
        <KPICard label="CA Noix de Palmiste"       value={fmt.kpiValue(kpis.caNoisFCFA, currency, eurRate)}    sub={`${currency} · sous-produit`} />
        <KPICard label="Coût Matière Première"     value={fmt.kpiValue(kpis.coutMPFCFA, currency, eurRate)}    valueColor="green" sub={`${currency} · ${kpis.coutMPDetail}`} accent="accent-green" />
        <KPICard label="Résultat Net Estimé"       value={(kpis.resultatNetFCFA >= 0 ? '+ ' : '– ') + fmt.kpiValue(Math.abs(kpis.resultatNetFCFA), currency, eurRate)} valueColor={kpis.resultatNetFCFA >= 0 ? 'green' : 'red'} sub={`${currency} · marge nette ~${kpis.margeNette}%`} accent={kpis.resultatNetFCFA >= 0 ? 'accent-green' : 'accent-red'} />
        <KPICard label="Taux d'Extraction"         value={fmt.pct(kpis.tauxExtraction)}                      valueColor="green" sub="huile produite ÷ régimes traités" accent="accent-green" />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Répartition du Chiffre d'Affaires</div>
          <div className="chart-subtitle">Par produit — {monthFull(data)}</div>
          <div className="chart-container" style={{ height: 260 }}>
            <canvas ref={refCA} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Structure des Charges Opérationnelles</div>
          <div className="chart-subtitle">{chargesSubtitle}</div>
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

      {/* Lien vers le P&L détaillé (Documents) — mois unique seulement */}
      {singleMonthEntry && (
        <div className="pnl-cta">
          <div className="pnl-cta-text">
            <div className="pnl-cta-title">Compte de résultat détaillé</div>
            <div className="pnl-cta-sub">Présentation OHADA complète · Téléchargeable en PDF</div>
          </div>
          <button
            className="pnl-cta-btn"
            onClick={() => setActivePnlMonth(singleMonthEntry.key)}
          >
            📄 Ouvrir P&L {monthLabel(data)}
          </button>
        </div>
      )}

      {/* Alertes — en bas */}
      {alertes && alertes.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="chart-title" style={{ marginBottom: 12 }}>Alertes & Points d'Attention</div>
          {alertes.map((a, i) => <AlertBox key={i} {...a} />)}
        </div>
      )}
    </section>
  )
}
