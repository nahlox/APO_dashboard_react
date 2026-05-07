import { useDashboardStore } from '../../store/dashboardStore'

function cap(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function moisLabel(data) {
  // Compatible avec les deux formats : statique (_etl.mois) et Supabase (_etl.mois)
  return `${cap(data._etl.mois)} ${data._etl.annee}`
}

export default function Sidebar({ allMois = [] }) {
  const {
    activeMonth, sidebarCollapsed, sidebarOpen,
    theme, currency, eurRate, eurRateDate,
    toggleSidebar, toggleTheme, toggleCurrency,
    setActiveMonth, closeMobileMenu,
  } = useDashboardStore()

  const navigate = (month) => {
    setActiveMonth(month)
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

          {allMois.map(({ key, data }) => (
            <div key={key}>
              <div className="sidebar-divider" />
              <div
                className={`sidebar-month-btn${activeMonth === key ? ' active' : ''}`}
                onClick={() => navigate(key)}
              >
                📅 {moisLabel(data)}
              </div>
            </div>
          ))}
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
