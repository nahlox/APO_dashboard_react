import { useEffect } from 'react'
import { Chart } from 'chart.js'
import { chartColors, defaultTooltip } from '../lib/kpiEngine'

export function useChartDefaults() {
  useEffect(() => {
    Chart.defaults.color = '#8A9A8E'
    Chart.defaults.borderColor = 'rgba(200,150,62,0.1)'
    Chart.defaults.font.family = "'DM Sans', sans-serif"
    Chart.defaults.font.size = 13
  }, [])
}

export { chartColors, defaultTooltip }
