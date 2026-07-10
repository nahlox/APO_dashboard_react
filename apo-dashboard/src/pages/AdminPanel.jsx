import { useState } from 'react'
import { supabase } from '../db/supabase'
import { useDashboardStore } from '../store/dashboardStore'

const PLANS = ['starter', 'business', 'enterprise']

const SOURCE_TYPES = [
  { value: 'excel_dropbox',       label: 'Fichiers Excel (Dropbox / Drive / OneDrive)' },
  { value: 'google_sheets',       label: 'Google Sheets' },
  { value: 'logiciel_comptable',  label: 'Logiciel de comptabilité (Sage, Odoo, QuickBooks…)' },
  { value: 'api',                 label: 'API externe' },
  { value: 'export_manuel',       label: 'Export manuel (CSV/PDF envoyé par email)' },
  { value: 'autre',               label: 'Autre' },
]

const FREQUENCES = ['quotidien', 'hebdomadaire', 'mensuel', 'ponctuel']

let sourceSeq = 0
const newSource = () => ({
  _key: ++sourceSeq,
  label: '',
  type: 'excel_dropbox',
  emplacement: '',
  acces: '',
  frequence: 'quotidien',
  notes: '',
})

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

export default function AdminPanel() {
  const { setShowAdmin } = useDashboardStore()
  const [form, setForm] = useState(EMPTY_FORM)
  const [sources, setSources] = useState([newSource()])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { ok: true, tenant_id, invited_user } | { error }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const setSource = (key, field) => (e) =>
    setSources(list => list.map(s => s._key === key ? { ...s, [field]: e.target.value } : s))
  const addSource = () => setSources(list => [...list, newSource()])
  const removeSource = (key) => setSources(list => list.filter(s => s._key !== key))

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
      }
    } catch (err) {
      setResult({ error: err.message || 'Erreur inconnue' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Onboarding — Nouveau client</h1>
        <button
          onClick={() => setShowAdmin(false)}
          style={{
            background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)',
            borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13,
          }}
        >← Retour au dashboard</button>
      </div>

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

        <Section title="Sources de données" hint="Chaque client peut avoir une organisation différente : Excel/Dropbox, logiciel de comptabilité, API, export manuel… Ajoute une entrée par source, elles seront documentées dans la config du tenant pour préparer l'intégration ETL.">
          {sources.map((s, i) => (
            <div key={s._key} style={{ border: '1px dashed var(--border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>Source #{i + 1}</span>
                {sources.length > 1 && (
                  <button type="button" onClick={() => removeSource(s._key)} style={{
                    background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12,
                  }}>✕ Retirer</button>
                )}
              </div>
              <Row>
                <Field label="Nom / ce que ça alimente" hint="ex: Comptabilité, Production journalière, Ventes">
                  <input value={s.label} onChange={setSource(s._key, 'label')} placeholder="Comptabilité" style={inputStyle} />
                </Field>
                <Field label="Type de source">
                  <select value={s.type} onChange={setSource(s._key, 'type')} style={inputStyle}>
                    {SOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
              </Row>
              <Row>
                <Field label="Emplacement / URL" hint="chemin de dossier, lien Sheets, URL d'API...">
                  <input value={s.emplacement} onChange={setSource(s._key, 'emplacement')} placeholder="/Client/Compta/2026 ou https://..." style={inputStyle} />
                </Field>
                <Field label="Accès / identifiants" hint="méthode d'accès — ne pas mettre de mot de passe ici, juste une référence">
                  <input value={s.acces} onChange={setSource(s._key, 'acces')} placeholder="Token Dropbox partagé, compte API référence..." style={inputStyle} />
                </Field>
              </Row>
              <Row>
                <Field label="Fréquence de mise à jour">
                  <select value={s.frequence} onChange={setSource(s._key, 'frequence')} style={inputStyle}>
                    {FREQUENCES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
              </Row>
              <Field label="Notes pour l'intégration" hint="détails utiles au développeur qui câblera l'import (structure des fichiers, particularités, contact technique côté client...)">
                <textarea value={s.notes} onChange={setSource(s._key, 'notes')} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </Field>
            </div>
          ))}
          <button type="button" onClick={addSource} style={{
            background: 'transparent', border: '1px dashed var(--gold)', color: 'var(--gold)',
            borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontSize: 13, alignSelf: 'flex-start',
          }}>+ Ajouter une source</button>
        </Section>

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

        <button type="submit" disabled={busy} style={{
          background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 10,
          padding: '14px 24px', fontSize: 15, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
          opacity: busy ? 0.6 : 1,
        }}>
          {busy ? 'Création en cours…' : 'Créer le tenant'}
        </button>

        {result?.ok && (
          <div style={{ background: 'rgba(63,163,77,0.12)', border: '1px solid var(--green)', borderRadius: 10, padding: 16, color: 'var(--text)' }}>
            ✓ Tenant <strong>{result.tenant_id}</strong> créé. Invitation envoyée à <strong>{result.invited_user}</strong>.
            <br />Les sources de données saisies sont enregistrées dans <code>tenant_config</code> — l'import (ETL) reste à câbler
            par source (voir ONBOARDING.md) : réutilisable directement pour Excel/Dropbox, sur-mesure pour les autres types.
          </div>
        )}
        {result?.error && (
          <div style={{ background: 'rgba(224,92,92,0.12)', border: '1px solid var(--red)', borderRadius: 10, padding: 16, color: 'var(--text)' }}>
            ✗ {result.error}
          </div>
        )}
      </form>
    </div>
  )
}

function Section({ title, hint, children }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: hint ? 6 : 14 }}>
        {title}
      </div>
      {hint && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 14 }}>{hint}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
    {Array.isArray(children) ? children.map((c, i) => <div key={i} style={{ flex: 1, minWidth: 200 }}>{c}</div>) : children}
  </div>
}

function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-dim)' }}>
      {label}
      {children}
      {hint && <span style={{ fontSize: 11, opacity: 0.7 }}>{hint}</span>}
    </label>
  )
}

const inputStyle = {
  background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '10px 12px', color: 'var(--text)', fontSize: 14, width: '100%',
}
