// Accès Supabase du module émargement. L'isolation par client et les droits
// d'écriture sont garantis par le RLS (migration 20260925090000_emargement_rh).
import { supabase } from '../db/supabase'

function check({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

export async function listerEmployes({ inclureInactifs = false } = {}) {
  let q = supabase.from('employes').select('*').order('nom').order('prenom')
  if (!inclureInactifs) q = q.eq('actif', true)
  return check(await q)
}

export async function enregistrerEmploye(employe) {
  const { id, cree_le, modifie_le, ...champs } = employe
  if (id) return check(await supabase.from('employes').update(champs).eq('id', id).select().single())
  return check(await supabase.from('employes').insert(champs).select().single())
}

export async function emargementsEntre(debut, fin) {
  return check(await supabase.from('emargements')
    .select('id, employe_id, date_jour, statut, heure_arrivee, heure_depart, pause_minutes, heures_travaillees, observation')
    .gte('date_jour', debut).lte('date_jour', fin)
    .order('date_jour'))
}

export async function enregistrerEmargements(lignes) {
  if (!lignes.length) return []
  return check(await supabase.from('emargements')
    .upsert(lignes, { onConflict: 'tenant_id,employe_id,date_jour' })
    .select())
}

export async function supprimerEmargements(ids) {
  if (!ids.length) return
  check(await supabase.from('emargements').delete().in('id', ids))
}

export async function lireBordereau(annee, mois) {
  return check(await supabase.from('bordereaux_heures')
    .select('*').eq('annee', annee).eq('mois', mois).maybeSingle())
}

export async function changerStatutBordereau({ tenantId, annee, mois, statut, user }) {
  const valide = statut === 'valide'
  return check(await supabase.from('bordereaux_heures').upsert({
    tenant_id: tenantId, annee, mois, statut,
    valide_par:       valide ? user.id : null,
    valide_par_email: valide ? user.email : null,
    valide_le:        valide ? new Date().toISOString() : null,
  }, { onConflict: 'tenant_id,annee,mois' }).select().single())
}
