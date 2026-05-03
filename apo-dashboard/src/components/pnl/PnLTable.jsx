import { fmt } from '../../lib/kpiEngine'
import { useDashboardStore } from '../../store/dashboardStore'
import { generatePnlPdf } from '../../lib/generatePnlPdf'

// ── Helpers ──────────────────────────────────────────────────

// Grid template: 3-col on desktop, 2-col on mobile (per-tonne hidden via CSS)
const GRID = '1fr 110px 140px'

function ColHeaders() {
  const { currency } = useDashboardStore()
  return (
    <div className="pnl-grid" style={{ display: 'grid', gridTemplateColumns: GRID, padding: '0 14px 10px', borderBottom: '1px solid rgba(242,140,40,0.12)', marginBottom: 6 }}>
      <span style={styles.dimLabel}>Libellé</span>
      <span className="pnl-col-tonne" style={{ ...styles.dimLabel, textAlign: 'right' }}>F / tonne</span>
      <span style={{ ...styles.dimLabel, textAlign: 'right' }}>Total {currency}</span>
    </div>
  )
}

function DataRow({ label, pertonne, total, color = 'var(--text-dim)', indent = false, showZero = false }) {
  const { currency } = useDashboardStore()
  const c = (v) => fmt.currency(Math.abs(v), currency)
  if (total === 0 && !showZero) return (
    <div className="pnl-grid" style={{ display: 'grid', gridTemplateColumns: GRID, padding: '5px 14px', opacity: 0.5 }}>
      <span style={{ ...styles.label, paddingLeft: indent ? 18 : 0, color }}>{label}</span>
      <span className="pnl-col-tonne" style={{ ...styles.numDim, textAlign: 'right' }}>—</span>
      <span style={{ ...styles.numDim, textAlign: 'right', fontStyle: 'italic' }}>non facturé</span>
    </div>
  )
  return (
    <div className="pnl-grid pnl-row" style={{ display: 'grid', gridTemplateColumns: GRID, padding: '5px 14px' }}>
      <span style={{ ...styles.label, paddingLeft: indent ? 18 : 0, color }}>{label}</span>
      <span className="pnl-col-tonne" style={{ ...styles.num, textAlign: 'right', color }}>{pertonne > 0 ? fmt.full(pertonne) : `– ${fmt.full(Math.abs(pertonne))}`}</span>
      <span style={{ ...styles.num, textAlign: 'right', color }}>{total >= 0 ? c(total) : `– ${c(total)}`}</span>
    </div>
  )
}

function SubtotalRow({ label, pertonne, total, pct, color, bg, borderColor }) {
  const { currency } = useDashboardStore()
  const c = (v) => fmt.currency(Math.abs(v), currency)
  const sign = total >= 0 ? '+' : '–'
  return (
    <div className="pnl-grid" style={{ display: 'grid', gridTemplateColumns: GRID, padding: '9px 14px', background: bg, borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, margin: '4px 0' }}>
      <span style={{ ...styles.subtotalLabel, color }}>
        {label}
        {pct != null && <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 400, opacity: 0.8 }}>({pct.toFixed(1).replace('.', ',')}%)</span>}
      </span>
      <span className="pnl-col-tonne" style={{ ...styles.subtotalNum, textAlign: 'right', color }}>{sign} {fmt.full(Math.abs(pertonne))}</span>
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

// ── OHADA Section metadata ────────────────────────────────────
const OHADA_SECTIONS = {
  '60': { title: "60. Fournitures de l'usine et des bureaux", color: '#d4813a' },
  '61': { title: '61. Frais de transport',                    color: '#c08a40' },
  '62': { title: '62. Services extérieurs',                   color: '#5b8fe0' },
  '63': { title: '63. Autres services extérieurs',            color: '#5b7ed0' },
  '65': { title: '65. Autres charges',                        color: '#8a9e8a' },
  '66': { title: '66. Charges de personnel',                  color: '#e05c5c' },
}
const SECTION_ORDER = ['60', '61', '62', '63', '65', '66']

// ── Main Component ────────────────────────────────────────────

