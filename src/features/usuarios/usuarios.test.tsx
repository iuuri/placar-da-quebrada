import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NovoUsuarioForm } from './components/NovoUsuarioForm'
import { gerarSenhaProvisoria, novoUsuarioSchema } from './schemas'

describe('gerarSenhaProvisoria', () => {
  it('gera 3 palavras e um número, com pelo menos 8 caracteres', () => {
    const senha = gerarSenhaProvisoria()
    expect(senha).toMatch(/^[a-z]+-[a-z]+-[a-z]+-\d{2}$/)
    expect(senha.length).toBeGreaterThanOrEqual(8)
  })

  it('é determinística com o mesmo sorteio', () => {
    expect(gerarSenhaProvisoria(() => 0)).toBe('bola-bola-bola-10')
  })
})

describe('novoUsuarioSchema', () => {
  it('normaliza o e-mail', () => {
    const r = novoUsuarioSchema.parse({ nome: 'Zé', email: ' Ze@Exemplo.COM ', senha: '12345678', role: 'operador' })
    expect(r.email).toBe('ze@exemplo.com')
  })

  it('recusa senha curta', () => {
    expect(novoUsuarioSchema.safeParse({ nome: 'Zé', email: 'z@e.com', senha: '123', role: 'operador' }).success).toBe(false)
  })
})

describe('NovoUsuarioForm', () => {
  it('já sugere uma senha e envia como operador', async () => {
    const user = userEvent.setup()
    const onSalvar = vi.fn().mockResolvedValue(undefined)
    render(<NovoUsuarioForm salvando={false} erro={null} onSalvar={onSalvar} />)

    expect((screen.getByLabelText('Senha provisória') as HTMLInputElement).value.length).toBeGreaterThanOrEqual(8)
    await user.type(screen.getByLabelText('Nome'), 'Tião Mesário')
    await user.type(screen.getByLabelText('E-mail (usado para entrar)'), 'tiao@exemplo.com')
    await user.click(screen.getByRole('button', { name: 'Criar acesso' }))

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1))
    expect(onSalvar.mock.calls[0][0]).toMatchObject({ nome: 'Tião Mesário', email: 'tiao@exemplo.com', role: 'operador' })
  })
})
