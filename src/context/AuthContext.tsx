import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import type { User, Session } from '@supabase/supabase-js'


// ── Tipos ──────────────────────────────────────────────────────────────────


export interface AuthUser {
  id: string
  name: string
  email: string
  plan: 'free' | 'basico' | 'freelance_pro' | 'studio'
  company?: string
  phone?: string
  avatar_url?: string
}


interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  token: string | null
  loading: boolean


  // Auth actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, plan?: string) => Promise<void>
  logout: () => Promise<void>
  updatePlan: (plan: AuthUser['plan']) => Promise<void>
  updateProfile: (data: Partial<Pick<AuthUser, 'name' | 'company' | 'phone'>>) => Promise<void>


  // Estado
  isAuthenticated: boolean


  // ── Límites por plan ──────────────────────────────────────────────────────
  // free          → 1 proyecto · sin IA · sin PDF · sin mapa · sin comparador
  // basico        → 3 proyectos · IA estándar (Gemini Flash) · sin PDF · mapa ✓
  // freelance_pro → ilimitado · IA avanzada (Gemini Pro) · PDF 5 días + hora a hora · mapa ✓ · comparador ✓
  // studio        → igual que freelance_pro + alertas automáticas


  projectLimit: () => number | 'unlimited'
  canCreateProject: (currentCount: number) => boolean
  canUseAI: () => boolean
  canUseAdvancedAI: () => boolean
  canUseMap: () => boolean
  canUseDateComparator: () => boolean
  canExportPDF: () => boolean           // PDF 5 días (freelance_pro+)
  canExportDayPDF: () => boolean        // PDF hora a hora (freelance_pro+) — alias de canExportPDF
  canUseAlerts: () => boolean           // Solo studio


  planLabel: () => string
  planColor: () => string
}


// ── Jerarquía numérica para comparaciones fáciles ─────────────────────────
const PLAN_RANK: Record<AuthUser['plan'], number> = {
  free: 0, basico: 1, freelance_pro: 2, studio: 3,
}


function atLeast(user: AuthUser | null, plan: AuthUser['plan']): boolean {
  if (!user) return false
  return PLAN_RANK[user.plan] >= PLAN_RANK[plan]
}


const AuthContext = createContext<AuthContextType | null>(null)


// ── Provider ───────────────────────────────────────────────────────────────


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)


  // Carga el perfil desde la tabla profiles
  async function loadProfile(supabaseUser: User) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, plan, company, phone, avatar_url')
      .eq('id', supabaseUser.id)
      .single()


    if (error || !data) {
      // Fallback mínimo si el trigger aún no ejecutó
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email ?? '',
        name: supabaseUser.user_metadata?.name ?? supabaseUser.email?.split('@')[0] ?? '',
        plan: (supabaseUser.user_metadata?.plan as AuthUser['plan']) ?? 'free',
      })
      return
    }


    setUser({
      id: data.id,
      email: data.email,
      name: data.name,
      plan: data.plan as AuthUser['plan'],
      company: data.company ?? undefined,
      phone: data.phone ?? undefined,
      avatar_url: data.avatar_url ?? undefined,
    })
  }


  // Escucha cambios de sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadProfile(session.user).finally(() => setLoading(false))
      else setLoading(false)
    })


    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) loadProfile(session.user)
      else setUser(null)
    })


    return () => subscription.unsubscribe()
  }, [])


  // ── Auth actions ──────────────────────────────────────────────────────────


  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }


  async function register(email: string, password: string, name: string, plan: string = 'free') {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, plan } },
    })
    if (error) throw new Error(error.message)
  }


  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }


  async function updatePlan(plan: AuthUser['plan']) {
    if (!user) return
    const { error } = await supabase.from('profiles').update({ plan }).eq('id', user.id)
    if (error) throw new Error(error.message)
    setUser(prev => prev ? { ...prev, plan } : prev)
  }


  async function updateProfile(data: Partial<Pick<AuthUser, 'name' | 'company' | 'phone'>>) {
    if (!user) return
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id)
    if (error) throw new Error(error.message)
    setUser(prev => prev ? { ...prev, ...data } : prev)
  }


  // ── Límites por plan ──────────────────────────────────────────────────────


  function projectLimit(): number | 'unlimited' {
    if (!user) return 0
    const limits: Record<AuthUser['plan'], number | 'unlimited'> = {
      free: 1, basico: 3, freelance_pro: 'unlimited', studio: 'unlimited',
    }
    return limits[user.plan]
  }


  function canCreateProject(currentCount: number): boolean {
    const limit = projectLimit()
    return limit === 'unlimited' || currentCount < (limit as number)
  }


  function canUseAI(): boolean           { return atLeast(user, 'basico') }
  function canUseAdvancedAI(): boolean   { return atLeast(user, 'freelance_pro') }
  function canUseMap(): boolean          { return atLeast(user, 'basico') }
  function canUseDateComparator(): boolean { return atLeast(user, 'freelance_pro') }
  function canExportPDF(): boolean       { return atLeast(user, 'freelance_pro') }
  function canExportDayPDF(): boolean    { return atLeast(user, 'freelance_pro') }
  function canUseAlerts(): boolean       { return atLeast(user, 'studio') }


  function planLabel(): string {
    if (!user) return ''
    const labels: Record<AuthUser['plan'], string> = {
      free: 'Free', basico: 'Básico', freelance_pro: 'Freelance Pro', studio: 'Studio',
    }
    return labels[user.plan]
  }


  function planColor(): string {
    if (!user) return '#64748b'
    const colors: Record<AuthUser['plan'], string> = {
      free: '#64748b', basico: '#3b82f6', freelance_pro: '#06b6d4', studio: '#8b5cf6',
    }
    return colors[user.plan]
  }


  return (
    <AuthContext.Provider value={{
      user, session, loading,
      token: session?.access_token ?? null,
      login, register, logout, updatePlan, updateProfile,
      isAuthenticated: !!session,
      projectLimit, canCreateProject,
      canUseAI, canUseAdvancedAI,
      canUseMap, canUseDateComparator,
      canExportPDF, canExportDayPDF,
      canUseAlerts,
      planLabel, planColor,
    }}>
      {children}
    </AuthContext.Provider>
  )
}


export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
