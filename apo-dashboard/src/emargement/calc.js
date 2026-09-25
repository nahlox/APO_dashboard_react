// ============================================================
// Émargement des heures — calculs purs (miroir de la colonne générée
// `emargements.heures_travaillees` et de la vue `vue_bordereau_mensuel`).
// ============================================================

/** Seuil journalier au-delà duquel les heures comptent en heures sup. */
export const SEUIL_HEURES_JOUR = 8

export const STATUTS = [
  { value: 'present', label: 'Présent',  code: '' },
  { value: 'mission', label: 'Mission',  code: '' },
  { value: 'absent',  label: 'Absent',   code: 'A' },
  { value: 'conge',   label: 'Congé',    code: 'C' },
  { value: 'maladie', label: 'Maladie',  code: 'M' },
  { value: 'repos',   label: 'Repos',    code: 'R' },
  { value: 'ferie',   label: 'Férié',    code: 'F' },
]
export const STATUT_LABEL = Object.fromEntries(STATUTS.map(s => [s.value, s.label]))
export const STATUT_CODE  = Object.fromEntries(STATUTS.map(s => [s.value, s.code]))

const TRAVAILLE = new Set(['present', 'mission'])

/** "07:30" ou "07:30:00" → minutes depuis minuit (null si vide/invalide). */
export function toMinutes(t) {
  if (!t) return null
  const m = /^(\d{1,2}):(\d{2})/.exec(t)
  if (!m) return null
  const h = Number(m[1]), mn = Number(m[2])
  if (h > 23 || mn > 59) return null
  return h * 60 + mn
}

/**
 * Heures travaillées d'une ligne d'émargement, arrondies au centième.
 * Un départ antérieur à l'arrivée signifie un poste de nuit (+24 h).
 */
export function calcHeures({ statut, heure_arrivee, heure_depart, pause_minutes }) {
  if (!TRAVAILLE.has(statut)) return 0
  const a = toMinutes(heure_arrivee), d = toMinutes(heure_depart)
  if (a === null || d === null) return 0
  let duree = d - a
  if (duree < 0) duree += 24 * 60
  const net = duree - (Number(pause_minutes) || 0)
  return Math.max(0, Math.round((net / 60) * 100) / 100)
}

/** Heures sup d'une journée. */
export function heuresSup(heures, seuil = SEUIL_HEURES_JOUR) {
  return Math.max(0, Math.round((heures - seuil) * 100) / 100)
}

/** 'YYYY-MM' → { annee, mois, debut: 'YYYY-MM-01', fin: 'YYYY-MM-DD', nbJours } */
export function bornesMois(ym) {
  const [annee, mois] = ym.split('-').map(Number)
  const nbJours = new Date(Date.UTC(annee, mois, 0)).getUTCDate()
  const mm = String(mois).padStart(2, '0')
  return { annee, mois, debut: `${annee}-${mm}-01`, fin: `${annee}-${mm}-${String(nbJours).padStart(2, '0')}`, nbJours }
}

/** Date locale → 'YYYY-MM-DD' (sans décalage UTC). */
export function isoLocal(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 1 → 'lun.' … selon le jour de semaine d'une date du mois. */
export function jourSemaine(annee, mois, jour) {
  return new Date(annee, mois - 1, jour).toLocaleDateString('fr-FR', { weekday: 'narrow' })
}

export function estWeekEnd(annee, mois, jour) {
  const j = new Date(annee, mois - 1, jour).getDay()
  return j === 0 || j === 6
}

/**
 * Totaux mensuels par employé à partir des lignes d'émargement brutes.
 * Renvoie une Map employe_id → { jours, heures, sup, absents, conges, parJour: {jour: ligne} }
 */
export function totauxParEmploye(lignes) {
  const res = new Map()
  for (const l of lignes) {
    let t = res.get(l.employe_id)
    if (!t) {
      t = { jours: 0, heures: 0, sup: 0, absents: 0, conges: 0, parJour: {} }
      res.set(l.employe_id, t)
    }
    const h = l.heures_travaillees != null ? Number(l.heures_travaillees) : calcHeures(l)
    const jour = Number(String(l.date_jour).slice(8, 10))
    t.parJour[jour] = { ...l, heures: h }
    if (TRAVAILLE.has(l.statut)) t.jours += 1
    if (l.statut === 'absent') t.absents += 1
    if (l.statut === 'conge' || l.statut === 'maladie') t.conges += 1
    t.heures += h
    t.sup += heuresSup(h)
  }
  for (const t of res.values()) {
    t.heures = Math.round(t.heures * 100) / 100
    t.sup = Math.round(t.sup * 100) / 100
  }
  return res
}

/** 7.5 → "7h30", 0 → "—" */
export function fmtHeures(h) {
  if (!h) return '—'
  const tot = Math.round(h * 60)
  const hh = Math.floor(tot / 60), mm = tot % 60
  return mm ? `${hh}h${String(mm).padStart(2, '0')}` : `${hh}h`
}

export function nomComplet(e) {
  return [e.nom, e.prenom].filter(Boolean).join(' ')
}
