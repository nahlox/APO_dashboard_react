import { useDashboardStore } from '../../store/dashboardStore'

const MODULE_ICONS = [
  { id: 'vue-ensemble', label: "Vue", icon: '📊' },
  { id: 'production',   label: 'Prod',  icon: '🌴' },
  { id: 'revenus',      label: 'Revenus', icon: '💰' },
  { id: 'charges',      label: 'Charges', icon: '💸' },
  { id: 'fournisseurs', label: 'Fourn.', icon: '🚚' },
  { id: 'pepiniere',    label: 'Pépin.', icon: '🌱', janOnly: true },
]

export default function MobileBottomNav() {
  const { activeMonth, activeTab, setActiveTab } = useDashboardStore()

  if (activeMonth === 'global') return null

  const currentTab = activeTab[activeMonth] ?? 'vue-ensemble'
  const tabs = MODULE_ICONS.filter(t => !t.janOnly || activeMonth === 'jan')

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation modules">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`mbn-item${currentTab === tab.id ? ' active' : ''}`}
          onClick={() => setActiveTab(activeMonth, tab.id)}
          aria-label={tab.label}
        >
          <span className="mbn-icon">{tab.icon}</span>
          <span className="mbn-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
