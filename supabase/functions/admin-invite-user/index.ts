// Edge Function : inviter / rattacher un utilisateur sur un tenant
// Appelée depuis la console admin (/admin), réservée aux super-admins.
// Deploy : python3 scripts/deploy_functions.py admin-invite-user
//
// Body :
//   { tenant_id, email, role: 'owner'|'manager'|'viewer', renvoyer?: boolean }
//
// L'email d'invitation est envoyé par NOUS via Resend (identité Palmeo), pas par
// le mailer Supabase : on génère le lien d'action avec generateLink() (qui
// n'envoie aucun email) puis on l'insère dans notre propre template.
// Avantages : image de marque, pas de limite de débit du mailer intégré,
// délivrabilité du domaine déjà vérifié dans Resend.
//
// Trois cas :
//   1. email inconnu           → lien 'invite'   → « créez votre mot de passe »
//   2. compte existant sans MDP → lien 'recovery' → « créez votre mot de passe »
//   3. compte existant actif    → aucun lien      → « un accès vous a été ouvert »

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY       = Deno.env.get('SUPABASE_ANON_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL        = Deno.env.get('APP_URL') || 'https://app.palmeo.co'
// Expéditeur des invitations : dédié si défini, sinon celui des rapports.
const INVITE_FROM    = Deno.env.get('INVITE_FROM_EMAIL')
                    || Deno.env.get('REPORT_FROM_EMAIL')
                    || 'Palmeo <onboarding@resend.dev>'

const ROLES = ['owner', 'manager', 'viewer']
const ROLE_LABEL: Record<string, string> = {
  owner:   'Propriétaire',
  manager: 'Gestionnaire',
  viewer:  'Lecteur',
}

// ── CORS ────────────────────────────────────────────────────────────────────
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

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ── Template email Palmeo ───────────────────────────────────────────────────
function emailHtml(opts: {
  marque: string; role: string; lien: string | null; couleur: string; invitePar: string
}) {
  const { marque, role, lien, couleur, invitePar } = opts
  const cta = lien
    ? `
      <tr><td align="center" style="padding:8px 32px 4px;">
        <a href="${lien}" style="display:inline-block; background:${couleur}; color:#ffffff; text-decoration:none; font-family:Arial,sans-serif; font-size:15px; font-weight:700; padding:15px 34px; border-radius:10px;">
          Créer mon mot de passe →
        </a>
      </td></tr>
      <tr><td style="padding:6px 32px 0;">
        <div style="font-size:12px; color:#9a9a9a; font-family:Arial,sans-serif; text-align:center;">
          Ce lien est personnel et valable 24 heures.
        </div>
      </td></tr>`
    : `
      <tr><td align="center" style="padding:8px 32px 4px;">
        <a href="${APP_URL}" style="display:inline-block; background:${couleur}; color:#ffffff; text-decoration:none; font-family:Arial,sans-serif; font-size:15px; font-weight:700; padding:15px 34px; border-radius:10px;">
          Ouvrir le tableau de bord →
        </a>
      </td></tr>`

  const intro = lien
    ? `Vous avez été invité·e à accéder au tableau de bord <strong>${esc(marque)}</strong>.
       Créez votre mot de passe pour activer votre accès.`
    : `Un accès au tableau de bord <strong>${esc(marque)}</strong> vient de vous être ouvert.
       Connectez-vous avec vos identifiants habituels.`

  return `<!DOCTYPE html>
<html lang="fr"><body style="margin:0; padding:0; background:#f4f2ee;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee; padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.06);">

        <tr><td style="background:linear-gradient(135deg,#1f5a2a,#2e7d40); padding:30px 32px;">
          <div style="font-size:12px; color:#a9d9b3; font-family:Arial,sans-serif; letter-spacing:1.4px; text-transform:uppercase;">Palmeo</div>
          <div style="font-size:23px; color:#ffffff; font-weight:700; font-family:Arial,sans-serif; margin-top:5px;">${esc(marque)}</div>
        </td></tr>

        <tr><td style="padding:26px 32px 10px;">
          <div style="font-size:15.5px; line-height:1.65; color:#3a3a3a; font-family:Arial,sans-serif;">
            ${intro}
          </div>
        </td></tr>

        <tr><td style="padding:6px 32px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f9f6; border-radius:10px;">
            <tr><td style="padding:14px 18px; font-family:Arial,sans-serif; font-size:13.5px; color:#4a4a4a;">
              <strong style="color:#2e7d40;">Votre rôle :</strong> ${esc(role)}<br>
              <span style="color:#8a8a8a;">Invitation envoyée par ${esc(invitePar)}</span>
            </td></tr>
          </table>
        </td></tr>

        ${cta}

        <tr><td style="padding:22px 32px 28px; border-top:1px solid #eee; margin-top:16px;">
          <div style="font-size:12px; color:#a0a0a0; font-family:Arial,sans-serif; text-align:center; line-height:1.6;">
            Palmeo — pilotage des huileries de palme<br>
            Si vous n'attendiez pas cette invitation, ignorez simplement cet email.
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}

async function sendResend(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: INVITE_FROM, to: [to], subject, html }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Resend: ${data?.message ?? res.status}`)
  return data?.id as string | undefined
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) })
  }
  try {
    if (req.method !== 'POST') return jsonCors(req, { error: 'Méthode non supportée' }, 405)

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return jsonCors(req, { error: 'Non authentifié' }, 401)

    const sbAsUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: userErr } = await sbAsUser.auth.getUser()
    if (userErr || !user) return jsonCors(req, { error: 'Session invalide' }, 401)

    const sb = createClient(SUPABASE_URL, SERVICE_KEY)
    const { data: superAdmin } = await sb.from('super_admins')
      .select('user_id').eq('user_id', user.id).maybeSingle()
    if (!superAdmin) return jsonCors(req, { error: 'Réservé aux super-admins' }, 403)

    const body = await req.json().catch(() => ({}))
    const tenant_id: string = body.tenant_id
    const email: string = (body.email ?? '').trim().toLowerCase()
    const role: string = ROLES.includes(body.role) ? body.role : 'viewer'
    const renvoyer: boolean = body.renvoyer === true

    if (!tenant_id || !email) return jsonCors(req, { error: 'tenant_id et email requis' }, 400)

    const { data: tenant } = await sb.from('tenants')
      .select('id, nom_affichage, couleur_primaire').eq('id', tenant_id).maybeSingle()
    if (!tenant) return jsonCors(req, { error: `Client '${tenant_id}' introuvable` }, 404)

    const marque  = tenant.nom_affichage || tenant_id
    const couleur = tenant.couleur_primaire || '#2e7d40'

    // Compte déjà existant ?
    const { data: usersPage } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = (usersPage?.users ?? []).find(u => u.email?.toLowerCase() === email)

    const redirectTo = `${APP_URL}/bienvenue`
    let userId: string
    let lien: string | null = null
    let nouveau = false

    if (!existing) {
      // 1. Nouveau compte — lien d'invitation (crée l'utilisateur, sans email Supabase)
      const { data, error } = await sb.auth.admin.generateLink({
        type: 'invite', email, options: { redirectTo },
      })
      if (error || !data?.user) {
        return jsonCors(req, { error: `Création du lien échouée : ${error?.message}` }, 500)
      }
      userId = data.user.id
      lien   = data.properties?.action_link ?? null
      nouveau = true
    } else {
      userId = existing.id
      // 2. Compte existant qui n'a jamais activé son accès → lien de définition de MDP
      const jamaisConnecte = !existing.last_sign_in_at
      if (jamaisConnecte || renvoyer) {
        const { data, error } = await sb.auth.admin.generateLink({
          type: 'recovery', email, options: { redirectTo },
        })
        if (error) return jsonCors(req, { error: `Création du lien échouée : ${error.message}` }, 500)
        lien = data?.properties?.action_link ?? null
      }
      // 3. Sinon : compte actif, aucun lien — simple notification d'accès
    }

    const { error: linkErr } = await sb.from('user_tenants')
      .upsert({ user_id: userId, tenant_id, role }, { onConflict: 'user_id,tenant_id' })
    if (linkErr) return jsonCors(req, { error: `Association échouée : ${linkErr.message}` }, 500)

    // Envoi de l'email Palmeo via Resend
    let emailId: string | undefined
    let emailErreur: string | undefined
    try {
      const subject = lien
        ? `Votre accès au tableau de bord ${marque}`
        : `Un nouvel accès vous a été ouvert — ${marque}`
      emailId = await sendResend(email, subject, emailHtml({
        marque, role: ROLE_LABEL[role] ?? role, lien, couleur,
        invitePar: user.email ?? 'Palmeo',
      }))
    } catch (e) {
      // L'utilisateur est bien rattaché : on signale l'échec d'envoi sans annuler.
      emailErreur = e instanceof Error ? e.message : String(e)
      console.error('Envoi invitation échoué:', emailErreur)
    }

    return jsonCors(req, {
      ok: true, email, role,
      invited: nouveau,
      lien_envoye: !!lien,
      email_id: emailId,
      email_erreur: emailErreur,
    })

  } catch (err) {
    console.error('admin-invite-user error:', err)
    return jsonCors(req, { error: 'Erreur interne' }, 500)
  }
})
