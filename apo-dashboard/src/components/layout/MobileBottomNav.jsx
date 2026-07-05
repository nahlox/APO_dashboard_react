import { useDashboardStore } from '../../store/dashboardStore'

const MODULES = [
  {
    id: 'production', label: 'Prod',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 20h10"/><path d="M12 20c0-7 0-9-3-12"/>
        <path d="M12 12c0-3 2-6 8-7-1 5-4 7-8 7Z"/>
        <path d="M12 14c0-3-2-5-7-5 1 4 4 6 7 5Z"/>
      </svg>
    ),
  },
  {
    id: 'revenus', label: 'Revenus',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>
        <path d="M6 12h.01M18 12h.01"/>
      </svg>
    ),
  },
  {
    id: 'vue-ensemble', label: 'Vue', center: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
        <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'charges', label: 'Charges',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6"/><path d="M18.1 10.4A6 6 0 1 1 10.3 18.1"/>
        <path d="M7 6h1.5v4"/><path d="M16.7 13.9l.7.7-2.8 2.8"/>
      </svg>
    ),
  },
  {
    id: 'fournisseurs', label: 'Fourn.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 18V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h2"/>
        <path d="M14 9h4l4 4v4a1 1 0 0 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
      </svg>
    ),
  },
]

export default function MobileBottomNav() {
  const { activeTab, setActiveTab } = useDashboardStore()
  const currentTab = activeTab['global'] ?? 'vue-ensemble'

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation modules">
      {MODULES.map(tab => (
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
