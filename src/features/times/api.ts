import { supabase } from '@/lib/supabase'
import type { Jogador, Time } from '@/types/database.types'
import type { JogadorFormValues, TimeFormValues } from './schemas'

export type TimeComContagem = Time & { jogadores: { count: number }[] }

export async function listarTimes(campeonatoId: string): Promise<TimeComContagem[]> {
  const { data, error } = await supabase
    .from('times')
    .select('*, jogadores(count)')
    .eq('campeonato_id', campeonatoId)
    .eq('jogadores.ativo', true)
    .order('nome')
  if (error) throw error
  return data as TimeComContagem[]
}

export async function buscarTime(id: string): Promise<Time | null> {
  const { data, error } = await supabase.from('times').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function criarTime(campeonatoId: string, valores: TimeFormValues): Promise<Time> {
  const { data, error } = await supabase
    .from('times')
    .insert({ ...valores, campeonato_id: campeonatoId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function atualizarTime(id: string, valores: TimeFormValues): Promise<Time> {
  const { data, error } = await supabase.from('times').update(valores).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function apagarTime(id: string): Promise<void> {
  const { error } = await supabase.from('times').delete().eq('id', id)
  if (error) throw error
}

export async function listarJogadores(timeId: string): Promise<Jogador[]> {
  const { data, error } = await supabase
    .from('jogadores')
    .select('*')
    .eq('time_id', timeId)
    .order('ativo', { ascending: false })
    .order('numero', { ascending: true, nullsFirst: false })
    .order('nome')
  if (error) throw error
  return data
}

export async function criarJogador(timeId: string, valores: JogadorFormValues): Promise<Jogador> {
  const { data, error } = await supabase
    .from('jogadores')
    .insert({ ...valores, time_id: timeId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function atualizarJogador(id: string, valores: Partial<JogadorFormValues> & { ativo?: boolean }) {
  const { data, error } = await supabase.from('jogadores').update(valores).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function apagarJogador(id: string): Promise<void> {
  const { error } = await supabase.from('jogadores').delete().eq('id', id)
  if (error) throw error
}
