import { useEffect, useState, useCallback } from 'react'
import SplashScreen from './components/SplashScreen'
import './styles/global.css'
import { useDashboardStore } from './store/dashboardStore'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
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

  const { activeMonth, activeTab, setActiveTab, theme, setMoisData } = useDashboardStore()

  const { moisData: moisSupp } = useMoisDB()

  useEffect(() => {
    setMoisData(moisSupp)
  }, [moisSupp, setMoisData])

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light')
  }, [theme])

  const staticKeys = new Set(MONTH_DATA.map(m => m.key))
  const allMois    = [...MONTH_DATA, ...moisSupp.filter(m => !staticKeys.has(m.key))]

  const isMonthActive = activeMonth !== 'global'
  const currentTab    = activeTab[activeMonth] ?? 'vue-ensemble'
  const tabs          = MONTH_TABS.filter(t => !t.janOnly || activeMonth === 'jan')

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      <Header />

      {/* Nav tabs — sibling of header, always flush against APO banner */}
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

      <div className="app-layout">
        <Sidebar allMois={allMois} />
        <div className="content-area">
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
    </>
  )
}
