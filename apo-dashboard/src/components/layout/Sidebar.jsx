import { useState, useMemo, useEffect } from 'react'
import { useDashboardStore } from '../../store/dashboardStore'
import { useAuth } from '../../contexts/AuthContext'
import { monthLabel } from '../../lib/monthUtils'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { supabase } from '../../db/supabase'

/** Regroupe allMois par année → [['2026', [{key, data}, …]], …] */
function groupByYear(allMois) {
  const map = {}
  allMois.forEach(item => {
    const year = String(item.data._etl.annee)
    if (!map[year]) map[year] = []
    map[year].push(item)
  })
  return Object.entries(map).sort(([a], [b]) => Number(a) - Number(b))
}

const MODULES = [
  {
    id: 'vue-ensemble', label: "Vue d'Ensemble",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
        <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'production', label: 'Production & Graines',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 20h10"/><path d="M12 20c0-7 0-9-3-12"/>
        <path d="M12 12c0-3 2-6 8-7-1 5-4 7-8 7Z"/><path d="M12 14c0-3-2-5-7-5 1 4 4 6 7 5Z"/>
      </svg>
    ),
  },
  {
    id: 'revenus', label: 'Revenus & Ventes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>
        <path d="M6 12h.01M18 12h.01"/>
      </svg>
    ),
  },
  {
    id: 'charges', label: 'Charges & Coûts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6"/><path d="M18.1 10.4A6 6 0 1 1 10.3 18.1"/>
        <path d="M7 6h1.5v4"/><path d="M16.7 13.9l.7.7-2.8 2.8"/>
      </svg>
    ),
  },
  {
    id: 'fournisseurs', label: 'Fournisseurs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 18V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h2"/>
        <path d="M14 9h4l4 4v4a1 1 0 0 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
      </svg>
    ),
  },
]

