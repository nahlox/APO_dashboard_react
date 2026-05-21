import { useEffect, useState, useCallback } from 'react'
import { usePullToRefresh } from './hooks/usePullToRefresh'
import SplashScreen from './components/SplashScreen'
import './styles/global.css'
import { useDashboardStore } from './store/dashboardStore'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import MobileBottomNav from './components/layout/MobileBottomNav'
import GlobalPanel from './pages/GlobalPanel'
import MonthPanel from './pages/MonthPanel'
import { MONTH_DATA } from './data/index'          // Jan/Fév/Mar — données statiques exactes
import { useMoisDB } from './hooks/useMoisDB'       // Avr+ depuis Supabase

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

const MONTH_TABS = [
  { id: 'vue-ensemble', label: "Vue d'Ensemble" },
  { id: 'production',   label: 'Production & Graines' },
  { id: 'revenus',      label: 'Revenus & Ventes' },
  { id: 'charges',      label: 'Charges & Coûts' },
  { id: 'fournisseurs', label: 'Fournisseurs' },
  { id: 'pepiniere',    label: 'Pépinière', janOnly: true },
]

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const handleSplashDone = useCallback(() => setSplashDone(true), [])

  const { activeMonth, activeTab, setActiveTab, theme, setMoisData, setEurRate } = useDashboardStore()

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

  const staticKeys = new Set(MONTH_DATA.map(m => m.key))
  const allMois    = [...MONTH_DATA, ...moisSupp.filter(m => !staticKeys.has(m.key))]

  const isMonthActive = activeMonth !== 'global'
  const currentTab    = activeTab[activeMonth] ?? 'vue-ensemble'
  const tabs          = MONTH_TABS.filter(t => !t.janOnly || activeMonth === 'jan')

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
      <button
        onClick={() => window.location.reload()}
        style={{
          display: 'none',
          position: 'fixed', bottom: 24, right: 20, zIndex: 9998,
          background: 'rgba(19,37,25,0.95)', border: '1px solid rgba(242,140,40,0.4)',
          color: 'var(--gold)', borderRadius: 50, width: 48, height: 48,
          fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}
        className="mobile-refresh-btn"
        title="Actualiser"
      >↻</button>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}

      <div className="app-layout">
        <Sidebar allMois={allMois} />
        <div className="content-area">
          <Header />

          {isMonthActive && (
            <nav className="nav-tabs">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={`nav-tab${currentTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(activeMonth, tab.id)}
                >
                  {tab.label}
                </div>
              ))}
            </nav>
          )}

          <main>
            {activeMonth === 'global' && (
              <GlobalPanel moisData={moisSupp.filter(m => !staticKeys.has(m.key))} />
            )}
            {allMois.map(({ key, data }) =>
              activeMonth === key && (
                <MonthPanel key={key} data={data} month={key} activeTab={currentTab} />
              )
            )}
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </>
  )
}
