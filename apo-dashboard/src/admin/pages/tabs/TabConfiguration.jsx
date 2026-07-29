import { useState } from 'react'
import { supabase } from '../../../db/supabase'
import { Card, Field, Banner, logAction, parseList, joinList } from '../../ui'

const PLANS = ['starter', 'business', 'enterprise']

/** Clés de config gérées par des champs dédiés — le reste part dans l'éditeur JSON avancé. */
const CLES_GEREES = [
  'report_recipients', 'tank_capacite_kg', 'skip_caisse', 'skip_banque',
  'rapport_email_actif', 'push_actif', 'seuil_te_critique', 'seuil_te_bas', 'seuil_marge_cible',
]

export default function TabConfiguration({ tenant, config, onSaved }) {
  const [t, setT] = useState(tenant)
  const [c, setC] = useState({
    report_recipients:  joinList(config.report_recipients),
    tank_capacite_kg:   config.tank_capacite_kg ?? '',
    skip_caisse:        joinList(config.skip_caisse) || 'TRANSFERT, VIREMENT, VERSEMENT, DEPOT, APPRO',
    skip_banque:        joinList(config.skip_banque) || 'APPRO CAISSE, COMPENSATION CHQ, VIREMENT, VERSEMENT, APPRO SARCI',
    rapport_email_actif: config.rapport_email_actif !== false,
    push_actif:          config.push_actif !== false,
    seuil_te_critique:   config.seuil_te_critique ?? 0.17,
    seuil_te_bas:        config.seuil_te_bas ?? 0.18,
    seuil_marge_cible:   config.seuil_marge_cible ?? 0.15,
  })
  const avance = Object.fromEntries(Object.entries(config).filter(([k]) => !CLES_GEREES.includes(k)))
  const [rawJson, setRawJson] = useState(JSON.stringify(avance, null, 2))
  const [banner, setBanner]   = useState(null)
  const [busy, setBusy]       = useState(false)

  const setT_ = (f) => (e) => setT(x => ({ ...x, [f]: e.target.value }))
  const setC_ = (f) => (e) => setC(x => ({ ...x, [f]: e.target.value }))
  const setCk  = (f) => (e) => setC(x => ({ ...x, [f]: e.target.checked }))

  async function save(e) {
    e.preventDefault()
    setBusy(true); setBanner(null)
    try {
      let extra = {}
      try { extra = JSON.parse(rawJson || '{}') }
      catch { throw new Error('Configuration avancée : JSON invalide.') }

      const { error: e1 } = await supabase.from('tenants').update({
        nom_affichage: t.nom_affichage, pays: t.pays, plan: t.plan, actif: t.actif,
        couleur_primaire: t.couleur_primaire, couleur_secondaire: t.couleur_secondaire,
        logo_url: t.logo_url || null, email_from: t.email_from || null,
      }).eq('id', tenant.id)
      if (e1) throw e1

      const nouvelleConfig = {
        ...extra,
        report_recipients:   parseList(c.report_recipients),
        tank_capacite_kg:    c.tank_capacite_kg ? Number(c.tank_capacite_kg) : null,
        skip_caisse:         parseList(c.skip_caisse),
        skip_banque:         parseList(c.skip_banque),
        rapport_email_actif: !!c.rapport_email_actif,
        push_actif:          !!c.push_actif,
        seuil_te_critique:   Number(c.seuil_te_critique),
        seuil_te_bas:        Number(c.seuil_te_bas),
        seuil_marge_cible:   Number(c.seuil_marge_cible),
      }
      const { error: e2 } = await supabase.from('tenant_config')
        .upsert({ tenant_id: tenant.id, config: nouvelleConfig })
      if (e2) throw e2

      await logAction('config_update', tenant.id, { champs: Object.keys(nouvelleConfig) })
      setBanner({ ok: 'Configuration enregistrée. Elle s\'applique au prochain chargement du dashboard client et au prochain envoi de rapport.' })
      onSaved?.()
    } catch (err) {
      setBanner({ error: err.message })
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={save}>
      <Banner {...(banner ?? {})} />

      <Card title="Identité" right={
        <label className="admin-check">
          <input type="checkbox" checked={!!t.actif} onChange={e => setT(x => ({ ...x, actif: e.target.checked }))} />
          Client actif
        </label>
      }>
        <Field label="Identifiant technique" hint="non modifiable — utilisé comme tenant_id partout en base">
          <input className="admin-input admin-mono" value={t.id} disabled />
        </Field>
        <Field label="Nom affiché" hint="apparaît dans le dashboard, les rapports email et les notifications">
          <input className="admin-input" value={t.nom_affichage || ''} onChange={setT_('nom_affichage')} />
        </Field>
        <div className="admin-row">
          <Field label="Pays (code ISO)">
            <input className="admin-input" value={t.pays || ''} onChange={setT_('pays')} placeholder="CI" />
          </Field>
          <Field label="Plan">
            <select className="admin-select" value={t.plan} onChange={setT_('plan')}>
              {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        {!t.actif && (
          <div className="admin-hint">
            Un client inactif est exclu des crons (rapport email, notification push) mais ses
            utilisateurs gardent l'accès au dashboard.
          </div>
        )}
      </Card>

      <Card title="Marque du client">
        <div className="admin-row">
          <Field label="Couleur primaire" hint="remplace l'orange Palmeo dans le dashboard du client">
            <input type="color" className="admin-input" value={t.couleur_primaire || '#F28C28'} onChange={setT_('couleur_primaire')} />
          </Field>
          <Field label="Couleur secondaire">
            <input type="color" className="admin-input" value={t.couleur_secondaire || '#3FA34D'} onChange={setT_('couleur_secondaire')} />
          </Field>
        </div>
        <Field label="Logo (URL publique)" hint="héberger l'image (Supabase Storage, CDN…) puis coller l'URL — pas d'upload intégré pour l'instant">
          <input className="admin-input" value={t.logo_url || ''} onChange={setT_('logo_url')} placeholder="https://.../logo.png" />
        </Field>
      </Card>

      <Card title="Rapports & notifications">
        <label className="admin-check">
          <input type="checkbox" checked={c.rapport_email_actif} onChange={setCk('rapport_email_actif')} />
          Rapport email quotidien (07h00 UTC)
        </label>
        <label className="admin-check">
          <input type="checkbox" checked={c.push_actif} onChange={setCk('push_actif')} />
          Notification push quotidienne (12h00 UTC)
        </label>
        <Field label="Expéditeur email" hint='ex : "Huilerie Bénin <rapport@domaine.com>" — le domaine doit être vérifié dans Resend. Vide = expéditeur Palmeo par défaut.'>
          <input className="admin-input" value={t.email_from || ''} onChange={setT_('email_from')} placeholder="Palmeo <rapport@palmeo.co>" />
        </Field>
        <Field label="Destinataires du rapport" hint="emails séparés par des virgules. Vide = tous les propriétaires et gestionnaires du client.">
          <input className="admin-input" value={c.report_recipients} onChange={setC_('report_recipients')} placeholder="direction@client.com, compta@client.com" />
        </Field>
      </Card>

      <Card title="Seuils d'alerte">
        <div className="admin-row">
          <Field label="Taux d'extraction critique" hint="alerte rouge sous ce seuil (0.17 = 17 %)">
            <input type="number" step="0.005" min="0" max="1" className="admin-input"
                   value={c.seuil_te_critique} onChange={setC_('seuil_te_critique')} />
          </Field>
          <Field label="Taux d'extraction bas" hint="signalé dans le rapport quotidien">
            <input type="number" step="0.005" min="0" max="1" className="admin-input"
                   value={c.seuil_te_bas} onChange={setC_('seuil_te_bas')} />
          </Field>
          <Field label="Marge nette cible" hint="0.15 = 15 % — référence de pilotage">
            <input type="number" step="0.01" min="0" max="1" className="admin-input"
                   value={c.seuil_marge_cible} onChange={setC_('seuil_marge_cible')} />
          </Field>
        </div>
        <div className="admin-hint">
          Ces seuils dépendent du procédé et de la qualité des régimes : ils varient d'une
          huilerie à l'autre et doivent être calés avec le client.
        </div>
      </Card>

      <Card title="Paramètres métier">
        <Field label="Capacité du tank de stockage (kg)" hint="utilisé par la jauge de stock d'huile du dashboard">
          <input type="number" className="admin-input" value={c.tank_capacite_kg} onChange={setC_('tank_capacite_kg')} placeholder="1300000" />
        </Field>
        <Field label="Libellés exclus des charges — caisse"
               hint="mouvements internes à ignorer dans le compte de résultat (préfixe de libellé, séparés par des virgules)">
          <input className="admin-input" value={c.skip_caisse} onChange={setC_('skip_caisse')} />
        </Field>
        <Field label="Libellés exclus des charges — banque"
               hint="virements internes, approvisionnements, compensations… (recherche partout dans le libellé)">
          <input className="admin-input" value={c.skip_banque} onChange={setC_('skip_banque')} />
        </Field>
      </Card>

      <Card title="Configuration avancée (JSON)">
        <div className="admin-hint" style={{ marginBottom: 10 }}>
          Paramètres techniques de l'ETL propres au client : chemins Dropbox, noms de fichiers,
          noms d'onglets Excel, exceptions de nommage, sources documentées. Modifier avec
          précaution — c'est ce que lit <span className="admin-mono">etl_cloud.py</span>.
        </div>
        <textarea className="admin-textarea" rows={14} value={rawJson}
                  onChange={e => setRawJson(e.target.value)} spellCheck={false} />
      </Card>

      <div className="admin-actions">
        <button type="submit" className="admin-btn" disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer la configuration'}
        </button>
      </div>
    </form>
  )
}
