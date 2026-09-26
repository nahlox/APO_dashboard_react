import { useEffect, useMemo, useState } from 'react'
import { listerEmployes, emargementsEntre, lireBordereau, changerStatutBordereau } from './api'
import { bornesMois, totauxParEmploye, fmtHeures, nomComplet, STATUT_CODE, estWeekEnd, jourSemaine, isoLocal } from './calc'

const moisCourant = () => isoLocal().slice(0, 7)

/** Code affiché dans la grille pour une journée. */
function cellule(l) {
  if (!l) return ''
  if (l.statut === 'present' || l.statut === 'mission') return l.heures ? String(Math.round(l.heures * 10) / 10).replace('.', ',') : 'P'
  return STATUT_CODE[l.statut] || '?'
}

/** Bordereau mensuel : grille employés × jours, totaux, validation, exports. */
export default function BordereauMensuel({ peutSaisir, tenantId, user, marque }) {
  const [ym, setYm]             = useState(moisCourant())
  const [employes, setEmployes] = useState(null)
  const [lignes, setLignes]     = useState([])
  const [bordereau, setBord]    = useState(null)
  const [msg, setMsg]           = useState(null)
  const [busy, setBusy]         = useState(false)

  const b = bornesMois(ym)
  const libelleMois = new Date(b.annee, b.mois - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  async function charger() {
    setMsg(null)
    try {
      const [emps, ems, bord] = await Promise.all([
        listerEmployes({ inclureInactifs: true }),
        emargementsEntre(b.debut, b.fin),
        lireBordereau(b.annee, b.mois),
      ])
      setEmployes(emps); setLignes(ems); setBord(bord)
    } catch (e) { setMsg({ error: e.message }) }
  }

  useEffect(() => { if (ym) charger() }, [ym])

  const totaux = useMemo(() => totauxParEmploye(lignes), [lignes])
  // Actifs + inactifs ayant émargé ce mois-ci.
  const lignesGrille = useMemo(
    () => (employes || []).filter(e => e.actif || totaux.has(e.id)),
    [employes, totaux],
  )
  const general = useMemo(() => {
    let heures = 0, sup = 0, jours = 0, montant = 0
    for (const e of lignesGrille) {
      const t = totaux.get(e.id); if (!t) continue
      heures += t.heures; sup += t.sup; jours += t.jours
      montant += t.heures * (Number(e.taux_horaire_fcfa) || 0)
    }
    return { heures, sup, jours, montant: Math.round(montant) }
  }, [lignesGrille, totaux])

  const valide = bordereau?.statut === 'valide'
  const jours = Array.from({ length: b.nbJours }, (_, i) => i + 1)
  const avecMontant = lignesGrille.some(e => Number(e.taux_horaire_fcfa) > 0)

  async function basculer() {
    const cible = valide ? 'brouillon' : 'valide'
    if (cible === 'valide' && !confirm(`Valider le bordereau de ${libelleMois} ? La saisie de ce mois sera verrouillée.`)) return
    setBusy(true); setMsg(null)
    try {
      setBord(await changerStatutBordereau({ tenantId, annee: b.annee, mois: b.mois, statut: cible, user }))
      setMsg({ ok: cible === 'valide' ? 'Bordereau validé et verrouillé.' : 'Bordereau rouvert : la saisie est de nouveau possible.' })
    } catch (e) { setMsg({ error: e.message }) }
    setBusy(false)
  }

  function exporterCSV() {
    const entete = ['Matricule', 'Nom', 'Poste', 'Service', ...jours.map(String), 'Jours présents', 'Heures', 'Heures sup', 'Absences', 'Congés/maladie']
    if (avecMontant) entete.push('Montant FCFA')
    const rows = lignesGrille.map(e => {
      const t = totaux.get(e.id) || { parJour: {}, jours: 0, heures: 0, sup: 0, absents: 0, conges: 0 }
      const r = [e.matricule || '', nomComplet(e), e.poste || '', e.service || '',
        ...jours.map(j => cellule(t.parJour[j])), t.jours, String(t.heures).replace('.', ','),
        String(t.sup).replace('.', ','), t.absents, t.conges]
      if (avecMontant) r.push(Math.round(t.heures * (Number(e.taux_horaire_fcfa) || 0)))
      return r
    })
    const esc = (v) => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
    const csv = [entete, ...rows].map(r => r.map(esc).join(';')).join('\r\n')
    telecharger(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `bordereau_heures_${ym}.csv`)
  }

  async function exporterPDF() {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })
    doc.setFontSize(16); doc.text(`Bordereau d'émargement des heures — ${libelleMois}`, 14, 16)
    doc.setFontSize(10)
    doc.text(`${marque} · Statut : ${valide ? `validé le ${new Date(bordereau.valide_le).toLocaleDateString('fr-FR')} par ${bordereau.valide_par_email || '—'}` : 'brouillon'}`, 14, 23)
    autoTable(doc, {
      startY: 28,
      head: [['Employé', ...jours.map(String), 'Jours', 'Heures', 'H. sup', 'Abs.', 'Cong.']],
      body: lignesGrille.map(e => {
        const t = totaux.get(e.id) || { parJour: {}, jours: 0, heures: 0, sup: 0, absents: 0, conges: 0 }
        return [nomComplet(e) + (e.matricule ? ` (${e.matricule})` : ''), ...jours.map(j => cellule(t.parJour[j])),
          t.jours, fmtHeures(t.heures), fmtHeures(t.sup), t.absents, t.conges]
      }),
      styles: { fontSize: 7, cellPadding: 1.2, halign: 'center' },
      columnStyles: { 0: { halign: 'left', cellWidth: 48 } },
      headStyles: { fillColor: [46, 125, 64] },
    })
    const y = doc.lastAutoTable.finalY + 10
    doc.setFontSize(9)
    doc.text(`Total : ${general.jours} jours travaillés · ${fmtHeures(general.heures)} · dont ${fmtHeures(general.sup)} heures sup (au-delà de 8 h/jour)`, 14, y)
    doc.text('Légende : nombre = heures travaillées · P = présent sans horaire · A absent · C congé · M maladie · R repos · F férié', 14, y + 6)
    doc.text('Visa Responsable RH :', 14, y + 20); doc.text('Visa Direction :', 200, y + 20)
    doc.save(`bordereau_heures_${ym}.pdf`)
  }

  return (
    <div className="rh-card">
      <div className="rh-toolbar">
        <label className="rh-field">
          <span>Mois</span>
          <input type="month" className="rh-input" value={ym} onChange={e => e.target.value && setYm(e.target.value)} />
        </label>
        <div className="rh-statut">
          <span className={`rh-badge ${valide ? 'ok' : 'warn'}`}>{valide ? 'Validé' : 'Brouillon'}</span>
          {valide && bordereau?.valide_le && (
            <span className="rh-dim">le {new Date(bordereau.valide_le).toLocaleDateString('fr-FR')} par {bordereau.valide_par_email || '—'}</span>
          )}
        </div>
        <div className="rh-stats">
          <div><b>{general.jours}</b><span>jours trav.</span></div>
          <div><b>{fmtHeures(general.heures)}</b><span>heures</span></div>
          <div><b>{fmtHeures(general.sup)}</b><span>heures sup</span></div>
          {avecMontant && <div><b>{general.montant.toLocaleString('fr-FR')}</b><span>FCFA</span></div>}
        </div>
      </div>

      {msg?.ok && <div className="rh-banner ok">{msg.ok}</div>}
      {msg?.error && <div className="rh-banner error">{msg.error}</div>}

      {employes === null ? <div className="rh-loading">Chargement…</div>
        : lignesGrille.length === 0 ? <div className="rh-empty">Aucun employé enregistré.</div>
        : (
          <div className="rh-table-wrap">
            <table className="rh-table rh-grille">
              <thead>
                <tr>
                  <th className="rh-sticky">Employé</th>
                  {jours.map(j => (
                    <th key={j} className={estWeekEnd(b.annee, b.mois, j) ? 'we' : ''}>
                      <div className="rh-jsem">{jourSemaine(b.annee, b.mois, j)}</div>{j}
                    </th>
                  ))}
                  <th className="num">Jours</th><th className="num">Heures</th><th className="num">H. sup</th>
                  <th className="num">Abs.</th><th className="num">Cong.</th>
                  {avecMontant && <th className="num">FCFA</th>}
                </tr>
              </thead>
              <tbody>
                {lignesGrille.map(e => {
                  const t = totaux.get(e.id) || { parJour: {}, jours: 0, heures: 0, sup: 0, absents: 0, conges: 0 }
                  return (
                    <tr key={e.id}>
                      <td className="rh-sticky">
                        <div className="rh-emp">{nomComplet(e)}{!e.actif && <span className="rh-dim"> (inactif)</span>}</div>
                        <div className="rh-emp-sub">{[e.matricule, e.poste].filter(Boolean).join(' · ')}</div>
                      </td>
                      {jours.map(j => {
                        const l = t.parJour[j]
                        return (
                          <td key={j} title={l?.observation || ''}
                              className={['c', estWeekEnd(b.annee, b.mois, j) ? 'we' : '', l ? `s-${l.statut}` : ''].join(' ')}>
                            {cellule(l)}
                          </td>
                        )
                      })}
                      <td className="num">{t.jours}</td>
                      <td className="num"><b>{fmtHeures(t.heures)}</b></td>
                      <td className="num">{fmtHeures(t.sup)}</td>
                      <td className="num">{t.absents || '—'}</td>
                      <td className="num">{t.conges || '—'}</td>
                      {avecMontant && <td className="num">{Math.round(t.heures * (Number(e.taux_horaire_fcfa) || 0)).toLocaleString('fr-FR')}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      <p className="rh-legende">
        Nombre = heures travaillées · P présent sans horaire · A absent · C congé · M maladie · R repos · F férié.
        Heures sup comptées au-delà de 8 h par jour.
      </p>

      <div className="rh-actions">
        <button className="rh-btn rh-btn-ghost" onClick={exporterCSV} disabled={!lignesGrille.length}>Exporter Excel (CSV)</button>
        <button className="rh-btn rh-btn-ghost" onClick={exporterPDF} disabled={!lignesGrille.length}>Exporter PDF</button>
        {peutSaisir && (
          <button className={`rh-btn ${valide ? 'rh-btn-ghost' : ''}`} onClick={basculer} disabled={busy}>
            {valide ? 'Rouvrir le bordereau' : 'Valider le bordereau du mois'}
          </button>
        )}
      </div>
    </div>
  )
}

function telecharger(blob, nom) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nom
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
