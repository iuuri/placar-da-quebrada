import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { PapelUsuario, Profile } from '@/types/database.types'
import type { NovoUsuarioValues } from './schemas'

export async function listarUsuarios(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('ativo', { ascending: false })
    .order('nome')
  if (error) throw error
  return data
}

export async function atualizarUsuario(id: string, valores: { nome?: string; role?: PapelUsuario }) {
  const { error } = await supabase.from('profiles').update(valores).eq('id', id)
  if (error) throw error
}

// Erro com a mensagem pronta para a tela (vinda da Edge Function).
export class ErroAdminUsers extends Error {}

type Acao =
  | ({ acao: 'criar' } & NovoUsuarioValues)
  | { acao: 'trocar_senha'; userId: string; senha: string }
  | { acao: 'definir_ativo'; userId: string; ativo: boolean }

async function chamarAdminUsers(corpo: Acao) {
  const { data, error } = await supabase.functions.invoke('admin-users', { body: corpo })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const detalhe = await error.context.json().catch(() => null)
      throw new ErroAdminUsers(detalhe?.erro ?? 'Não foi possível completar a ação.')
    }
    throw new ErroAdminUsers('Sem conexão com o servidor. Verifique a internet e tente de novo.')
  }
  return data
}

export const criarUsuario = (valores: NovoUsuarioValues) => chamarAdminUsers({ acao: 'criar', ...valores })
export const trocarSenha = (userId: string, senha: string) => chamarAdminUsers({ acao: 'trocar_senha', userId, senha })
export const definirAtivo = (userId: string, ativo: boolean) => chamarAdminUsers({ acao: 'definir_ativo', userId, ativo })
