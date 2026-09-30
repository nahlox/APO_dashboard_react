import { describe, it, expect } from 'vitest'
import { filterMonthsByRange } from '../aggregateData'

const m = (annee, mois) => ({ key: `${mois}-${annee}`, data: { _etl: { annee, mois } } })
const ALL = [m(2025, 'Novembre'), m(2025, 'Décembre'), m(2026, 'Janvier'), m(2026, 'Février'), m(2026, 'Mars')]
const keys = (arr) => arr.map(x => x.key)

describe('filterMonthsByRange', () => {
  it('sans filtre → tout', () => {
    expect(filterMonthsByRange(ALL, { year: null, from: null, to: null })).toBe(ALL)
  })
  it('filtre sur l’année seule', () => {
    expect(keys(filterMonthsByRange(ALL, { year: 2025, from: null, to: null })))
      .toEqual(['Novembre-2025', 'Décembre-2025'])
  })
  it('année + plage de mois', () => {
    expect(keys(filterMonthsByRange(ALL, { year: 2026, from: 2, to: 3 })))
      .toEqual(['Février-2026', 'Mars-2026'])
  })
  it('ancien format sans année (état existant) reste compatible', () => {
    expect(keys(filterMonthsByRange(ALL, { from: 1, to: 1 }))).toEqual(['Janvier-2026'])
  })
})
