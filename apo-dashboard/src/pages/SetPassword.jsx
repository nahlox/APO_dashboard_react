import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../db/supabase'

/**
 * Page d'activation de compte (/bienvenue).
 * L'utilisateur arrive ici depuis le lien reçu par email : supabase-js consomme
 * les jetons présents dans l'URL et ouvre une session temporaire. Il ne lui
 * reste qu'à définir son mot de passe pour se connecter normalement ensuite.
 */
export default function SetPassword() {
  const [etat, setEtat]     = useState('verif')   // verif | pret | invalide | ok
  const [pwd, setPwd]       = useState('')
  const [pwd2, setPwd2]     = useState('')
  const [erreur, setErreur] = useState(null)
  const [busy, setBusy]     = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Lien porteur d'une erreur explicite (expiré, déjà consommé…).
    // Supabase renvoie un message en anglais : on le traduit pour l'utilisateur.
    const hash = new URLSearchParams(window.location.hash.slice(1))
    if (hash.get('error')) {
      const code = hash.get('error_code') || ''
      const brut = (hash.get('error_description') || '').replace(/\+/g, ' ')
      const messages = {
        otp_expired:   "Ce lien d'activation a expiré. Les liens sont valables 24 heures et à usage unique.",
        access_denied: "Ce lien a déjà été utilisé. Chaque lien d'activation ne fonctionne qu'une fois.",
      }
      setErreur(messages[code] || (/expired|invalid/i.test(brut)
        ? "Ce lien d'activation a expiré ou a déjà été utilisé."
        : brut || 'Lien invalide.'))
      // Un lien mort ne doit jamais laisser la session précédente en place :
      // sinon on reste connecté sous le compte qui utilisait ce navigateur
      // (typiquement l'administrateur qui teste l'invitation), ce qui donne
      // l'illusion que l'invité s'est connecté sous une autre identité.
      supabase.auth.signOut().catch(() => {})
      setEtat('invalide')
      return
    }

    const avecJetons = window.location.hash.includes('access_token')

    let fini = false
    const valider = (session) => {
      if (fini || !session) return
      fini = true
      // Compte déjà activé qui arrive ici sans lien : rien à faire, on renvoie
      // vers le tableau de bord.
      if (!avecJetons && session.user?.user_metadata?.mdp_defini === true) {
        navigate('/', { replace: true })
        return
      }
      setEtat('pret')
    }

    // supabase-js échange les jetons de l'URL de façon asynchrone : on écoute
    // l'événement plutôt que d'attendre un délai fixe (sinon un réseau lent
    // afficherait « lien invalide » à tort).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => valider(session))
    supabase.auth.getSession().then(({ data: { session } }) => valider(session))

    // Filet de sécurité : au-delà de 6 s sans session, le lien est hors d'usage.
    const t = setTimeout(() => { if (!fini) { fini = true; setEtat('invalide') } }, 6000)

    return () => { clearTimeout(t); subscription.unsubscribe() }
  }, [navigate])

  async function submit(e) {
    e.preventDefault()
    setErreur(null)
    if (pwd.length < 8) return setErreur('Le mot de passe doit contenir au moins 8 caractères.')
    if (pwd !== pwd2)   return setErreur('Les deux mots de passe ne correspondent pas.')

    setBusy(true)
    // `mdp_defini` marque que l'utilisateur a bien choisi son mot de passe :
    // tant qu'il est absent, l'accès au tableau de bord renvoie ici. Sans ce
    // marqueur, un simple clic sur le lien d'invitation suffisait à utiliser
    // l'application sans jamais définir de mot de passe.
    const { error } = await supabase.auth.updateUser({
      password: pwd,
      data: { mdp_defini: true },
    })
    setBusy(false)
    if (error) return setErreur(error.message)

    setEtat('ok')
    setTimeout(() => navigate('/', { replace: true }), 1500)
  }

  const inputStyle = {
    background: 'var(--dark)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none',
    width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
  }
  const labelStyle = {
    color: 'var(--label, var(--text-dim))', fontSize: 11, fontWeight: 600,
    letterSpacing: '1.5px', textTransform: 'uppercase',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--dark)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: 'var(--dark2)',
        border: '1px solid var(--border)', borderRadius: 20, padding: '44px 40px',
        display: 'flex', flexDirection: 'column', gap: 24,
        boxShadow: '0 4px 24px rgba(40,30,10,.07)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(140deg, #E8924A, #C86A10)',
            margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(200,106,16,.25)',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22V11"/>
              <path d="M12 11c0-4 2-7 8-8-1 5-4 7-8 8Z"/>
              <path d="M12 11C12 7 10 4 4 3c1 5 4 7 8 8Z"/>
              <path d="M12 11c2-3 5-4 8-3-2 3-5 4-8 3Z"/>
              <path d="M12 11C10 8 7 7 4 8c2 3 5 4 8 3Z"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", color: 'var(--gold)',
            fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: 2,
          }}>Palmeo</h1>
          <p style={{
            color: 'var(--text-dim)', fontSize: 11, margin: '6px 0 0',
            letterSpacing: '1.5px', textTransform: 'uppercase',
          }}>Activation de votre accès</p>
        </div>

        {etat === 'verif' && (
          <p style={{ color: 'var(--text-dim)', fontSize: 14, textAlign: 'center' }}>
            Vérification du lien…
          </p>
        )}

        {etat === 'invalide' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)',
              borderRadius: 8, padding: '12px 14px', color: 'var(--red)', fontSize: 13,
            }}>
              {erreur || "Ce lien n'est plus valide."}
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Demandez à votre administrateur de vous renvoyer une invitation : il dispose
              d'un bouton « Renvoyer » qui génère un nouveau lien, valable 24&nbsp;heures.
            </p>
            <button onClick={() => navigate('/', { replace: true })} style={{
              background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 10,
              padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%',
              fontFamily: "'DM Sans', sans-serif",
            }}>Aller à la page de connexion</button>
          </div>
        )}

        {etat === 'ok' && (
          <p style={{ color: 'var(--green)', fontSize: 14, textAlign: 'center', lineHeight: 1.6 }}>
            Mot de passe enregistré.<br />Ouverture de votre tableau de bord…
          </p>
        )}

        {etat === 'pret' && (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Choisissez un mot de passe pour activer votre compte. Il vous servira
              à vous connecter les prochaines fois.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Mot de passe</label>
              <input type="password" value={pwd} onChange={e => setPwd(e.target.value)}
                     placeholder="8 caractères minimum" autoComplete="new-password"
                     required style={inputStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Confirmer le mot de passe</label>
              <input type="password" value={pwd2} onChange={e => setPwd2(e.target.value)}
                     placeholder="••••••••" autoComplete="new-password"
                     required style={inputStyle} />
            </div>

            {erreur && (
              <div style={{
                background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)',
                borderRadius: 8, padding: '10px 14px', color: 'var(--red)', fontSize: 13,
              }}>{erreur}</div>
            )}

            <button type="submit" disabled={busy} style={{
              background: busy ? 'var(--dark3)' : 'var(--gold)',
              color: busy ? 'var(--text-dim)' : '#fff',
              border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700,
              cursor: busy ? 'not-allowed' : 'pointer', width: '100%', marginTop: 4,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: busy ? 'none' : '0 4px 14px rgba(200,106,16,.3)',
            }}>{busy ? 'Enregistrement…' : 'Activer mon accès'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
