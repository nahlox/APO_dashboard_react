import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../db/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(undefined) // undefined = chargement en cours
  const [tenantId,     setTenantId]     = useState(null)
  const [role,         setRole]         = useState(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [branding,     setBranding]     = useState(null) // { nom_affichage, logo_url, couleur_primaire, couleur_secondaire }

  async function loadTenant(userId) {
    const { data } = await supabase
      .from('user_tenants')
      .select('tenant_id, role')
      .eq('user_id', userId)
      .single()
    if (data) {
      setTenantId(data.tenant_id)
      setRole(data.role)
      loadBranding(data.tenant_id)
    }
  }

  async function loadBranding(tid) {
    const { data } = await supabase
      .from('tenants')
      .select('nom_affichage, logo_url, couleur_primaire, couleur_secondaire')
      .eq('id', tid)
      .single()
    if (data) {
      setBranding(data)
      document.documentElement.style.setProperty('--gold', data.couleur_primaire)
      document.documentElement.style.setProperty('--green', data.couleur_secondaire)
    }
  }

  async function loadSuperAdmin(userId) {
    const { data } = await supabase
      .from('super_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    setIsSuperAdmin(!!data)
  }

  useEffect(() => {
    // Session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) { loadTenant(u.id); loadSuperAdmin(u.id) }
      else { setTenantId(null); setRole(null); setIsSuperAdmin(false); setBranding(null) }
    })

    // Écoute les changements de session (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) { loadTenant(u.id); loadSuperAdmin(u.id) }
      else { setTenantId(null); setRole(null); setIsSuperAdmin(false); setBranding(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, tenantId, role, isSuperAdmin, branding, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
