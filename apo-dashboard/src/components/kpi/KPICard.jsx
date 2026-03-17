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
  return (
    <div className={`kpi-card fade-in${accent ? ` ${accent}` : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value${valueColor ? ` ${valueColor}` : ''}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      {badge && (
        <div style={{ marginTop: 8 }}>
          <span className={`kpi-badge badge-${badgeType}`}>{badge}</span>
        </div>
      )}
    </div>
  )
}
