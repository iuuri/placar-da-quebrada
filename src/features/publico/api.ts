import { supabase } from '@/lib/supabase'
import type { Campeonato, Jogador, Time } from '@/types/database.types'

// Área pública: visitantes (anon) só podem ler algumas colunas de `times`,
// então as consultas sempre listam as colunas (nunca select('*') em times).
const COLUNAS_CAMPEONATO = 'id, nome, slug, temporada, modalidade, local_padrao, status, publico'
const COLUNAS_TIME = 'id, campeonato_id, nome, sigla, cor_primaria, escudo_url'

export type CampeonatoPublico = Pick<
  Campeonato,
  'id' | 'nome' | 'slug' | 'temporada' | 'modalidade' | 'local_padrao' | 'status' | 'publico'
>
export type TimePublico = Pick<Time, 'id' | 'campeonato_id' | 'nome' | 'sigla' | 'cor_primaria' | 'escudo_url'>
export type TimeComElenco = TimePublico & {
  jogadores: Pick<Jogador, 'id' | 'nome' | 'apelido' | 'numero' | 'posicao'>[]
}

export async function listarCampeonatosPublicos(): Promise<CampeonatoPublico[]> {
  const { data, error } = await supabase
    .from('campeonatos')
    .select(COLUNAS_CAMPEONATO)
    .eq('publico', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Sem filtro de `publico`: o RLS já esconde privados de visitantes;
// admin/operador conseguem pré-visualizar um campeonato ainda privado.
export async function buscarCampeonatoPorSlug(slug: string): Promise<CampeonatoPublico | null> {
  const { data, error } = await supabase.from('campeonatos').select(COLUNAS_CAMPEONATO).eq('slug', slug).maybeSingle()
  if (error) throw error
  return data
}

export async function listarTimesDoCampeonato(campeonatoId: string): Promise<TimePublico[]> {
  const { data, error } = await supabase
    .from('times')
    .select(COLUNAS_TIME)
    .eq('campeonato_id', campeonatoId)
    .order('nome')
  if (error) throw error
  return data
}

export async function buscarTimeComElenco(timeId: string): Promise<TimeComElenco | null> {
  const { data, error } = await supabase
    .from('times')
    .select(`${COLUNAS_TIME}, jogadores(id, nome, apelido, numero, posicao)`)
    .eq('id', timeId)
    .eq('jogadores.ativo', true)
    .order('numero', { referencedTable: 'jogadores', ascending: true, nullsFirst: false })
    .maybeSingle()
  if (error) throw error
  return data as TimeComElenco | null
}
