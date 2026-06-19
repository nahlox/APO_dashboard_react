import { useState, useEffect } from 'react'
import { supabase } from '../db/supabase'

export function useCpoPrices(limit = 18) {
  const [prices,  setPrices]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    supabase
      .from('prix_cpo')
      .select('date, prix_usd_tonne')
      .order('date', { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setPrices((data || []).reverse())  // plus ancien → plus récent pour le graphique
        setLoading(false)
      })
  }, [limit])

  const latest   = prices[prices.length - 1]   ?? null
  const previous = prices[prices.length - 2]   ?? null
  const pctChange = (latest && previous && previous.prix_usd_tonne > 0)
    ? ((latest.prix_usd_tonne - previous.prix_usd_tonne) / previous.prix_usd_tonne * 100).toFixed(1)
    : null

  return { prices, loading, error, latest, pctChange }
}