export default function Sidebar({ allMois = [] }) {
  const {
    sidebarCollapsed, sidebarOpen,
    theme, currency, eurRate, eurRateDate,
    activeTab, setActiveTab,
    activePnlMonth, setActivePnlMonth,
    toggleSidebar, setTheme, toggleCurrency,
    closeMobileMenu,
  } = useDashboardStore()
  const { user, role, signOut } = useAuth()
  const { status: pushStatus, subscribe, unsubscribe } = usePushNotifications(supabase)

  // État des dossiers — ouverts par défaut
  const [pnlOpen, setPnlOpen]   = useState(true)
  const [openYears, setOpenYears] = useState({})   // { '2026': true }

  const yearGroups = useMemo(() => groupByYear(allMois), [allMois])

  // Initialise les années ouvertes dès qu'on a des données
  useEffect(() => {
    if (yearGroups.length) {
      setOpenYears(prev => {
        const next = { ...prev }
        yearGroups.forEach(([y]) => { if (next[y] === undefined) next[y] = true })
        return next
      })
    }
  }, [yearGroups])

  const toggleYear = (y) => setOpenYears(prev => ({ ...prev, [y]: !prev[y] }))

  const currentTab = activeTab['global'] ?? 'vue-ensemble'
  // Quand on est sur un P&L, aucun module n'est actif
  const isPnlOpen  = !!activePnlMonth

  const handleNav = (id) => {
    setActiveTab('global', id)
    closeMobileMenu()
  }

  const handlePnl = (key) => {
    setActivePnlMonth(key)
    closeMobileMenu()
  }

  return (
    <>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeMobileMenu} />
      )}

      <aside className={[
        'sidebar',
        sidebarCollapsed ? 'collapsed' : '',
        sidebarOpen      ? 'open'      : '',
      ].filter(Boolean).join(' ')}>

        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V11"/>
                <path d="M12 11c0-4 2-7 8-8-1 5-4 7-8 8Z"/>
                <path d="M12 11C12 7 10 4 4 3c1 5 4 7 8 8Z"/>
                <path d="M12 11c2-3 5-4 8-3-2 3-5 4-8 3Z"/>
                <path d="M12 11C10 8 7 7 4 8c2 3 5 4 8 3Z"/>
              </svg>
            </div>
            <div className="sidebar-logo-text">
              <div className="sidebar-brand">APO</div>
              <div className="sidebar-brand-sub">Agro Palm Oil</div>
            </div>
          </div>
          <button
            className={`hamburger${sidebarCollapsed ? '' : ' open'}`}
            onClick={sidebarOpen ? closeMobileMenu : toggleSidebar}
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Réduire le menu'}
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Modules — masqués sur mobile (la bottom-nav prend le relais) */}
        <div className="sidebar-section sidebar-section-modules">
          <div className="sidebar-label">Modules</div>

          {MODULES.map(m => (
            <div
              key={m.id}
              className={`sidebar-module-btn${!isPnlOpen && currentTab === m.id ? ' active' : ''}`}
              onClick={() => handleNav(m.id)}
            >
              <span className="sidebar-module-icon">{m.icon}</span>
              <span className="sidebar-module-label">{m.label}</span>
            </div>
          ))}
        </div>

        {yearGroups.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-label">Documents</div>

            {/* Dossier racine : P&L */}
            <div
              className={`sidebar-folder${pnlOpen ? ' open' : ''}`}
              onClick={() => setPnlOpen(o => !o)}
            >
              <span className="sf-chevron">{pnlOpen ? '▾' : '▸'}</span>
              <span className="sf-icon">📁</span>
              <span className="sf-label">P&amp;L</span>
            </div>

            {pnlOpen && (
              <div className="sf-children">
                {yearGroups.map(([year, months]) => (
                  <div key={year}>
                    {/* Dossier année */}
                    <div
                      className={`sidebar-folder sf-year${openYears[year] ? ' open' : ''}`}
                      onClick={() => toggleYear(year)}
                    >
                      <span className="sf-chevron">{openYears[year] ? '▾' : '▸'}</span>
                      <span className="sf-icon">📁</span>
                      <span className="sf-label">{year}</span>
                    </div>

                    {openYears[year] && (
                      <div className="sf-children sf-months">
                        {months.map(({ key, data }) => (
                          <div
                            key={key}
                            className={`sf-doc${activePnlMonth === key ? ' active' : ''}`}
                            onClick={() => handlePnl(key)}
                            title={`Compte de résultat ${monthLabel(data)} ${data._etl.annee}`}
                          >
                            <span className="sf-doc-icon">📄</span>
                            <span className="sf-doc-label">{monthLabel(data)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="sidebar-currency">
          <div className="sc-label">Apparence</div>

          {/* Slider thème : ☀️ Clair — ◑ Auto — 🌙 Sombre */}
          {(() => {
            const THEMES = ['light', 'auto', 'dark']
            const idx = THEMES.indexOf(theme)
            const options = [
              { value: 'light', icon: '○' },
              { value: 'auto',  icon: '◑' },
              { value: 'dark',  icon: '●' },
            ]
            return (
              <div className="theme-flick">
                <div
                  className="theme-flick-pill"
                  style={{ transform: `translateX(${idx * 100}%)` }}
                />
                {options.map(({ value, icon }) => (
                  <button
                    key={value}
                    className={`theme-flick-btn${theme === value ? ' active' : ''}`}
                    onClick={() => setTheme(value)}
                  >
                    <span className="tf-icon">{icon}</span>
                  </button>
                ))}
              </div>
            )
          })()}

          <div className="sc-label" style={{ marginTop: 14 }}>Devise</div>
          <div className="currency-pill">
            <button
              className={`currency-pill-btn${currency === 'FCFA' ? ' active' : ''}`}
              onClick={() => currency !== 'FCFA' && toggleCurrency()}
            >FCFA</button>
            <button
              className={`currency-pill-btn${currency === 'EUR' ? ' active' : ''}`}
              onClick={() => currency !== 'EUR' && toggleCurrency()}
            >EUR</button>
          </div>
          <div className="rate-info">
            1 € = <span>{eurRate.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} XOF</span>
            <br />{eurRateDate ? `Live · ${eurRateDate}` : 'Taux fixe BCF'}
          </div>

          {/* Notifications push quotidiennes */}
          {pushStatus !== 'unsupported' && (
            <div style={{ marginTop: 14 }}>
              <div className="sc-label">Notifications</div>
              <button
                onClick={pushStatus === 'subscribed' ? unsubscribe : subscribe}
                disabled={pushStatus === 'requesting' || pushStatus === 'denied'}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  background: pushStatus === 'subscribed' ? 'rgba(63,163,77,0.12)' : 'rgba(242,140,40,0.1)',
                  border: `1px solid ${pushStatus === 'subscribed' ? 'var(--green)' : 'var(--gold)'}`,
                  borderRadius: 8, padding: '7px 10px', cursor: pushStatus === 'denied' ? 'not-allowed' : 'pointer',
                  color: pushStatus === 'subscribed' ? 'var(--green)' : pushStatus === 'denied' ? 'var(--text-dim)' : 'var(--gold)',
                  fontSize: 12, fontWeight: 600,
                }}
              >
                <span style={{ fontSize: 15 }}>
                  {pushStatus === 'subscribed' ? '🔔' : pushStatus === 'requesting' ? '⏳' : pushStatus === 'denied' ? '🔕' : '🔔'}
                </span>
                {pushStatus === 'subscribed'  ? 'Notifications actives'  :
                 pushStatus === 'requesting'  ? 'Activation…'           :
                 pushStatus === 'denied'      ? 'Bloqué (navigateur)'   :
                                               'Activer les notifications'}
              </button>

              {/* BOUTON TEST — à supprimer après validation */}
              {pushStatus === 'subscribed' && (
                <button
                  onClick={async () => {
                    const SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Zmd2aGVucXpkdXRqY3hodWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI5ODk2MSwiZXhwIjoyMDkxODc0OTYxfQ.3_kNu864JFiKy1G7kWr5jZ04sLOUNW8ZPttuA1rhRUY'
                    const r = await fetch('https://iwfgvhenqzdutjcxhuip.supabase.co/functions/v1/daily-push', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${SVC}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ tenant_id: 'apo' }),
                    })
                    const d = await r.json()
                    alert(r.ok ? `✓ Envoyé — ${d.body}` : `Erreur : ${JSON.stringify(d)}`)
                  }}
                  style={{
                    marginTop: 6, width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(242,140,40,0.08)', border: '1px dashed var(--gold)',
                    borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
                    color: 'var(--gold)', fontSize: 12, fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: 15 }}>🧪</span> Envoyer notif maintenant
                </button>
              )}
            </div>
          )}

          {/* Avatar utilisateur en bas du menu */}
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-email">{user.email}</span>
                <span className="sidebar-user-role">{role}</span>
              </div>
              <button
                className="sidebar-logout-btn"
                onClick={signOut}
                title="Se déconnecter"
              >⎋</button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
