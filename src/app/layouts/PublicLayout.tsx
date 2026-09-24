import { Link, Outlet } from 'react-router'
import { Marca } from '@/components/Marca'
import { useAuth } from '@/features/auth/context'

export function PublicLayout() {
  const { session } = useAuth()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Marca />
        <Link to={session ? '/painel' : '/login'} className="font-bold underline underline-offset-4">
          {session ? 'Meu painel' : 'Entrar'}
        </Link>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12">
        <Outlet />
      </main>
    </div>
  )
}
