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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-1, #0f1117)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--bg-2, #161b22)',
        border: '1px solid var(--border, rgba(242,140,40,0.15))',
        borderRadius: '16px',
        padding: '40px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Logo Palmeo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #16a34a, #4ade80)',
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 800, color: '#fff',
            boxShadow: '0 0 24px rgba(74,222,128,0.25)',
          }}>P</div>
          <h1 style={{
            color: 'var(--text-1, #e8eaf0)',
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.5px',
          }}>palmeo</h1>
          <p style={{
            color: 'var(--text-2, #8b92a8)',
            fontSize: 13,
            margin: '6px 0 0',
          }}>Connectez-vous à votre espace</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--text-2, #8b92a8)', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              style={{
                background: 'var(--bg-1, #0f1117)',
                border: '1px solid var(--border, rgba(242,140,40,0.2))',
                borderRadius: 8,
                padding: '10px 14px',
                color: 'var(--text-1, #e8eaf0)',
                fontSize: 14,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--text-2, #8b92a8)', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px' }}>
              MOT DE PASSE
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                background: 'var(--bg-1, #0f1117)',
                border: '1px solid var(--border, rgba(242,140,40,0.2))',
                borderRadius: 8,
                padding: '10px 14px',
                color: 'var(--text-1, #e8eaf0)',
                fontSize: 14,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#ef4444',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'var(--border, #2a2d3a)' : 'var(--gold, #f28c28)',
              color: loading ? 'var(--text-2, #8b92a8)' : '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
              marginTop: 4,
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
