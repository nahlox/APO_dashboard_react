import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDashboardStore } from '../store/dashboardStore'
import LoginPage from '../pages/LoginPage'
import SaisieJour from './SaisieJour'
import BordereauMensuel from './BordereauMensuel'
import Employes from './Employes'
import './emargement.css'

const ONGLETS = [
  { id: 'saisie',    label: 'Saisie du jour' },
  { id: 'bordereau', label: 'Bordereau mensuel' },
  { id: 'employes',  label: 'Employés' },
]

/**
 * Bordereau d'émargement des heures (/emargement).
 *
 * - Compte « rh » : c'est sa seule page (redirigé ici depuis « / », et le RLS
 *   lui ferme les données du tableau de bord).
 * - owner / manager / viewer : accessible depuis la sidebar du tableau de bord,
 *   avec un lien retour. Le viewer consulte sans pouvoir modifier.
 */
export default function EmargementApp() {
  const { user, role, tenantId, accesCharge, branding, signOut } = useAuth()
  const { theme } = useDashboardStore()
  const [onglet, setOnglet] = useState('saisie')

  // Même gestion du thème que le tableau de bord (cette page n'y passe pas).
  useEffect(() => {
    if (theme !== 'auto') { document.body.classList.toggle('light', theme === 'light'); return }
    const apply = () => { const h = new Date().getHours(); document.body.classList.toggle('light', h >= 7 && h < 19) }
    apply()
    const t = setInterval(apply, 60_000)
    return () => clearInterval(t)
  }, [theme])

  if (user === undefined) return null
  if (user === null) return <LoginPage />
  if (!accesCharge) return <div className="rh-root"><div className="rh-loading">Chargement…</div></div>

  if (!tenantId) {
    return (
      <div className="rh-root">
        <div className="rh-card rh-center">
          <h1 className="rh-h1">Accès non configuré</h1>
          <p className="rh-dim">Votre compte ({user.email}) n'est rattaché à aucune entreprise.
            Contactez votre administrateur.</p>
          <button className="rh-btn" onClick={signOut}>Se déconnecter</button>
        </div>
      </div>
    )
  }

  const estRH = role === 'rh'
  const peutSaisir = ['owner', 'manager', 'rh'].includes(role)
  const marque = branding?.nom_affichage?.split(' — ')[0] || 'Palmeo'

  return (
    <div className="rh-root">
      <header className="rh-header">
        <div className="rh-brand">
          <div className="rh-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="2"/>
              <path d="M8 8h8M8 12h8M8 16h4"/><path d="m15 16 1.5 1.5L19 15"/>
            </svg>
          </div>
          <div>
            <div className="rh-brand-name">{marque}</div>
            <div className="rh-brand-sub">Émargement des heures</div>
          </div>
        </div>
        <div className="rh-header-right">
          {!estRH && <Link to="/" className="rh-btn rh-btn-ghost">← Tableau de bord</Link>}
          <span className="rh-user" title={user.email}>{user.email}</span>
          <button className="rh-btn rh-btn-ghost" onClick={signOut}>Déconnexion</button>
        </div>
      </header>

      <main className="rh-main">
        <nav className="rh-tabs">
          {ONGLETS.map(o => (
            <button key={o.id} className={onglet === o.id ? 'active' : ''} onClick={() => setOnglet(o.id)}>
              {o.label}
            </button>
          ))}
        </nav>

        {!peutSaisir && (
          <div className="rh-banner info">Consultation seule : votre rôle ne permet pas de modifier l'émargement.</div>
        )}

        {onglet === 'saisie'    && <SaisieJour peutSaisir={peutSaisir} tenantId={tenantId} />}
        {onglet === 'bordereau' && <BordereauMensuel peutSaisir={peutSaisir} tenantId={tenantId} user={user} marque={marque} />}
        {onglet === 'employes'  && <Employes peutSaisir={peutSaisir} />}
      </main>
    </div>
  )
}
