import { fmt } from '../../lib/kpiEngine'
import { useDashboardStore } from '../../store/dashboardStore'

export default function PnLTable({ pnl }) {
  const { currency } = useDashboardStore()
  const c = (v) => fmt.currency(Math.abs(v), currency)

  return (
    <div className="pnl-box">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="chart-title">Compte de Résultat — Vue par Tonne d'Huile Produite</div>
          <div className="chart-subtitle">Base : {pnl.baseLabel}</div>
        </div>
        <div>
          <span className="kpi-badge badge-up" style={{ fontSize: 12, padding: '4px 12px' }}>{pnl.status}</span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 8 }}>
        <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '0 14px 8px' }}>Libellé</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '0 14px 8px', textAlign: 'right' }}>
          <span>FCFA / tonne</span>
          <span>Total FCFA</span>
        </div>
      </div>

      {/* PRODUITS */}
      <div style={{ background: 'rgba(76,175,122,0.05)', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
        <div className="pnl-row" style={{ padding: '12px 14px 8px' }}>
          <span className="pnl-label" style={{ fontWeight: 700, color: 'var(--green)' }}>PRODUITS</span>
          <span />
        </div>
        {pnl.produits.map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="pnl-row">
            <span className="pnl-label indent">→ {row.label}</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'right' }}>
              <span className="pnl-amount pos" style={{ fontSize: 12 }}>{row.pertonne > 0 ? fmt.full(row.pertonne) : '—'}</span>
              <span className="pnl-amount pos" style={{ fontSize: 12 }}>{row.total > 0 ? c(row.total) : '—'}</span>
            </div>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid rgba(76,175,122,0.2)', padding: '10px 14px' }}>
          <span className="pnl-label" style={{ fontWeight: 700, paddingLeft: 14 }}>Total Produits</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'right' }}>
            <span className="pnl-amount pos" style={{ fontWeight: 700 }}>{fmt.full(pnl.totalProduitsTonne)}</span>
            <span className="pnl-amount pos" style={{ fontWeight: 700 }}>{c(pnl.totalProduitsTotal)}</span>
          </div>
        </div>
      </div>

      {/* CHARGES */}
      <div style={{ background: 'rgba(224,92,92,0.04)', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
        <div className="pnl-row" style={{ padding: '12px 14px 8px' }}>
          <span className="pnl-label" style={{ fontWeight: 700, color: 'var(--red)' }}>CHARGES</span>
          <span />
        </div>
        {pnl.charges.map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="pnl-row">
            <span className="pnl-label indent">→ {row.label}</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'right' }}>
              <span className="pnl-amount neg" style={{ fontSize: 12 }}>{fmt.full(Math.abs(row.pertonne))}</span>
              <span className="pnl-amount neg" style={{ fontSize: 12 }}>– {c(row.total)}</span>
            </div>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid rgba(224,92,92,0.2)', padding: '10px 14px' }}>
          <span className="pnl-label" style={{ fontWeight: 700, paddingLeft: 14 }}>Total Charges</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'right' }}>
            <span className="pnl-amount neg" style={{ fontWeight: 700 }}>{fmt.full(Math.abs(pnl.totalChargesTonne))}</span>
            <span className="pnl-amount neg" style={{ fontWeight: 700 }}>– {c(Math.abs(pnl.totalChargesTotal))}</span>
          </div>
        </div>
      </div>

      {/* RÉSULTAT */}
      <div style={{ background: 'rgba(76,175,122,0.08)', border: '1px solid rgba(76,175,122,0.2)', borderRadius: 8, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <span className="pnl-label" style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>RÉSULTAT NET ESTIMÉ</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'right' }}>
            <span className="pnl-amount pos bold">+ {fmt.full(pnl.resultatTonne)}</span>
            <span className="pnl-amount pos bold">+ {c(pnl.resultatTotal)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(76,175,122,0.15)', flexWrap: 'wrap' }}>
          {pnl.notes.map((n, i) => (
            <span key={i} style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {n.label} : <strong style={{ color: `var(--${n.color})` }}>{n.value}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
