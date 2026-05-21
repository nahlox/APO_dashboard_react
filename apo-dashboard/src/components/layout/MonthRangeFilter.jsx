import { useDashboardStore } from '../../store/dashboardStore'

const MOIS_LIST = [
  { num: 1,  label: 'Janvier' },   { num: 2,  label: 'Février' },
  { num: 3,  label: 'Mars' },      { num: 4,  label: 'Avril' },
  { num: 5,  label: 'Mai' },       { num: 6,  label: 'Juin' },
  { num: 7,  label: 'Juillet' },   { num: 8,  label: 'Août' },
  { num: 9,  label: 'Septembre' }, { num: 10, label: 'Octobre' },
  { num: 11, label: 'Novembre' },  { num: 12, label: 'Décembre' },
]

function moisNum(libelle) {
  return MOIS_LIST.findIndex(m => m.label.toLowerCase() === (libelle || '').toLowerCase()) + 1
}

export default function MonthRangeFilter({ allMois = [] }) {
  const { monthRange, setMonthRange, resetMonthRange } = useDashboardStore()

  // Mois disponibles (depuis les données)
  const moisDispo = allMois
    .map(m => moisNum(m.data?._etl?.mois))
    .filter(n => n > 0)
    .sort((a, b) => a - b)

  if (moisDispo.length === 0) return null

  const minDispo = moisDispo[0]
  const maxDispo = moisDispo[moisDispo.length - 1]
  const from = monthRange.from ?? minDispo
  const to   = monthRange.to   ?? maxDispo

  const handleFrom = (e) => {
    const v = parseInt(e.target.value, 10)
    setMonthRange(v, Math.max(v, to))
  }
  const handleTo = (e) => {
    const v = parseInt(e.target.value, 10)
    setMonthRange(Math.min(from, v), v)
  }

  const isFullRange = from === minDispo && to === maxDispo
  const nbMois = to - from + 1

  return (
    <div className="month-range-filter">
      <div className="mrf-label">Période</div>
      <div className="mrf-controls">
        <select className="mrf-select" value={from} onChange={handleFrom}>
          {moisDispo.map(n => (
            <option key={n} value={n}>{MOIS_LIST[n - 1].label}</option>
          ))}
        </select>
        <span className="mrf-arrow">→</span>
        <select className="mrf-select" value={to} onChange={handleTo}>
          {moisDispo.map(n => (
            <option key={n} value={n}>{MOIS_LIST[n - 1].label}</option>
          ))}
        </select>
        {!isFullRange && (
          <button className="mrf-reset" onClick={resetMonthRange} title="Réinitialiser">
            ✕
          </button>
        )}
      </div>
      <div className="mrf-summary">
        {nbMois} mois
      </div>
    </div>
  )
}
