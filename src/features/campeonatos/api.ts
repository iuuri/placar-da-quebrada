import { supabase } from '@/lib/supabase'
import type { Campeonato } from '@/types/database.types'
import type { CampeonatoFormValues } from './schemas'

export async function listarCampeonatos(): Promise<Campeonato[]> {
  const { data, error } = await supabase
    .from('campeonatos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function buscarCampeonato(id: string): Promise<Campeonato | null> {
  const { data, error } = await supabase.from('campeonatos').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function criarCampeonato(valores: CampeonatoFormValues): Promise<Campeonato> {
  const { data, error } = await supabase.from('campeonatos').insert(valores).select('*').single()
  if (error) throw error
  return data
}

export async function atualizarCampeonato(id: string, valores: CampeonatoFormValues): Promise<Campeonato> {
  const { data, error } = await supabase.from('campeonatos').update(valores).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function apagarCampeonato(id: string): Promise<void> {
  const { error } = await supabase.from('campeonatos').delete().eq('id', id)
  if (error) throw error
}
