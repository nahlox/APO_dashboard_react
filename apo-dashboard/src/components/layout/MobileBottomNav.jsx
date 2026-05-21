import { useDashboardStore } from '../../store/dashboardStore'

const MODULE_ICONS = [
  { id: 'production',   label: 'Prod',    icon: '🌴' },
  { id: 'revenus',      label: 'Revenus', icon: '💰' },
  { id: 'vue-ensemble', label: "Vue",     icon: '📊', center: true },
  { id: 'charges',      label: 'Charges', icon: '💸' },
  { id: 'fournisseurs', label: 'Fourn.',  icon: '🚚' },
]

export default function MobileBottomNav() {
  const { activeTab, setActiveTab } = useDashboardStore()
  const currentTab = activeTab['global'] ?? 'vue-ensemble'

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation modules">
      {MODULE_ICONS.map(tab => (
        <button
          key={tab.id}
          className={`mbn-item${currentTab === tab.id ? ' active' : ''}${tab.center ? ' mbn-center' : ''}`}
          onClick={() => setActiveTab('global', tab.id)}
          aria-label={tab.label}
        >
          <span className="mbn-icon">{tab.icon}</span>
          <span className="mbn-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
