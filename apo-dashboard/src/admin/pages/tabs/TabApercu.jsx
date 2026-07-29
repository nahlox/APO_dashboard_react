import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../db/supabase'
import { Card, Stat, Badge, money, dateFR, dateTimeFR, freshness } from '../../ui'

/** Aperçu : santé des données, activité récente, points de vigilance. */
export default function TabApercu({ tenant, config }) {
  const [health, setHealth] = useState(null)
  const [runs, setRuns]     = useState([])
  const [kpis, setKpis]     = useState([])

  useEffect(() => {
    supabase.rpc('admin_tenant_health', { p_tenant_id: tenant.id })
      .then(({ data }) => setHealth(data ?? []))
    supabase.from('etl_runs').select('*').eq('tenant_id', tenant.id)
      .order('demarre_le', { ascending: false }).limit(5)
      .then(({ data }) => setRuns(data ?? []))
    supabase.from('kpis_mensuels')
      .select('ca_total_fcfa, resultat_net_fcfa, periodes(annee, mois, libelle)')
      .eq('tenant_id', tenant.id).order('periode_id', { ascending: false }).limit(3)
      .then(({ data }) => setKpis(data ?? []))
  }, [tenant.id])

  // Points de vigilance calculés
  const alertes = []
  if (health) {
    for (const h of health) {
      if (h.nb_lignes === 0) alertes.push(`${h.domaine} : aucune donnée importée`)
      else if (h.jours_retard > 7) alertes.push(`${h.domaine} : ${h.jours_retard} jours de retard`)
    }
  }
  if (!config?.sources?.length) alertes.push("Aucune source de données documentée")
  if (runs.length && runs[0].statut === 'erreur') alertes.push(`Dernier import en erreur : ${runs[0].message || 'voir le journal'}`)
  if (config?.rapport_email_actif === false) alertes.push('Rapport email désactivé pour ce client')

  return (
    <>
      <div className="admin-grid" style={{ marginBottom: 14 }}>
        <Stat label="Mois suivis" value={kpis.length ? `${kpis[0].periodes?.libelle} ${kpis[0].periodes?.annee}` : '—'} hint="dernier mois avec KPIs" />
        <Stat label="CA dernier mois" value={kpis.length ? `${money(kpis[0].ca_total_fcfa)} FCFA` : '—'} />
        <Stat label="Résultat dernier mois" value={kpis.length ? `${money(kpis[0].resultat_net_fcfa)} FCFA` : '—'} />
        <Stat label="Dernier import" value={runs.length ? dateTimeFR(runs[0].demarre_le) : 'Jamais'}
              hint={runs.length ? `${runs[0].source} · ${runs[0].statut}` : 'aucun run enregistré'} />
      </div>

      {alertes.length > 0 && (
        <Card title={`Points de vigilance (${alertes.length})`}>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alertes.map((a, i) => <li key={i} style={{ fontSize: 13.5 }}>{a}</li>)}
          </ul>
        </Card>
      )}

      <Card title="Fraîcheur des données par domaine"
            right={<Link to={`/admin/c/${tenant.id}/integrations`} className="admin-hint">Voir les intégrations →</Link>}>
        {!health && <div className="admin-loading">Chargement…</div>}
        {health && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Domaine</th><th className="admin-num">Lignes</th><th>Dernière donnée</th><th>Fraîcheur</th></tr>
              </thead>
              <tbody>
                {health.map(h => {
                  const f = freshness(h.jours_retard)
                  return (
                    <tr key={h.domaine}>
                      <td>{h.domaine}</td>
                      <td className="admin-num">{Number(h.nb_lignes).toLocaleString('fr-FR')}</td>
                      <td>{h.derniere_date ? dateFR(h.derniere_date) : '—'}</td>
                      <td>{h.nb_lignes === 0 ? <Badge kind="danger">Vide</Badge> : <Badge kind={f.kind}>{f.text}</Badge>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Derniers imports">
        {runs.length === 0 && <div className="admin-empty" style={{ padding: 20 }}>Aucun import enregistré pour ce client.</div>}
        {runs.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Démarré</th><th>Source</th><th>Statut</th><th>Message</th></tr></thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.id}>
                    <td>{dateTimeFR(r.demarre_le)}</td>
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
