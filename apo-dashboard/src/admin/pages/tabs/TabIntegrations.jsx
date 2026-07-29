import { useEffect, useState } from 'react'
import { supabase } from '../../../db/supabase'
import { Card, Field, Badge, Banner, dateFR, dateTimeFR, logAction } from '../../ui'

const TYPES_SOURCE = [
  { value: 'excel_dropbox',      label: 'Excel / Dropbox' },
  { value: 'sage',               label: 'Sage (agent on-site)' },
  { value: 'google_sheets',      label: 'Google Sheets' },
  { value: 'logiciel_comptable', label: 'Autre logiciel comptable (Odoo, QuickBooks…)' },
  { value: 'api',                label: 'API externe' },
  { value: 'saisie_manuelle',    label: 'Saisie manuelle / export ponctuel' },
  { value: 'autre',              label: 'Autre' },
]
const FREQUENCES = ['quotidien', 'hebdomadaire', 'mensuel', 'ponctuel']

let seq = 0
const nouvelleSource = () => ({
  _key: ++seq, label: '', type: 'excel_dropbox', emplacement: '',
  acces: '', frequence: 'quotidien', notes: '',
})

/** Génère une clé d'ingestion et n'enregistre que son empreinte SHA-256. */
async function sha256hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function TabIntegrations({ tenantId, config, onSaved }) {
  const [sources, setSources] = useState(
    config.sources?.length ? config.sources.map(s => ({ _key: ++seq, ...s })) : [nouvelleSource()]
  )
  const [keys, setKeys]       = useState(null)
  const [runs, setRuns]       = useState(null)
  const [banner, setBanner]   = useState(null)
  const [busy, setBusy]       = useState(false)
  const [keyLabel, setKeyLabel] = useState('')
  const [nouvelleCle, setNouvelleCle] = useState(null)

  async function loadKeys() {
    const { data } = await supabase.from('tenant_api_keys')
      .select('id, label, actif, cree_le, dernier_usage').eq('tenant_id', tenantId)
      .order('cree_le', { ascending: false })
    setKeys(data ?? [])
  }
  async function loadRuns() {
    const { data } = await supabase.from('etl_runs').select('*').eq('tenant_id', tenantId)
      .order('demarre_le', { ascending: false }).limit(30)
    setRuns(data ?? [])
  }
  useEffect(() => { loadKeys(); loadRuns() }, [tenantId])

  const setSrc = (key, f) => (e) =>
    setSources(l => l.map(s => s._key === key ? { ...s, [f]: e.target.value } : s))

  async function saveSources(e) {
    e.preventDefault()
    setBusy(true); setBanner(null)
    try {
      const propres = sources.filter(s => s.label.trim()).map(({ _key, ...s }) => s)
      const { error } = await supabase.from('tenant_config')
        .upsert({ tenant_id: tenantId, config: { ...config, sources: propres } })
      if (error) throw error
      await logAction('sources_update', tenantId, { nb_sources: propres.length })
      setBanner({ ok: 'Sources enregistrées.' })
      onSaved?.()
    } catch (err) { setBanner({ error: err.message }) }
    finally { setBusy(false) }
  }

  async function createKey(e) {
    e.preventDefault()
    setBusy(true); setBanner(null); setNouvelleCle(null)
    try {
      const rnd = crypto.getRandomValues(new Uint8Array(24))
      const cle = `pk_${tenantId}_${[...rnd].map(b => b.toString(16).padStart(2, '0')).join('')}`
      const { error } = await supabase.from('tenant_api_keys').insert({
        tenant_id: tenantId, key_hash: await sha256hex(cle),
        label: keyLabel.trim() || `ingest_${tenantId}`,
      })
      if (error) throw error
      await logAction('key_create', tenantId, { label: keyLabel })
      setNouvelleCle(cle)
      setKeyLabel('')
      loadKeys()
    } catch (err) { setBanner({ error: err.message }) }
    finally { setBusy(false) }
  }

  async function revokeKey(id, label) {
    if (!confirm(`Révoquer la clé « ${label} » ?\n\nL'agent qui l'utilise ne pourra plus envoyer de données.`)) return
    const { error } = await supabase.from('tenant_api_keys').update({ actif: false }).eq('id', id)
    if (error) return setBanner({ error: error.message })
    await logAction('key_revoke', tenantId, { id, label })
    setBanner({ ok: `Clé « ${label} » révoquée.` })
    loadKeys()
  }

  return (
    <>
      <Banner {...(banner ?? {})} />

      <form onSubmit={saveSources}>
        <Card title="Sources de données du client"
              right={<button type="button" className="admin-btn admin-btn-ghost"
                             onClick={() => setSources(l => [...l, nouvelleSource()])}>+ Ajouter</button>}>
          <div className="admin-hint" style={{ marginBottom: 6 }}>
            Décrit d'où viennent les données de ce client. Sert de spécification pour brancher
            l'import : Excel/Dropbox réutilise <span className="admin-mono">etl_cloud.py</span>,
            Sage passe par un agent on-site qui pousse via l'API d'ingestion ci-dessous.
          </div>

          {sources.map((s, i) => (
            <div key={s._key} style={{ border: '1px dashed var(--a-border)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="admin-metric-label">Source #{i + 1}</span>
                {sources.length > 1 && (
                  <button type="button" className="admin-btn admin-btn-danger"
                          onClick={() => setSources(l => l.filter(x => x._key !== s._key))}>Retirer</button>
                )}
              </div>
              <div className="admin-row">
                <Field label="Nom / ce que ça alimente">
                  <input className="admin-input" value={s.label} onChange={setSrc(s._key, 'label')} placeholder="Comptabilité" />
                </Field>
                <Field label="Type">
                  <select className="admin-select" value={s.type} onChange={setSrc(s._key, 'type')}>
                    {TYPES_SOURCE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Fréquence">
                  <select className="admin-select" value={s.frequence} onChange={setSrc(s._key, 'frequence')}>
                    {FREQUENCES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
              </div>
              <div className="admin-row">
                <Field label="Emplacement / URL">
                  <input className="admin-input" value={s.emplacement} onChange={setSrc(s._key, 'emplacement')}
                         placeholder="/Client/Compta/2026, serveur SQL, https://…" />
                </Field>
                <Field label="Moyen d'accès" hint="référence uniquement — jamais de mot de passe ici">
                  <input className="admin-input" value={s.acces} onChange={setSrc(s._key, 'acces')}
                         placeholder="Token Dropbox partagé, compte SQL lecture seule…" />
                </Field>
              </div>
              <Field label="Notes d'intégration">
                <textarea className="admin-textarea" rows={2} value={s.notes} onChange={setSrc(s._key, 'notes')} />
              </Field>
            </div>
          ))}

          <div className="admin-actions">
            <button type="submit" className="admin-btn" disabled={busy}>Enregistrer les sources</button>
          </div>
        </Card>
      </form>

      <Card title="Clés d'ingestion (agents on-site)">
        <div className="admin-hint" style={{ marginBottom: 12 }}>
          Chaque agent installé chez le client (connecteur Sage notamment) s'authentifie avec sa
          propre clé. Le <span className="admin-mono">tenant_id</span> est forcé côté serveur : une
          clé de ce client ne peut écrire que sur ce client. Seule l'empreinte est stockée.
        </div>

        {nouvelleCle && (
          <div className="admin-banner info">
            <strong>Clé créée — copiez-la maintenant, elle ne sera plus jamais affichée :</strong>
            <div className="admin-secret">{nouvelleCle}</div>
            <div style={{ marginTop: 8, fontSize: 12.5 }}>
              À utiliser en en-tête HTTP <span className="admin-mono">x-api-key</span> vers
              <span className="admin-mono"> /functions/v1/ingest</span>.
            </div>
          </div>
        )}

        {keys === null && <div className="admin-loading">Chargement…</div>}
        {keys?.length === 0 && <div className="admin-empty" style={{ padding: 18 }}>Aucune clé pour ce client.</div>}
        {keys?.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Libellé</th><th>Créée</th><th>Dernier usage</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id}>
                    <td className="admin-mono">{k.label}</td>
                    <td>{dateFR(k.cree_le)}</td>
                    <td>{k.dernier_usage ? dateTimeFR(k.dernier_usage) : 'Jamais utilisée'}</td>
                    <td><Badge kind={k.actif ? 'ok' : 'danger'}>{k.actif ? 'Active' : 'Révoquée'}</Badge></td>
                    <td style={{ textAlign: 'right' }}>
                      {k.actif && <button className="admin-btn admin-btn-danger" onClick={() => revokeKey(k.id, k.label)}>Révoquer</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={createKey} className="admin-actions">
          <input className="admin-input" style={{ maxWidth: 260 }} value={keyLabel}
                 onChange={e => setKeyLabel(e.target.value)} placeholder="agent_sage_usine" />
          <button type="submit" className="admin-btn admin-btn-ghost" disabled={busy}>Générer une clé</button>
        </form>
      </Card>

      <Card title="Historique des imports" right={
        <button className="admin-btn admin-btn-ghost" onClick={loadRuns}>Rafraîchir</button>
      }>
        {runs === null && <div className="admin-loading">Chargement…</div>}
        {runs?.length === 0 && (
          <div className="admin-empty" style={{ padding: 18 }}>
            Aucun import enregistré. Les runs apparaissent ici dès que l'ETL ou un agent
            envoie son compte-rendu.
          </div>
        )}
        {runs?.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Démarré</th><th>Terminé</th><th>Source</th><th>Statut</th><th className="admin-num">Lignes</th><th>Message</th></tr></thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.id}>
                    <td>{dateTimeFR(r.demarre_le)}</td>
                    <td>{r.termine_le ? dateTimeFR(r.termine_le) : <Badge kind="warn">en cours</Badge>}</td>
                    <td className="admin-mono">{r.source}</td>
                    <td><Badge kind={r.statut === 'ok' ? 'ok' : r.statut === 'erreur' ? 'danger' : 'warn'}>{r.statut}</Badge></td>
                    <td className="admin-num">{r.lignes || 0}</td>
                    <td style={{ color: 'var(--a-dim)', maxWidth: 320 }}>{r.message || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
