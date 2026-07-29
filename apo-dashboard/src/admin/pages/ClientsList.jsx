import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../db/supabase'
import { Badge, Stat, money, dateFR, freshness } from '../ui'

/** Écran d'accueil : parc clients + santé de chacun en un coup d'œil. */
export default function ClientsList() {
  const [rows, setRows] = useState(null)
  const [err, setErr]   = useState(null)

  useEffect(() => {
    supabase.rpc('admin_tenants_overview').then(({ data, error }) => {
      if (error) setErr(error.message)
      setRows(data ?? [])
    })
  }, [])

  if (err)          return <div className="admin-banner error">{err}</div>
  if (rows === null) return <div className="admin-loading">Chargement…</div>

  const actifs   = rows.filter(r => r.actif)
  const enRetard = rows.filter(r => r.derniere_donnee &&
    (Date.now() - new Date(r.derniere_donnee)) / 86400000 > 7)
  const sansData = rows.filter(r => !r.derniere_donnee)

  return (
    <>
      <div className="admin-page-head">
        <h1 className="admin-h1">Clients</h1>
        <p className="admin-sub">Parc, fraîcheur des données et intégrations de chaque huilerie.</p>
      </div>

      <div className="admin-grid" style={{ marginBottom: 22 }}>
        <Stat label="Clients actifs" value={actifs.length} hint={`${rows.length} au total`} />
        <Stat label="Données en retard" value={enRetard.length} hint="plus de 7 jours sans donnée" />
        <Stat label="Sans aucune donnée" value={sansData.length} hint="intégration à finaliser" />
        <Stat label="CA suivi (cumulé)"
              value={money(rows.reduce((s, r) => s + Number(r.ca_total_fcfa || 0), 0)) + ' FCFA'}
              hint="tous clients confondus" />
      </div>

      {rows.length === 0 && (
        <div className="admin-empty">
          Aucun client pour l'instant. <Link to="/admin/nouveau">Créer le premier</Link>.
        </div>
      )}

      {rows.map(t => {
        const jours = t.derniere_donnee
          ? Math.floor((Date.now() - new Date(t.derniere_donnee)) / 86400000)
          : null
        const f = freshness(jours)
        return (
          <Link key={t.tenant_id} to={`/admin/c/${t.tenant_id}`} className="admin-client-card">
            <div className="admin-client-head">
              <div className="admin-client-avatar" style={{ background: t.couleur_primaire || '#6E8BFF' }}>
                {(t.nom_affichage || t.tenant_id).slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="admin-client-name">{t.nom_affichage || t.tenant_id}</div>
                <div className="admin-client-id">{t.tenant_id} · {t.pays} · {t.plan}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {!t.actif && <Badge kind="danger">Inactif</Badge>}
                <Badge kind={f.kind}>Données : {f.text}</Badge>
              </div>
            </div>

            <div className="admin-client-metrics">
              <div>
                <div className="admin-metric-label">Utilisateurs</div>
                <div className="admin-metric-value">{t.nb_users}</div>
              </div>
              <div>
                <div className="admin-metric-label">Mois suivis</div>
                <div className="admin-metric-value">{t.nb_periodes}</div>
              </div>
              <div>
                <div className="admin-metric-label">Écritures</div>
                <div className="admin-metric-value">{Number(t.nb_transactions).toLocaleString('fr-FR')}</div>
              </div>
              <div>
                <div className="admin-metric-label">CA suivi</div>
                <div className="admin-metric-value">{money(t.ca_total_fcfa)} FCFA</div>
              </div>
              <div>
                <div className="admin-metric-label">Dernier import</div>
                <div className="admin-metric-value">
                  {t.dernier_import ? dateFR(t.dernier_import) : '—'}
                  {t.dernier_import_statut === 'erreur' && ' ⚠'}
                </div>
              </div>
              <div>
                <div className="admin-metric-label">Clés d'ingestion</div>
                <div className="admin-metric-value">{t.nb_cles_actives}</div>
              </div>
            </div>
          </Link>
        )
      })}
    </>
  )
}
