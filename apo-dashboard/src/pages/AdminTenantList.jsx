import { useEffect, useState } from 'react'
import { supabase } from '../db/supabase'
import { Section, Row, Field, inputStyle, btnPrimary, btnGhost, Banner } from '../components/admin/AdminUI'
import SourcesEditor, { newSource, withKey } from '../components/admin/SourcesEditor'

const PLANS = ['starter', 'business', 'enterprise']
const ROLES = ['owner', 'manager', 'viewer']

export default function AdminTenantList() {
  const [tenants, setTenants]   = useState(null) // null = chargement
  const [selectedId, setSelectedId] = useState(null)

  async function loadTenants() {
    const { data } = await supabase.from('tenants').select('*').order('cree_le', { ascending: false })
    setTenants(data ?? [])
  }

  useEffect(() => { loadTenants() }, [])

  if (tenants === null) {
    return <div style={{ color: 'var(--text-dim)', padding: 20 }}>Chargement…</div>
  }

  if (selectedId) {
    return (
      <TenantDetail
        tenantId={selectedId}
        onBack={() => { setSelectedId(null); loadTenants() }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {tenants.length === 0 && (
        <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>Aucun client pour l'instant.</div>
      )}
      {tenants.map(t => (
        <div
          key={t.id}
          onClick={() => setSelectedId(t.id)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px',
            cursor: 'pointer', background: 'var(--dark2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: t.actif ? 'var(--green)' : 'var(--text-dim)',
            }} title={t.actif ? 'Actif' : 'Inactif'} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>{t.nom_affichage || t.nom}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{t.id} · {t.pays} · {t.plan}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {t.cree_le ? new Date(t.cree_le).toLocaleDateString('fr-FR') : ''} →
          </div>
        </div>
      ))}
    </div>
  )
}

function TenantDetail({ tenantId, onBack }) {
  const [tenant, setTenant]   = useState(null)
  const [config, setConfig]   = useState(null)
  const [sources, setSources] = useState([newSource()])
  const [reportRecipients, setReportRecipients] = useState('')
  const [tankCapacite, setTankCapacite] = useState('')
  const [users, setUsers]     = useState(null)
  const [saving, setSaving]   = useState(false)
  const [banner, setBanner]   = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('viewer')
  const [inviting, setInviting] = useState(false)

  async function loadAll() {
    const { data: t } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
    setTenant(t)

    const { data: cfgRow } = await supabase.from('tenant_config').select('config').eq('tenant_id', tenantId).maybeSingle()
    const cfg = cfgRow?.config ?? {}
    setConfig(cfg)
    setReportRecipients((cfg.report_recipients ?? []).join(', '))
    setTankCapacite(cfg.tank_capacite_kg ?? '')
    setSources(cfg.sources?.length ? cfg.sources.map(withKey) : [newSource()])

    await loadUsers()
  }

  async function loadUsers() {
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.functions.invoke('admin-tenant-users', {
      body: { tenant_id: tenantId },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    if (!error) setUsers(data?.users ?? [])
  }

  useEffect(() => { loadAll() }, [tenantId])

  const set = (field) => (e) => setTenant(t => ({ ...t, [field]: e.target.value }))

  async function handleSaveTenant(e) {
    e.preventDefault()
    setSaving(true)
    setBanner(null)
    try {
      const { error: tErr } = await supabase.from('tenants').update({
        nom_affichage: tenant.nom_affichage,
        pays: tenant.pays,
        plan: tenant.plan,
        actif: tenant.actif,
        couleur_primaire: tenant.couleur_primaire,
        couleur_secondaire: tenant.couleur_secondaire,
        logo_url: tenant.logo_url || null,
        email_from: tenant.email_from || null,
      }).eq('id', tenantId)
      if (tErr) throw tErr

      const newConfig = {
        ...config,
        report_recipients: reportRecipients.split(',').map(s => s.trim()).filter(Boolean),
        tank_capacite_kg: tankCapacite ? Number(tankCapacite) : null,
        sources: sources.filter(s => s.label.trim()).map(({ _key, ...s }) => s),
      }
      const { error: cErr } = await supabase.from('tenant_config')
        .upsert({ tenant_id: tenantId, config: newConfig })
      if (cErr) throw cErr

      setConfig(newConfig)
      setBanner({ ok: 'Modifications enregistrées.' })
    } catch (err) {
      setBanner({ error: err.message || 'Erreur inconnue' })
    } finally {
      setSaving(false)
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    setInviting(true)
    setBanner(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase.functions.invoke('admin-invite-user', {
        body: { tenant_id: tenantId, email: inviteEmail.trim(), role: inviteRole },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setBanner({ ok: data.invited ? `Invitation envoyée à ${data.email}.` : `${data.email} associé au tenant.` })
      setInviteEmail('')
      await loadUsers()
    } catch (err) {
      setBanner({ error: err.message || 'Erreur inconnue' })
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleChange(userId, role) {
    await supabase.from('user_tenants').update({ role }).eq('user_id', userId).eq('tenant_id', tenantId)
    loadUsers()
  }

  async function handleRemoveUser(userId) {
    await supabase.from('user_tenants').delete().eq('user_id', userId).eq('tenant_id', tenantId)
    loadUsers()
  }

  if (!tenant || !config) {
    return <div style={{ color: 'var(--text-dim)', padding: 20 }}>Chargement…</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button type="button" onClick={onBack} style={{ ...btnGhost, alignSelf: 'flex-start' }}>← Tous les clients</button>

      <form onSubmit={handleSaveTenant} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Section title="Identité" right={
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-dim)' }}>
            <input type="checkbox" checked={!!tenant.actif} onChange={e => setTenant(t => ({ ...t, actif: e.target.checked }))} />
            Actif
          </label>
        }>
          <Field label="Identifiant technique">
            <input value={tenant.id} disabled style={{ ...inputStyle, opacity: 0.6 }} />
          </Field>
          <Field label="Nom affiché">
            <input value={tenant.nom_affichage || ''} onChange={set('nom_affichage')} style={inputStyle} />
          </Field>
          <Row>
            <Field label="Pays (code)">
              <input value={tenant.pays || ''} onChange={set('pays')} style={inputStyle} />
            </Field>
            <Field label="Plan">
              <select value={tenant.plan} onChange={set('plan')} style={inputStyle}>
                {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </Row>
        </Section>

        <Section title="Branding">
          <Row>
            <Field label="Couleur primaire">
              <input type="color" value={tenant.couleur_primaire || '#F28C28'} onChange={set('couleur_primaire')} style={{ ...inputStyle, padding: 4, height: 40 }} />
            </Field>
            <Field label="Couleur secondaire">
              <input type="color" value={tenant.couleur_secondaire || '#3FA34D'} onChange={set('couleur_secondaire')} style={{ ...inputStyle, padding: 4, height: 40 }} />
            </Field>
          </Row>
          <Field label="Logo (URL publique)" hint="héberger l'image (ex: Supabase Storage) puis coller l'URL ici">
            <input value={tenant.logo_url || ''} onChange={set('logo_url')} placeholder="https://.../logo.png" style={inputStyle} />
          </Field>
        </Section>

        <Section title="Rapports & email">
          <Field label="Expéditeur email (Resend)">
            <input value={tenant.email_from || ''} onChange={set('email_from')} placeholder="Huilerie Bénin <rapport@domaine.com>" style={inputStyle} />
          </Field>
          <Field label="Destinataires des rapports" hint="emails séparés par des virgules">
            <input value={reportRecipients} onChange={e => setReportRecipients(e.target.value)} placeholder="a@x.com, b@x.com" style={inputStyle} />
          </Field>
        </Section>

        <Section title="Production">
          <Field label="Capacité tank (kg)">
            <input type="number" value={tankCapacite} onChange={e => setTankCapacite(e.target.value)} style={inputStyle} />
          </Field>
        </Section>

        <SourcesEditor sources={sources} setSources={setSources} />

        <button type="submit" disabled={saving} style={{ ...btnPrimary, padding: '14px 24px', fontSize: 15, alignSelf: 'flex-start', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>

        {banner?.ok && <Banner ok={banner.ok} />}
        {banner?.error && <Banner error={banner.error} />}
      </form>

      <Section title="Utilisateurs">
        {users === null && <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Chargement…</div>}
        {users?.map(u => (
          <div key={u.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <div>
              <div style={{ color: 'var(--text)', fontSize: 14 }}>{u.email}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {u.last_sign_in_at ? `Dernière connexion ${new Date(u.last_sign_in_at).toLocaleDateString('fr-FR')}` : 'Jamais connecté'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select value={u.role} onChange={e => handleRoleChange(u.user_id, e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '6px 10px' }}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button type="button" onClick={() => handleRemoveUser(u.user_id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12 }}>
                ✕ Retirer
              </button>
            </div>
          </div>
        ))}

        <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 4 }}>
          <Field label="Ajouter un utilisateur">
            <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@client.com" style={inputStyle} />
          </Field>
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ ...inputStyle, width: 140 }}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="submit" disabled={inviting} style={{ ...btnPrimary, opacity: inviting ? 0.6 : 1 }}>
            {inviting ? 'Envoi…' : 'Inviter'}
          </button>
        </form>
      </Section>
    </div>
  )
}
