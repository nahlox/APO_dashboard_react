import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../db/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(undefined) // undefined = chargement en cours
  const [tenantId, setTenantId] = useState(null)
  const [role,     setRole]     = useState(null)

  async function loadTenant(userId) {
    const { data } = await supabase
      .from('user_tenants')
      .select('tenant_id, role')
      .eq('user_id', userId)
      .single()
    if (data) {
      setTenantId(data.tenant_id)
      setRole(data.role)
    }
  }

  useEffect(() => {
    // Session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadTenant(u.id)
      else { setTenantId(null); setRole(null) }
    })

    // Écoute les changements de session (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadTenant(u.id)
      else { setTenantId(null); setRole(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, tenantId, role, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
