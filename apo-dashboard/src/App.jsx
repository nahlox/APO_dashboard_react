import { useEffect } from 'react'
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

export default function App() {
  const { activeMonth, theme, setMoisData } = useDashboardStore()

  // Mois supplémentaires depuis Supabase (Avril et au-delà uniquement)
  const { moisData: moisSupp } = useMoisDB()

  // Pousse les mois Supabase dans le store pour que VueEnsemble y accède
  useEffect(() => {
    setMoisData(moisSupp)
  }, [moisSupp, setMoisData])

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light')
  }, [theme])

  // Tous les mois : statiques + Supabase (sans doublons)
  const staticKeys = new Set(MONTH_DATA.map(m => m.key))
  const allMois = [...MONTH_DATA, ...moisSupp.filter(m => !staticKeys.has(m.key))]

  return (
    <>
      <Header />
      <div className="app-layout">
        <Sidebar allMois={allMois} />
        <div className="content-area">
          <main>
            {activeMonth === 'global' && (
              <GlobalPanel moisData={moisSupp.filter(m => !staticKeys.has(m.key))} />
            )}

            {allMois.map(({ key, data }) =>
              activeMonth === key && (
                <MonthPanel key={key} data={data} month={key} />
              )
            )}
          </main>
        </div>
      </div>
    </>
  )
}
