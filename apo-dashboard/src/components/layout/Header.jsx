import { useDashboardStore } from '../../store/dashboardStore'
import { useAuth } from '../../contexts/AuthContext'
import { generatePnlPdf } from '../../lib/generatePnlPdf'

const MOIS_LIST = [
  { num: 1,  label: 'Janvier' },  { num: 2,  label: 'Février' },
  { num: 3,  label: 'Mars' },     { num: 4,  label: 'Avril' },
  { num: 5,  label: 'Mai' },      { num: 6,  label: 'Juin' },
  { num: 7,  label: 'Juillet' },  { num: 8,  label: 'Août' },
  { num: 9,  label: 'Septembre' },{ num: 10, label: 'Octobre' },
  { num: 11, label: 'Novembre' }, { num: 12, label: 'Décembre' },
]

function moisNum(libelle) {
  return MOIS_LIST.findIndex(m => m.label.toLowerCase() === (libelle || '').toLowerCase()) + 1
}

function getInitials(email) {
  if (!email) return '?'
  const name = email.split('@')[0]
  const parts = name.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const MODULE_NAMES = {
  'vue-ensemble': "Vue d'Ensemble",
  'production':   'Production & Graines',
  'revenus':      'Revenus & Ventes',
  'charges':      'Charges & Coûts',
  'fournisseurs': 'Fournisseurs',
}

export default function Header({ allMois = [] }) {
  const {
    sidebarOpen, toggleMobileMenu,
    activeTab, activePnlMonth,
    monthRange, setMonthRange, resetMonthRange,
    currency, moisData,
  } = useDashboardStore()
  const { user } = useAuth()

  const currentTab  = activeTab['global'] ?? 'vue-ensemble'
  const sectionName = activePnlMonth ? 'Compte de Résultat' : (MODULE_NAMES[currentTab] ?? "Vue d'Ensemble")

  // Period selector logic (mirrors MonthRangeFilter)
  const moisDispo = allMois
    .map(m => moisNum(m.data?._etl?.mois))
    .filter(n => n > 0)
    .sort((a, b) => a - b)

  const minDispo = moisDispo[0]
  const maxDispo = moisDispo[moisDispo.length - 1]
  const from  = monthRange.from ?? minDispo
  const to    = monthRange.to   ?? maxDispo
  const nbMois = (from && to) ? to - from + 1 : 0

  const handleFrom = (e) => {
    const v = parseInt(e.target.value, 10)
    setMonthRange(v, Math.max(v, to))
  }
  const handleTo = (e) => {
    const v = parseInt(e.target.value, 10)
    setMonthRange(Math.min(from, v), v)
  }

  // Export — PDF if in P&L view, else disabled
  const pnlData = activePnlMonth ? allMois.find(m => m.key === activePnlMonth)?.data : null
  const handleExport = () => {
    if (pnlData) generatePnlPdf(pnlData, currency)
  }

  const initials = getInitials(user?.email)

  return (
    <header>
      {/* Left: mobile hamburger + breadcrumb */}
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

      {/* Right: period selector + bell + export + avatar */}
      <div className="header-actions">
        {/* Period selector — hidden in P&L mode */}
        {!activePnlMonth && moisDispo.length > 0 && (
          <div className="header-period">
            <span className="header-period-label">Période</span>
            <select
              className="header-period-select"
              value={from}
              onChange={handleFrom}
            >
              {moisDispo.map(n => (
                <option key={n} value={n}>{MOIS_LIST[n - 1].label}</option>
              ))}
            </select>
            <span className="header-period-arrow">→</span>
            <select
              className="header-period-select"
              value={to}
              onChange={handleTo}
            >
              {moisDispo.map(n => (
                <option key={n} value={n}>{MOIS_LIST[n - 1].label}</option>
              ))}
            </select>
            <span className="header-period-count">{nbMois} mois</span>
          </div>
        )}

        {/* Bell notification */}
        <button className="header-icon-btn" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
        </button>

        {/* Export */}
        <button
          className="header-export-btn"
          onClick={handleExport}
          disabled={!pnlData}
          title={pnlData ? 'Exporter en PDF' : 'Ouvrez un P&L pour exporter'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M21 21H3"/>
          </svg>
          Exporter
        </button>

        {/* User avatar */}
        <div className="header-avatar" title={user?.email}>
          {initials}
        </div>
      </div>
    </header>
  )
}
