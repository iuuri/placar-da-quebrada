// Arquivo de configuração de rotas, não de componentes: o aviso de fast refresh não se aplica.
// oxlint-disable react/only-export-components
import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, Outlet } from 'react-router'
import { RequireRole } from '@/features/auth/RequireRole'
import { HomePage } from '@/features/home/pages/HomePage'
import { PublicLayout } from './layouts/PublicLayout'
import { Carregando } from './pages/Carregando'
import { ErroRota } from './pages/ErroRota'
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
    errorElement: <ErroRota />,
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
    errorElement: <ErroRota />,
    children: [
      { path: 'painel', element: sobDemanda(() => import('@/features/painel/pages/PainelPage'), 'PainelPage') },
      {
        path: 'admin',
        element: (
          <RequireRole roles={['admin']}>
            <Outlet />
          </RequireRole>
        ),
        children: [
          {
            index: true,
            element: sobDemanda(() => import('@/features/campeonatos/pages/CampeonatosAdminPage'), 'CampeonatosAdminPage'),
          },
          {
            path: 'usuarios',
            element: sobDemanda(() => import('@/features/usuarios/pages/UsuariosPage'), 'UsuariosPage'),
          },
          {
            path: 'campeonatos/novo',
            element: sobDemanda(() => import('@/features/campeonatos/pages/CampeonatoFormPage'), 'CampeonatoFormPage'),
          },
          {
            path: 'campeonatos/:id',
            element: sobDemanda(() => import('@/features/campeonatos/pages/CampeonatoFormPage'), 'CampeonatoFormPage'),
          },
          {
            path: 'campeonatos/:id/times',
            element: sobDemanda(() => import('@/features/times/pages/TimesPage'), 'TimesPage'),
          },
          {
            path: 'campeonatos/:id/times/novo',
            element: sobDemanda(() => import('@/features/times/pages/TimeFormPage'), 'TimeFormPage'),
          },
          {
            path: 'campeonatos/:id/times/:timeId',
            element: sobDemanda(() => import('@/features/times/pages/TimeFormPage'), 'TimeFormPage'),
          },
        ],
      },
    ],
  },
])
