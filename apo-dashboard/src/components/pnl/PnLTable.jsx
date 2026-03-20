import { fmt } from '../../lib/kpiEngine'
import { useDashboardStore } from '../../store/dashboardStore'

// ── Helpers ──────────────────────────────────────────────────

function ColHeaders() {
  const { currency } = useDashboardStore()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', padding: '0 14px 10px', borderBottom: '1px solid rgba(200,150,62,0.12)', marginBottom: 6 }}>
      <span style={styles.dimLabel}>Libellé</span>
      <span style={{ ...styles.dimLabel, textAlign: 'right' }}>F / tonne</span>
      <span style={{ ...styles.dimLabel, textAlign: 'right' }}>Total {currency}</span>
    </div>
  )
}

function DataRow({ label, pertonne, total, color = 'var(--text-dim)', indent = false, showZero = false }) {
  const { currency } = useDashboardStore()
  const c = (v) => fmt.currency(Math.abs(v), currency)
  if (total === 0 && !showZero) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', padding: '5px 14px', opacity: 0.5 }}>
      <span style={{ ...styles.label, paddingLeft: indent ? 18 : 0, color }}>{label}</span>
      <span style={{ ...styles.numDim, textAlign: 'right' }}>—</span>
      <span style={{ ...styles.numDim, textAlign: 'right', fontStyle: 'italic' }}>non facturé</span>
    </div>
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', padding: '5px 14px' }} className="pnl-row">
      <span style={{ ...styles.label, paddingLeft: indent ? 18 : 0, color }}>{label}</span>
      <span style={{ ...styles.num, textAlign: 'right', color }}>{pertonne > 0 ? fmt.full(pertonne) : `– ${fmt.full(Math.abs(pertonne))}`}</span>
      <span style={{ ...styles.num, textAlign: 'right', color }}>{total >= 0 ? c(total) : `– ${c(total)}`}</span>
    </div>
  )
}

function SubtotalRow({ label, pertonne, total, pct, color, bg, borderColor }) {
  const { currency } = useDashboardStore()
  const c = (v) => fmt.currency(Math.abs(v), currency)
  const sign = total >= 0 ? '+' : '–'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', padding: '9px 14px', background: bg, borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, margin: '4px 0' }}>
      <span style={{ ...styles.subtotalLabel, color }}>
        {label}
        {pct != null && <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 400, opacity: 0.8 }}>({pct.toFixed(1).replace('.', ',')}%)</span>}
      </span>
      <span style={{ ...styles.subtotalNum, textAlign: 'right', color }}>{sign} {fmt.full(Math.abs(pertonne))}</span>
      <span style={{ ...styles.subtotalNum, textAlign: 'right', color }}>{sign} {c(total)}</span>
    </div>
  )
}

