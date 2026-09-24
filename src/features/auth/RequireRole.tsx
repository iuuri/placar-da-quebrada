import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Carregando } from '@/app/pages/Carregando'
import type { PapelUsuario } from '@/types/database.types'
import { useAuth } from './context'

type Props = {
  // Sem `roles`: basta estar logado com perfil ativo.
  roles?: PapelUsuario[]
  children: ReactNode
}

// Só UX: a proteção real dos dados é o RLS no banco.
export function RequireRole({ roles, children }: Props) {
  const { session, profile, carregando } = useAuth()
  const location = useLocation()

  if (carregando) return <Carregando />
  if (!session) return <Navigate to="/login" replace state={{ de: location.pathname }} />
  if (!profile || !profile.ativo) return <Navigate to="/login?motivo=inativo" replace />
  if (roles && !roles.includes(profile.role)) return <Navigate to="/painel" replace />
  return children
}
