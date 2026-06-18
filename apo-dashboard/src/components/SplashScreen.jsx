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
      background: '#0a0c10',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 32,
      opacity:   phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.55s ease' : 'none',
      pointerEvents: 'none',
    }}>

      {/* Logo Palmeo (plateforme) */}
      <div style={{
        animation: 'apo-logo-in 0.65s cubic-bezier(.22,1,.36,1) forwards',
        opacity: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'linear-gradient(135deg, #16a34a, #4ade80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 800, color: '#fff',
          boxShadow: '0 0 40px rgba(74,222,128,0.3)',
          animation: 'apo-pulse 2s ease-in-out 0.7s infinite',
        }}>P</div>
        <div style={{
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px',
          color: '#fff',
        }}>palmeo</div>
      </div>

      {/* Séparateur */}
      <div style={{
        width: 1, height: 28,
        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.12), transparent)',
        animation: 'apo-text-in 0.6s ease 0.3s forwards',
        opacity: 0,
      }} />

      {/* Tenant APO */}
      <div style={{
        textAlign: 'center',
        animation: 'apo-text-in 0.7s cubic-bezier(.22,1,.36,1) 0.35s forwards',
        opacity: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <img
          src={logoApo}
          alt="APO"
          style={{ width: 52, height: 52, filter: 'drop-shadow(0 0 16px rgba(242,140,40,0.4))' }}
        />
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 18, fontWeight: 900, letterSpacing: '0.1em',
          color: '#F28C28',
        }}>A.P.O</div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10, fontWeight: 400, letterSpacing: '0.22em',
          color: 'rgba(200,220,200,0.45)',
          textTransform: 'uppercase',
        }}>Agro Palm Oil</div>
      </div>

      {/* Barre de chargement */}
      <div style={{
        width: 140, height: 2,
        background: 'rgba(242,140,40,0.12)',
        borderRadius: 2, overflow: 'hidden',
        animation: 'apo-bar-in 0.5s ease 0.5s forwards',
        opacity: 0,
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #16a34a, #4ade80, #F28C28)',
          borderRadius: 2,
          animation: 'apo-bar-fill 1.6s cubic-bezier(.4,0,.2,1) 0.6s forwards',
          width: 0,
        }} />
      </div>

      <style>{`
        @keyframes apo-logo-in {
          from { opacity: 0; transform: scale(0.8) translateY(10px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
        @keyframes apo-text-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes apo-bar-in  { to { opacity: 1; } }
        @keyframes apo-bar-fill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes apo-pulse {
          0%, 100% { box-shadow: 0 0 32px rgba(74,222,128,0.25); }
          50%       { box-shadow: 0 0 52px rgba(74,222,128,0.5);  }
        }
      `}</style>
    </div>
  )
}
