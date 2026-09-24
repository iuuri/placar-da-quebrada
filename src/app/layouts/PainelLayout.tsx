import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { Marca } from '@/components/Marca'
import { Button } from '@/components/ui/button'
import { sair } from '@/features/auth/api'
import { useAuth } from '@/features/auth/context'
import { cn } from '@/lib/utils'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn('rounded-md px-3 py-2 font-bold', isActive ? 'bg-tinta text-muro' : 'hover:bg-muro-escuro')

export function PainelLayout() {
  const { profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [saindo, setSaindo] = useState(false)

  async function handleSair() {
    setSaindo(true)
    try {
      await sair()
    } finally {
      queryClient.clear()
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b-2 border-muro-escuro bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Marca />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-tinta-suave sm:inline">
              {profile?.nome || profile?.email} · {isAdmin ? 'Admin' : 'Operador'}
            </span>
            <Button variant="secondary" onClick={handleSair} disabled={saindo}>
              {saindo ? 'Saindo…' : 'Sair'}
            </Button>
          </div>
        </div>
        <nav aria-label="Painel" className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          <NavLink to="/painel" end className={linkClass}>
            Meus jogos
          </NavLink>
          {isAdmin ? (
            <NavLink to="/admin" className={linkClass}>
              Administração
            </NavLink>
          ) : null}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
