import { useEffect, useMemo, useState } from 'react'
import { listerEmployes, emargementsEntre, enregistrerEmargements, supprimerEmargements, lireBordereau } from './api'
import { STATUTS, calcHeures, fmtHeures, isoLocal, nomComplet } from './calc'

const HORAIRE_DEFAUT = { heure_arrivee: '07:00', heure_depart: '16:00', pause_minutes: 60 }
const VIDE = { statut: '', heure_arrivee: '', heure_depart: '', pause_minutes: 0, observation: '' }
const hhmm = (t) => (t ? String(t).slice(0, 5) : '')

/** Émargement d'une journée : une ligne par employé actif. */
export default function SaisieJour({ peutSaisir, tenantId }) {
  const [date, setDate]         = useState(isoLocal())
  const [employes, setEmployes] = useState(null)
  const [lignes, setLignes]     = useState({})   // employe_id → saisie
  const [existants, setExist]   = useState({})   // employe_id → id en base
  const [verrouille, setVerr]   = useState(false)
  const [filtre, setFiltre]     = useState('')
  const [msg, setMsg]           = useState(null)
  const [busy, setBusy]         = useState(false)

  async function charger() {
    setMsg(null)
    try {
      const [emps, ems, bord] = await Promise.all([
        listerEmployes(),
        emargementsEntre(date, date),
        lireBordereau(Number(date.slice(0, 4)), Number(date.slice(5, 7))),
      ])
      const l = {}, ex = {}
      for (const e of ems) {
        l[e.employe_id] = {
          statut: e.statut, heure_arrivee: hhmm(e.heure_arrivee), heure_depart: hhmm(e.heure_depart),
          pause_minutes: e.pause_minutes ?? 0, observation: e.observation ?? '',
        }
        ex[e.employe_id] = e.id
      }
      setEmployes(emps); setLignes(l); setExist(ex); setVerr(bord?.statut === 'valide')
    } catch (e) { setMsg({ error: e.message }) }
  }

  useEffect(() => { if (date) charger() }, [date])

  const editable = peutSaisir && !verrouille

  function maj(id, champ, valeur) {
    setLignes(prev => {
      const cur = { ...VIDE, ...prev[id] }
      const next = { ...cur, [champ]: valeur }
      // Passer à « présent » pré-remplit l'horaire standard si rien n'est saisi.
      if (champ === 'statut' && (valeur === 'present' || valeur === 'mission') && !cur.heure_arrivee && !cur.heure_depart) {
        Object.assign(next, HORAIRE_DEFAUT)
      }
      return { ...prev, [id]: next }
    })
  }

  function tousPresents() {
    setLignes(prev => {
      const next = { ...prev }
      for (const e of employes) if (!next[e.id]?.statut) next[e.id] = { ...VIDE, statut: 'present', ...HORAIRE_DEFAUT }
      return next
    })
  }

  async function enregistrer() {
    setBusy(true); setMsg(null)
    try {
      const aEnregistrer = [], aSupprimer = []
      for (const e of employes) {
        const l = lignes[e.id]
        if (l?.statut) {
          aEnregistrer.push({
            tenant_id: tenantId, employe_id: e.id, date_jour: date, statut: l.statut,
            heure_arrivee: l.heure_arrivee || null, heure_depart: l.heure_depart || null,
            pause_minutes: Number(l.pause_minutes) || 0, observation: l.observation?.trim() || null,
          })
        } else if (existants[e.id]) {
          aSupprimer.push(existants[e.id])
        }
      }
      await enregistrerEmargements(aEnregistrer)
      await supprimerEmargements(aSupprimer)
      await charger()
      setMsg({ ok: `Émargement du ${new Date(date + 'T12:00').toLocaleDateString('fr-FR')} enregistré (${aEnregistrer.length} ligne${aEnregistrer.length > 1 ? 's' : ''}).` })
    } catch (e) { setMsg({ error: e.message }) }
    setBusy(false)
  }

  const visibles = useMemo(() => {
    if (!employes) return []
    const f = filtre.trim().toLowerCase()
    if (!f) return employes
    return employes.filter(e => [e.nom, e.prenom, e.matricule, e.poste, e.service].some(v => v?.toLowerCase().includes(f)))
  }, [employes, filtre])

  const resume = useMemo(() => {
    let presents = 0, absents = 0, heures = 0
    for (const l of Object.values(lignes)) {
      if (l.statut === 'present' || l.statut === 'mission') presents++
      if (l.statut === 'absent') absents++
      heures += calcHeures(l)
    }
    return { presents, absents, heures }
  }, [lignes])

  return (
    <div className="rh-card">
      <div className="rh-toolbar">
        <label className="rh-field">
          <span>Date</span>
          <input type="date" className="rh-input" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <label className="rh-field rh-grow">
          <span>Rechercher</span>
          <input className="rh-input" placeholder="Nom, matricule, poste…" value={filtre} onChange={e => setFiltre(e.target.value)} />
        </label>
        <div className="rh-stats">
          <div><b>{resume.presents}</b><span>présents</span></div>
          <div><b>{resume.absents}</b><span>absents</span></div>
          <div><b>{fmtHeures(resume.heures)}</b><span>heures</span></div>
        </div>
      </div>

      {verrouille && <div className="rh-banner info">Le bordereau de ce mois est validé : la saisie est verrouillée.</div>}
      {msg?.ok && <div className="rh-banner ok">{msg.ok}</div>}
      {msg?.error && <div className="rh-banner error">{msg.error}</div>}

      {employes === null ? <div className="rh-loading">Chargement…</div>
        : employes.length === 0 ? (
          <div className="rh-empty">Aucun employé actif. Ajoutez vos employés dans l'onglet « Employés ».</div>
        ) : (
          <>
            <div className="rh-table-wrap">
              <table className="rh-table">
                <thead>
                  <tr>
                    <th>Employé</th><th>Statut</th><th>Arrivée</th><th>Départ</th>
                    <th>Pause (min)</th><th className="num">Heures</th><th>Observation</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map(e => {
                    const l = { ...VIDE, ...lignes[e.id] }
                    const travaille = l.statut === 'present' || l.statut === 'mission'
                    const h = calcHeures(l)
                    return (
                      <tr key={e.id} className={l.statut ? '' : 'rh-row-vide'}>
                        <td>
                          <div className="rh-emp">{nomComplet(e)}</div>
                          <div className="rh-emp-sub">{[e.matricule, e.poste].filter(Boolean).join(' · ')}</div>
                        </td>
                        <td>
                          <select className="rh-input" disabled={!editable} value={l.statut}
                                  onChange={ev => maj(e.id, 'statut', ev.target.value)}>
                            <option value="">— non saisi —</option>
                            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </td>
                        <td><input type="time" className="rh-input" disabled={!editable || !travaille}
                                   value={l.heure_arrivee} onChange={ev => maj(e.id, 'heure_arrivee', ev.target.value)} /></td>
                        <td><input type="time" className="rh-input" disabled={!editable || !travaille}
                                   value={l.heure_depart} onChange={ev => maj(e.id, 'heure_depart', ev.target.value)} /></td>
                        <td><input type="number" min="0" max="720" step="5" className="rh-input rh-input-sm" disabled={!editable || !travaille}
                                   value={l.pause_minutes} onChange={ev => maj(e.id, 'pause_minutes', ev.target.value)} /></td>
                        <td className="num">{travaille ? fmtHeures(h) : '—'}</td>
                        <td><input className="rh-input" disabled={!editable} placeholder="—"
                                   value={l.observation} onChange={ev => maj(e.id, 'observation', ev.target.value)} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {editable && (
              <div className="rh-actions">
                <button className="rh-btn rh-btn-ghost" onClick={tousPresents} disabled={busy}>
                  Marquer les non-saisis présents (7h–16h)
                </button>
                <button className="rh-btn" onClick={enregistrer} disabled={busy}>
                  {busy ? 'Enregistrement…' : 'Enregistrer la journée'}
                </button>
              </div>
            )}
          </>
        )}
    </div>
  )
}
