import { useState, useMemo } from 'react'
import { useDashboardStore } from '../../store/dashboardStore'
import { monthShort } from '../../lib/monthUtils'

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
  const yearGroups = useMemo(() => groupByYear(allMois), [allMois])

  const currentTab = activeTab['global'] ?? 'vue-ensemble'
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

        {/* Header: logo + collapse button (hamburger only on mobile becomes close) */}
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
          {/* Close button — only visible on mobile drawer */}
          <button
            className="sidebar-close-btn"
            onClick={closeMobileMenu}
            aria-label="Fermer le menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Modules — masqués sur mobile (la bottom-nav prend le relais) */}
        <div className="sidebar-section sidebar-section-modules">
          <div className="sidebar-label">Pilotage</div>

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

        {/* Documents — Compte de Résultat avec pills par mois */}
        {yearGroups.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-label">Documents</div>

            <div className="sidebar-doc-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6"/><path d="M16 13H8M16 17H8"/>
              </svg>
              <span className="sidebar-doc-title">Compte de Résultat</span>
            </div>

            {yearGroups.map(([year, months]) => (
              <div key={year} className="sidebar-doc-year-group">
                <div className="sidebar-doc-year">{year}</div>
                <div className="sidebar-month-pills">
                  {months.map(({ key, data }) => (
                    <button
                      key={key}
                      className={`sidebar-month-pill${activePnlMonth === key ? ' active' : ''}`}
                      onClick={() => handlePnl(key)}
                      title={`Compte de résultat ${monthShort(data)} ${data._etl.annee}`}
                    >
                      {monthShort(data)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom: Apparence + Devise + Notifications + User */}
        <div className="sidebar-currency">
          <div className="sc-label">Apparence</div>

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
                <div className="theme-flick-pill" style={{ transform: `translateX(${idx * 100}%)` }} />
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
            <br />{eurRateDate ? `Live · ${eurRateDate}` : 'Taux fixe BCEAO'}
          </div>

        </div>
      </aside>
    </>
  )
}
