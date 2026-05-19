import { useEffect, useRef } from 'react'
import { Chart, BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { fmt, chartColors, defaultTooltip } from '../../lib/kpiEngine'
import { useDashboardStore } from '../../store/dashboardStore'
import { monthFull } from '../../lib/monthUtils'

Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend)

// ── CHARGES ──────────────────────────────────────────────────
export function Charges({ data, month }) {
  const { currency, eurRate } = useDashboardStore()
  const { charges, kpis } = data
  const refWaterfall = useRef(null)
  const chartRef     = useRef(null)

  const isCategorized = charges.topDepenses.length > 0 && charges.topDepenses[0].date === ''
  const total = charges.topDepenses.reduce((s, r) => s + r.mt, 0)

  useEffect(() => {
    chartRef.current?.destroy()
    if (!refWaterfall.current || !isCategorized) return

    const ca      = kpis.caTotalFCFA       || 0
    const coutMP  = kpis.coutMPFCFA        || 0
    const amort   = kpis.amortissementFCFA || 0
    const taxes   = kpis.totalTaxesFCFA    || 0
    const resultat= kpis.resultatNetFCFA   || 0

    // Build waterfall steps: CA → -coutMP → -each charge cat → -amort → -taxes → Résultat
    const steps = [
      { label: "CA",              value:  ca,      color: chartColors.green },
      { label: "Coût MP",         value: -coutMP,  color: 'rgba(224,92,92,0.85)' },
      ...charges.topDepenses.map(r => ({ label: r.lib.replace("Fournitures de l'usine et des bureaux", "Fournitures").replace("Autres services extérieurs", "Autres serv. ext.").replace("Services extérieurs", "Services ext."), value: -r.mt, color: 'rgba(224,92,92,0.75)' })),
      ...(amort  > 0 ? [{ label: "Amort. & frais fin.", value: -amort,  color: 'rgba(224,92,92,0.65)' }] : []),
      ...(taxes  > 0 ? [{ label: "Impôts & taxes",      value: -taxes,  color: 'rgba(224,92,92,0.65)' }] : []),
      { label: "Résultat Net",    value:  resultat, color: resultat >= 0 ? chartColors.green : 'rgba(224,92,92,0.9)' },
    ]

    // Floating bar: [base, base+value] for each step
    let running = 0
    const bases  = []
    const values = []
    const colors = []
    for (const s of steps) {
      if (s.label === "CA" || s.label === "Résultat Net") {
        bases.push(0)
        values.push(Math.abs(s.value))
      } else {
        const top = running + s.value
        bases.push(Math.min(running, top))
        values.push(Math.abs(s.value))
      }
      colors.push(s.color)
      if (s.label !== "Résultat Net") running += s.value
    }

    const div = currency === 'EUR' ? eurRate : 1e6

    chartRef.current = new Chart(refWaterfall.current, {
      type: 'bar',
      data: {
        labels: steps.map(s => s.label),
        datasets: [
          {
            // invisible base
            data: bases.map(b => b / div),
            backgroundColor: 'transparent',
            borderWidth: 0,
            stack: 'waterfall',
          },
          {
            // visible bar
            data: values.map(v => v / div),
            backgroundColor: colors,
            borderRadius: 3,
            stack: 'waterfall',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...defaultTooltip,
            callbacks: {
              label: (ctx) => {
                if (ctx.datasetIndex === 0) return null
                const step = steps[ctx.dataIndex]
                const sign = step.value < 0 ? '− ' : '+ '
                return sign + fmt.money(Math.abs(step.value), currency, eurRate)
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false }, stacked: true, ticks: { font: { size: 10 }, maxRotation: 30 } },
          y: {
            stacked: true,
            grid: { color: 'rgba(242,140,40,0.06)' },
            ticks: {
              callback: v => {
                if (currency === 'EUR') return Math.round(v / 1e3).toLocaleString('fr-FR') + ' K€'
                return v.toLocaleString('fr-FR') + ' M'
              },
            },
          },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [month, currency, eurRate, isCategorized])

  return (
    <section>
      <div className="section-title">Charges & Coûts</div>
      <div className="section-subtitle">Dépenses opérationnelles — {monthFull(data)}</div>

      {isCategorized && (
        <div className="chart-card">
          <div className="chart-title">Du CA au Résultat Net</div>
          <div className="chart-subtitle">Décomposition des coûts — de la recette brute au bénéfice ({currency})</div>
          <div className="chart-container" style={{ height: 300 }}>
            <canvas ref={refWaterfall} />
          </div>
        </div>
      )}

      <div className="chart-card">
        <div className="chart-title">{isCategorized ? 'Répartition par Catégorie' : 'Top Dépenses du Mois'}</div>
        <div className="chart-subtitle">
          {isCategorized
            ? "Charges d'exploitation classées par catégorie (hors achats graines)"
            : 'Classées par montant décroissant (hors achats graines)'}
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{isCategorized ? 'Catégorie' : 'Libellé'}</th>
              {!isCategorized && <th>Date</th>}
              {isCategorized && <th style={{ textAlign: 'right' }}>Part</th>}
              <th style={{ textAlign: 'right' }}>Montant {currency}</th>
            </tr>
          </thead>
          <tbody>
            {charges.topDepenses.map((r, i) => (
              <tr key={i}>
                <td className="rank">{i + 1}</td>
                <td>{r.lib}</td>
                {!isCategorized && (
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-dim)' }}>{r.date}</td>
                )}
                {isCategorized && (
                  <td className="num" style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                    {total > 0 ? (r.mt / total * 100).toFixed(1) + '%' : '—'}
                  </td>
                )}
                <td className="num" style={{ color: 'var(--red)' }}>– {fmt.currency(r.mt, currency, eurRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ── FOURNISSEURS ──────────────────────────────────────────────
export function Fournisseurs({ data, month }) {
  const { currency, eurRate } = useDashboardStore()
  const { fournisseurs } = data
  return (
    <section>
      <div className="section-title">Fournisseurs</div>
      <div className="section-subtitle">Classement et volumes d'achat — {monthFull(data)}</div>
      <div className="chart-card">
        <div className="chart-title">Top Fournisseurs par Volume</div>
        <div className="chart-subtitle">Poids (kg), prix unitaire et montant total payé</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fournisseur</th>
              <th style={{ textAlign: 'right' }}>Poids (kg)</th>
              <th style={{ textAlign: 'right' }}>Prix F/kg</th>
              <th style={{ textAlign: 'right' }}>Montant {currency}</th>
              <th>Part</th>
            </tr>
          </thead>
          <tbody>
            {fournisseurs.liste.map((f, i) => {
              const pct = (f.poids / fournisseurs.totalPoidsKg * 100).toFixed(1)
              return (
                <tr key={i}>
                  <td className="rank">{i + 1}</td>
                  <td>{f.name}</td>
                  <td className="num">{fmt.full(f.poids)}</td>
                  <td className="num">{f.prix} F/kg</td>
                  <td className="num" style={{ color: 'var(--gold)' }}>{fmt.currency(f.montant, currency, eurRate)}</td>
                  <td>
                    <div className="mini-bar-wrap" style={{ minWidth: 120 }}>
                      <div className="mini-bar">
                        <div className="mini-bar-fill" style={{ width: pct + '%' }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", width: 40 }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ── PÉPINIÈRE ─────────────────────────────────────────────────
export function Pepiniere({ data, month }) {
  const { currency, eurRate } = useDashboardStore()
  const { kpis, pepiniere } = data
  if (!pepiniere) return null

  return (
    <section>
      <div className="section-title">Pépinière</div>
      <div className="section-subtitle">Suivi des ventes de plants et encaissements — {monthFull(data)}</div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Contrats Totaux</div>
          <div className="kpi-value gold">{fmt.kpiValue(kpis.pepContratsFCFA, currency, eurRate)}</div>
          <div className="kpi-sub">{currency} · {pepiniere.clients.length} clients</div>
        </div>
        <div className="kpi-card accent-green">
          <div className="kpi-label">Encaissé</div>
          <div className="kpi-value green">{fmt.kpiValue(kpis.pepEncaisséFCFA, currency, eurRate)}</div>
          <div className="kpi-sub">{currency} · {(kpis.pepEncaisséFCFA / kpis.pepContratsFCFA * 100).toFixed(0)}% collecté</div>
        </div>
        <div className="kpi-card accent-red">
          <div className="kpi-label">Reste à Percevoir</div>
          <div className="kpi-value red">{fmt.kpiValue(kpis.pepResteaFCFA, currency, eurRate)}</div>
          <div className="kpi-sub">{currency} · créances à recouvrer</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Détail Clients Pépinière</div>
        <div className="chart-subtitle">Statut de règlement par client</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nom Client</th>
              <th>Localité</th>
              <th style={{ textAlign: 'right' }}>Ha</th>
              <th style={{ textAlign: 'right' }}>Total {currency}</th>
              <th style={{ textAlign: 'right' }}>Encaissé</th>
              <th style={{ textAlign: 'right' }}>Reste</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {pepiniere.clients.map((r) => {
              const reste = r.total - r.enc
              return (
                <tr key={r.no}>
                  <td className="rank">{r.no}</td>
                  <td>{r.nom}</td>
                  <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{r.loc}</td>
                  <td className="num">{r.ha} ha</td>
                  <td className="num">{fmt.currency(r.total, currency, eurRate)}</td>
                  <td className="num" style={{ color: 'var(--green)' }}>{fmt.currency(r.enc, currency, eurRate)}</td>
                  <td className="num" style={{ color: reste > 0 ? 'var(--red)' : 'var(--text-dim)' }}>
                    {reste > 0 ? '–' + fmt.currency(reste, currency, eurRate) : '0'}
                  </td>
                  <td>
                    <span className={`kpi-badge ${reste === 0 ? 'badge-up' : 'badge-down'}`}>
                      {reste === 0 ? 'Soldé' : 'Solde dû'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
