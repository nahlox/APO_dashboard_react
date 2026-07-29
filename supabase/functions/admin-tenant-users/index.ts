// Edge Function : Lister les utilisateurs d'un tenant (email + rôle)
// Appelée depuis la page /admin (panneau "Clients"), réservée aux super-admins.
// Nécessaire car résoudre l'email d'un user_id demande l'API admin (service role) —
// impossible à faire depuis le client avec la clé anon.
// Deploy : supabase functions deploy admin-tenant-users
//
// Body attendu : { tenant_id: "huilerie_benin" }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!

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

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return jsonCors(req, { error: 'Non authentifié' }, 401)

    const sbAsUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: userErr } = await sbAsUser.auth.getUser()
    if (userErr || !user) return jsonCors(req, { error: 'Session invalide' }, 401)

    const sb = createClient(SUPABASE_URL, SERVICE_KEY)

    const { data: superAdmin } = await sb.from('super_admins').select('user_id').eq('user_id', user.id).maybeSingle()
    if (!superAdmin) return jsonCors(req, { error: 'Réservé aux super-admins' }, 403)

    const body = await req.json().catch(() => ({}))
    const tenant_id: string = body.tenant_id
    if (!tenant_id) return jsonCors(req, { error: 'tenant_id requis' }, 400)

    const { data: links, error: linksErr } = await sb.from('user_tenants')
      .select('user_id, role, cree_le').eq('tenant_id', tenant_id)
    if (linksErr) return jsonCors(req, { error: linksErr.message }, 500)

    const { data: usersPage } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const byId = new Map((usersPage?.users ?? []).map(u => [u.id, u]))

    const result = (links ?? []).map(l => ({
      user_id: l.user_id,
      role: l.role,
      cree_le: l.cree_le,
      email: byId.get(l.user_id)?.email ?? '(utilisateur introuvable)',
      last_sign_in_at: byId.get(l.user_id)?.last_sign_in_at ?? null,
    }))

    return jsonCors(req, { users: result })

  } catch (err) {
    console.error('admin-tenant-users error:', err)
    return jsonCors(req, { error: String(err) }, 500)
  }
})
