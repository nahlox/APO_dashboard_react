import { describe, it, expect } from 'vitest'
import { calcHeures, heuresSup, bornesMois, totauxParEmploye, fmtHeures, toMinutes } from '../calc'

describe('calcHeures', () => {
  it('journée normale avec pause', () => {
    expect(calcHeures({ statut: 'present', heure_arrivee: '07:00', heure_depart: '16:00', pause_minutes: 60 })).toBe(8)
  })
  it('poste de nuit (départ le lendemain)', () => {
    expect(calcHeures({ statut: 'present', heure_arrivee: '22:00:00', heure_depart: '06:30:00', pause_minutes: 30 })).toBe(8)
  })
  it('absent ou horaires manquants → 0', () => {
    expect(calcHeures({ statut: 'absent', heure_arrivee: '07:00', heure_depart: '16:00' })).toBe(0)
    expect(calcHeures({ statut: 'present', heure_arrivee: '07:00', heure_depart: null })).toBe(0)
  })
  it('pause plus longue que la présence → 0', () => {
    expect(calcHeures({ statut: 'present', heure_arrivee: '07:00', heure_depart: '07:30', pause_minutes: 60 })).toBe(0)
  })
})

describe('helpers', () => {
  it('toMinutes rejette les heures invalides', () => {
    expect(toMinutes('25:00')).toBeNull()
    expect(toMinutes('08:15')).toBe(495)
  })
  it('heuresSup au-delà de 8 h', () => {
    expect(heuresSup(10.5)).toBe(2.5)
    expect(heuresSup(6)).toBe(0)
  })
  it('bornesMois gère février bissextile', () => {
    expect(bornesMois('2028-02')).toMatchObject({ debut: '2028-02-01', fin: '2028-02-29', nbJours: 29 })
    expect(bornesMois('2026-09').nbJours).toBe(30)
  })
  it('fmtHeures', () => {
    expect(fmtHeures(7.5)).toBe('7h30')
    expect(fmtHeures(8)).toBe('8h')
    expect(fmtHeures(0)).toBe('—')
  })
})

describe('totauxParEmploye', () => {
  it('agrège jours, heures, heures sup, absences et congés', () => {
    const t = totauxParEmploye([
      { employe_id: 1, date_jour: '2026-09-01', statut: 'present', heures_travaillees: 10 },
      { employe_id: 1, date_jour: '2026-09-02', statut: 'present', heures_travaillees: 8 },
      { employe_id: 1, date_jour: '2026-09-03', statut: 'absent',  heures_travaillees: 0 },
      { employe_id: 1, date_jour: '2026-09-04', statut: 'maladie', heures_travaillees: 0 },
      { employe_id: 2, date_jour: '2026-09-01', statut: 'present', heure_arrivee: '06:00', heure_depart: '14:00', pause_minutes: 0 },
    ])
    expect(t.get(1)).toMatchObject({ jours: 2, heures: 18, sup: 2, absents: 1, conges: 1 })
    expect(t.get(1).parJour[3].statut).toBe('absent')
    expect(t.get(2)).toMatchObject({ jours: 1, heures: 8, sup: 0 })
  })
})
