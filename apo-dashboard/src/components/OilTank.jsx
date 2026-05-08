import { useEffect, useState } from 'react'
import { fmt } from '../lib/kpiEngine'

/**
 * OilTank — animated liquid fill tank
 * @param {number} stockKg       - current stock in kg
 * @param {number} capaciteKg    - total tank capacity in kg
 * @param {number} prixKg        - prix moyen huile F/kg (to compute stock value)
 * @param {string} currency
 * @param {number} eurRate
 * @param {boolean} isLive       - true = current month (live), false = end of month snapshot
 */
export default function OilTank({ stockKg = 0, capaciteKg = 1_300_000, prixKg = 0, currency = 'FCFA', eurRate = 655.957, isLive = false }) {
  const pct         = Math.min(100, Math.max(0, (stockKg / capaciteKg) * 100))
  const stockT      = stockKg / 1000
  const stockVal    = stockKg * prixKg
  const [animPct, setAnimPct] = useState(0)

  // Animate fill on mount
  useEffect(() => {
    const t = setTimeout(() => setAnimPct(pct), 80)
    return () => clearTimeout(t)
  }, [pct])

  // CPO orange-red fixed palette
  const fillColor  = '#D4500A'
  const fillColorA = 'rgba(212,80,10,0.22)'
  const waveColor  = 'rgba(212,80,10,0.60)'

  const tankH = 180
  const tankW = 110
  const fillH = (animPct / 100) * tankH

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>

      {/* Badge live / snapshot */}
      <div style={{
        fontSize: 10, letterSpacing: 1, fontWeight: 700, padding: '3px 10px',
        borderRadius: 20, background: isLive ? 'rgba(63,163,77,0.15)' : 'rgba(138,154,142,0.12)',
        color: isLive ? '#3FA34D' : '#8A9A84', border: `1px solid ${isLive ? 'rgba(63,163,77,0.3)' : 'rgba(138,154,142,0.2)'}`,
      }}>
        {isLive ? '● LIVE' : 'FIN DE MOIS'}
      </div>

      {/* SVG Tank */}
      <svg width={tankW + 20} height={tankH + 40} viewBox={`0 0 ${tankW + 20} ${tankH + 40}`}>
        <defs>
          {/* Clip to tank shape */}
          <clipPath id={`tankClip-${pct}`}>
            <rect x="10" y="10" width={tankW} height={tankH} rx="8" />
          </clipPath>

          {/* Wave animation */}
          <style>{`
            @keyframes wave-${Math.round(pct)} {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
        </defs>

        {/* Tank background */}
        <rect x="10" y="10" width={tankW} height={tankH} rx="8"
          fill="rgba(19,37,25,0.8)" stroke="rgba(242,140,40,0.25)" strokeWidth="1.5" />

        {/* Liquid fill + wave */}
        <g clipPath={`url(#tankClip-${pct})`}>
          {/* Static fill */}
          <rect
            x="10" y={10 + tankH - fillH + 8}
            width={tankW} height={fillH}
            fill={fillColorA}
            style={{ transition: 'y 1.2s cubic-bezier(0.4,0,0.2,1), height 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
          {/* Animated wave at surface */}
          <g style={{
            transform: `translateY(${tankH - fillH + 10}px)`,
            transition: 'transform 1.2s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <g style={{ animation: `wave-${Math.round(pct)} 2.4s linear infinite` }}>
              <path
                d={`M0,8 C${tankW * 0.25},0 ${tankW * 0.5},16 ${tankW},8 C${tankW * 1.25},0 ${tankW * 1.5},16 ${tankW * 2},8 L${tankW * 2},${fillH + 20} L0,${fillH + 20} Z`}
                fill={waveColor}
              />
            </g>
          </g>
        </g>

        {/* % label inside tank */}
        <text x={tankW / 2 + 10} y={10 + tankH - fillH / 2 + 5}
          textAnchor="middle" fontSize="15" fontWeight="700"
          fill={fillH > 30 ? fillColor : 'rgba(138,154,142,0.6)'}
          style={{ transition: 'y 1.2s cubic-bezier(0.4,0,0.2,1)', fontFamily: "'DM Sans', sans-serif" }}>
          {animPct.toFixed(0)}%
        </text>

        {/* Tank outline on top */}
        <rect x="10" y="10" width={tankW} height={tankH} rx="8"
          fill="none" stroke="rgba(242,140,40,0.35)" strokeWidth="1.5" />

        {/* Capacity markers — 25%, 50%, 75% */}
        {[0.25, 0.5, 0.75].map(f => (
          <g key={f}>
            <line x1="10" y1={10 + tankH * (1 - f)} x2="22" y2={10 + tankH * (1 - f)}
              stroke="rgba(242,140,40,0.3)" strokeWidth="1" />
            <text x="24" y={10 + tankH * (1 - f) + 4}
              fontSize="8" fill="rgba(138,154,142,0.5)" fontFamily="'DM Mono', monospace">
              {Math.round(capaciteKg / 1000 * f)}T
            </text>
          </g>
        ))}
      </svg>

      {/* Stock value */}
      <div style={{ textAlign: 'center', lineHeight: 1.5 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: fillColor, fontFamily: "'DM Sans', sans-serif" }}>
          {stockT.toFixed(1)} T
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
          sur {(capaciteKg / 1000).toFixed(0)} T capacité
        </div>
        {stockVal > 0 && (
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>
            {fmt.currency(stockVal, currency, eurRate)}
          </div>
        )}
        {stockVal > 0 && (
          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
            valeur au prix {prixKg.toFixed(0)} F/kg
          </div>
        )}
      </div>
    </div>
  )
}
