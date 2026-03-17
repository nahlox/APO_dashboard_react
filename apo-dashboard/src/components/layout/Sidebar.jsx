import { useDashboardStore } from '../../store/dashboardStore'

export default function Sidebar() {
  const {
    activeMonth, sidebarCollapsed, sidebarOpen,
    theme, currency,
    toggleSidebar, toggleTheme, toggleCurrency,
    setActiveMonth, closeMobileMenu,
  } = useDashboardStore()

  const navigate = (month) => {
    setActiveMonth(month)
    closeMobileMenu()   // ferme le drawer sur mobile après navigation
  }

  return (
    <>
      {/* Overlay sombre — mobile uniquement */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeMobileMenu} />
      )}

      <aside className={[
        'sidebar',
        sidebarCollapsed ? 'collapsed' : '',
        sidebarOpen      ? 'open'      : '',
      ].filter(Boolean).join(' ')}>

        <div className="sidebar-header">
          <button
            className={`hamburger${sidebarCollapsed ? '' : ' open'}`}
            onClick={toggleSidebar}
            aria-label="Réduire le menu"
          >
            <span /><span /><span />
          </button>
          <span className="sidebar-brand">Menu</span>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Navigation</div>

          <div
            className={`sidebar-month-btn global-btn${activeMonth === 'global' ? ' active' : ''}`}
            onClick={() => navigate('global')}
          >
            🌐 Vue Globale
          </div>

          <div className="sidebar-divider" />

          <div
            className={`sidebar-month-btn${activeMonth === 'jan' ? ' active' : ''}`}
            onClick={() => navigate('jan')}
          >
            📅 Janvier 2026
          </div>

          <div className="sidebar-divider" />

          <div
            className={`sidebar-month-btn${activeMonth === 'feb' ? ' active' : ''}`}
            onClick={() => navigate('feb')}
          >
            📅 Février 2026
          </div>
        </div>

        <div className="sidebar-currency">
          <div className="sc-label">Apparence</div>
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="theme-text">{theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}</span>
            <span className="theme-indicator" />
          </button>

          <div className="sc-label" style={{ marginTop: 14 }}>Devise</div>
          <div className="toggle-wrap">
            <span className={`toggle-label${currency === 'FCFA' ? ' active' : ''}`}>FCFA</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={currency === 'USD'} onChange={toggleCurrency} />
              <span className="toggle-slider" />
            </label>
            <span className={`toggle-label${currency === 'USD' ? ' active' : ''}`}>USD</span>
          </div>
          <div className="rate-info">
            1 USD = <span>563 FCFA</span><br />XE.com · 11 mars 2026
          </div>
        </div>
      </aside>
    </>
  )
}
