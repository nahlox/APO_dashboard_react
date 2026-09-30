import { useState, useEffect, useRef } from 'react'
import { useDashboardStore } from '../../store/dashboardStore'
import { useAuth } from '../../contexts/AuthContext'
import { generatePnlPdf } from '../../lib/generatePnlPdf'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { supabase } from '../../db/supabase'
import { usePeriode, MOIS_LABELS } from '../../hooks/usePeriode'

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
    currency, moisData,
  } = useDashboardStore()
  const { user, tenantId, signOut } = useAuth()
  const { status: pushStatus, subscribe, unsubscribe } = usePushNotifications(supabase, tenantId)

  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef(null)

  useEffect(() => {
    if (!avatarOpen) return
    function handleOutside(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [avatarOpen])

  const currentTab  = activeTab['global'] ?? 'vue-ensemble'
  const sectionName = activePnlMonth ? 'Compte de Résultat' : (MODULE_NAMES[currentTab] ?? "Vue d'Ensemble")

  const { annees, year, moisDispo, from, to, nbMois, handleYear, handleFrom, handleTo } = usePeriode(allMois)

  const pnlData = activePnlMonth ? allMois.find(m => m.key === activePnlMonth)?.data : null
  const handleExport = () => {
    if (pnlData) generatePnlPdf(pnlData, currency)
  }

  const initials = getInitials(user?.email)

  const handleBell = () => {
    if (pushStatus === 'subscribed') unsubscribe()
    else if (pushStatus !== 'denied' && pushStatus !== 'unsupported') subscribe()
  }

  const bellTitle = pushStatus === 'subscribed'
    ? 'Désactiver les notifications'
    : pushStatus === 'denied'
      ? 'Notifications bloquées par le navigateur'
      : 'Activer les notifications quotidiennes'

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
            {annees.length > 0 && (
              <select className="header-period-select" value={year ?? ''} onChange={handleYear} aria-label="Année">
                <option value="">Toutes années</option>
                {annees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
            <select
              className="header-period-select"
              value={from}
              onChange={handleFrom}
              aria-label="Mois de début"
            >
              {moisDispo.map(n => (
                <option key={n} value={n}>{MOIS_LABELS[n - 1]}</option>
              ))}
            </select>
            <span className="header-period-arrow">→</span>
            <select
              className="header-period-select"
              value={to}
              onChange={handleTo}
              aria-label="Mois de fin"
            >
              {moisDispo.map(n => (
                <option key={n} value={n}>{MOIS_LABELS[n - 1]}</option>
              ))}
            </select>
            <span className="header-period-count">{nbMois} mois</span>
          </div>
        )}

        {/* Bell — toggle notifications */}
        {pushStatus !== 'unsupported' && (
          <button
            className={`header-icon-btn${pushStatus === 'subscribed' ? ' bell-active' : ''}${pushStatus === 'denied' ? ' bell-denied' : ''}`}
            onClick={handleBell}
            disabled={pushStatus === 'requesting'}
            aria-label={bellTitle}
            title={bellTitle}
          >
            {pushStatus === 'subscribed' ? (
              /* Bell filled — notifications ON */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" fill="none" strokeWidth="1.6"/>
              </svg>
            ) : pushStatus === 'denied' ? (
              /* Bell with slash — blocked */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
              </svg>
            ) : (
              /* Bell outlined — notifications OFF */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
            )}
          </button>
        )}

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

        {/* Avatar + dropdown */}
        <div className="header-avatar-wrap" ref={avatarRef}>
          <button
            className="header-avatar"
            onClick={() => setAvatarOpen(o => !o)}
            title={user?.email}
            aria-label="Mon compte"
          >
            {initials}
          </button>
          {avatarOpen && (
            <div className="header-avatar-dropdown">
              <div className="had-email">{user?.email}</div>
              <button className="had-logout" onClick={signOut}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
