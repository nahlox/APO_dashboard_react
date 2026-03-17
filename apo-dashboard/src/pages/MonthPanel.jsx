import { useState } from 'react'
import VueEnsemble from '../components/sections/VueEnsemble'
import Production from '../components/sections/Production'
import Revenus from '../components/sections/Revenus'
import { Charges, Fournisseurs, Pepiniere } from '../components/sections/OperationalSections'

const TABS = [
  { id: 'vue-ensemble', label: "Vue d'Ensemble" },
  { id: 'production',   label: 'Production & Graines' },
  { id: 'revenus',      label: 'Revenus & Ventes' },
  { id: 'charges',      label: 'Charges & Coûts' },
  { id: 'fournisseurs', label: 'Fournisseurs' },
  { id: 'pepiniere',    label: 'Pépinière', janOnly: true },
]

export default function MonthPanel({ data, month }) {
  const [activeTab, setActiveTab] = useState('vue-ensemble')

  const tabs = TABS.filter(t => !t.janOnly || month === 'jan')

  return (
    <div>
      {/* Sub-navigation */}
      <nav className="nav-tabs" style={{ margin: '0 -40px', padding: '0 40px' }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </nav>

      <div style={{ paddingTop: 24 }}>
        {activeTab === 'vue-ensemble' && <VueEnsemble data={data} month={month} />}
        {activeTab === 'production'   && <Production   data={data} month={month} />}
        {activeTab === 'revenus'      && <Revenus       data={data} month={month} />}
        {activeTab === 'charges'      && <Charges       data={data} month={month} />}
        {activeTab === 'fournisseurs' && <Fournisseurs  data={data} month={month} />}
        {activeTab === 'pepiniere'    && <Pepiniere     data={data} month={month} />}
      </div>
    </div>
  )
}
