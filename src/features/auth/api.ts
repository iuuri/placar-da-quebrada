import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database.types'

export async function entrar(email: string, senha: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error) throw error
}

export async function sair() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function enviarEmailRecuperacao(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  })
  if (error) throw error
}

export async function atualizarSenha(senha: string) {
  const { error } = await supabase.auth.updateUser({ password: senha })
  if (error) throw error
}

export async function buscarProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export function observarSessao(callback: (evento: AuthChangeEvent, session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange(callback)
  return () => data.subscription.unsubscribe()
}

export async function sessaoAtual() {
  const { data } = await supabase.auth.getSession()
  return data.session
}
