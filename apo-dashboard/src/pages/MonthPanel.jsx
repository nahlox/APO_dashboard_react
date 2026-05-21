import VueEnsemble from '../components/sections/VueEnsemble'
import Production from '../components/sections/Production'
import Revenus from '../components/sections/Revenus'
import { Charges, Fournisseurs, Pepiniere } from '../components/sections/OperationalSections'
import ErrorBoundary from '../components/ErrorBoundary'

export default function MonthPanel({ data, month, activeTab = 'vue-ensemble', allMois = [] }) {
  return (
    <div style={{ paddingTop: 24 }}>
      <ErrorBoundary key={`${month}-${activeTab}`}>
        {activeTab === 'vue-ensemble' && <VueEnsemble data={data} month={month} />}
        {activeTab === 'production'   && <Production   data={data} month={month} />}
        {activeTab === 'revenus'      && <Revenus       data={data} month={month} />}
        {activeTab === 'charges'      && <Charges       data={data} month={month} />}
        {activeTab === 'fournisseurs' && <Fournisseurs  data={data} month={month} allMois={allMois} />}
        {activeTab === 'pepiniere'    && <Pepiniere     data={data} month={month} />}
      </ErrorBoundary>
    </div>
  )
}
