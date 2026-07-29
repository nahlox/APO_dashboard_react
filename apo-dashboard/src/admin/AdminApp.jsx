import { Routes, Route, NavLink, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginPage from '../pages/LoginPage'
import ClientsList from './pages/ClientsList'
import ClientNew from './pages/ClientNew'
import ClientDetail from './pages/ClientDetail'
import Journal from './pages/Journal'
import './admin.css'

/**
 * Console opérateur de la plateforme — totalement séparée du tableau de bord
 * client : route dédiée (/admin), layout propre, identité visuelle neutre.
 * Réservée aux super-admins.
 */
export default function AdminApp() {
  const { user, isSuperAdmin, signOut } = useAuth()

  if (user === undefined) return null
  if (user === null) return <LoginPage />

  // Le statut super-admin est chargé de façon asynchrone : tant qu'on ne l'a pas,
  // on n'affiche pas « accès refusé » (sinon l'écran clignote à chaque ouverture).
  if (isSuperAdmin === null || isSuperAdmin === undefined) {
    return <div className="admin-root"><div className="admin-loading">Chargement…</div></div>
  }

  if (!isSuperAdmin) {
    return (
      <div className="admin-root">
        <div className="admin-main" style={{ maxWidth: 520, margin: '10vh auto' }}>
          <div className="admin-card">
            <h1 className="admin-h1">Accès réservé</h1>
            <p className="admin-sub" style={{ marginBottom: 6 }}>
              Cette console est réservée aux administrateurs de la plateforme.
            </p>
            {/* Indiquer le compte connecté : cliquer un lien d'invitation
                remplace la session courante, ce qui prête facilement à confusion. */}
            <p className="admin-sub" style={{ marginBottom: 18 }}>
              Vous êtes connecté en tant que <strong>{user.email}</strong>.
              Si ce n'est pas votre compte administrateur, déconnectez-vous puis
              reconnectez-vous avec celui-ci.
            </p>
            <div className="admin-actions" style={{ marginTop: 0 }}>
              <button className="admin-btn" onClick={signOut}>Se déconnecter</button>
              <Link to="/" className="admin-btn admin-btn-ghost" style={{ textDecoration: 'none' }}>
                Aller au tableau de bord
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-root">
      <div className="admin-shell">
        <aside className="admin-side">
          <div className="admin-brand">
            <div className="admin-brand-name">Palmeo</div>
            <div className="admin-brand-sub">Console opérateur</div>
          </div>

          <nav className="admin-nav">
            <div className="admin-nav-label">Plateforme</div>
            <NavLink to="/admin" end>Clients</NavLink>
            <NavLink to="/admin/nouveau">Nouveau client</NavLink>
            <NavLink to="/admin/journal">Journal d'activité</NavLink>
          </nav>

          <div className="admin-side-footer">
            <div>{user.email}</div>
            <Link to="/">← Tableau de bord client</Link>
            <a href="#" onClick={(e) => { e.preventDefault(); signOut() }}>Déconnexion</a>
          </div>
        </aside>

        <main className="admin-main">
          <Routes>
            <Route index                 element={<ClientsList />} />
            <Route path="nouveau"        element={<ClientNew />} />
            <Route path="journal"        element={<Journal />} />
            <Route path="c/:tenantId/*"  element={<ClientDetail />} />
            <Route path="*"              element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
