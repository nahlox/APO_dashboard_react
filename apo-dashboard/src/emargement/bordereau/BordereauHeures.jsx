import { useEffect, useRef } from 'react'
import { supabase } from '../../db/supabase'
import { mountBordereau } from './bordereau.js'
import css from './bordereau.css?raw'
import markup from './bordereau.html?raw'

const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap'

/** Les @font-face ne se chargent pas depuis un Shadow DOM : on ajoute la feuille au document. */
function chargerPolices() {
  if (document.querySelector(`link[href="${FONTS_HREF}"]`)) return
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = FONTS_HREF
  document.head.appendChild(l)
}

/** Thème Palmeo (classe `light` sur <body>) → attribut data-theme lu par la CSS de l'artefact. */
function themeCourant() {
  return document.body.classList.contains('light') ? 'light' : 'dark'
}

/**
 * « Bordereau des Heures » : l'artefact d'émargement repris tel quel (DOM, CSS
 * et logique d'origine), isolé dans un Shadow DOM pour ne rien partager avec
 * les styles du tableau de bord, et branché sur Supabase.
 */
export default function BordereauHeures({ tenantId, peutSaisir }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    chargerPolices()
    host.setAttribute('data-theme', themeCourant())
    const obs = new MutationObserver(() => host.setAttribute('data-theme', themeCourant()))
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    const root = host.shadowRoot || host.attachShadow({ mode: 'open' })
    root.innerHTML = `<style>${css}</style>${markup}`
    const destroy = mountBordereau(root, { sb: supabase, tenantId, writable: peutSaisir })

    return () => {
      obs.disconnect()
      destroy()
      root.innerHTML = ''
    }
  }, [tenantId, peutSaisir])

  return <div ref={hostRef} />
}
