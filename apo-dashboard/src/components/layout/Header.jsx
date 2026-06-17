import { useState, useRef, useEffect } from 'react'
import { useDashboardStore } from '../../store/dashboardStore'
import { useAuth } from '../../contexts/AuthContext'

export default function Header() {
  const { sidebarOpen, toggleMobileMenu } = useDashboardStore()
  const { user, role, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Fermer le menu si clic en dehors
  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'
  const email   = user?.email ?? ''

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

        <div className="logo-icon">🌴</div>
        <div className="logo-text">
          <h1>APO</h1>
          <span>Agro Palm Oil — Tableau de Bord Global</span>
        </div>
      </div>

      <div className="header-right">
        <div ref={menuRef} style={{ position: 'relative' }}>
          {/* Avatar cliquable */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Compte"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 8,
            }}
          >
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gold), var(--green, #2e6b3e))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
              color: '#fff',
              flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }} className="header-user-text">
              <span style={{ fontSize: 12, color: 'var(--text-1, #e8eaf0)', fontWeight: 600, lineHeight: 1.2 }}>
                {email.split('@')[0]}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-dim, #8b92a8)', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {role ?? ''}
              </span>
            </div>
          </button>

          {/* Menu déroulant */}
          {menuOpen && (
            <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                zIndex: 1000,
                background: 'var(--bg-2, #161b22)',
                border: '1px solid var(--border, rgba(242,140,40,0.15))',
                borderRadius: 10,
                minWidth: 200,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                overflow: 'hidden',
              }}>
                {/* Infos utilisateur */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border, rgba(242,140,40,0.1))',
                }}>
                  <div style={{ fontSize: 13, color: 'var(--text-1, #e8eaf0)', fontWeight: 600 }}>
                    {email}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gold, #f28c28)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {role}
                  </div>
                </div>

                {/* Bouton déconnexion */}
                <button
                  onClick={() => { setMenuOpen(false); signOut() }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '11px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#ef4444',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>⎋</span> Se déconnecter
                </button>
              </div>
          )}
        </div>
      </div>
    </header>
  )
}
