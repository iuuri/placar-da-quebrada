import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apagarCampeonato,
  atualizarCampeonato,
  buscarCampeonato,
  criarCampeonato,
  listarCampeonatos,
} from './api'
import type { CampeonatoFormValues } from './schemas'

const chaves = {
  todos: ['campeonatos'] as const,
  um: (id: string) => ['campeonatos', id] as const,
}

export function useCampeonatos() {
  return useQuery({ queryKey: chaves.todos, queryFn: listarCampeonatos })
}

export function useCampeonato(id: string | undefined) {
  return useQuery({
    queryKey: chaves.um(id ?? ''),
    queryFn: () => buscarCampeonato(id!),
    enabled: Boolean(id),
  })
}

// Sem id: cria. Com id: atualiza.
export function useSalvarCampeonato(id?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valores: CampeonatoFormValues) =>
      id ? atualizarCampeonato(id, valores) : criarCampeonato(valores),
    onSuccess: (campeonato) => {
      queryClient.setQueryData(chaves.um(campeonato.id), campeonato)
      return queryClient.invalidateQueries({ queryKey: chaves.todos, exact: true })
    },
  })
}

export function useApagarCampeonato() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apagarCampeonato,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.todos }),
  })
}
