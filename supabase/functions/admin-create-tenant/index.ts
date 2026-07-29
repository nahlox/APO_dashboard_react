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

// ── CORS (appelée depuis le navigateur : le préflight doit répondre) ────────
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',').map(s => s.trim()).filter(Boolean)
function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allow = ALLOWED_ORIGINS.length === 0 ? '*'
    : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0])
  return {
    'Access-Control-Allow-Origin':  allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
    'Vary': 'Origin',
  }
}
function jsonCors(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) })
  }
  try {
    if (req.method !== 'POST') {
      return jsonCors(req, { error: 'Méthode non supportée' }, 405)
    }

    // ── 1. Vérifier que l'appelant est authentifié et super-admin ───────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return jsonCors(req, { error: 'Non authentifié' }, 401)
    }

    const sbAsUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: userErr } = await sbAsUser.auth.getUser()
    if (userErr || !user) {
      return jsonCors(req, { error: 'Session invalide' }, 401)
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY)

    const { data: superAdmin } = await sb
      .from('super_admins').select('user_id').eq('user_id', user.id).maybeSingle()
    if (!superAdmin) {
      return jsonCors(req, { error: 'Réservé aux super-admins' }, 403)
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
      return jsonCors(req, { error: 'tenant_id invalide (minuscules, chiffres, underscore, 2-32 car.)' }, 400)
    }
    if (!nom_affichage) {
      return jsonCors(req, { error: 'nom_affichage requis' }, 400)
    }
    if (!premier_utilisateur?.email) {
      return jsonCors(req, { error: 'premier_utilisateur.email requis' }, 400)
    }

    const { data: existing } = await sb.from('tenants').select('id').eq('id', tenant_id).maybeSingle()
    if (existing) {
      return jsonCors(req, { error: `Le tenant '${tenant_id}' existe déjà` }, 409)
    }

    // ── 3. Créer le tenant ────────────────────────────────────────────────────
    const { error: tenantErr } = await sb.from('tenants').insert({
      id: tenant_id, nom: nom_affichage, nom_affichage, pays, plan,
      couleur_primaire, couleur_secondaire, logo_url, email_from,
    })
    if (tenantErr) {
      return jsonCors(req, { error: `Création tenant échouée: ${tenantErr.message}` }, 500)
    }

    // ── 4. Créer la config ETL/rapports du tenant ────────────────────────────
    const { error: cfgErr } = await sb.from('tenant_config').upsert({
      tenant_id,
      config: { report_recipients, tank_capacite_kg, sources },
    })
    if (cfgErr) {
      await sb.from('tenants').delete().eq('id', tenant_id)
      return jsonCors(req, { error: `Création config échouée: ${cfgErr.message}` }, 500)
    }

    // ── 5. Inviter le premier utilisateur ────────────────────────────────────
    // Délégué à admin-invite-user : un seul endroit gère la génération du lien
    // et l'email Palmeo (Resend). On relaie le JWT de l'appelant, qui y est
    // revalidé comme super-admin.
    const inviteRes = await fetch(`${SUPABASE_URL}/functions/v1/admin-invite-user`, {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id,
        email: premier_utilisateur.email,
        role: premier_utilisateur.role === 'manager' || premier_utilisateur.role === 'viewer'
          ? premier_utilisateur.role : 'owner',
      }),
    })
    const inviteData = await inviteRes.json().catch(() => ({}))
    if (!inviteRes.ok || inviteData?.error) {
      // Le tenant n'a aucun utilisateur : on annule pour ne pas laisser d'orphelin.
      await sb.from('tenant_config').delete().eq('tenant_id', tenant_id)
      await sb.from('tenants').delete().eq('id', tenant_id)
      return jsonCors(req, { error: `Invitation échouée: ${inviteData?.error ?? inviteRes.status}` }, 500)
    }

    return jsonCors(req, {
      ok: true, tenant_id,
      invited_user: premier_utilisateur.email,
      email_erreur: inviteData?.email_erreur,
    })

  } catch (err) {
    console.error('admin-create-tenant error:', err)
    return jsonCors(req, { error: String(err) }, 500)
  }
})
