import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDashboardStore } from '../store/dashboardStore'
import LoginPage from '../pages/LoginPage'
import BordereauHeures from './bordereau/BordereauHeures'
import BordereauMensuel from './BordereauMensuel'
import './emargement.css'

const VUES = [
  { id: 'emargement', label: 'Émargement' },
  { id: 'mensuel',    label: 'Bordereau mensuel · export' },
]

/**
 * Émargement des heures (/emargement).
 *
 * - « Émargement » : le Bordereau des Heures (pointage par quart, récap du jour,
 *   semaine, suivi & congés, effectif) — repris de l'artefact d'origine.
 * - « Bordereau mensuel » : grille du mois, validation (verrouillage), export CSV/PDF.
 *
 * Compte « rh » : c'est sa seule page (redirigé ici depuis « / », et le RLS lui
 * ferme les données du tableau de bord). owner / manager / viewer y accèdent
 * depuis la sidebar ; le viewer consulte sans pouvoir modifier.
 */
export default function EmargementApp() {
  const { user, role, tenantId, accesCharge, branding, signOut } = useAuth()
  const { theme } = useDashboardStore()
  const [vue, setVue] = useState('emargement')

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
        <div className="rh-header-left">
          {!estRH && <Link to="/" className="rh-btn rh-btn-ghost">← Tableau de bord</Link>}
          <nav className="rh-switch">
            {VUES.map(v => (
              <button key={v.id} className={vue === v.id ? 'active' : ''} onClick={() => setVue(v.id)}>
                {v.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="rh-header-right">
          <span className="rh-user" title={user.email}>{user.email}</span>
          <button className="rh-btn rh-btn-ghost" onClick={signOut}>Déconnexion</button>
        </div>
      </header>

      {vue === 'emargement' && <BordereauHeures tenantId={tenantId} peutSaisir={peutSaisir} />}
      {vue === 'mensuel' && (
        <main className="rh-main">
          <BordereauMensuel peutSaisir={peutSaisir} tenantId={tenantId} user={user} marque={marque} />
        </main>
      )}
    </div>
  )
}
