// Edge Function : Onboarding d'un nouveau client (tenant)
// Appelée par la page /admin du dashboard, réservée aux super-admins.
// Deploy : supabase functions deploy admin-create-tenant
//
// Variables d'env requises : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//
// Body attendu :
// {
//   tenant_id: "huilerie_benin",           // slug unique, minuscules, sans espace
//   nom_affichage: "Huilerie du Bénin",
//   pays: "BJ",
//   plan: "starter" | "business" | "enterprise",
//   couleur_primaire: "#F28C28",
//   couleur_secondaire: "#3FA34D",
//   logo_url: "https://.../logo.png",       // optionnel
//   email_from: "Huilerie Bénin <rapport@domaine.com>",  // optionnel
//   report_recipients: ["a@x.com"],         // optionnel, sinon owners/managers
//   tank_capacite_kg: 500000,
//   sources: [                              // description générique des sources de données du client
//     {
//       label: "Comptabilité",                // ce que la source alimente
//       type: "excel_dropbox" | "google_sheets" | "logiciel_comptable" | "api" | "export_manuel" | "autre",
//       emplacement: "/Client/Compta/2026",   // chemin, URL, lien Sheets...
//       acces: "Token Dropbox partagé",       // référence de méthode d'accès (jamais de secret en clair)
//       frequence: "quotidien" | "hebdomadaire" | "mensuel" | "ponctuel",
//       notes: "détails utiles au développeur qui câblera l'import",
//     },
//   ],
//   premier_utilisateur: { email: "proprietaire@client.com", role: "owner" }
// }
//
// NB : `sources` documente l'organisation des données du client de façon générique (n'importe
// quel type de source : Excel, logiciel de comptabilité, API...). Ça n'exécute rien tout seul —
// l'import (ETL) reste à câbler par un développeur pour chaque source, en s'appuyant sur cette
// config comme spécification. Voir ONBOARDING.md.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY      = Deno.env.get('SUPABASE_ANON_KEY')!

const TENANT_ID_RE = /^[a-z0-9_]{2,32}$/

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Méthode non supportée' }), { status: 405 })
    }

    // ── 1. Vérifier que l'appelant est authentifié et super-admin ───────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401 })
    }

    const sbAsUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: userErr } = await sbAsUser.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Session invalide' }), { status: 401 })
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY)

    const { data: superAdmin } = await sb
      .from('super_admins').select('user_id').eq('user_id', user.id).maybeSingle()
    if (!superAdmin) {
      return new Response(JSON.stringify({ error: 'Réservé aux super-admins' }), { status: 403 })
    }

    // ── 2. Valider le body ───────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const {
      tenant_id, nom_affichage, pays = 'CI', plan = 'starter',
      couleur_primaire = '#F28C28', couleur_secondaire = '#3FA34D',
      logo_url = null, email_from = null,
      report_recipients = [], tank_capacite_kg = null,
      sources = [],
      premier_utilisateur,
    } = body

    if (!tenant_id || !TENANT_ID_RE.test(tenant_id)) {
      return new Response(JSON.stringify({ error: 'tenant_id invalide (minuscules, chiffres, underscore, 2-32 car.)' }), { status: 400 })
    }
    if (!nom_affichage) {
      return new Response(JSON.stringify({ error: 'nom_affichage requis' }), { status: 400 })
    }
    if (!premier_utilisateur?.email) {
      return new Response(JSON.stringify({ error: 'premier_utilisateur.email requis' }), { status: 400 })
    }

    const { data: existing } = await sb.from('tenants').select('id').eq('id', tenant_id).maybeSingle()
    if (existing) {
      return new Response(JSON.stringify({ error: `Le tenant '${tenant_id}' existe déjà` }), { status: 409 })
    }

    // ── 3. Créer le tenant ────────────────────────────────────────────────────
    const { error: tenantErr } = await sb.from('tenants').insert({
      id: tenant_id, nom: nom_affichage, nom_affichage, pays, plan,
      couleur_primaire, couleur_secondaire, logo_url, email_from,
    })
    if (tenantErr) {
      return new Response(JSON.stringify({ error: `Création tenant échouée: ${tenantErr.message}` }), { status: 500 })
    }

    // ── 4. Créer la config ETL/rapports du tenant ────────────────────────────
    const { error: cfgErr } = await sb.from('tenant_config').upsert({
      tenant_id,
      config: { report_recipients, tank_capacite_kg, sources },
    })
    if (cfgErr) {
      await sb.from('tenants').delete().eq('id', tenant_id)
      return new Response(JSON.stringify({ error: `Création config échouée: ${cfgErr.message}` }), { status: 500 })
    }

    // ── 5. Inviter le premier utilisateur (email d'invitation Supabase) ─────
    const { data: invited, error: inviteErr } = await sb.auth.admin.inviteUserByEmail(premier_utilisateur.email)
    if (inviteErr) {
      await sb.from('tenant_config').delete().eq('tenant_id', tenant_id)
      await sb.from('tenants').delete().eq('id', tenant_id)
      return new Response(JSON.stringify({ error: `Invitation échouée: ${inviteErr.message}` }), { status: 500 })
    }

    const { error: linkErr } = await sb.from('user_tenants').insert({
      user_id: invited.user.id,
      tenant_id,
      role: premier_utilisateur.role === 'manager' || premier_utilisateur.role === 'viewer'
        ? premier_utilisateur.role : 'owner',
    })
    if (linkErr) {
      return new Response(JSON.stringify({ error: `Association utilisateur échouée: ${linkErr.message}`, tenant_id }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true, tenant_id, invited_user: invited.user.email }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('admin-create-tenant error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
