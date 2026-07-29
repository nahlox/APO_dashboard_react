import { useEffect, useState } from 'react'
import { supabase } from '../../../db/supabase'
import { Card, Field, Badge, Banner, logAction } from '../../ui'

/** Catégories internes utilisées par le compte de résultat (voir CAT_LABELS côté dashboard). */
const CATEGORIES = [
  'fournitures_usine', 'frais_transport', 'services_ext', 'autres_services_ext',
  'autres_charges', 'charges_personnel', 'taxes_fiscales', 'frais_bancaires',
  'amortissement', 'materiels', 'electricite', 'eau_fournitures', 'construction',
  'entretien', 'assurance', 'vehicules', 'securite', 'salaires',
  'charges_patronales', 'frais_relat', 'frais_admin',
]
const SECTIONS = ['60', '61', '62', '63', '64', '65', '66', 'IV', 'BIC']

/**
 * Correspondance plan comptable → catégories du compte de résultat.
 * Les lignes `tenant_id = NULL` sont les défauts SYSCOHADA de la plateforme ;
 * un client peut les surcharger sans les modifier pour les autres.
 */
export default function TabPlanComptable({ tenantId }) {
  const [defauts, setDefauts] = useState(null)
  const [surcharges, setSurcharges] = useState([])
  const [banner, setBanner] = useState(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ prefixe: '', categorie: 'fournitures_usine', section_pnl: '60', libelle: '' })

  async function load() {
    const { data } = await supabase.from('compte_mappings').select('*').order('prefixe')
    setDefauts((data ?? []).filter(r => r.tenant_id === null))
    setSurcharges((data ?? []).filter(r => r.tenant_id === tenantId))
  }
  useEffect(() => { load() }, [tenantId])

  async function addOverride(e) {
    e.preventDefault()
    setBusy(true); setBanner(null)
    try {
      const { error } = await supabase.from('compte_mappings').upsert({
        tenant_id: tenantId, prefixe: form.prefixe.trim(),
        categorie: form.categorie, section_pnl: form.section_pnl,
        libelle: form.libelle.trim() || null,
      }, { onConflict: 'tenant_id,prefixe' })
      if (error) throw error
      await logAction('mapping_upsert', tenantId, form)
      setBanner({ ok: `Compte ${form.prefixe} mappé sur « ${form.categorie} ».` })
      setForm({ ...form, prefixe: '', libelle: '' })
      load()
    } catch (err) { setBanner({ error: err.message }) }
    finally { setBusy(false) }
  }

  async function removeOverride(id, prefixe) {
    if (!confirm(`Supprimer la surcharge du compte ${prefixe} ?\nLe défaut SYSCOHADA reprendra effet.`)) return
    const { error } = await supabase.from('compte_mappings').delete().eq('id', id)
    if (error) return setBanner({ error: error.message })
    await logAction('mapping_delete', tenantId, { prefixe })
    load()
  }

  return (
    <>
      <Banner {...(banner ?? {})} />

      <Card title="À quoi ça sert">
        <div className="admin-hint">
          Quand les données viennent d'un logiciel comptable (Sage, Odoo…), chaque écriture porte
          un numéro de compte. Cette table traduit ces numéros en catégories du compte de résultat.
          Les défauts SYSCOHADA couvrent la zone OHADA ; ajoutez une surcharge uniquement si ce
          client utilise un plan comptable particulier.
        </div>
      </Card>

      <Card title={`Surcharges de ce client (${surcharges.length})`}>
        {surcharges.length === 0 && (
          <div className="admin-empty" style={{ padding: 18 }}>
            Aucune surcharge — ce client utilise les défauts SYSCOHADA.
          </div>
        )}
        {surcharges.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Préfixe</th><th>Catégorie</th><th>Section</th><th>Libellé</th><th></th></tr></thead>
              <tbody>
                {surcharges.map(m => (
                  <tr key={m.id}>
                    <td className="admin-mono">{m.prefixe}</td>
                    <td>{m.categorie}</td>
                    <td>{m.section_pnl}</td>
                    <td style={{ color: 'var(--a-dim)' }}>{m.libelle || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="admin-btn admin-btn-danger" onClick={() => removeOverride(m.id, m.prefixe)}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={addOverride}>
          <div className="admin-row" style={{ marginTop: 12 }}>
            <Field label="Préfixe de compte" hint="ex : 601, 66">
              <input required className="admin-input admin-mono" value={form.prefixe}
                     onChange={e => setForm(f => ({ ...f, prefixe: e.target.value }))} placeholder="601" />
            </Field>
            <Field label="Catégorie">
              <select className="admin-select" value={form.categorie}
                      onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Section P&L">
              <select className="admin-select" value={form.section_pnl}
                      onChange={e => setForm(f => ({ ...f, section_pnl: e.target.value }))}>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Libellé (optionnel)">
              <input className="admin-input" value={form.libelle}
                     onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Achats de régimes" />
            </Field>
          </div>
          <div className="admin-actions">
            <button type="submit" className="admin-btn" disabled={busy}>Ajouter la surcharge</button>
          </div>
        </form>
      </Card>

      <Card title={`Défauts plateforme — SYSCOHADA (${defauts?.length ?? 0})`}>
        {defauts === null && <div className="admin-loading">Chargement…</div>}
        {defauts && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Préfixe</th><th>Catégorie</th><th>Section</th><th>Libellé</th><th></th></tr></thead>
              <tbody>
                {defauts.map(m => {
                  const surcharge = surcharges.find(s => s.prefixe === m.prefixe)
                  return (
                    <tr key={m.id}>
                      <td className="admin-mono">{m.prefixe}</td>
                      <td style={{ textDecoration: surcharge ? 'line-through' : 'none', opacity: surcharge ? .5 : 1 }}>{m.categorie}</td>
                      <td>{m.section_pnl}</td>
                      <td style={{ color: 'var(--a-dim)' }}>{m.libelle}</td>
                      <td style={{ textAlign: 'right' }}>
                        {surcharge && <Badge kind="warn">surchargé</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
