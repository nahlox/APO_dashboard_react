import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import AdminApp from './admin/AdminApp'
import SetPassword from './pages/SetPassword'

/**
 * Deux applications distinctes derrière la même authentification :
 *   /          → tableau de bord client (Palmeo, branding du tenant)
 *   /admin/*   → console opérateur plateforme (super-admins uniquement)
 *   /bienvenue → activation de compte depuis un lien d'invitation
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/admin/*"  element={<AdminApp />} />
          <Route path="/bienvenue" element={<SetPassword />} />
          <Route path="/"         element={<App />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
