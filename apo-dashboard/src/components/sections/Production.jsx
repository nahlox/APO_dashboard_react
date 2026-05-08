import { useEffect, useRef } from 'react'
import {
  Chart, BarElement, BarController, LineElement, LineController,
  PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js'
import KPICard from '../kpi/KPICard'
import { fmt, chartColors, defaultTooltip } from '../../lib/kpiEngine'
import { monthFull, monthLabel, monthEndDate } from '../../lib/monthUtils'

Chart.register(BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

export default function Production({ data, month }) {
  const kpis       = data?.kpis       ?? {}
  const production = data?.production ?? {}

  const dailyLabels   = production.grainesDailyLabels ?? []
  const dailyKg       = production.grainesDailyKg     ?? []
  const teDailyLabels = production.teDailyLabels      ?? []
  const teDailyVals   = production.teDailyVals        ?? []
  const comparLabels  = production.comparAnnuelLabels  ?? []
  const comparAnnuel  = production.comparAnnuel        ?? []

  const endDate   = monthEndDate(data)
  const detailSub = kpis.nbCamions ? `${kpis.nbCamions} camions` : `${kpis.nbFournisseurs ?? 0} fournisseurs`

  const te         = kpis.tauxExtraction ?? 0
  const gapTo22    = Math.max(0, 22 - te)
  const gainTonnes = (kpis.regimesTraitesT ?? 0) * (gapTo22 / 100)
  const teColor    = te >= 22 ? 'var(--green)' : te >= 18 ? 'var(--gold)' : 'var(--red)'
  const teBadge    = te >= 22 ? { cls: 'badge-up',     txt: 'Objectif atteint ✓' }
                   : te >= 18 ? { cls: 'badge-neutral', txt: 'Dans la norme' }
                   :            { cls: 'badge-down',    txt: 'Sous le minimum' }

  const refDaily  = useRef(null)
  const refTE     = useRef(null)
  const refCompar = useRef(null)
  const charts    = useRef({})

  useEffect(() => {
    Object.values(charts.current).forEach(c => { try { c?.destroy() } catch (_) {} })
    charts.current = {}

    // ── Réception journalière ──────────────────────────────────────────────
    charts.current.daily = new Chart(refDaily.current, {
      type: 'bar',
      data: {
        labels: dailyLabels,
        datasets: [{
          label: 'Régimes reçus (kg)',
          data: dailyKg,
          backgroundColor: dailyKg.map(v =>
            v > 700000 ? chartColors.gold : v > 0 ? 'rgba(242,140,40,0.5)' : 'rgba(242,140,40,0.15)'
          ),
          borderRadius: 3,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...defaultTooltip, callbacks: { label: c => `${fmt.full(c.raw)} kg` } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: 'rgba(242,140,40,0.06)' }, ticks: { callback: v => (v / 1000).toFixed(0) + 'T' } },
        },
      },
    })

    // ── Taux d'extraction journalier ──────────────────────────────────────
    const teRaw     = teDailyVals.map(v => parseFloat(v) || 0)
    const teValides = teRaw.filter(v => v > 0).sort((a, b) => a - b)
    const p95       = teValides.length ? teValides[Math.floor(teValides.length * 0.95)] : 25
    const teYMin    = teValides.length > 0 ? Math.max(0, Math.floor(Math.min(...teValides) - 1)) : 0
    const teYMax    = teValides.length > 0 ? Math.ceil(Math.max(p95, 23) + 1) : 30
    const teAff     = teRaw.map(v => v > teYMax ? teYMax : v)
    const outlierIdx = new Set(teRaw.map((v, i) => v > teYMax ? i : -1).filter(i => i >= 0))

    charts.current.te = new Chart(refTE.current, {
      type: 'line',
      data: {
        labels: teDailyLabels,
        datasets: [
          {
            label: 'TE%', data: teAff,
            borderColor: chartColors.gold, backgroundColor: 'rgba(242,140,40,0.08)',
            fill: true, tension: 0.3,
            pointBackgroundColor: teRaw.map((v, i) =>
              outlierIdx.has(i) ? 'rgba(224,92,92,0.9)'
              : v >= 19.5 ? chartColors.green
              : v >= 18   ? chartColors.gold
              : chartColors.red
            ),
            pointRadius: teRaw.map((v, i) => outlierIdx.has(i) ? 6 : 4),
            pointStyle:  teRaw.map((v, i) => outlierIdx.has(i) ? 'triangle' : 'circle'),
          },
          { label: 'Min 18%',   data: Array(teDailyLabels.length).fill(18), borderColor: 'rgba(224,92,92,0.5)',  borderDash: [4, 4], pointRadius: 0, fill: false },
          { label: 'Cible 22%', data: Array(teDailyLabels.length).fill(22), borderColor: 'rgba(63,163,77,0.4)',  borderDash: [4, 4], pointRadius: 0, fill: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { font: { size: 12 } } },
          tooltip: { ...defaultTooltip, callbacks: { label: c => {
            const real = teRaw[c.dataIndex] ?? 0
            return `TE : ${real.toFixed(2)}%${outlierIdx.has(c.dataIndex) ? ' ⚠ hors plage' : ''}`
          }}},
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9 } } },
          y: { min: teYMin, max: teYMax, grid: { color: 'rgba(242,140,40,0.06)' }, ticks: { callback: v => v + '%' } },
        },
      },
    })

    // ── Comparaison annuelle ───────────────────────────────────────────────
    const bgColors = ['rgba(138,154,142,0.4)', 'rgba(242,140,40,0.5)', 'rgba(63,163,77,0.5)', chartColors.gold]
    charts.current.compar = new Chart(refCompar.current, {
      type: 'bar',
      data: {
        labels: comparLabels,
        datasets: comparAnnuel.map((entry, i) => ({
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
          y: { grid: { color: 'rgba(242,140,40,0.06)' }, ticks: { callback: v => v + 'T' } },
        },
      },
    })

    return () => {
      Object.values(charts.current).forEach(c => { try { c?.destroy() } catch (_) {} })
      charts.current = {}
    }
  }, [month])

  return (
    <section>
      <div className="section-title">Production & Approvisionnement</div>
      <div className="section-subtitle">Collecte de régimes FFB et indicateurs de production — {monthFull(data)}</div>

      <div className="kpi-grid">
        <KPICard label="Régimes Reçus (FFB)"   value={fmt.tonnes(kpis.regimesRecusT   ?? 0)} valueColor="gold"  sub={`kg achetés · ${detailSub}`} />
        <KPICard label="Régimes Traités"        value={fmt.tonnes(kpis.regimesTraitesT ?? 0)} valueColor="green" sub="kg effectivement traités · base coût MP" accent="accent-green" />
        <KPICard label="Stock Régimes Fin Mois" value={fmt.tonnes(kpis.stockFinMoisT   ?? 0)} sub={`kg en stock au ${endDate} · reportés mois suiv.`} />
        <KPICard label="Huile Brute Produite"   value={fmt.tonnes(kpis.huileProduiteT  ?? 0)} valueColor="green" sub={`kg produits · ${fmt.tonnes(kpis.huileVendueT ?? 0)} livrés`} accent="accent-green" />
        <KPICard label="Taux d'Extraction Réel" value={fmt.pct(te)}                           valueColor="green" sub="Huile produite ÷ Régimes traités" accent="accent-green" />
      </div>

      {/* Indicateurs TE */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title">Indicateur : Taux d'Extraction (TE)</div>
        <div className="chart-subtitle">Calculé sur régimes traités</div>
        <div className="gauge-row" style={{ marginTop: 16 }}>
          <div className="gauge-item">
            <div className="gauge-label">TE APO {monthLabel(data)}</div>
            <div className="gauge-value" style={{ color: teColor }}>{fmt.pct(te)}</div>
            <div className="gauge-unit">huile / régimes traités</div>
            <span className={`kpi-badge ${teBadge.cls}`} style={{ marginTop: 8 }}>{teBadge.txt}</span>
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
            {te >= 22 ? (
              <>
                <div className="gauge-label">Objectif 22% atteint</div>
                <div className="gauge-value" style={{ color: 'var(--green)' }}>✓ 22%+</div>
                <div className="gauge-unit">aucun gain à chercher</div>
                <span className="kpi-badge badge-up" style={{ marginTop: 8 }}>Performance optimale</span>
              </>
            ) : (
              <>
                <div className="gauge-label">Gain Potentiel (+{gapTo22.toFixed(1)}% vers 22%)</div>
                <div className="gauge-value" style={{ color: 'var(--accent)' }}>{fmt.tonnes(gainTonnes)}</div>
                <div className="gauge-unit">huile supplémentaire possible</div>
                <span className="kpi-badge badge-up" style={{ marginTop: 8 }}>≈ revenus additionnels</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Charts — toujours affichés, vides si pas de données journalières */}
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
          <div className="chart-subtitle">Données historiques {monthLabel(data)}</div>
          <div className="chart-container" style={{ height: 260 }}>
            <canvas ref={refCompar} />
          </div>
        </div>
      </div>
    </section>
  )
}
