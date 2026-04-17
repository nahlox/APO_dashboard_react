import { useEffect } from 'react'
import { Chart } from 'chart.js'
import { chartColors, defaultTooltip } from '../lib/kpiEngine'

export function useChartDefaults() {
  useEffect(() => {
    Chart.defaults.color = '#8A9A84'
    Chart.defaults.borderColor = 'rgba(242,140,40,0.1)'
    Chart.defaults.font.family = "'DM Sans', sans-serif"
    Chart.defaults.font.size = 13
  }, [])
}

export { chartColors, defaultTooltip }
