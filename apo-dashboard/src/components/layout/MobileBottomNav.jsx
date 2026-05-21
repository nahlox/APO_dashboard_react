import { useDashboardStore } from '../../store/dashboardStore'

const MODULE_ICONS = [
  { id: 'vue-ensemble', label: "Vue",     icon: '📊' },
  { id: 'production',   label: 'Prod',    icon: '🌴' },
  { id: 'revenus',      label: 'Revenus', icon: '💰' },
  { id: 'charges',      label: 'Charges', icon: '💸' },
  { id: 'fournisseurs', label: 'Fourn.',  icon: '🚚' },
  { id: 'pepiniere',    label: 'Pépin.',  icon: '🌱' },
]

export default function MobileBottomNav() {
  const { activeTab, setActiveTab } = useDashboardStore()
  const currentTab = activeTab['global'] ?? 'vue-ensemble'

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation modules">
      {MODULE_ICONS.map(tab => (
        <button
          key={tab.id}
          className={`mbn-item${currentTab === tab.id ? ' active' : ''}`}
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
