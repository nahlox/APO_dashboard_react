import { useState } from 'react'
import { useDashboardStore } from '../store/dashboardStore'
import { btnGhost } from '../components/admin/AdminUI'
import AdminCreateTenant from './AdminCreateTenant'
import AdminTenantList from './AdminTenantList'

const TABS = [
  { id: 'clients', label: 'Clients' },
  { id: 'creer',   label: '+ Nouveau client' },
]

export default function AdminPanel() {
  const { setShowAdmin } = useDashboardStore()
  const [tab, setTab] = useState('clients')

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Administration — Clients</h1>
        <button onClick={() => setShowAdmin(false)} style={btnGhost}>← Retour au dashboard</button>
      </div>

      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '10px 16px', fontSize: 14, fontWeight: 600,
              color: tab === t.id ? 'var(--gold)' : 'var(--text-dim)',
              borderBottom: tab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'clients' && <AdminTenantList />}
      {tab === 'creer' && <AdminCreateTenant onCreated={() => setTab('clients')} />}
    </div>
  )
}
