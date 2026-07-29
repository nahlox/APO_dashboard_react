import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../db/supabase'
import { Card, Badge, dateTimeFR } from '../ui'

const LIBELLES = {
  config_update:    'Configuration modifiée',
  sources_update:   'Sources mises à jour',
  user_invite:      'Utilisateur invité',
  user_role_change: 'Rôle modifié',
  user_remove:      'Utilisateur retiré',
  key_create:       "Clé d'ingestion créée",
  key_revoke:       "Clé d'ingestion révoquée",
  mapping_upsert:   'Plan comptable — surcharge',
  mapping_delete:   'Plan comptable — suppression',
  tenant_create:    'Client créé',
}
const SENSIBLES = new Set(['user_remove', 'key_revoke', 'key_create', 'tenant_create'])

/** Journal d'activité : qui a changé quoi, sur quel client. */
export default function Journal() {
  const [rows, setRows] = useState(null)
  const [runs, setRuns] = useState([])

  useEffect(() => {
    supabase.from('admin_audit_log').select('*').order('cree_le', { ascending: false }).limit(100)
      .then(({ data }) => setRows(data ?? []))
    supabase.from('etl_runs').select('*').order('demarre_le', { ascending: false }).limit(20)
      .then(({ data }) => setRuns(data ?? []))
  }, [])

  return (
    <>
      <div className="admin-page-head">
        <h1 className="admin-h1">Journal d'activité</h1>
        <p className="admin-sub">Actions d'administration et imports de données, tous clients confondus.</p>
      </div>

      <Card title="Actions d'administration">
        {rows === null && <div className="admin-loading">Chargement…</div>}
        {rows?.length === 0 && (
          <div className="admin-empty" style={{ padding: 20 }}>
            Aucune action enregistrée. Le journal se remplit dès la première modification
            faite depuis cette console.
          </div>
        )}
        {rows?.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Date</th><th>Action</th><th>Client</th><th>Par</th><th>Détails</th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{dateTimeFR(r.cree_le)}</td>
                    <td>
                      {SENSIBLES.has(r.action)
                        ? <Badge kind="warn">{LIBELLES[r.action] || r.action}</Badge>
                        : (LIBELLES[r.action] || r.action)}
                    </td>
                    <td>
                      {r.tenant_id
                        ? <Link to={`/admin/c/${r.tenant_id}`} className="admin-mono">{r.tenant_id}</Link>
                        : '—'}
                    </td>
                    <td style={{ color: 'var(--a-dim)' }}>{r.acteur_email || '—'}</td>
                    <td className="admin-mono" style={{ color: 'var(--a-dim)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.details ? JSON.stringify(r.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Imports récents (tous clients)">
        {runs.length === 0 && <div className="admin-empty" style={{ padding: 20 }}>Aucun import enregistré.</div>}
        {runs.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Démarré</th><th>Client</th><th>Source</th><th>Statut</th><th>Message</th></tr></thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{dateTimeFR(r.demarre_le)}</td>
                    <td><Link to={`/admin/c/${r.tenant_id}`} className="admin-mono">{r.tenant_id}</Link></td>
                    <td className="admin-mono">{r.source}</td>
                    <td><Badge kind={r.statut === 'ok' ? 'ok' : r.statut === 'erreur' ? 'danger' : 'warn'}>{r.statut}</Badge></td>
                    <td style={{ color: 'var(--a-dim)' }}>{r.message || '—'}</td>
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
