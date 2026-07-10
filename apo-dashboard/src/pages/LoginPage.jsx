import { useState } from 'react'
import { supabase } from '../db/supabase'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
    setLoading(false)
  }

  const inputStyle = {
    background: 'var(--dark)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '10px 14px',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.18s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--dark)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--dark2)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '44px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: '0 4px 24px rgba(40,30,10,.07)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: 16,
            background: 'linear-gradient(140deg, #E8924A, #C86A10)',
            margin: '0 auto 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
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
            fontFamily: "'Playfair Display', serif",
            color: 'var(--gold)',
            fontSize: 26, fontWeight: 900,
            margin: 0, letterSpacing: 2,
          }}>Palmeo</h1>
          <p style={{
            color: 'var(--text-dim)',
            fontSize: 11, margin: '6px 0 0',
            letterSpacing: '1.5px', textTransform: 'uppercase',
          }}>Tableau de Bord</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--label, var(--text-dim))', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--label, var(--text-dim))', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(192,57,43,0.08)',
              border: '1px solid rgba(192,57,43,0.25)',
              borderRadius: 8, padding: '10px 14px',
              color: 'var(--red)', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'var(--dark3)' : 'var(--gold)',
              color: loading ? 'var(--text-dim)' : '#fff',
              border: 'none', borderRadius: 10,
              padding: '13px', fontSize: 14,
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%', marginTop: 4,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.3px',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(200,106,16,.3)',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
