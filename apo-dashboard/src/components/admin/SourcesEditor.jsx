import { Section, Row, Field, inputStyle } from './AdminUI'

export const SOURCE_TYPES = [
  { value: 'excel_dropbox',       label: 'Fichiers Excel (Dropbox / Drive / OneDrive)' },
  { value: 'google_sheets',       label: 'Google Sheets' },
  { value: 'logiciel_comptable',  label: 'Logiciel de comptabilité (Sage, Odoo, QuickBooks…)' },
  { value: 'api',                 label: 'API externe' },
  { value: 'export_manuel',       label: 'Export manuel (CSV/PDF envoyé par email)' },
  { value: 'autre',               label: 'Autre' },
]

export const FREQUENCES = ['quotidien', 'hebdomadaire', 'mensuel', 'ponctuel']

let sourceSeq = 0
export const newSource = () => ({
  _key: ++sourceSeq,
  label: '',
  type: 'excel_dropbox',
  emplacement: '',
  acces: '',
  frequence: 'quotidien',
  notes: '',
})

/** Normalise une source venant de tenant_config (sans _key) pour l'édition locale. */
export const withKey = (s) => ({ _key: ++sourceSeq, ...s })

export default function SourcesEditor({ sources, setSources }) {
  const setSource = (key, field) => (e) =>
    setSources(list => list.map(s => s._key === key ? { ...s, [field]: e.target.value } : s))
  const addSource = () => setSources(list => [...list, newSource()])
  const removeSource = (key) => setSources(list => list.filter(s => s._key !== key))

  return (
    <Section title="Sources de données" hint="Chaque client peut avoir une organisation différente : Excel/Dropbox, logiciel de comptabilité, API, export manuel… Ajoute une entrée par source, elles seront documentées dans la config du tenant pour préparer l'intégration ETL.">
      {sources.map((s, i) => (
        <div key={s._key} style={{ border: '1px dashed var(--border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>Source #{i + 1}</span>
            {sources.length > 1 && (
              <button type="button" onClick={() => removeSource(s._key)} style={{
                background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12,
              }}>✕ Retirer</button>
            )}
          </div>
          <Row>
            <Field label="Nom / ce que ça alimente" hint="ex: Comptabilité, Production journalière, Ventes">
              <input value={s.label} onChange={setSource(s._key, 'label')} placeholder="Comptabilité" style={inputStyle} />
            </Field>
            <Field label="Type de source">
              <select value={s.type} onChange={setSource(s._key, 'type')} style={inputStyle}>
                {SOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </Row>
          <Row>
            <Field label="Emplacement / URL" hint="chemin de dossier, lien Sheets, URL d'API...">
              <input value={s.emplacement} onChange={setSource(s._key, 'emplacement')} placeholder="/Client/Compta/2026 ou https://..." style={inputStyle} />
            </Field>
            <Field label="Accès / identifiants" hint="méthode d'accès — ne pas mettre de mot de passe ici, juste une référence">
              <input value={s.acces} onChange={setSource(s._key, 'acces')} placeholder="Token Dropbox partagé, compte API référence..." style={inputStyle} />
            </Field>
          </Row>
          <Row>
            <Field label="Fréquence de mise à jour">
              <select value={s.frequence} onChange={setSource(s._key, 'frequence')} style={inputStyle}>
                {FREQUENCES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
          </Row>
          <Field label="Notes pour l'intégration" hint="détails utiles au développeur qui câblera l'import (structure des fichiers, particularités, contact technique côté client...)">
            <textarea value={s.notes} onChange={setSource(s._key, 'notes')} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
        </div>
      ))}
      <button type="button" onClick={addSource} style={{
        background: 'transparent', border: '1px dashed var(--gold)', color: 'var(--gold)',
        borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontSize: 13, alignSelf: 'flex-start',
      }}>+ Ajouter une source</button>
    </Section>
  )
}
