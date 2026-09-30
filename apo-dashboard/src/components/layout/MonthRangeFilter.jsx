import { usePeriode, MOIS_LABELS } from '../../hooks/usePeriode'

export default function MonthRangeFilter({ allMois = [] }) {
  const { annees, year, moisDispo, from, to, nbMois, isDefault,
          handleYear, handleFrom, handleTo, reset } = usePeriode(allMois)

  if (moisDispo.length === 0 && annees.length === 0) return null

  return (
    <div className="month-range-filter">
      <div className="mrf-label">Période</div>
      <div className="mrf-controls">
        {annees.length > 0 && (
          <select className="mrf-select" value={year ?? ''} onChange={handleYear} aria-label="Année">
            <option value="">Toutes années</option>
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        <select className="mrf-select" value={from} onChange={handleFrom} aria-label="Mois de début">
          {moisDispo.map(n => (
            <option key={n} value={n}>{MOIS_LABELS[n - 1]}</option>
          ))}
        </select>
        <span className="mrf-arrow">→</span>
        <select className="mrf-select" value={to} onChange={handleTo} aria-label="Mois de fin">
          {moisDispo.map(n => (
            <option key={n} value={n}>{MOIS_LABELS[n - 1]}</option>
          ))}
        </select>
        {!isDefault && (
          <button className="mrf-reset" onClick={reset} title="Réinitialiser">
            ✕
          </button>
        )}
      </div>
      <div className="mrf-summary">
        {nbMois} mois{year ? ` · ${year}` : ''}
      </div>
    </div>
  )
}
