import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 80   // px to pull before triggering
const MAX_PULL  = 120  // px cap on visual pull distance

/**
 * Pull-to-refresh on mobile.
 * Returns { pullDistance } for optional visual indicator.
 * Triggers window.location.reload() when pull exceeds THRESHOLD.
 */
export function usePullToRefresh() {
  const startY      = useRef(null)
  const [pull, setPull] = useState(0)

  useEffect(() => {
    const onTouchStart = (e) => {
      // Only trigger when already scrolled to top
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
      }
    }

    const onTouchMove = (e) => {
      if (startY.current === null) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0) {
        setPull(Math.min(delta, MAX_PULL))
      }
    }

    const onTouchEnd = () => {
      if (pull >= THRESHOLD) {
        window.location.reload()
      }
      startY.current = null
      setPull(0)
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove',  onTouchMove,  { passive: true })
    document.addEventListener('touchend',   onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove',  onTouchMove)
      document.removeEventListener('touchend',   onTouchEnd)
    }
  }, [pull])

  return { pullDistance: pull }
}
