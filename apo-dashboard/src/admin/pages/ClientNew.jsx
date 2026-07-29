import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../db/supabase'
import { Card, Field, Banner, parseList, logAction } from '../ui'

const PLANS = ['starter', 'business', 'enterprise']
const VIDE = {
  tenant_id: '', nom_affichage: '', pays: 'CI', plan: 'starter',
  couleur_primaire: '#F28C28', couleur_secondaire: '#3FA34D',
  email_from: '', report_recipients: '', tank_capacite_kg: '',
  premier_email: '', premier_role: 'owner',
}

export default function ClientNew() {
  const [f, setF] = useState(VIDE)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState(null)
  const navigate = useNavigate()

  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }))

  // Suggère un slug technique à partir du nom saisi
  const onNom = (e) => {
    const nom = e.target.value
    setF(x => ({
      ...x,
      nom_affichage: nom,
      tenant_id: x.tenant_id || nom.toLowerCase().normalize('NFD')
        .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '').slice(0, 32),
    }))
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setBanner(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase.functions.invoke('admin-create-tenant', {
        body: {
          tenant_id: f.tenant_id.trim().toLowerCase(),
          nom_affichage: f.nom_affichage.trim(),
          pays: f.pays.trim() || 'CI',
          plan: f.plan,
          couleur_primaire: f.couleur_primaire,
          couleur_secondaire: f.couleur_secondaire,
          email_from: f.email_from.trim() || null,
          report_recipients: parseList(f.report_recipients),
          tank_capacite_kg: f.tank_capacite_kg ? Number(f.tank_capacite_kg) : null,
          sources: [],
          premier_utilisateur: { email: f.premier_email.trim(), role: f.premier_role },
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      await logAction('tenant_create', f.tenant_id, { nom: f.nom_affichage, plan: f.plan })
      navigate(`/admin/c/${f.tenant_id.trim().toLowerCase()}/integrations`)
    } catch (err) {
      setBanner({ error: err.message })
    } finally { setBusy(false) }
  }

  return (
    <>
      <div className="admin-page-head">
        <h1 className="admin-h1">Nouveau client</h1>
        <p className="admin-sub">
          Crée le tenant, sa configuration et invite le premier utilisateur. Les sources de
          données se déclarent juste après, dans l'onglet Intégrations.
        </p>
      </div>

      <form onSubmit={submit}>
        <Banner {...(banner ?? {})} />

        <Card title="Identité">
          <Field label="Nom de l'huilerie">
            <input required className="admin-input" value={f.nom_affichage} onChange={onNom}
                   placeholder="Huilerie du Bénin" />
          </Field>
          <Field label="Identifiant technique" hint="minuscules, chiffres, underscore — définitif, utilisé comme tenant_id partout en base">
            <input required className="admin-input admin-mono" value={f.tenant_id} onChange={set('tenant_id')}
                   pattern="[a-z0-9_]{2,32}" placeholder="huilerie_benin" />
          </Field>
          <div className="admin-row">
            <Field label="Pays (code ISO)">
              <input className="admin-input" value={f.pays} onChange={set('pays')} placeholder="BJ" />
            </Field>
            <Field label="Plan">
              <select className="admin-select" value={f.plan} onChange={set('plan')}>
                {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
        </Card>

        <Card title="Marque">
          <div className="admin-row">
            <Field label="Couleur primaire">
              <input type="color" className="admin-input" value={f.couleur_primaire} onChange={set('couleur_primaire')} />
            </Field>
            <Field label="Couleur secondaire">
              <input type="color" className="admin-input" value={f.couleur_secondaire} onChange={set('couleur_secondaire')} />
            </Field>
          </div>
        </Card>

        <Card title="Rapports">
          <Field label="Expéditeur email" hint="domaine à vérifier dans Resend — vide = expéditeur Palmeo par défaut">
            <input className="admin-input" value={f.email_from} onChange={set('email_from')} />
          </Field>
          <Field label="Destinataires" hint="vide = propriétaires et gestionnaires du client">
            <input className="admin-input" value={f.report_recipients} onChange={set('report_recipients')}
                   placeholder="direction@client.com" />
          </Field>
        </Card>

        <Card title="Paramètres métier">
          <Field label="Capacité du tank (kg)" hint="jauge de stock d'huile — modifiable plus tard">
            <input type="number" className="admin-input" value={f.tank_capacite_kg}
                   onChange={set('tank_capacite_kg')} placeholder="500000" />
          </Field>
        </Card>

        <Card title="Premier utilisateur">
          <div className="admin-row">
            <Field label="Email" hint="reçoit une invitation pour définir son mot de passe">
              <input required type="email" className="admin-input" value={f.premier_email}
                     onChange={set('premier_email')} placeholder="proprietaire@client.com" />
            </Field>
            <Field label="Rôle">
              <select className="admin-select" value={f.premier_role} onChange={set('premier_role')}>
                <option value="owner">Propriétaire</option>
                <option value="manager">Gestionnaire</option>
                <option value="viewer">Lecteur</option>
              </select>
            </Field>
          </div>
        </Card>

        <div className="admin-actions">
          <button type="submit" className="admin-btn" disabled={busy}>
            {busy ? 'Création…' : 'Créer le client'}
          </button>
        </div>
      </form>
    </>
  )
}
