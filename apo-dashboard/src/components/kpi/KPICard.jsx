/**
 * KPICard — carte KPI réutilisable
 * @param {string} label    - titre (uppercase small)
 * @param {string} value    - valeur principale
 * @param {string} valueColor - 'gold' | 'green' | 'red' | ''
 * @param {string} sub      - sous-texte descriptif
 * @param {string} accent   - '' | 'accent-green' | 'accent-red'
 * @param {string} badge    - texte badge optionnel
 * @param {string} badgeType - 'up' | 'down' | 'neutral'
 */
export default function KPICard({ label, value, valueColor = '', sub, accent = '', badge, badgeType = 'neutral' }) {
  // Réduit automatiquement la police pour les grands nombres (≥ 14 caractères)
  const len = String(value).replace(/[^0-9]/g, '').length
  const fontSize = len >= 10 ? '18px' : len >= 8 ? '22px' : undefined

  return (
    <div className={`kpi-card fade-in${accent ? ` ${accent}` : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value${valueColor ? ` ${valueColor}` : ''}`} style={fontSize ? { fontSize } : undefined}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      {badge && (
        <div style={{ marginTop: 8 }}>
          <span className={`kpi-badge badge-${badgeType}`}>{badge}</span>
        </div>
      )}
    </div>
  )
}
