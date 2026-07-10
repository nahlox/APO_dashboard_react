import { useEffect, useRef } from 'react'
import PnLTable from '../components/pnl/PnLTable'
import { generatePnlPdf } from '../lib/generatePnlPdf'
import { useDashboardStore } from '../store/dashboardStore'
import { monthFull } from '../lib/monthUtils'
import { fmt } from '../lib/kpiEngine'
import { useAuth } from '../contexts/AuthContext'

/**
 * Vue dédiée au compte de résultat (P&L) d'un mois précis.
 * Affichage plein écran avec bouton de téléchargement proéminent.
 */
export default function PnLView({ data }) {
  const { currency, eurRate, closePnlView } = useDashboardStore()
  const { branding } = useAuth()
  const brandNom = branding?.nom_affichage || 'APO Agro Palm Oil'
  const printRef = useRef(null)

  // Scroll au top à l'ouverture
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [data])

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
        Document indisponible — données manquantes pour ce mois.
      </div>
    )
  }

  const kpis = data.kpis
  const resultatPos = kpis.resultatNetFCFA >= 0
  const titre = monthFull(data)

  return (
    <div className="pnl-view" ref={printRef}>
      {/* Bandeau du document */}
      <div className="pnl-view-header">
        <div className="pnl-view-back">
          <button onClick={closePnlView} className="pnl-view-back-btn" aria-label="Retour">
            ← Retour
          </button>
        </div>

        <div className="pnl-view-title-wrap">
          <div className="pnl-view-doctype">DOCUMENT OFFICIEL</div>
          <h1 className="pnl-view-title">
            Compte de Résultat — {titre}
          </h1>
          <div className="pnl-view-sub">
            {brandNom} · Présentation OHADA · {kpis.huileProduiteT} tonnes d'huile produites
          </div>
        </div>

        <div className="pnl-view-actions">
          <button
            className="pnl-view-download"
            onClick={() => generatePnlPdf(data, currency, brandNom)}
            title="Télécharger le PDF"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Télécharger PDF
          </button>
        </div>
      </div>

      {/* Résumé financier */}
      <div className="pnl-view-summary">
        <div className="pnl-summary-card">
          <div className="pnl-summary-label">Chiffre d'Affaires</div>
          <div className="pnl-summary-value gold">{fmt.currency(kpis.caTotalFCFA, currency, eurRate)}</div>
        </div>
        <div className="pnl-summary-card">
          <div className="pnl-summary-label">Coût Matière</div>
          <div className="pnl-summary-value red">{fmt.currency(kpis.coutMPFCFA, currency, eurRate)}</div>
        </div>
        <div className="pnl-summary-card">
          <div className="pnl-summary-label">Charges Exploitation</div>
          <div className="pnl-summary-value red">{fmt.currency(kpis.chargesExplFCFA, currency, eurRate)}</div>
        </div>
        <div className={`pnl-summary-card highlight ${resultatPos ? 'pos' : 'neg'}`}>
          <div className="pnl-summary-label">Résultat Net</div>
          <div className={`pnl-summary-value ${resultatPos ? 'green' : 'red'}`}>
            {resultatPos ? '+ ' : '– '}{fmt.currency(Math.abs(kpis.resultatNetFCFA), currency, eurRate)}
          </div>
          <div className="pnl-summary-sub">{kpis.margeNette}% de marge nette</div>
        </div>
      </div>

      {/* Tableau P&L complet */}
      <PnLTable pnl={data.pnl} data={data} />
    </div>
  )
}
