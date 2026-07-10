import { useState } from 'react'
import { supabase } from '../db/supabase'
import { Section, Row, Field, inputStyle, btnPrimary, Banner } from '../components/admin/AdminUI'
import SourcesEditor, { newSource } from '../components/admin/SourcesEditor'

const PLANS = ['starter', 'business', 'enterprise']

const EMPTY_FORM = {
  tenant_id: '',
  nom_affichage: '',
  pays: 'CI',
  plan: 'starter',
  couleur_primaire: '#F28C28',
  couleur_secondaire: '#3FA34D',
  email_from: '',
  report_recipients: '',
  tank_capacite_kg: '',
  premier_email: '',
  premier_role: 'owner',
}

export default function AdminCreateTenant({ onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [sources, setSources] = useState([newSource()])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { ok: true, tenant_id, invited_user } | { error }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setResult(null)

    const { data: { session } } = await supabase.auth.getSession()

    const body = {
      tenant_id: form.tenant_id.trim().toLowerCase(),
      nom_affichage: form.nom_affichage.trim(),
      pays: form.pays.trim() || 'CI',
      plan: form.plan,
      couleur_primaire: form.couleur_primaire,
      couleur_secondaire: form.couleur_secondaire,
      email_from: form.email_from.trim() || null,
      report_recipients: form.report_recipients
        .split(',').map(s => s.trim()).filter(Boolean),
      tank_capacite_kg: form.tank_capacite_kg ? Number(form.tank_capacite_kg) : null,
      sources: sources
        .filter(s => s.label.trim())
        .map(({ _key, ...s }) => ({ ...s, label: s.label.trim() })),
      premier_utilisateur: {
        email: form.premier_email.trim(),
        role: form.premier_role,
      },
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-tenant', {
        body,
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (error) throw error
      if (data?.error) {
        setResult({ error: data.error })
      } else {
        setResult({ ok: true, ...data })
        setForm(EMPTY_FORM)
        setSources([newSource()])
        onCreated?.()
      }
    } catch (err) {
      setResult({ error: err.message || 'Erreur inconnue' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <Section title="Identité du tenant">
        <Field label="Identifiant technique (slug)" hint="minuscules, chiffres, underscore — ex: huilerie_benin">
          <input required value={form.tenant_id} onChange={set('tenant_id')} placeholder="huilerie_benin" style={inputStyle} />
        </Field>
        <Field label="Nom affiché">
          <input required value={form.nom_affichage} onChange={set('nom_affichage')} placeholder="Huilerie du Bénin" style={inputStyle} />
        </Field>
        <Row>
          <Field label="Pays (code)">
            <input value={form.pays} onChange={set('pays')} placeholder="BJ" style={inputStyle} />
          </Field>
          <Field label="Plan">
            <select value={form.plan} onChange={set('plan')} style={inputStyle}>
              {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </Row>
      </Section>

      <Section title="Branding">
        <Row>
          <Field label="Couleur primaire">
            <input type="color" value={form.couleur_primaire} onChange={set('couleur_primaire')} style={{ ...inputStyle, padding: 4, height: 40 }} />
          </Field>
          <Field label="Couleur secondaire">
            <input type="color" value={form.couleur_secondaire} onChange={set('couleur_secondaire')} style={{ ...inputStyle, padding: 4, height: 40 }} />
          </Field>
        </Row>
      </Section>

      <Section title="Rapports & email">
        <Field label="Expéditeur email (Resend)" hint='ex: "Huilerie Bénin <rapport@domaine.com>" — laisser vide pour utiliser l’expéditeur par défaut'>
          <input value={form.email_from} onChange={set('email_from')} placeholder="Huilerie Bénin <rapport@domaine.com>" style={inputStyle} />
        </Field>
        <Field label="Destinataires des rapports" hint="emails séparés par des virgules">
          <input value={form.report_recipients} onChange={set('report_recipients')} placeholder="a@x.com, b@x.com" style={inputStyle} />
        </Field>
      </Section>

      <Section title="Production">
        <Field label="Capacité tank (kg)">
          <input type="number" value={form.tank_capacite_kg} onChange={set('tank_capacite_kg')} placeholder="500000" style={inputStyle} />
        </Field>
      </Section>

      <SourcesEditor sources={sources} setSources={setSources} />

      <Section title="Premier utilisateur">
        <Row>
          <Field label="Email">
            <input required type="email" value={form.premier_email} onChange={set('premier_email')} placeholder="proprietaire@client.com" style={inputStyle} />
          </Field>
          <Field label="Rôle">
            <select value={form.premier_role} onChange={set('premier_role')} style={inputStyle}>
              <option value="owner">owner</option>
              <option value="manager">manager</option>
              <option value="viewer">viewer</option>
            </select>
          </Field>
        </Row>
      </Section>

      <button type="submit" disabled={busy} style={{ ...btnPrimary, padding: '14px 24px', fontSize: 15, opacity: busy ? 0.6 : 1, cursor: busy ? 'default' : 'pointer' }}>
        {busy ? 'Création en cours…' : 'Créer le tenant'}
      </button>

      {result?.ok && (
        <Banner ok={`Tenant ${result.tenant_id} créé. Invitation envoyée à ${result.invited_user}. Les sources de données saisies sont enregistrées dans tenant_config — l'import (ETL) reste à câbler par source (voir ONBOARDING.md).`} />
      )}
      {result?.error && <Banner error={result.error} />}
    </form>
  )
}
