import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { Profile } from '@/types/database.types'
import { AuthContext, type AuthState } from './context'
import { mensagemErroAuth } from './errors'
import { RequireRole } from './RequireRole'
import { loginSchema, novaSenhaSchema } from './schemas'

describe('schemas', () => {
  it('rejeita e-mail inválido e senha vazia no login', () => {
    const r = loginSchema.safeParse({ email: 'x', senha: '' })
    expect(r.success).toBe(false)
  })

  it('exige confirmação igual à nova senha', () => {
    const r = novaSenhaSchema.safeParse({ senha: '12345678', confirmacao: '1234567x' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toEqual(['confirmacao'])
  })
})

describe('mensagemErroAuth', () => {
  it('traduz credenciais inválidas', () => {
    expect(mensagemErroAuth({ code: 'invalid_credentials' })).toBe('E-mail ou senha incorretos.')
  })

  it('usa mensagem genérica para erro desconhecido', () => {
    expect(mensagemErroAuth(new Error('boom'))).toMatch(/Não foi possível/)
  })
})

function profile(parcial: Partial<Profile>): Profile {
  return {
    id: 'u1',
    nome: 'Zé',
    email: 'ze@exemplo.com',
    role: 'operador',
    ativo: true,
    created_at: '',
    updated_at: '',
    ...parcial,
  }
}

function renderComAuth(auth: Partial<AuthState>, inicial: string) {
  const valor: AuthState = {
    session: null,
    profile: null,
    carregando: false,
    erroProfile: null,
    recuperandoSenha: false,
    isAdmin: false,
    ...auth,
  }
  const router = createMemoryRouter(
    [
      { path: '/login', element: <p>tela de login</p> },
      { path: '/painel', element: <RequireRole><p>painel</p></RequireRole> },
      { path: '/admin', element: <RequireRole roles={['admin']}><p>admin</p></RequireRole> },
    ],
    { initialEntries: [inicial] },
  )
  render(
    <AuthContext.Provider value={valor}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  )
}

const sessao = { user: { id: 'u1' } } as AuthState['session']

describe('RequireRole', () => {
  it('manda visitante para o login', () => {
    renderComAuth({}, '/painel')
    expect(screen.getByText('tela de login')).toBeInTheDocument()
  })

  it('deixa operador ativo entrar no painel', () => {
    renderComAuth({ session: sessao, profile: profile({}) }, '/painel')
    expect(screen.getByText('painel')).toBeInTheDocument()
  })

  it('tira operador da área de admin', () => {
    renderComAuth({ session: sessao, profile: profile({}) }, '/admin')
    expect(screen.getByText('painel')).toBeInTheDocument()
  })

  it('deixa admin entrar na área de admin', () => {
    renderComAuth({ session: sessao, profile: profile({ role: 'admin' }), isAdmin: true }, '/admin')
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('bloqueia usuário desativado', () => {
    renderComAuth({ session: sessao, profile: profile({ ativo: false }) }, '/painel')
    expect(screen.getByText('tela de login')).toBeInTheDocument()
  })
})