export default function PnLTable({ pnl, data }) {
  const { currency } = useDashboardStore()
  const c = (v) => fmt.currency(Math.abs(v), currency)
  const huileProduiteT = data?.kpis?.huileProduiteT || 0

  return (
    <div className="pnl-box">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12 }}>
        <div>
          <div className="chart-title">Compte de Résultat — Vue par Tonne d'Huile Produite</div>
          <div className="chart-subtitle">Base : {pnl.baseLabel}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span className="kpi-badge badge-up" style={{ fontSize: 11, padding: '4px 12px', whiteSpace: 'nowrap' }}>{pnl.status}</span>
          {data && (
            <button
              onClick={() => generatePnlPdf(data, currency)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px',
                background: 'rgba(242,140,40,0.08)',
                border: '1px solid rgba(242,140,40,0.35)',
                borderRadius: 8,
                color: 'var(--gold)',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(242,140,40,0.16)'; e.currentTarget.style.borderColor = 'rgba(242,140,40,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(242,140,40,0.08)'; e.currentTarget.style.borderColor = 'rgba(242,140,40,0.35)' }}
              title="Télécharger le compte de résultat en PDF"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Télécharger PDF
            </button>
          )}
        </div>
      </div>

      <ColHeaders />

      {/* ── I. CHIFFRE D'AFFAIRES ─────────────────────────── */}
      <div style={{ background: 'rgba(76,175,122,0.04)', borderRadius: 8, marginBottom: 4, overflow: 'hidden', border: '1px solid rgba(76,175,122,0.1)' }}>
        <SectionHeader title="I. Chiffre d'affaires" color="var(--green)" />
        {pnl.produits.map((row, i) => (
          <DataRow key={i} label={row.label} pertonne={row.pertonne} total={row.total}
            color={row.total > 0 ? 'var(--text)' : 'var(--text-dim)'} indent />
        ))}
        <div className="pnl-grid" style={{ display: 'grid', gridTemplateColumns: GRID, padding: '8px 14px', borderTop: '1px solid rgba(76,175,122,0.2)', background: 'rgba(76,175,122,0.06)' }}>
          <span style={{ ...styles.totalLabel, color: 'var(--green)' }}>Total CA</span>
          <span className="pnl-col-tonne" style={{ ...styles.totalNum, textAlign: 'right', color: 'var(--green)' }}>{fmt.full(pnl.totalProduitsTonne)}</span>
          <span style={{ ...styles.totalNum, textAlign: 'right', color: 'var(--green)' }}>{c(pnl.totalProduitsTotal)}</span>
        </div>
      </div>

      {/* ── II. COÛT MATIÈRE PREMIÈRE ──────────────────────── */}
      <div style={{ background: 'rgba(242,140,40,0.04)', borderRadius: 8, marginBottom: 4, overflow: 'hidden', border: '1px solid rgba(242,140,40,0.12)' }}>
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
        bg="rgba(242,140,40,0.08)"
        borderColor="rgba(242,140,40,0.25)"
      />

      {/* ── III. CHARGES D'EXPLOITATION (OHADA 61→66) ───────── */}
      {(() => {
        // Group charges by section
        const bySection = {}
        for (const row of pnl.chargesExploitation) {
          const sec = row.section || '65'
          if (!bySection[sec]) bySection[sec] = []
          bySection[sec].push(row)
        }

        // Compute per-section totals
        const secTotals = {}
        for (const [sec, rows] of Object.entries(bySection)) {
          secTotals[sec] = rows.reduce((s, r) => s + (r.total || 0), 0)
        }

        // ValeurAjoutée = MargeBrute - sec 60+61+62+63+65
        const vaDeductions = ['60','61','62','63','65'].reduce((s, sec) => s + (secTotals[sec] || 0), 0)
        const valeurAjoutee = pnl.margeBruteTotal + vaDeductions   // vaDeductions are negative
        const vaTonne = huileProduiteT ? Math.round(valeurAjoutee / huileProduiteT) : 0
        const vaPct   = pnl.totalProduitsTotal ? +((valeurAjoutee / pnl.totalProduitsTotal) * 100).toFixed(1) : 0

        // EBE = ValeurAjoutée - sec66
        const sec66Total  = secTotals['66'] || 0
        const ebe         = valeurAjoutee + sec66Total   // sec66Total is negative
        const ebeTonne    = huileProduiteT ? Math.round(ebe / huileProduiteT) : 0
        const ebePct      = pnl.totalProduitsTotal ? +((ebe / pnl.totalProduitsTotal) * 100).toFixed(1) : 0

        return (
          <>
            <div style={{ background: 'rgba(224,92,92,0.03)', borderRadius: 8, marginBottom: 4, overflow: 'hidden', border: '1px solid rgba(224,92,92,0.1)' }}>
              <SectionHeader title="III. Charges d'exploitation opérationnelles" color="var(--red)" />

              {/* Pre-66 sections (60, 61, 62, 63, 65) */}
              {SECTION_ORDER.filter(sec => sec !== '66' && bySection[sec]?.length > 0).map((sec, si) => {
                const meta = OHADA_SECTIONS[sec] || { title: `Section ${sec}`, color: 'var(--text-dim)' }
                const rows = bySection[sec]
                const tot  = secTotals[sec]
                const totT = huileProduiteT ? Math.round(tot / huileProduiteT) : 0
                return (
                  <div key={sec}>
                    <div style={{ padding: '8px 14px 2px', marginTop: si === 0 ? 0 : 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: meta.color, opacity: 0.85 }}>{meta.title}</span>
                    </div>
                    {rows.map((row, i) => (
                      <DataRow key={i} label={row.label} pertonne={-row.pertonne} total={row.total} color="var(--text)" indent />
                    ))}
                    {rows.length > 1 && (
                      <div className="pnl-grid" style={{ display: 'grid', gridTemplateColumns: GRID, padding: '5px 14px', background: 'rgba(0,0,0,0.04)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ ...styles.label, color: meta.color, fontWeight: 600 }}>Sous-total {meta.title.split('.')[0]}</span>
                        <span className="pnl-col-tonne" style={{ ...styles.num, textAlign: 'right', color: meta.color }}>– {fmt.full(Math.abs(totT))}</span>
                        <span style={{ ...styles.num, textAlign: 'right', color: meta.color }}>– {c(tot)}</span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* ── Valeur Ajoutée (entre 65 et 66) ── */}
              <SubtotalRow
                label="Valeur Ajoutée"
                pertonne={vaTonne}
                total={valeurAjoutee}
                pct={vaPct}
                color="#58a6ff"
                bg="rgba(88,166,255,0.07)"
                borderColor="rgba(88,166,255,0.22)"
              />

              {/* Section 66 — Charges de personnel */}
              {bySection['66']?.length > 0 && (() => {
                const meta = OHADA_SECTIONS['66']
                const rows = bySection['66']
                const tot  = secTotals['66']
                const totT = huileProduiteT ? Math.round(tot / huileProduiteT) : 0
                return (
                  <div>
                    <div style={{ padding: '8px 14px 2px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: meta.color, opacity: 0.85 }}>{meta.title}</span>
                    </div>
                    {rows.map((row, i) => (
                      <DataRow key={i} label={row.label} pertonne={-row.pertonne} total={row.total} color="var(--text)" indent />
                    ))}
                    {rows.length > 1 && (
                      <div className="pnl-grid" style={{ display: 'grid', gridTemplateColumns: GRID, padding: '5px 14px', background: 'rgba(0,0,0,0.04)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ ...styles.label, color: meta.color, fontWeight: 600 }}>Sous-total 66</span>
                        <span className="pnl-col-tonne" style={{ ...styles.num, textAlign: 'right', color: meta.color }}>– {fmt.full(Math.abs(totT))}</span>
                        <span style={{ ...styles.num, textAlign: 'right', color: meta.color }}>– {c(tot)}</span>
                      </div>
                    )}
                  </div>
                )
              })()}

              <div className="pnl-grid" style={{ display: 'grid', gridTemplateColumns: GRID, padding: '8px 14px', borderTop: '1px solid rgba(224,92,92,0.2)', background: 'rgba(224,92,92,0.05)' }}>
                <span style={{ ...styles.totalLabel, color: 'var(--red)' }}>Total Charges exploitation</span>
                <span className="pnl-col-tonne" style={{ ...styles.totalNum, textAlign: 'right', color: 'var(--red)' }}>– {fmt.full(Math.abs(pnl.totalChargesExpTonne))}</span>
                <span style={{ ...styles.totalNum, textAlign: 'right', color: 'var(--red)' }}>– {c(pnl.totalChargesExpTotal)}</span>
              </div>
            </div>

            {/* ── EBE (Excédent Brut d'Exploitation) ────────────── */}
            <SubtotalRow
              label="EBE — Excédent Brut d'Exploitation"
              pertonne={ebeTonne}
              total={ebe}
              pct={ebePct}
              color="var(--text)"
              bg="rgba(138,154,142,0.08)"
              borderColor="rgba(138,154,142,0.2)"
            />
          </>
        )
      })()}

      {/* ── IV. IMPÔTS & TAXES (hors IS) ───────────────────── */}
      {pnl.impotsTaxes && pnl.impotsTaxes.length > 0 && (
        <div style={{ background: 'rgba(138,92,224,0.03)', borderRadius: 8, marginBottom: 4, overflow: 'hidden', border: '1px solid rgba(138,92,224,0.12)' }}>
          <SectionHeader title="IV. Impôts & taxes (hors impôt sur bénéfices)" color="#8a5ce0" />
          {pnl.impotsTaxes.map((row, i) => (
            <DataRow key={i} label={row.label} pertonne={-row.pertonne} total={row.total} color="var(--text)" indent />
          ))}
          {pnl.impotsTaxes.length > 1 && (
            <div className="pnl-grid" style={{ display: 'grid', gridTemplateColumns: GRID, padding: '8px 14px', borderTop: '1px solid rgba(138,92,224,0.15)', background: 'rgba(138,92,224,0.04)' }}>
              <span style={{ ...styles.totalLabel, color: '#8a5ce0' }}>Total Impôts & taxes</span>
              <span className="pnl-col-tonne" style={{ ...styles.totalNum, textAlign: 'right', color: '#8a5ce0' }}>– {fmt.full(Math.abs(pnl.totalImpotsTaxesTonne))}</span>
              <span style={{ ...styles.totalNum, textAlign: 'right', color: '#8a5ce0' }}>– {c(pnl.totalImpotsTaxesTotal)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── RÉSULTAT D'EXPLOITATION ─────────────────────────── */}
      {pnl.resultatExplTotal != null && (
        <SubtotalRow
          label="Résultat d'exploitation"
          pertonne={pnl.resultatExplTonne}
          total={pnl.resultatExplTotal}
          pct={pnl.resultatExplPct}
          color={pnl.resultatExplTotal >= 0 ? 'var(--gold)' : 'var(--red)'}
          bg={pnl.resultatExplTotal >= 0 ? 'rgba(242,140,40,0.07)' : 'rgba(224,92,92,0.07)'}
          borderColor={pnl.resultatExplTotal >= 0 ? 'rgba(242,140,40,0.2)' : 'rgba(224,92,92,0.2)'}
        />
      )}

      {/* ── V. AMORTISSEMENTS & CHARGES FINANCIÈRES ────────── */}
      <div style={{ background: 'rgba(138,154,142,0.04)', borderRadius: 8, marginBottom: 4, overflow: 'hidden', border: '1px solid rgba(138,154,142,0.15)' }}>
        <SectionHeader title="V. Amortissements & charges financières" color="var(--text-dim)" />
        {pnl.amortissements.map((row, i) => (
          <DataRow key={i} label={row.label} pertonne={-row.pertonne} total={row.total} color="var(--text-dim)" indent />
        ))}
      </div>

      {/* ── VI. IMPÔT SUR BÉNÉFICES (BIC) ──────────────────── */}
      {pnl.bic && pnl.bic.length > 0 && (
        <div style={{ background: 'rgba(138,92,224,0.03)', borderRadius: 8, marginBottom: 4, overflow: 'hidden', border: '1px solid rgba(138,92,224,0.12)' }}>
          <SectionHeader title="VI. Impôt sur bénéfices (IS)" color="#8a5ce0" />
          {pnl.bic.map((row, i) => (
            <DataRow key={i} label={row.label} pertonne={-row.pertonne} total={row.total} color="var(--text-dim)" indent />
          ))}
        </div>
      )}

      {/* ── RÉSULTAT NET ─────────────────────────────────────── */}
      <div style={{ background: pnl.resultatTotal >= 0 ? 'rgba(76,175,122,0.08)' : 'rgba(224,92,92,0.08)', border: `1px solid ${pnl.resultatTotal >= 0 ? 'rgba(76,175,122,0.3)' : 'rgba(224,92,92,0.3)'}`, borderRadius: 8, padding: '12px 14px' }}>
        <div className="pnl-grid" style={{ display: 'grid', gridTemplateColumns: GRID }}>
          <span style={{ ...styles.resultatLabel, color: pnl.resultatTotal >= 0 ? 'var(--green)' : 'var(--red)' }}>
            Résultat Net Estimé
          </span>
          <span className="pnl-col-tonne" style={{ ...styles.resultatNum, textAlign: 'right', color: pnl.resultatTotal >= 0 ? 'var(--green)' : 'var(--red)' }}>
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
