import { useEffect, useRef } from 'react'
import {
  Chart, BarElement, BarController, LineElement, LineController,
  PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler,
  ArcElement, PieController, RadialLinearScale
} from 'chart.js'
import KPICard from '../components/kpi/KPICard'
import { fmt, buildGlobalKPIs, chartColors, defaultTooltip } from '../lib/kpiEngine'
import { useDashboardStore } from '../store/dashboardStore'
import { MONTH_DATA as MONTH_DATA_STATIC } from '../data/index'
import { monthLabel, monthFull, monthShort, rangeLabel, sumLabel } from '../lib/monthUtils'

Chart.register(BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler, ArcElement, PieController, RadialLinearScale)

const PIE_COLORS = [
  'rgba(242,140,40,0.92)', 'rgba(224,92,92,0.85)', 'rgba(63,163,77,0.85)',
  'rgba(160,120,220,0.80)', 'rgba(255,165,80,0.80)', 'rgba(138,154,142,0.80)',
  'rgba(107,201,122,0.85)', 'rgba(90,160,210,0.80)',
]

// Bar colors cycle for multi-month charts
const BAR_COLORS = [
  chartColors.goldAlpha,
  chartColors.greenAlpha,
  'rgba(107,201,122,0.7)',
  'rgba(160,120,220,0.7)',
  'rgba(90,160,210,0.7)',
]

function buildCombinedCharges(monthData) {
  const merged = {}
  for (const { data } of monthData) {
    data.charts.charges.labels.forEach((lbl, i) => {
      merged[lbl] = (merged[lbl] || 0) + data.charts.charges.values[i]
    })
  }
  const sorted = Object.entries(merged).sort((a, b) => b[1] - a[1]).slice(0, 10)
  return { labels: sorted.map(([l]) => l), values: sorted.map(([, v]) => v) }
}

