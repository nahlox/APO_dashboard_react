import { useDashboardStore } from '../store/dashboardStore'
import { moisIndex } from '../lib/aggregateData'

export const MOIS_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

/**
 * Filtre « Période » (année + mois de début/fin) partagé par l'en-tête desktop
 * et la barre compacte mobile. Les mois proposés sont ceux disponibles dans
 * l'année choisie (ou toutes années confondues quand aucune n'est choisie).
 */
export function usePeriode(allMois = []) {
  const { monthRange, setMonthRange, setYear, resetMonthRange } = useDashboardStore()

  const annees = [...new Set(allMois.map(m => m.data?._etl?.annee).filter(Boolean))].sort((a, b) => a - b)
  const year = monthRange.year ?? null

  const moisDispo = [...new Set(allMois
    .filter(m => year == null || m.data?._etl?.annee === year)
    .map(m => moisIndex(m.data?._etl?.mois))
    .filter(n => n > 0))].sort((a, b) => a - b)

  const minDispo = moisDispo[0]
  const maxDispo = moisDispo[moisDispo.length - 1]
  const from = monthRange.from ?? minDispo
  const to   = monthRange.to   ?? maxDispo

  return {
    annees, year, moisDispo, from, to,
    nbMois: (from && to) ? moisDispo.filter(n => n >= from && n <= to).length : 0,
    isDefault: year == null && monthRange.from == null && monthRange.to == null,
    handleYear: (e) => setYear(e.target.value === '' ? null : parseInt(e.target.value, 10)),
    handleFrom: (e) => { const v = parseInt(e.target.value, 10); setMonthRange(v, Math.max(v, to)) },
    handleTo:   (e) => { const v = parseInt(e.target.value, 10); setMonthRange(Math.min(from, v), v) },
    reset: resetMonthRange,
  }
}
