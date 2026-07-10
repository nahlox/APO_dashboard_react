// Edge Function : Ajouter/inviter un utilisateur sur un tenant existant
// Appelée depuis la page /admin (panneau "Clients"), réservée aux super-admins.
// Deploy : supabase functions deploy admin-invite-user
//
// Body attendu :
// { tenant_id: "huilerie_benin", email: "manager@client.com", role: "manager" }
//
// Si l'email correspond à un utilisateur auth déjà existant (ex: déjà présent sur un autre
// tenant), on le relie simplement au nouveau tenant. Sinon on envoie une invitation Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!

const ROLES = ['owner', 'manager', 'viewer']

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
    const email: string = (body.email ?? '').trim()
    const role: string = ROLES.includes(body.role) ? body.role : 'viewer'

    if (!tenant_id || !email) {
      return new Response(JSON.stringify({ error: 'tenant_id et email requis' }), { status: 400 })
    }

    const { data: tenant } = await sb.from('tenants').select('id').eq('id', tenant_id).maybeSingle()
    if (!tenant) return new Response(JSON.stringify({ error: `Tenant '${tenant_id}' introuvable` }), { status: 404 })

    // Chercher si l'utilisateur existe déjà (ex: présent sur un autre tenant)
    const { data: usersPage } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = (usersPage?.users ?? []).find(u => u.email?.toLowerCase() === email.toLowerCase())

    let userId: string
    let invited = false
    if (existing) {
      userId = existing.id
    } else {
      const { data: created, error: inviteErr } = await sb.auth.admin.inviteUserByEmail(email)
      if (inviteErr || !created?.user) {
        return new Response(JSON.stringify({ error: `Invitation échouée: ${inviteErr?.message}` }), { status: 500 })
      }
      userId = created.user.id
      invited = true
    }

    const { error: linkErr } = await sb.from('user_tenants')
      .upsert({ user_id: userId, tenant_id, role }, { onConflict: 'user_id,tenant_id' })
    if (linkErr) {
      return new Response(JSON.stringify({ error: `Association échouée: ${linkErr.message}` }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true, email, role, invited }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('admin-invite-user error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
