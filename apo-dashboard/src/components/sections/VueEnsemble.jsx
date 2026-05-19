import { useEffect, useRef } from 'react'
import { Chart, ArcElement, DoughnutController, PieController, BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js'
import KPICard from '../kpi/KPICard'
import AlertBox from '../kpi/AlertBox'
import PnLTable from '../pnl/PnLTable'
import { fmt, chartColors, defaultTooltip } from '../../lib/kpiEngine'
import { useDashboardStore } from '../../store/dashboardStore'
import { MONTH_DATA as MONTH_DATA_STATIC } from '../../data/index'
import { monthFull } from '../../lib/monthUtils'

Chart.register(ArcElement, DoughnutController, PieController, BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

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

function buildMonthCharges(monthKey, MONTH_DATA) {
  const entry = MONTH_DATA.find(m => m.key === monthKey)
  if (!entry) return { labels: [], values: [] }
  const labels = entry.data.charts.charges.labels
  const values = entry.data.charts.charges.values
  return { labels, values }
}

// Noms courts pour l'axe X
const MOIS_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const MOIS_ORDER  = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

export default function VueEnsemble({ data, month }) {
  const { currency, eurRate, moisData } = useDashboardStore()
  const { kpis, pnl, alertes, charts } = data

  const allMois = [...MONTH_DATA_STATIC, ...moisData]
  const combinedCharges = buildMonthCharges(month, allMois)
  const chargesSubtitle = `${monthFull(data)} — hors matières premières`

  const refCA      = useRef(null)
  const refMarge   = useRef(null)
  const chartCA    = useRef(null)
  const chartMarge = useRef(null)

  useEffect(() => {
    if (chartCA.current)    { chartCA.current.destroy();    chartCA.current = null }
    if (chartMarge.current) { chartMarge.current.destroy(); chartMarge.current = null }

    const cur = currency

    // ── Doughnut CA Mix ────────────────────────────────────────────────────
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

    // ── Évolution mensuelle marge ──────────────────────────────────────────
    // Construire la série sur tous les mois chargés, triés chronologiquement
    const moisSorted = [...moisData].sort((a, b) => MOIS_ORDER.indexOf(a.key) - MOIS_ORDER.indexOf(b.key))
    if (moisSorted.length > 0 && refMarge.current) {
      const labels        = moisSorted.map(m => MOIS_LABELS[MOIS_ORDER.indexOf(m.key)])
      const margeNettePct = moisSorted.map(m => m.data.kpis.margeNette ?? 0)
      const margeBrute    = moisSorted.map(m => {
        const k = m.data.kpis
        const mb = (k.caTotalFCFA - k.coutMPFCFA)
        return cur === 'EUR' ? +(mb / eurRate).toFixed(0) : mb
      })
      const resultatNet   = moisSorted.map(m => {
        const r = m.data.kpis.resultatNetFCFA
        return cur === 'EUR' ? +(r / eurRate).toFixed(0) : r
      })
      const prixHuile     = moisSorted.map(m => m.data.kpis.prixMoyenHuileKg ?? 0)
      const prixRegime    = moisSorted.map(m => m.data.kpis.prixMoyenRegimeKg ?? 0)

      chartMarge.current = new Chart(refMarge.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Marge brute (CA − MP)',
              data: margeBrute,
              backgroundColor: 'rgba(242,140,40,0.35)',
              borderColor: 'rgba(242,140,40,0.8)',
              borderWidth: 1, borderRadius: 4,
              yAxisID: 'yMontant', order: 3,
            },
            {
              label: 'Résultat net',
              data: resultatNet,
              backgroundColor: resultatNet.map(v => v >= 0 ? 'rgba(63,163,77,0.55)' : 'rgba(224,92,92,0.55)'),
              borderColor:     resultatNet.map(v => v >= 0 ? 'rgba(63,163,77,0.9)'  : 'rgba(224,92,92,0.9)'),
              borderWidth: 1, borderRadius: 4,
              yAxisID: 'yMontant', order: 2,
            },
            {
              type: 'line',
              label: 'Marge nette %',
              data: margeNettePct,
              borderColor: 'rgba(255,255,255,0.55)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderDash: [4, 3], tension: 0.35, fill: false,
              pointBackgroundColor: margeNettePct.map(v => v >= 20 ? chartColors.green : v >= 10 ? chartColors.gold : 'rgba(224,92,92,0.9)'),
              pointRadius: 5, pointStyle: 'circle',
              yAxisID: 'yPct', order: 1,
            },
            {
              type: 'line',
              label: 'Prix huile (F/kg)',
              data: prixHuile,
              borderColor: chartColors.gold,
              borderWidth: 1.5, tension: 0.3, fill: false,
              pointRadius: 3, pointStyle: 'rect',
              yAxisID: 'yPrix', order: 0,
            },
            {
              type: 'line',
              label: 'Prix régimes (F/kg)',
              data: prixRegime,
              borderColor: 'rgba(138,154,142,0.7)',
              borderWidth: 1.5, tension: 0.3, fill: false,
              pointRadius: 3, pointStyle: 'rect',
              yAxisID: 'yPrix', order: 0,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { labels: { font: { size: 10 }, padding: 10, color: '#b0b8b4' } },
            tooltip: {
              ...defaultTooltip,
              callbacks: {
                label: c => {
                  if (c.datasetIndex === 2) return ` Marge nette : ${c.raw.toFixed(1)}%`
                  if (c.datasetIndex === 3) return ` Prix huile : ${c.raw.toFixed(0)} F/kg`
                  if (c.datasetIndex === 4) return ` Prix régimes : ${c.raw.toFixed(2)} F/kg`
                  const fcfa = cur === 'EUR' ? c.raw * eurRate : c.raw
                  return ` ${c.dataset.label} : ${fmt.currency(fcfa, cur, eurRate)}`
                },
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            yMontant: {
              position: 'left',
              grid: { color: 'rgba(242,140,40,0.06)' },
              ticks: { callback: v => cur === 'EUR' ? (v / 1000).toFixed(0) + ' k€' : (v / 1_000_000).toFixed(0) + ' M' },
            },
            yPct: {
              position: 'right',
              grid: { display: false },
              ticks: { callback: v => v + '%', color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
            },
            yPrix: {
              display: false,   // prix sur axe caché — visible uniquement en tooltip
            },
          },
        },
      })
    }

    return () => {
      chartCA.current?.destroy()
      chartMarge.current?.destroy()
    }
  }, [month, currency, moisData])

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
          <div className="chart-title">Évolution Mensuelle de la Marge</div>
          <div className="chart-subtitle">Marge brute, résultat net et marge % — tous les mois chargés</div>
          <div className="chart-container" style={{ height: 260 }}>
            <canvas ref={refMarge} />
          </div>
        </div>
      </div>

      {/* Explication coefficients */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title" style={{ marginBottom: 10 }}>Comprendre les coefficients de marge</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {[
            { coeff: 'Marge brute', formule: 'CA total − Coût Matière Première', desc: "Combien il reste après avoir payé les graines (régimes FFB). C'est la valeur ajoutée de l'extraction.", color: 'rgba(242,140,40,0.7)' },
            { coeff: 'Résultat net', formule: 'Marge brute − Charges − Amortissements', desc: "Ce qu'il reste réellement après toutes les dépenses : salaires, carburant, maintenance, banque.", color: 'rgba(63,163,77,0.7)' },
            { coeff: 'Marge nette %', formule: 'Résultat net ÷ CA total × 100', desc: 'Indicateur de rentabilité global. > 20% = excellent · 10–20% = correct · < 10% = vigilance.', color: 'rgba(255,255,255,0.5)' },
            { coeff: 'Coeff. graines/huile', formule: 'Prix huile F/kg ÷ Prix régimes F/kg', desc: "Mesure combien de fois le prix de vente de l'huile couvre le coût d'achat des graines. Doit rester > 7× pour être rentable.", color: chartColors.gold },
          ].map(({ coeff, formule, desc, color }) => (
            <div key={coeff} style={{ borderLeft: `3px solid ${color}`, paddingLeft: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#e8d5a0', marginBottom: 2 }}>{coeff}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8a9a84', marginBottom: 4 }}>{formule}</div>
              <div style={{ fontSize: 11, color: '#b0b8b4', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
        {/* Coefficient graines/huile du mois courant */}
        {kpis.prixMoyenHuileKg > 0 && kpis.prixMoyenRegimeKg > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ color: 'var(--text-dim)' }}>Ce mois :</span>
            <span>Prix huile <strong style={{ color: chartColors.gold }}>{kpis.prixMoyenHuileKg.toFixed(0)} F/kg</strong></span>
            <span>Prix régimes <strong style={{ color: '#8a9a84' }}>{kpis.prixMoyenRegimeKg.toFixed(2)} F/kg</strong></span>
            <span>Coeff. <strong style={{ color: (kpis.prixMoyenHuileKg / kpis.prixMoyenRegimeKg) >= 7 ? 'var(--green)' : 'var(--gold)' }}>
              ×{(kpis.prixMoyenHuileKg / kpis.prixMoyenRegimeKg).toFixed(1)}
            </strong></span>
            <span>Marge nette <strong style={{ color: kpis.margeNette >= 20 ? 'var(--green)' : kpis.margeNette >= 10 ? 'var(--gold)' : 'var(--red)' }}>
              {kpis.margeNette}%
            </strong></span>
          </div>
        )}
      </div>

      {/* P&L */}
      <PnLTable pnl={pnl} data={data} />

      {/* Alertes — en bas */}
      <div style={{ marginTop: 24 }}>
        <div className="chart-title" style={{ marginBottom: 12 }}>Alertes & Points d'Attention</div>
        {alertes.map((a, i) => <AlertBox key={i} {...a} />)}
      </div>
    </section>
  )
}
