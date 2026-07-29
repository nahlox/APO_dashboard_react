/** Primitives UI de la console opérateur (voir admin.css). */
import { supabase } from '../db/supabase'

export function Card({ title, right, children }) {
  return (
    <div className="admin-card">
      {title && <div className="admin-card-title"><span>{title}</span>{right}</div>}
      {children}
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="admin-field">
      {label && <span className="admin-label">{label}</span>}
      {children}
      {hint && <span className="admin-hint">{hint}</span>}
    </label>
  )
}

export function Stat({ label, value, hint }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
      {hint && <div className="admin-stat-hint">{hint}</div>}
    </div>
  )
}

export function Badge({ kind, children }) {
  return <span className={`admin-badge ${kind || ''}`}><span className="admin-dot" />{children}</span>
}

export function Banner({ ok, error, info }) {
  const msg = ok || error || info
  if (!msg) return null
  const kind = ok ? 'ok' : error ? 'error' : 'info'
  return <div className={`admin-banner ${kind}`}>{msg}</div>
}

/** Formatage FCFA compact (M / Md) pour les vues de pilotage. */
export function money(v) {
  const n = Number(v) || 0
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)} Md`
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(0)} M`
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)} K`
  return String(Math.round(n))
}

export function dateFR(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function dateTimeFR(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** Fraîcheur des données → badge (vert < 3j, orange < 8j, rouge au-delà). */
export function freshness(days) {
  if (days === null || days === undefined) return { kind: '', text: 'Aucune donnée' }
  if (days <= 2) return { kind: 'ok',     text: days <= 0 ? "Aujourd'hui" : `${days} j` }
  if (days <= 7) return { kind: 'warn',   text: `${days} j` }
  return { kind: 'danger', text: `${days} j` }
}

/** Journalise une action admin (best-effort — n'interrompt jamais l'action). */
export async function logAction(action, tenantId, details) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('admin_audit_log').insert({
      acteur_id: user?.id, acteur_email: user?.email,
      tenant_id: tenantId, action, details: details ?? null,
    })
  } catch { /* le journal ne doit jamais bloquer une opération */ }
}

/** Liste "a, b, c" ⇄ tableau — utilisé pour les champs multi-valeurs. */
export const parseList = (s) => (s || '').split(',').map(x => x.trim()).filter(Boolean)
export const joinList  = (a) => (Array.isArray(a) ? a.join(', ') : '')
