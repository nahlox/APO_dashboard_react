import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Manque VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY dans .env')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── KPIs mensuels + données de production pour un mois donné ──
export async function fetchDonneesMois(annee, mois) {
  const { data: periode } = await supabase
    .from('periodes')
    .select('id')
    .eq('annee', annee)
    .eq('mois', mois)
    .single()

  if (!periode) return null

  const [kpis, production, ca] = await Promise.all([
    supabase.from('kpis_mensuels').select('*').eq('periode_id', periode.id).single(),
    supabase.from('vue_production_par_mois').select('*').eq('annee', annee).eq('mois', mois).single(),
    supabase.from('vue_ca_par_mois').select('*').eq('annee', annee).eq('mois', mois).single(),
  ])

  return { kpis: kpis.data, production: production.data, ca: ca.data }
}

// ── Production journalière pour les graphiques ────────────────
export async function fetchProductionJournaliere(annee, mois) {
  const { data: periode } = await supabase
    .from('periodes')
    .select('id')
    .eq('annee', annee)
    .eq('mois', mois)
    .single()

  const { data } = await supabase
    .from('production_journaliere')
    .select('date_production, regime_recu_kg, regime_traite_kg, huile_produite_kg, taux_extraction, nb_sterilisateurs')
    .eq('periode_id', periode.id)
    .order('date_production')

  return data
}

// ── Top fournisseurs du mois ──────────────────────────────────
export async function fetchTopFournisseurs(annee, mois, limite = 10) {
  const { data } = await supabase
    .from('vue_top_fournisseurs')
    .select('*')
    .eq('annee', annee)
    .eq('mois', mois)
    .limit(limite)

  return data
}

// ── Top charges exploitation du mois ─────────────────────────
export async function fetchTopCharges(annee, mois, limite = 15) {
  const { data } = await supabase
    .from('vue_top_charges')
    .select('*')
    .eq('annee', annee)
    .eq('mois', mois)
    .limit(limite)

  return data
}

// ── Ventes huile journalières ─────────────────────────────────
export async function fetchVentesHuile(annee, mois) {
  const { data: periode } = await supabase
    .from('periodes')
    .select('id')
    .eq('annee', annee)
    .eq('mois', mois)
    .single()

  const { data } = await supabase
    .from('ventes_huile')
    .select('date_vente, poids_apo_kg, prix_kg, montant_fcfa')
    .eq('periode_id', periode.id)
    .order('date_vente')

  return data
}

// ── Contrats pépinière ────────────────────────────────────────
export async function fetchPepiniere() {
  const { data } = await supabase
    .from('vue_pepiniere')
    .select('*')
    .order('date_contrat')

  return data
}

// ── KPIs tous les mois (vue globale) ─────────────────────────
export async function fetchKpisTousMois() {
  const { data } = await supabase
    .from('kpis_mensuels')
    .select('*, periodes(annee, mois, libelle)')
    .order('periode_id')

  return data
}

// ── Achats régimes par fournisseur et par mois ────────────────
export async function fetchAchatsRegimes(annee, mois) {
  const { data: periode } = await supabase
    .from('periodes')
    .select('id')
    .eq('annee', annee)
    .eq('mois', mois)
    .single()

  const { data } = await supabase
    .from('achats_regimes')
    .select('date_achat, poids_kg, prix_kg, montant_total, fournisseurs(nom, reference)')
    .eq('periode_id', periode.id)
    .order('date_achat')

  return data
}
