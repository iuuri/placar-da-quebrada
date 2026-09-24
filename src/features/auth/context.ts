import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'
import type { Profile } from '@/types/database.types'

export type AuthState = {
  session: Session | null
  profile: Profile | null
  carregando: boolean
  erroProfile: Error | null
  recuperandoSenha: boolean
  isAdmin: boolean
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return ctx
}
