import { useDashboardStore } from '../../store/dashboardStore'
import { monthLabel } from '../../lib/monthUtils'

const MODULES = [
  { id: 'vue-ensemble', label: "Vue d'Ensemble",      icon: '📊' },
  { id: 'production',   label: 'Production & Graines', icon: '🌴' },
  { id: 'revenus',      label: 'Revenus & Ventes',     icon: '💰' },
  { id: 'charges',      label: 'Charges & Coûts',      icon: '💸' },
  { id: 'fournisseurs', label: 'Fournisseurs',         icon: '🚚' },
  { id: 'pepiniere',    label: 'Pépinière',            icon: '🌱' },
]

export default function Sidebar({ allMois = [] }) {
  const {
    sidebarCollapsed, sidebarOpen,
    theme, currency, eurRate, eurRateDate,
    activeTab, setActiveTab,
    activePnlMonth, setActivePnlMonth,
    toggleSidebar, toggleTheme, toggleCurrency,
    closeMobileMenu,
  } = useDashboardStore()

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

        {allMois.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-label">Documents</div>

            {allMois.map(({ key, data }) => (
              <div
                key={key}
                className={`sidebar-module-btn${activePnlMonth === key ? ' active' : ''}`}
                onClick={() => handlePnl(key)}
                title={`Compte de résultat ${monthLabel(data)} ${data._etl.annee}`}
              >
                <span className="sidebar-module-icon">📄</span>
                <span className="sidebar-module-label">P&L {monthLabel(data)}</span>
              </div>
            ))}
          </div>
        )}

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
