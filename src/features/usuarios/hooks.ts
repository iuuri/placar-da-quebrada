import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PapelUsuario } from '@/types/database.types'
import { atualizarUsuario, criarUsuario, definirAtivo, listarUsuarios, trocarSenha } from './api'
import type { NovoUsuarioValues } from './schemas'

const chave = ['usuarios'] as const

export function useUsuarios() {
  return useQuery({ queryKey: chave, queryFn: listarUsuarios })
}

function useInvalidar() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: chave })
}

export function useCriarUsuario() {
  const invalidar = useInvalidar()
  return useMutation({ mutationFn: (v: NovoUsuarioValues) => criarUsuario(v), onSuccess: invalidar })
}

export function useAtualizarUsuario() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, ...valores }: { id: string; nome?: string; role?: PapelUsuario }) => atualizarUsuario(id, valores),
    onSuccess: invalidar,
  })
}

export function useTrocarSenha() {
  return useMutation({ mutationFn: ({ id, senha }: { id: string; senha: string }) => trocarSenha(id, senha) })
}

export function useDefinirAtivo() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => definirAtivo(id, ativo),
    onSuccess: invalidar,
  })
}
