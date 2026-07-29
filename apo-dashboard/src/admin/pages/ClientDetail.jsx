import { useEffect, useState, useCallback } from 'react'
import { useParams, NavLink, Routes, Route, Link, Navigate } from 'react-router-dom'
import { supabase } from '../../db/supabase'
import { Badge } from '../ui'
import TabApercu from './tabs/TabApercu'
import TabUtilisateurs from './tabs/TabUtilisateurs'
import TabConfiguration from './tabs/TabConfiguration'
import TabIntegrations from './tabs/TabIntegrations'
import TabPlanComptable from './tabs/TabPlanComptable'

/** Fiche client : en-tête + onglets. Chaque onglet a sa propre URL. */
export default function ClientDetail() {
  const { tenantId } = useParams()
  const [tenant, setTenant] = useState(null)
  const [config, setConfig] = useState(null)
  const [err, setErr] = useState(null)

  const reload = useCallback(async () => {
    const [{ data: t, error: e1 }, { data: c }] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', tenantId).single(),
      supabase.from('tenant_config').select('config').eq('tenant_id', tenantId).maybeSingle(),
    ])
    if (e1) { setErr(e1.message); return }
    setTenant(t)
    setConfig(c?.config ?? {})
  }, [tenantId])

  useEffect(() => { reload() }, [reload])

  if (err) return <div className="admin-banner error">{err}</div>
  if (!tenant) return <div className="admin-loading">Chargement…</div>

  const base = `/admin/c/${tenantId}`

  return (
    <>
      <div className="admin-page-head">
        <Link to="/admin" className="admin-hint" style={{ textDecoration: 'none' }}>← Tous les clients</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div className="admin-client-avatar" style={{ background: tenant.couleur_primaire || '#6E8BFF' }}>
            {(tenant.nom_affichage || tenant.id).slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="admin-h1" style={{ marginBottom: 2 }}>{tenant.nom_affichage || tenant.id}</h1>
            <p className="admin-sub">
              <span className="admin-mono">{tenant.id}</span> · {tenant.pays} · plan {tenant.plan}
            </p>
          </div>
          <Badge kind={tenant.actif ? 'ok' : 'danger'}>{tenant.actif ? 'Actif' : 'Inactif'}</Badge>
        </div>
      </div>

      <nav className="admin-tabs">
        <NavLink to={base} end>Aperçu</NavLink>
        <NavLink to={`${base}/utilisateurs`}>Utilisateurs</NavLink>
        <NavLink to={`${base}/configuration`}>Configuration</NavLink>
        <NavLink to={`${base}/integrations`}>Intégrations & données</NavLink>
        <NavLink to={`${base}/plan-comptable`}>Plan comptable</NavLink>
      </nav>

      <Routes>
        <Route index               element={<TabApercu tenant={tenant} config={config} />} />
        <Route path="utilisateurs" element={<TabUtilisateurs tenantId={tenantId} />} />
        <Route path="configuration" element={<TabConfiguration tenant={tenant} config={config} onSaved={reload} />} />
        <Route path="integrations" element={<TabIntegrations tenantId={tenantId} config={config} onSaved={reload} />} />
        <Route path="plan-comptable" element={<TabPlanComptable tenantId={tenantId} />} />
        <Route path="*"            element={<Navigate to={base} replace />} />
      </Routes>
    </>
  )
}
