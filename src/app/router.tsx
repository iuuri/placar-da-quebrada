// Arquivo de configuração de rotas, não de componentes: o aviso de fast refresh não se aplica.
// oxlint-disable react/only-export-components
import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { RequireRole } from '@/features/auth/RequireRole'
import { HomePage } from '@/features/home/pages/HomePage'
import { PublicLayout } from './layouts/PublicLayout'
import { Carregando } from './pages/Carregando'
import { NotFoundPage } from './pages/NotFoundPage'

// Telas de login e painel carregam sob demanda: o visitante só baixa a área pública.
function sobDemanda<M>(carregar: () => Promise<M>, nome: keyof M) {
  const Componente = lazy(async () => ({ default: (await carregar())[nome] as ComponentType }))
  return (
    <Suspense fallback={<Carregando />}>
      <Componente />
    </Suspense>
  )
}

const PainelLayout = () => import('./layouts/PainelLayout')

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: sobDemanda(() => import('@/features/auth/pages/LoginPage'), 'LoginPage') },
      {
        path: 'esqueci-senha',
        element: sobDemanda(() => import('@/features/auth/pages/EsqueciSenhaPage'), 'EsqueciSenhaPage'),
      },
      {
        path: 'redefinir-senha',
        element: sobDemanda(() => import('@/features/auth/pages/RedefinirSenhaPage'), 'RedefinirSenhaPage'),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <RequireRole>{sobDemanda(PainelLayout, 'PainelLayout')}</RequireRole>,
    children: [
      { path: 'painel', element: sobDemanda(() => import('@/features/painel/pages/PainelPage'), 'PainelPage') },
      {
        path: 'admin',
        element: (
          <RequireRole roles={['admin']}>
            {sobDemanda(() => import('@/features/painel/pages/AdminPage'), 'AdminPage')}
          </RequireRole>
        ),
      },
    ],
  },
])
