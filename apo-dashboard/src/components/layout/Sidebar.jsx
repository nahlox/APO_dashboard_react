import { useDashboardStore } from '../../store/dashboardStore'

export default function Sidebar() {
  const {
    sidebarCollapsed, sidebarOpen,
    theme, currency, eurRate, eurRateDate,
    toggleSidebar, toggleTheme, toggleCurrency,
    closeMobileMenu,
  } = useDashboardStore()

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

          <div className="sidebar-month-btn global-btn active">
            🌐 Vue Globale
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
              <input type="checkbox" checked={currency === 'EUR'} onChange={toggleCurrency} />
              <span className="toggle-slider" />
            </label>
            <span className={`toggle-label${currency === 'EUR' ? ' active' : ''}`}>EUR</span>
          </div>
          <div className="rate-info">
            1 € = <span>{eurRate.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} XOF</span>
            <br />{eurRateDate ? `Live · ${eurRateDate}` : 'Taux fixe BCF'}
          </div>
        </div>
      </aside>
    </>
  )
}
