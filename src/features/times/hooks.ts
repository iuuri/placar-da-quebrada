import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apagarJogador,
  apagarTime,
  atualizarJogador,
  atualizarTime,
  buscarTime,
  criarJogador,
  criarTime,
  listarJogadores,
  listarTimes,
} from './api'
import type { JogadorFormValues, TimeFormValues } from './schemas'

const chaves = {
  times: (campeonatoId: string) => ['times', 'campeonato', campeonatoId] as const,
  time: (id: string) => ['times', id] as const,
  jogadores: (timeId: string) => ['jogadores', timeId] as const,
}

export function useTimes(campeonatoId: string) {
  return useQuery({ queryKey: chaves.times(campeonatoId), queryFn: () => listarTimes(campeonatoId) })
}

export function useTime(id: string) {
  return useQuery({ queryKey: chaves.time(id), queryFn: () => buscarTime(id) })
}

// Sem timeId: cria no campeonato. Com timeId: atualiza.
export function useSalvarTime(campeonatoId: string, timeId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valores: TimeFormValues) =>
      timeId ? atualizarTime(timeId, valores) : criarTime(campeonatoId, valores),
    onSuccess: (time) => {
      queryClient.setQueryData(chaves.time(time.id), time)
      return queryClient.invalidateQueries({ queryKey: chaves.times(campeonatoId) })
    },
  })
}

export function useApagarTime(campeonatoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apagarTime,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.times(campeonatoId) }),
  })
}

export function useJogadores(timeId: string) {
  return useQuery({ queryKey: chaves.jogadores(timeId), queryFn: () => listarJogadores(timeId) })
}

function useInvalidarJogadores(timeId: string, campeonatoId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: chaves.jogadores(timeId) }),
      // a lista de times mostra a contagem de jogadores ativos
      queryClient.invalidateQueries({ queryKey: chaves.times(campeonatoId) }),
    ])
}

export function useSalvarJogador(timeId: string, campeonatoId: string) {
  const invalidar = useInvalidarJogadores(timeId, campeonatoId)
  return useMutation({
    mutationFn: ({ id, valores }: { id?: string; valores: JogadorFormValues }) =>
      id ? atualizarJogador(id, valores) : criarJogador(timeId, valores),
    onSuccess: invalidar,
  })
}

export function useAlternarJogadorAtivo(timeId: string, campeonatoId: string) {
  const invalidar = useInvalidarJogadores(timeId, campeonatoId)
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => atualizarJogador(id, { ativo }),
    onSuccess: invalidar,
  })
}

export function useApagarJogador(timeId: string, campeonatoId: string) {
  const invalidar = useInvalidarJogadores(timeId, campeonatoId)
  return useMutation({ mutationFn: apagarJogador, onSuccess: invalidar })
}
