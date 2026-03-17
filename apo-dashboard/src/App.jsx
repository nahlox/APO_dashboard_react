import { useEffect } from 'react'
import './styles/global.css'
import { useDashboardStore } from './store/dashboardStore'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import GlobalPanel from './pages/GlobalPanel'
import MonthPanel from './pages/MonthPanel'
import { janData } from './data/janvier'
import { febData } from './data/fevrier'

// Enregistrement global Chart.js
import { Chart, CategoryScale, LinearScale, BarElement, BarController, LineElement, LineController, PointElement, ArcElement, DoughnutController, Tooltip, Legend, Filler } from 'chart.js'
Chart.register(CategoryScale, LinearScale, BarElement, BarController, LineElement, LineController, PointElement, ArcElement, DoughnutController, Tooltip, Legend, Filler)

// Defaults globaux Chart.js APO
Chart.defaults.color = '#8A9A8E'
Chart.defaults.borderColor = 'rgba(200,150,62,0.1)'
Chart.defaults.font.family = "'DM Sans', sans-serif"
Chart.defaults.font.size = 13

export default function App() {
  const { activeMonth, theme } = useDashboardStore()

  // Sync class body avec le theme store
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light')
  }, [theme])

  return (
    <>
      <Header />
      <div className="app-layout">
        <Sidebar />
        <div className="content-area">
          <main>
            {activeMonth === 'global' && <GlobalPanel />}
            {activeMonth === 'jan'    && <MonthPanel data={janData} month="jan" />}
            {activeMonth === 'feb'    && <MonthPanel data={febData} month="feb" />}
          </main>
        </div>
      </div>
    </>
  )
}
