import { useDashboardStore } from '../../store/dashboardStore'

const MODULE_NAMES = {
  'vue-ensemble': "Vue d'Ensemble",
  'production':   'Production & Graines',
  'revenus':      'Revenus & Ventes',
  'charges':      'Charges & Coûts',
  'fournisseurs': 'Fournisseurs',
}

export default function Header() {
  const { sidebarOpen, toggleMobileMenu, activeTab, activePnlMonth } = useDashboardStore()
  const currentTab = activeTab['global'] ?? 'vue-ensemble'
  const sectionName = activePnlMonth ? 'Compte de Résultat' : (MODULE_NAMES[currentTab] ?? "Vue d'Ensemble")

  return (
    <header>
      <div className="logo-area">
        <button
          className={`mobile-menu-btn${sidebarOpen ? ' open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>

        <div className="header-breadcrumb">
          <div className="header-breadcrumb-top">Pilotage · Tableau de bord</div>
          <div className="header-breadcrumb-section">{sectionName}</div>
        </div>
      </div>
      <div className="header-right" />
    </header>
  )
}
