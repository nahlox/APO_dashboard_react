import { useEffect, useState } from 'react'
import logoApo from '../assets/logo_apo.png'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in') // 'in' | 'hold' | 'out'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600)
    const t2 = setTimeout(() => setPhase('out'),  2200)
    const t3 = setTimeout(() => onDone(),          2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0F2A1D',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 28,
      opacity:   phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.55s ease' : 'none',
      pointerEvents: 'none',
    }}>

      {/* Logo avec pulse */}
      <div style={{
        animation: 'apo-logo-in 0.65s cubic-bezier(.22,1,.36,1) forwards',
        opacity: 0,
      }}>
        <img
          src={logoApo}
          alt="APO"
          style={{
            width: 110, height: 110,
            filter: 'drop-shadow(0 0 32px rgba(242,140,40,0.45))',
            animation: 'apo-pulse 2s ease-in-out 0.7s infinite',
          }}
        />
      </div>

      {/* Texte */}
      <div style={{
        textAlign: 'center',
        animation: 'apo-text-in 0.7s cubic-bezier(.22,1,.36,1) 0.2s forwards',
        opacity: 0,
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 28, fontWeight: 900, letterSpacing: '0.08em',
          color: '#F28C28',
          textShadow: '0 0 40px rgba(242,140,40,0.4)',
        }}>
          A.P.O
        </div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11, fontWeight: 400, letterSpacing: '0.25em',
          color: 'rgba(200,220,200,0.6)',
          marginTop: 5, textTransform: 'uppercase',
        }}>
          Agro Palm Oil — Dashboard 2026
        </div>
      </div>

      {/* Barre de chargement */}
      <div style={{
        width: 160, height: 2,
        background: 'rgba(242,140,40,0.15)',
        borderRadius: 2,
        overflow: 'hidden',
        animation: 'apo-bar-in 0.5s ease 0.4s forwards',
        opacity: 0,
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #F28C28, #f5b060)',
          borderRadius: 2,
          animation: 'apo-bar-fill 1.6s cubic-bezier(.4,0,.2,1) 0.5s forwards',
          width: 0,
        }} />
      </div>

      <style>{`
        @keyframes apo-logo-in {
          from { opacity: 0; transform: scale(0.75) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes apo-text-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes apo-bar-in {
          to { opacity: 1; }
        }
        @keyframes apo-bar-fill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes apo-pulse {
          0%, 100% { filter: drop-shadow(0 0 28px rgba(242,140,40,0.35)); }
          50%       { filter: drop-shadow(0 0 48px rgba(242,140,40,0.65)); }
        }
      `}</style>
    </div>
  )
}
