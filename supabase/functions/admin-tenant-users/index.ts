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

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Méthode non supportée' }), { status: 405 })
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401 })

    const sbAsUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: userErr } = await sbAsUser.auth.getUser()
    if (userErr || !user) return new Response(JSON.stringify({ error: 'Session invalide' }), { status: 401 })

    const sb = createClient(SUPABASE_URL, SERVICE_KEY)

    const { data: superAdmin } = await sb.from('super_admins').select('user_id').eq('user_id', user.id).maybeSingle()
    if (!superAdmin) return new Response(JSON.stringify({ error: 'Réservé aux super-admins' }), { status: 403 })

    const body = await req.json().catch(() => ({}))
    const tenant_id: string = body.tenant_id
    if (!tenant_id) return new Response(JSON.stringify({ error: 'tenant_id requis' }), { status: 400 })

    const { data: links, error: linksErr } = await sb.from('user_tenants')
      .select('user_id, role, cree_le').eq('tenant_id', tenant_id)
    if (linksErr) return new Response(JSON.stringify({ error: linksErr.message }), { status: 500 })

    const { data: usersPage } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const byId = new Map((usersPage?.users ?? []).map(u => [u.id, u]))

    const result = (links ?? []).map(l => ({
      user_id: l.user_id,
      role: l.role,
      cree_le: l.cree_le,
      email: byId.get(l.user_id)?.email ?? '(utilisateur introuvable)',
      last_sign_in_at: byId.get(l.user_id)?.last_sign_in_at ?? null,
    }))

    return new Response(JSON.stringify({ users: result }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('admin-tenant-users error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
