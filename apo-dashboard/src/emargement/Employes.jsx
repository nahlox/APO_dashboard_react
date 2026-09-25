import { useEffect, useState } from 'react'
import { listerEmployes, enregistrerEmploye } from './api'
import { nomComplet } from './calc'

const NOUVEAU = {
  matricule: '', nom: '', prenom: '', poste: '', service: '',
  type_contrat: '', taux_horaire_fcfa: '', date_entree: '', actif: true,
}
const CONTRATS = ['CDI', 'CDD', 'Journalier', 'Saisonnier', 'Stagiaire']

/** Liste et fiche des employés soumis à l'émargement. */
export default function Employes({ peutSaisir }) {
  const [employes, setEmployes] = useState(null)
  const [fiche, setFiche]       = useState(null)   // null = formulaire fermé
  const [voirInactifs, setVoir] = useState(false)
  const [msg, setMsg]           = useState(null)
  const [busy, setBusy]         = useState(false)

  async function charger() {
    try { setEmployes(await listerEmployes({ inclureInactifs: true })) }
    catch (e) { setMsg({ error: e.message }) }
  }
  useEffect(() => { charger() }, [])

  async function enregistrer(e) {
    e.preventDefault()
    if (!fiche.nom.trim()) return setMsg({ error: 'Le nom est obligatoire.' })
    setBusy(true); setMsg(null)
    try {
      const payload = { ...fiche }
      for (const k of ['matricule', 'prenom', 'poste', 'service', 'type_contrat', 'date_entree']) {
        payload[k] = typeof payload[k] === 'string' ? (payload[k].trim() || null) : payload[k]
      }
      payload.nom = payload.nom.trim()
      payload.taux_horaire_fcfa = payload.taux_horaire_fcfa === '' || payload.taux_horaire_fcfa == null ? null : Number(payload.taux_horaire_fcfa)
      await enregistrerEmploye(payload)
      setMsg({ ok: `${nomComplet(payload)} enregistré.` })
      setFiche(null)
      await charger()
    } catch (err) {
      setMsg({ error: /employes_tenant_matricule_key/.test(err.message) ? 'Ce matricule est déjà utilisé.' : err.message })
    }
    setBusy(false)
  }

  async function basculerActif(emp) {
    setMsg(null)
    try { await enregistrerEmploye({ id: emp.id, actif: !emp.actif }); await charger() }
    catch (e) { setMsg({ error: e.message }) }
  }

  const champ = (k) => ({
    value: fiche?.[k] ?? '',
    onChange: (e) => setFiche(f => ({ ...f, [k]: e.target.value })),
  })

  const liste = (employes || []).filter(e => voirInactifs || e.actif)

  return (
    <div className="rh-card">
      <div className="rh-toolbar">
        <label className="rh-check">
          <input type="checkbox" checked={voirInactifs} onChange={e => setVoir(e.target.checked)} />
          Afficher les employés inactifs
        </label>
        <div className="rh-grow" />
        {peutSaisir && !fiche && (
          <button className="rh-btn" onClick={() => { setFiche({ ...NOUVEAU }); setMsg(null) }}>+ Ajouter un employé</button>
        )}
      </div>

      {msg?.ok && <div className="rh-banner ok">{msg.ok}</div>}
      {msg?.error && <div className="rh-banner error">{msg.error}</div>}

      {fiche && (
        <form className="rh-form" onSubmit={enregistrer}>
          <div className="rh-form-title">{fiche.id ? `Modifier ${nomComplet(fiche)}` : 'Nouvel employé'}</div>
          <div className="rh-form-grid">
            <label className="rh-field"><span>Nom *</span><input className="rh-input" required {...champ('nom')} /></label>
            <label className="rh-field"><span>Prénom</span><input className="rh-input" {...champ('prenom')} /></label>
            <label className="rh-field"><span>Matricule</span><input className="rh-input" {...champ('matricule')} /></label>
            <label className="rh-field"><span>Poste</span><input className="rh-input" placeholder="ex : Opérateur presse" {...champ('poste')} /></label>
            <label className="rh-field"><span>Service</span><input className="rh-input" placeholder="ex : Production" {...champ('service')} /></label>
            <label className="rh-field"><span>Contrat</span>
              <select className="rh-input" {...champ('type_contrat')}>
                <option value="">—</option>
                {CONTRATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="rh-field"><span>Taux horaire (FCFA)</span><input type="number" min="0" className="rh-input" {...champ('taux_horaire_fcfa')} /></label>
            <label className="rh-field"><span>Date d'entrée</span><input type="date" className="rh-input" {...champ('date_entree')} /></label>
          </div>
          <div className="rh-actions">
            <button type="button" className="rh-btn rh-btn-ghost" onClick={() => setFiche(null)} disabled={busy}>Annuler</button>
            <button type="submit" className="rh-btn" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      )}

      {employes === null ? <div className="rh-loading">Chargement…</div>
        : liste.length === 0 ? <div className="rh-empty">Aucun employé pour l'instant.</div>
        : (
          <div className="rh-table-wrap">
            <table className="rh-table">
              <thead>
                <tr><th>Matricule</th><th>Nom</th><th>Poste</th><th>Service</th><th>Contrat</th>
                  <th className="num">Taux horaire</th><th>Statut</th>{peutSaisir && <th />}</tr>
              </thead>
              <tbody>
                {liste.map(e => (
                  <tr key={e.id} className={e.actif ? '' : 'rh-row-vide'}>
                    <td className="rh-mono">{e.matricule || '—'}</td>
                    <td className="rh-emp">{nomComplet(e)}</td>
                    <td>{e.poste || '—'}</td>
                    <td>{e.service || '—'}</td>
                    <td>{e.type_contrat || '—'}</td>
                    <td className="num">{e.taux_horaire_fcfa ? Number(e.taux_horaire_fcfa).toLocaleString('fr-FR') : '—'}</td>
                    <td><span className={`rh-badge ${e.actif ? 'ok' : ''}`}>{e.actif ? 'Actif' : 'Inactif'}</span></td>
                    {peutSaisir && (
                      <td className="rh-row-actions">
                        <button className="rh-link" onClick={() => { setFiche({ ...NOUVEAU, ...e, taux_horaire_fcfa: e.taux_horaire_fcfa ?? '' }); setMsg(null) }}>Modifier</button>
                        <button className="rh-link" onClick={() => basculerActif(e)}>{e.actif ? 'Désactiver' : 'Réactiver'}</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
