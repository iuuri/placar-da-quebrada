import { useQuery } from '@tanstack/react-query'
import { buscarCampeonatoPorSlug, buscarTimeComElenco, listarCampeonatosPublicos, listarTimesDoCampeonato } from './api'

export function useCampeonatosPublicos() {
  return useQuery({ queryKey: ['publico', 'campeonatos'], queryFn: listarCampeonatosPublicos })
}

export function useCampeonatoPorSlug(slug: string) {
  return useQuery({ queryKey: ['publico', 'campeonato', slug], queryFn: () => buscarCampeonatoPorSlug(slug) })
}

export function useTimesDoCampeonato(campeonatoId: string | undefined) {
  return useQuery({
    queryKey: ['publico', 'times', campeonatoId],
    queryFn: () => listarTimesDoCampeonato(campeonatoId!),
    enabled: Boolean(campeonatoId),
  })
}

export function useTimeComElenco(timeId: string) {
  return useQuery({ queryKey: ['publico', 'time', timeId], queryFn: () => buscarTimeComElenco(timeId) })
}
