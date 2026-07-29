import { useEffect, useState } from 'react'
import { supabase } from '../../../db/supabase'
import { Card, Field, Badge, Banner, dateFR, logAction } from '../../ui'

const ROLES = [
  { value: 'owner',   label: 'Propriétaire', hint: 'accès complet aux données du client' },
  { value: 'manager', label: 'Gestionnaire', hint: 'consultation + destinataire des rapports' },
  { value: 'viewer',  label: 'Lecteur',      hint: 'consultation seule' },
]

export default function TabUtilisateurs({ tenantId }) {
  const [users, setUsers]   = useState(null)
  const [banner, setBanner] = useState(null)
  const [email, setEmail]   = useState('')
  const [role, setRole]     = useState('viewer')
  const [busy, setBusy]     = useState(false)

  async function loadUsers() {
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.functions.invoke('admin-tenant-users', {
      body: { tenant_id: tenantId },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    if (error) setBanner({ error: error.message })
    else setUsers(data?.users ?? [])
  }

  useEffect(() => { setUsers(null); loadUsers() }, [tenantId])

  /** Envoie (ou renvoie) l'email d'invitation Palmeo via Resend. */
  async function envoyerInvitation({ destinataire, roleChoisi, renvoyer }) {
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.functions.invoke('admin-invite-user', {
      body: { tenant_id: tenantId, email: destinataire, role: roleChoisi, renvoyer },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function invite(e) {
    e.preventDefault()
    setBusy(true); setBanner(null)
    try {
      const data = await envoyerInvitation({ destinataire: email.trim(), roleChoisi: role })
      await logAction('user_invite', tenantId, { email: data.email, role, invited: data.invited })
      if (data.email_erreur) {
        setBanner({ error: `${data.email} a bien été rattaché, mais l'email n'a pas pu être envoyé : ${data.email_erreur}` })
      } else if (data.lien_envoye) {
        setBanner({ ok: `Invitation envoyée à ${data.email}. Il ou elle crée son mot de passe depuis l'email, puis peut se connecter.` })
      } else {
        setBanner({ ok: `${data.email} a déjà un compte actif : un email l'informe de son nouvel accès.` })
      }
      setEmail('')
      await loadUsers()
    } catch (err) {
      setBanner({ error: err.message })
    } finally { setBusy(false) }
  }

  async function renvoyer(u) {
    setBusy(true); setBanner(null)
    try {
      const data = await envoyerInvitation({ destinataire: u.email, roleChoisi: u.role, renvoyer: true })
      await logAction('user_invite_resend', tenantId, { email: u.email })
      setBanner(data.email_erreur
        ? { error: `Envoi échoué : ${data.email_erreur}` }
        : { ok: `Nouveau lien d'activation envoyé à ${u.email} (valable 24 h).` })
    } catch (err) {
      setBanner({ error: err.message })
    } finally { setBusy(false) }
  }

  async function changeRole(userId, newRole) {
    const { error } = await supabase.from('user_tenants')
      .update({ role: newRole }).eq('user_id', userId).eq('tenant_id', tenantId)
    if (error) return setBanner({ error: error.message })
    await logAction('user_role_change', tenantId, { user_id: userId, role: newRole })
    setBanner({ ok: 'Rôle mis à jour.' })
    loadUsers()
  }

  async function removeUser(userId, userEmail) {
    if (!confirm(`Retirer ${userEmail} de ce client ?\n\nSon compte reste actif mais il perd l'accès aux données de ce client.`)) return
    const { error } = await supabase.from('user_tenants')
      .delete().eq('user_id', userId).eq('tenant_id', tenantId)
    if (error) return setBanner({ error: error.message })
    await logAction('user_remove', tenantId, { user_id: userId, email: userEmail })
    setBanner({ ok: `${userEmail} n'a plus accès à ce client.` })
    loadUsers()
  }

  return (
    <>
      <Banner {...(banner ?? {})} />

      <Card title={`Utilisateurs${users ? ` (${users.length})` : ''}`}>
        {users === null && <div className="admin-loading">Chargement…</div>}
        {users?.length === 0 && <div className="admin-empty" style={{ padding: 20 }}>Aucun utilisateur rattaché.</div>}
        {users?.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Email</th><th>Rôle</th><th>Dernière connexion</th><th></th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id}>
                    <td>
                      {u.email}
                      {!u.last_sign_in_at && <> <Badge kind="warn">Invitation en attente</Badge></>}
                    </td>
                    <td>
                      <select className="admin-select" style={{ width: 'auto', padding: '5px 9px' }}
                              value={u.role} onChange={e => changeRole(u.user_id, e.target.value)}>
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                    <td style={{ color: 'var(--a-dim)' }}>
                      {u.last_sign_in_at ? dateFR(u.last_sign_in_at) : 'Jamais'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {!u.last_sign_in_at && (
                        <button className="admin-btn admin-btn-ghost" disabled={busy}
                                style={{ padding: '5px 10px', fontSize: 12.5, marginRight: 6 }}
                                onClick={() => renvoyer(u)}>Renvoyer</button>
                      )}
                      <button className="admin-btn admin-btn-danger"
                              onClick={() => removeUser(u.user_id, u.email)}>Retirer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Inviter un utilisateur">
        <form onSubmit={invite}>
          <div className="admin-row">
            <Field label="Email">
              <input required type="email" className="admin-input" value={email}
                     onChange={e => setEmail(e.target.value)} placeholder="responsable@client.com" />
            </Field>
            <Field label="Rôle" hint={ROLES.find(r => r.value === role)?.hint}>
              <select className="admin-select" value={role} onChange={e => setRole(e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="admin-actions">
            <button type="submit" className="admin-btn" disabled={busy}>
              {busy ? 'Envoi…' : "Envoyer l'invitation"}
            </button>
            <span className="admin-hint">
              L'utilisateur reçoit un email Palmeo (via Resend) l'invitant à créer son mot de
              passe, puis se connecte normalement. S'il possède déjà un compte actif, il est
              rattaché à ce client et simplement informé par email.
            </span>
          </div>
        </form>
      </Card>
    </>
  )
}
