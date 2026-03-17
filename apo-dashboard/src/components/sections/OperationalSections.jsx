import { fmt } from '../../lib/kpiEngine'

// ── CHARGES ──────────────────────────────────────────────────
export function Charges({ data, month }) {
  const { charges } = data
  const isJan = month === 'jan'
  return (
    <section>
      <div className="section-title">Charges & Coûts</div>
      <div className="section-subtitle">Top dépenses opérationnelles — {isJan ? 'Janvier' : 'Février'} 2026</div>
      <div className="chart-card">
        <div className="chart-title">Top 15 Dépenses du Mois</div>
        <div className="chart-subtitle">Classées par montant décroissant (hors achats graines)</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Libellé</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Montant FCFA</th>
            </tr>
          </thead>
          <tbody>
            {charges.topDepenses.map((r, i) => (
              <tr key={i}>
                <td className="rank">{i + 1}</td>
                <td>{r.lib}</td>
                <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-dim)' }}>{r.date}</td>
                <td className="num" style={{ color: 'var(--red)' }}>– {fmt.full(r.mt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ── FOURNISSEURS ──────────────────────────────────────────────
export function Fournisseurs({ data, month }) {
  const { fournisseurs } = data
  const isJan = month === 'jan'
  return (
    <section>
      <div className="section-title">Fournisseurs</div>
      <div className="section-subtitle">Classement et volumes d'achat — {isJan ? 'Janvier' : 'Février'} 2026</div>
      <div className="chart-card">
        <div className="chart-title">Top Fournisseurs par Volume</div>
        <div className="chart-subtitle">Poids (kg), prix unitaire et montant total payé</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fournisseur</th>
              <th style={{ textAlign: 'right' }}>Poids (kg)</th>
              <th style={{ textAlign: 'right' }}>Prix F/kg</th>
              <th style={{ textAlign: 'right' }}>Montant FCFA</th>
              <th>Part</th>
            </tr>
          </thead>
          <tbody>
            {fournisseurs.liste.map((f, i) => {
              const pct = (f.poids / fournisseurs.totalPoidsKg * 100).toFixed(1)
              return (
                <tr key={i}>
                  <td className="rank">{i + 1}</td>
                  <td>{f.name}</td>
                  <td className="num">{fmt.full(f.poids)}</td>
                  <td className="num">{f.prix} F/kg</td>
                  <td className="num" style={{ color: 'var(--gold)' }}>{fmt.full(f.montant)}</td>
                  <td>
                    <div className="mini-bar-wrap" style={{ minWidth: 120 }}>
                      <div className="mini-bar">
                        <div className="mini-bar-fill" style={{ width: pct + '%' }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", width: 40 }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ── PÉPINIÈRE ─────────────────────────────────────────────────
export function Pepiniere({ data, month }) {
  const { kpis, pepiniere } = data
  if (!pepiniere) return null
  const isJan = month === 'jan'

  return (
    <section>
      <div className="section-title">Pépinière</div>
      <div className="section-subtitle">Suivi des ventes de plants et encaissements — {isJan ? 'Janvier' : 'Février'} 2026</div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Contrats Totaux</div>
          <div className="kpi-value gold">{fmt.millions(kpis.pepContratsFCFA)} M</div>
          <div className="kpi-sub">FCFA · {pepiniere.clients.length} clients</div>
        </div>
        <div className="kpi-card accent-green">
          <div className="kpi-label">Encaissé</div>
          <div className="kpi-value green">{fmt.millions(kpis.pepEncaisséFCFA)} M</div>
          <div className="kpi-sub">FCFA · {(kpis.pepEncaisséFCFA / kpis.pepContratsFCFA * 100).toFixed(0)}% collecté</div>
        </div>
        <div className="kpi-card accent-red">
          <div className="kpi-label">Reste à Percevoir</div>
          <div className="kpi-value red">{fmt.millions(kpis.pepResteaFCFA)} M</div>
          <div className="kpi-sub">FCFA · créances à recouvrer</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Détail Clients Pépinière</div>
        <div className="chart-subtitle">Statut de règlement par client</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nom Client</th>
              <th>Localité</th>
              <th style={{ textAlign: 'right' }}>Ha</th>
              <th style={{ textAlign: 'right' }}>Total FCFA</th>
              <th style={{ textAlign: 'right' }}>Encaissé</th>
              <th style={{ textAlign: 'right' }}>Reste</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {pepiniere.clients.map((r) => {
              const reste = r.total - r.enc
              return (
                <tr key={r.no}>
                  <td className="rank">{r.no}</td>
                  <td>{r.nom}</td>
                  <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{r.loc}</td>
                  <td className="num">{r.ha} ha</td>
                  <td className="num">{fmt.full(r.total)}</td>
                  <td className="num" style={{ color: 'var(--green)' }}>{fmt.full(r.enc)}</td>
                  <td className="num" style={{ color: reste > 0 ? 'var(--red)' : 'var(--text-dim)' }}>
                    {reste > 0 ? '–' + fmt.full(reste) : '0'}
                  </td>
                  <td>
                    <span className={`kpi-badge ${reste === 0 ? 'badge-up' : 'badge-down'}`}>
                      {reste === 0 ? 'Soldé' : 'Solde dû'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