function SectionHeader({ title, color }) {
  return (
    <div style={{ padding: '10px 14px 4px' }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color }}>{title}</span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────

export default function PnLTable({ pnl }) {
  const { currency } = useDashboardStore()
  const c = (v) => fmt.currency(Math.abs(v), currency)

  return (
    <div className="pnl-box">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div className="chart-title">Compte de Résultat — Vue par Tonne d'Huile Produite</div>
          <div className="chart-subtitle">Base : {pnl.baseLabel}</div>
        </div>
        <span className="kpi-badge badge-up" style={{ fontSize: 11, padding: '4px 12px', whiteSpace: 'nowrap' }}>{pnl.status}</span>
      </div>

      <ColHeaders />

      {/* ── I. CHIFFRE D'AFFAIRES ─────────────────────────── */}
      <div style={{ background: 'rgba(76,175,122,0.04)', borderRadius: 8, marginBottom: 4, overflow: 'hidden', border: '1px solid rgba(76,175,122,0.1)' }}>
        <SectionHeader title="I. Chiffre d'affaires" color="var(--green)" />
        {pnl.produits.map((row, i) => (
          <DataRow key={i} label={row.label} pertonne={row.pertonne} total={row.total}
            color={row.total > 0 ? 'var(--text)' : 'var(--text-dim)'} indent />
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', padding: '8px 14px', borderTop: '1px solid rgba(76,175,122,0.2)', background: 'rgba(76,175,122,0.06)' }}>
          <span style={{ ...styles.totalLabel, color: 'var(--green)' }}>Total CA</span>
          <span style={{ ...styles.totalNum, textAlign: 'right', color: 'var(--green)' }}>{fmt.full(pnl.totalProduitsTonne)}</span>
          <span style={{ ...styles.totalNum, textAlign: 'right', color: 'var(--green)' }}>{c(pnl.totalProduitsTotal)}</span>
        </div>
      </div>

      {/* ── II. COÛT MATIÈRE PREMIÈRE ──────────────────────── */}
      <div style={{ background: 'rgba(200,150,62,0.04)', borderRadius: 8, marginBottom: 4, overflow: 'hidden', border: '1px solid rgba(200,150,62,0.12)' }}>
        <SectionHeader title="II. Coût matière première" color="var(--gold)" />
        <DataRow label={pnl.coutMP.label} pertonne={pnl.coutMP.pertonne} total={pnl.coutMP.total} color="var(--gold)" indent />
      </div>

      {/* ── MARGE BRUTE ────────────────────────────────────── */}
      <SubtotalRow
        label="Marge Brute"
        pertonne={pnl.margeBruteTonne}
        total={pnl.margeBruteTotal}
        pct={pnl.margeBrutePct}
        color="var(--gold)"
        bg="rgba(200,150,62,0.08)"
        borderColor="rgba(200,150,62,0.25)"
      />

      {/* ── III. CHARGES D'EXPLOITATION ────────────────────── */}
      <div style={{ background: 'rgba(224,92,92,0.03)', borderRadius: 8, marginBottom: 4, overflow: 'hidden', border: '1px solid rgba(224,92,92,0.1)' }}>
        <SectionHeader title="III. Charges d'exploitation (hors amort.)" color="var(--red)" />
        {pnl.chargesExploitation.map((row, i) => (
          <DataRow key={i} label={row.label} pertonne={-row.pertonne} total={row.total} color="var(--text)" indent />
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', padding: '8px 14px', borderTop: '1px solid rgba(224,92,92,0.2)', background: 'rgba(224,92,92,0.05)' }}>
          <span style={{ ...styles.totalLabel, color: 'var(--red)' }}>Total Charges exploitation</span>
          <span style={{ ...styles.totalNum, textAlign: 'right', color: 'var(--red)' }}>– {fmt.full(Math.abs(pnl.totalChargesExpTonne))}</span>
          <span style={{ ...styles.totalNum, textAlign: 'right', color: 'var(--red)' }}>– {c(pnl.totalChargesExpTotal)}</span>
        </div>
      </div>

      {/* ── EBE / EBITDA ────────────────────────────────────── */}
      <SubtotalRow
        label="EBE / EBITDA"
        pertonne={pnl.ebitdaTonne}
        total={pnl.ebitdaTotal}
        pct={pnl.ebitdaPct}
        color="var(--text)"
        bg="rgba(138,154,142,0.08)"
        borderColor="rgba(138,154,142,0.2)"
      />

      {/* ── IV. AMORTISSEMENTS & CHARGES FINANCIÈRES ───────── */}
      <div style={{ background: 'rgba(138,154,142,0.04)', borderRadius: 8, marginBottom: 4, overflow: 'hidden', border: '1px solid rgba(138,154,142,0.15)' }}>
        <SectionHeader title="IV. Amortissements & charges financières" color="var(--text-dim)" />
        {pnl.amortissements.map((row, i) => (
          <DataRow key={i} label={row.label} pertonne={-row.pertonne} total={row.total} color="var(--text-dim)" indent />
        ))}
      </div>

      {/* ── RÉSULTAT NET ─────────────────────────────────────── */}
      <div style={{ background: pnl.resultatTotal >= 0 ? 'rgba(76,175,122,0.08)' : 'rgba(224,92,92,0.08)', border: `1px solid ${pnl.resultatTotal >= 0 ? 'rgba(76,175,122,0.3)' : 'rgba(224,92,92,0.3)'}`, borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px' }}>
          <span style={{ ...styles.resultatLabel, color: pnl.resultatTotal >= 0 ? 'var(--green)' : 'var(--red)' }}>
            Résultat Net Estimé
          </span>
          <span style={{ ...styles.resultatNum, textAlign: 'right', color: pnl.resultatTotal >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {pnl.resultatTotal >= 0 ? '+' : '–'} {fmt.full(Math.abs(pnl.resultatTonne))}
          </span>
          <span style={{ ...styles.resultatNum, textAlign: 'right', color: pnl.resultatTotal >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {pnl.resultatTotal >= 0 ? '+' : '–'} {fmt.currency(Math.abs(pnl.resultatTotal), currency)}
          </span>
        </div>

        {/* Notes / indicateurs */}
        <div style={{ display: 'flex', gap: 20, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(76,175,122,0.15)', flexWrap: 'wrap' }}>
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

// ── Styles ────────────────────────────────────────────────────
const styles = {
  dimLabel: {
    fontSize: 10,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: 'var(--text-dim)',
  },
  label: {
    fontSize: 12,
    color: 'var(--text)',
  },
  num: {
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums',
  },
  numDim: {
    fontSize: 11,
    color: 'var(--text-dim)',
    fontVariantNumeric: 'tabular-nums',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 700,
  },
  totalNum: {
    fontSize: 12,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  subtotalLabel: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.3px',
  },
  subtotalNum: {
    fontSize: 13,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  resultatLabel: {
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: '0.3px',
  },
  resultatNum: {
    fontSize: 14,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
}
