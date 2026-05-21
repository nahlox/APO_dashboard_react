import { useEffect, useState, useCallback, useMemo } from 'react'
import { usePullToRefresh } from './hooks/usePullToRefresh'
import SplashScreen from './components/SplashScreen'
import './styles/global.css'
import { useDashboardStore } from './store/dashboardStore'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import MobileBottomNav from './components/layout/MobileBottomNav'
import MonthRangeFilter from './components/layout/MonthRangeFilter'
import MonthPanel from './pages/MonthPanel'
import GlobalOverview from './pages/GlobalOverview'
import PnLView from './pages/PnLView'
import { useMoisDB } from './hooks/useMoisDB'
import { buildAggregateData, filterMonthsByRange } from './lib/aggregateData'

import {
  Chart, CategoryScale, LinearScale,
  BarElement, BarController,
  LineElement, LineController, PointElement,
  ArcElement, DoughnutController,
  Tooltip, Legend, Filler,
} from 'chart.js'
Chart.register(
  CategoryScale, LinearScale,
  BarElement, BarController,
  LineElement, LineController, PointElement,
  ArcElement, DoughnutController,
  Tooltip, Legend, Filler,
)
Chart.defaults.color       = '#8A9A84'
Chart.defaults.borderColor = 'rgba(242,140,40,0.1)'
Chart.defaults.font.family = "'DM Sans', sans-serif"
Chart.defaults.font.size   = 13

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const handleSplashDone = useCallback(() => setSplashDone(true), [])

  const { activeTab, theme, setMoisData, setEurRate, monthRange, activePnlMonth } = useDashboardStore()

  const { moisData: moisSupp } = useMoisDB()

  useEffect(() => {
    setMoisData(moisSupp)
  }, [moisSupp, setMoisData])

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light')
  }, [theme])

  // Taux EUR live — XOF est arrimé à 655,957 mais on vérifie via l'API
  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=EUR&to=XOF')
      .then(r => r.json())
      .then(d => {
        const rate = d?.rates?.XOF
        if (rate && rate > 0) setEurRate(rate, d.date)
      })
      .catch(() => { /* utilise le taux par défaut 655,957 */ })
  }, [setEurRate])

  const { pullDistance } = usePullToRefresh()

  // Tous les mois proviennent de Supabase (avec fallback statique pour Jan/Fév/Mars)
  const allMois = moisSupp

  // Filtre par plage de mois
  const filteredMois = useMemo(
    () => filterMonthsByRange(allMois, monthRange),
    [allMois, monthRange]
  )

  // Données agrégées (sur la plage filtrée)
  const aggregatedData = useMemo(
    () => buildAggregateData(filteredMois),
    [filteredMois]
  )

  // Pépinière retirée → fallback Vue d'Ensemble si tab obsolète
  const VALID_TABS = ['vue-ensemble', 'production', 'revenus', 'charges', 'fournisseurs']
  const savedTab   = activeTab['global']
  const currentTab = VALID_TABS.includes(savedTab) ? savedTab : 'vue-ensemble'

  // Clé unique pour forcer le re-render des sections quand la plage change
  const rangeKey = filteredMois.length
    ? `${filteredMois[0].key}-${filteredMois[filteredMois.length - 1].key}-${filteredMois.length}`
    : 'empty'

  return (
    <>
      {pullDistance > 10 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          height: pullDistance, background: 'rgba(19,37,25,0.92)',
          transition: 'height 0.1s', pointerEvents: 'none',
          color: pullDistance >= 80 ? 'var(--gold)' : 'var(--text-dim)',
          fontSize: 13, letterSpacing: 1,
        }}>
          {pullDistance >= 80 ? '↑ Relâchez pour actualiser' : '↓ Tirez pour actualiser'}
        </div>
      )}
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}

      <div className="app-layout">
        <Sidebar allMois={allMois} />
        <div className="content-area">
          <Header />

          {/* Filtre de plage — masqué en mode P&L (un seul mois fixe) */}
          {!activePnlMonth && <MonthRangeFilter allMois={allMois} />}

          <main>
            {activePnlMonth ? (
              <PnLView
                key={activePnlMonth}
                data={allMois.find(m => m.key === activePnlMonth)?.data}
              />
            ) : (
              <>
                {!aggregatedData && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
                    Aucun mois ne correspond au filtre sélectionné.
                  </div>
                )}
                {aggregatedData && currentTab === 'vue-ensemble' && filteredMois.length > 1 && (
                  <GlobalOverview filteredMois={filteredMois} aggregatedData={aggregatedData} />
                )}
                {aggregatedData && !(currentTab === 'vue-ensemble' && filteredMois.length > 1) && (
                  <MonthPanel key={rangeKey} data={aggregatedData} month={rangeKey} activeTab={currentTab} allMois={allMois} />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </>
  )
}
