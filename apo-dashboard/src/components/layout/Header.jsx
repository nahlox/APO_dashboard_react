import { useDashboardStore } from '../../store/dashboardStore'

export default function Header() {
  const { sidebarOpen, toggleMobileMenu } = useDashboardStore()

  return (
    <header>
      <div className="logo-area">
        {/* Hamburger visible uniquement sur mobile */}
        <button
          className={`mobile-menu-btn${sidebarOpen ? ' open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>

        <div className="logo-icon">🌴</div>
        <div className="logo-text">
          <h1>APO</h1>
          <span>Agro Palm Oil — Tableau de Bord Global</span>
        </div>
      </div>
      <div className="header-right">
        <div className="period">Janvier – Février 2026</div>
        <div className="updated">Données comptables consolidées</div>
      </div>
    </header>
  )
}