export default function GlobalPanel({ moisData = [] }) {
  // Jan/Fév/Mar = données statiques exactes ; moisData = mois supplémentaires Supabase (avr+)
  const MONTH_DATA = [...MONTH_DATA_STATIC, ...moisData]
  const { setActiveMonth, currency, eurRate } = useDashboardStore()

  const combinedCharges = buildCombinedCharges(MONTH_DATA)
  const global = buildGlobalKPIs(...MONTH_DATA.map(m => m.data))

  const refCA     = useRef(null)
  const refResult = useRef(null)
  const refProd   = useRef(null)
  const refCosts  = useRef(null)
  const refPrix   = useRef(null)
  const charts    = useRef({})

  // Derived labels (re-computed whenever MONTH_DATA changes)
  const monthLabels   = MONTH_DATA.map(m => monthFull(m.data))
  const shortLabels   = MONTH_DATA.map(m => monthLabel(m.data))
  const range         = rangeLabel(MONTH_DATA)
  const sum           = sumLabel(MONTH_DATA)
  const year          = MONTH_DATA[0]?.data._etl.annee ?? ''
  const sectionSub    = `Comparaison mensuelle ${shortLabels.join(' · ')} ${year} · Cliquez sur un mois pour accéder au détail complet`

  useEffect(() => {
    Object.values(charts.current).forEach(c => c?.destroy())
    charts.current = {}

    const cur = currency
    // FCFA → données en millions ; EUR → données en euros bruts
    const div = cur === 'EUR' ? eurRate : 1e6
    const yTick = (v) => {
      if (cur === 'EUR') {
        if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + ' M€'
        return Math.round(v / 1e3).toLocaleString('fr-FR') + ' K€'
      }
      return v.toLocaleString('fr-FR') + ' M'
    }

    // CA par mois
    charts.current.ca = new Chart(refCA.current, {
      type: 'bar',
      data: {
        labels: shortLabels,
        datasets: [
          {
            label: 'Huile CPO',
            data: MONTH_DATA.map(m => m.data.kpis.caHuileFCFA / div),
            backgroundColor: chartColors.goldAlpha, borderRadius: 4,
          },
          {
            label: 'Noix Palmiste',
            data: MONTH_DATA.map(m => m.data.kpis.caNoisFCFA / div),
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

    // Résultat net
    charts.current.result = new Chart(refResult.current, {
      type: 'bar',
      data: {
        labels: shortLabels,
        datasets: [{
          label: 'Résultat Net',
          data: MONTH_DATA.map(m => m.data.kpis.resultatNetFCFA / div),
          backgroundColor: MONTH_DATA.map((_, i) => BAR_COLORS[i] ?? chartColors.dim),
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...defaultTooltip, callbacks: { label: c => fmt.money(c.raw * div, cur, eurRate) } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(242,140,40,0.06)' }, ticks: { callback: yTick } } },
      },
    })

    // Production volumes
    charts.current.prod = new Chart(refProd.current, {
      type: 'bar',
      data: {
        labels: ['Régimes Reçus', 'Régimes Traités', 'Huile Produite', 'Huile Vendue'],
        datasets: MONTH_DATA.map(({ data }, i) => ({
          label: monthLabel(data),
          data: [data.kpis.regimesRecusT, data.kpis.regimesTraitesT, data.kpis.huileProduiteT, data.kpis.huileVendueT],
          backgroundColor: BAR_COLORS[i] ?? chartColors.dim,
          borderRadius: 3,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 12 } } }, tooltip: { ...defaultTooltip, callbacks: { label: c => fmt.full(Math.round(c.raw)) + ' T' } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(242,140,40,0.06)' }, ticks: { callback: v => v + ' T' } } },
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

    // Prix régimes vs CPO + marge brute par kg de régime
    const prixRegimes = MONTH_DATA.map(m => m.data.kpis.prixMoyenRegimeKg || 0)
    const prixCPO     = MONTH_DATA.map(m => m.data.kpis.prixMoyenHuileKg  || 0)
    const teList      = MONTH_DATA.map(m => (m.data.kpis.tauxExtraction    || 0) / 100)
    // Valeur de l'huile extraite par kg de régime acheté = prix_cpo × TE
    const valHuileKg  = MONTH_DATA.map((_, i) => +(prixCPO[i] * teList[i]).toFixed(1))
    // Marge brute par kg de régime = valeur huile − prix régime
    const margeKg     = MONTH_DATA.map((_, i) => +(valHuileKg[i] - prixRegimes[i]).toFixed(1))

    charts.current.prix = new Chart(refPrix.current, {
      type: 'line',
      data: {
        labels: shortLabels,
        datasets: [
          {
            label: 'Prix CPO vendu (F/kg)',
            data: prixCPO,
            borderColor: chartColors.gold,
            backgroundColor: 'rgba(242,140,40,0.08)',
            pointBackgroundColor: chartColors.gold,
            borderWidth: 2, pointRadius: 5, tension: 0.3, fill: false, yAxisID: 'y',
          },
          {
            label: 'Valeur huile / kg régime (F/kg)',
            data: valHuileKg,
            borderColor: chartColors.accent,
            backgroundColor: 'rgba(107,201,122,0.08)',
            pointBackgroundColor: chartColors.accent,
            borderWidth: 2, pointRadius: 5, tension: 0.3, fill: false,
            borderDash: [4, 3], yAxisID: 'y',
          },
          {
            label: 'Prix régimes achetés (F/kg)',
            data: prixRegimes,
            borderColor: 'rgba(224,92,92,1)',
            backgroundColor: 'rgba(224,92,92,0.08)',
            pointBackgroundColor: 'rgba(224,92,92,1)',
            borderWidth: 2, pointRadius: 5, tension: 0.3, fill: false, yAxisID: 'y',
          },
          {
            label: 'Marge brute / kg régime (F/kg)',
            data: margeKg,
            borderColor: chartColors.green,
            backgroundColor: 'rgba(63,163,77,0.15)',
            pointBackgroundColor: chartColors.green,
            borderWidth: 2, pointRadius: 4, tension: 0.3, fill: true, yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { font: { size: 11 }, boxWidth: 14 } },
          tooltip: { ...defaultTooltip, callbacks: { label: c => ` ${c.dataset.label}: ${c.raw.toLocaleString('fr-FR')} F/kg` } },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(242,140,40,0.06)' },
            ticks: { callback: v => v.toLocaleString('fr-FR') + ' F' },
          },
        },
      },
    })

    return () => Object.values(charts.current).forEach(c => c?.destroy())
  }, [currency, eurRate, moisData.length])

  return (
    <div>
      <div className="section-title">Vue Globale — Performance Annuelle</div>
      <div className="section-subtitle">{sectionSub}</div>

      {/* KPIs cumulés */}
      <div className="kpi-grid">
        <KPICard label={`CA Cumulé ${range}`}            value={fmt.kpiValue(global.caCumule, currency, eurRate)}             valueColor="gold"  sub={`${currency} · ${sum}`} />
        {MONTH_DATA.length >= 2 && (
          <KPICard label={`Évolution CA ${monthShort(MONTH_DATA.at(-1).data)}/${monthShort(MONTH_DATA.at(-2).data)}`}
                   value={(global.evolutionCA_MarFev > 0 ? '+' : '') + global.evolutionCA_MarFev.toFixed(1) + '%'}
                   valueColor="gold"
                   sub={`${fmt.currency(MONTH_DATA.at(-1).data.kpis.caTotalFCFA, currency, eurRate)} vs ${fmt.currency(MONTH_DATA.at(-2).data.kpis.caTotalFCFA, currency, eurRate)}`} />
        )}
        <KPICard label={`Résultat Cumulé ${range}`}      value={'+ ' + fmt.kpiValue(global.resultatCumule, currency, eurRate)} valueColor="green" sub={`${currency} · ${sum}`} accent="accent-green" />
        <KPICard label="Huile Produite Cumulée"          value={fmt.tonnes(global.huileProduiteTotal)}                valueColor="gold"  sub={MONTH_DATA.map(m => fmt.tonnes(m.data.kpis.huileProduiteT)).join(' + ')} />
        {MONTH_DATA.length >= 2 && (
          <KPICard label={`Évolution Production ${monthShort(MONTH_DATA.at(-1).data)}/${monthShort(MONTH_DATA.at(-2).data)}`}
                   value={(((MONTH_DATA.at(-1).data.kpis.huileProduiteT - MONTH_DATA.at(-2).data.kpis.huileProduiteT) / (MONTH_DATA.at(-2).data.kpis.huileProduiteT || 1)) * 100).toFixed(1) + '%'}
                   valueColor="gold"
                   sub={`${fmt.tonnes(MONTH_DATA.at(-1).data.kpis.huileProduiteT)} vs ${fmt.tonnes(MONTH_DATA.at(-2).data.kpis.huileProduiteT)}`} />
        )}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Évolution du CA</div>
          <div className="chart-subtitle">CA mensuel par produit {range} {year} ({currency})</div>
          <div className="chart-container" style={{ height: 300 }}>
            <canvas ref={refCA} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Évolution du Résultat</div>
          <div className="chart-subtitle">Résultat net mensuel {range} {year} ({currency})</div>
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
          <div className="chart-subtitle">{sum} {year} — hors matières premières</div>
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

      {/* Prix régimes vs CPO */}
      <div className="chart-card">
        <div className="chart-title">Évolution des Prix & Marge Matière</div>
        <div className="chart-subtitle">
          Prix d'achat régimes · Prix vente CPO · Valeur huile extraite / kg régime · Marge brute matière (F/kg)
        </div>
        <div className="chart-container" style={{ height: 300 }}>
          <canvas ref={refPrix} />
        </div>
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: 'var(--text-dim)' }}>
          Marge brute/kg = (Prix CPO × Taux extraction) − Prix régimes · Hors charges exploitation &amp; amortissement
        </div>
      </div>

      {/* Cartes résumé — une par mois enregistré */}
      <div className="global-compare-grid">
        {MONTH_DATA.map(({ key, data, accent, rgba }) => (
          <div key={key} className="month-summary-card" style={{ borderTop: `3px solid ${accent}` }}>
            <div className="month-summary-title">
              <span className="month-badge" style={{ background: `${rgba}0.2)`, color: accent, marginRight: 8 }}>
                {monthLabel(data)}
              </span>
              {data._etl.annee}
            </div>
            {[
              ["Chiffre d'Affaires",    fmt.currency(data.kpis.caTotalFCFA, currency, eurRate),                        'var(--gold)'],
              ['Coût Matière Première', fmt.currency(data.kpis.coutMPFCFA, currency, eurRate),                          'var(--red)'],
              ['Charges Exploitation',  fmt.currency(data.kpis.chargesExplFCFA, currency, eurRate),                     'var(--red)'],
              ['Résultat Net',          '+ ' + fmt.currency(data.kpis.resultatNetFCFA, currency, eurRate),              'var(--green)'],
              ['Marge Nette',           data.kpis.margeNette + '%',                                            'var(--green)'],
              ['Régimes Traités',       fmt.tonnes(data.kpis.regimesTraitesT),                                 null],
              ['Huile Produite',        fmt.tonnes(data.kpis.huileProduiteT),                                  null],
              ['Huile Vendue',          fmt.tonnes(data.kpis.huileVendueT),                                    null],
              ["Taux d'Extraction",     fmt.pct(data.kpis.tauxExtraction),                                     null],
            ].map(([label, val, color], i) => (
              <div className="compare-row" key={i}>
                <span className="compare-label">{label}</span>
                <span className="compare-val" style={color ? { color } : {}}>{val}</span>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => setActiveMonth(key)}
                style={{ background: `${rgba}0.15)`, border: `1px solid ${rgba}0.4)`, color: accent, padding: '8px 18px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: 1 }}
              >
                Voir détail {monthLabel(data)} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
