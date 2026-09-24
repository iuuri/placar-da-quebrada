import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JogadorForm } from './components/JogadorForm'
import { TimeForm } from './components/TimeForm'
import { gerarSigla, jogadorSchema, timeSchema } from './schemas'

describe('gerarSigla', () => {
  it('usa as iniciais ignorando da/de/do', () => {
    expect(gerarSigla('Unidos da Vila')).toBe('UV')
    expect(gerarSigla('Unidos Várzea Jardim')).toBe('UVJ')
  })

  it('usa as 3 primeiras letras quando é uma palavra só', () => {
    expect(gerarSigla('Palmeirinha')).toBe('PAL')
  })

  it('ignora FC e acentos', () => {
    expect(gerarSigla('São Jorge FC')).toBe('SJ')
  })
})

describe('schemas de time e jogador', () => {
  const time = { nome: 'Unidos', sigla: 'udv', cor_primaria: '#ff0000', escudo_url: '', responsavel: '', contato: '' }

  it('deixa a sigla maiúscula e campos vazios como null', () => {
    const r = timeSchema.parse(time)
    expect(r.sigla).toBe('UDV')
    expect(r.escudo_url).toBeNull()
    expect(r.contato).toBeNull()
  })

  it('recusa escudo sem https', () => {
    expect(timeSchema.safeParse({ ...time, escudo_url: 'http://x.com/a.png' }).success).toBe(false)
  })

  it('converte número da camisa e aceita vazio', () => {
    expect(jogadorSchema.parse({ nome: 'Zé', apelido: '', numero: '10', posicao: '' }).numero).toBe(10)
    expect(jogadorSchema.parse({ nome: 'Zé', apelido: '', numero: '', posicao: '' }).numero).toBeNull()
  })

  it('recusa número com 3 dígitos', () => {
    expect(jogadorSchema.safeParse({ nome: 'Zé', apelido: '', numero: '100', posicao: '' }).success).toBe(false)
  })
})

describe('TimeForm', () => {
  it('sugere a sigla pelo nome e envia', async () => {
    const user = userEvent.setup()
    const onSalvar = vi.fn()
    render(<TimeForm salvando={false} erro={null} rotuloSalvar="Criar time" onSalvar={onSalvar} />)

    await user.type(screen.getByLabelText('Nome do time'), 'Real Jardim Paulista')
    expect(screen.getByLabelText('Sigla')).toHaveValue('RJP')
    await user.click(screen.getByRole('button', { name: 'Criar time' }))

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1))
    expect(onSalvar.mock.calls[0][0]).toMatchObject({ nome: 'Real Jardim Paulista', sigla: 'RJP', contato: null })
  })
})

describe('JogadorForm', () => {
  it('limpa o formulário depois de adicionar', async () => {
    const user = userEvent.setup()
    const onSalvar = vi.fn().mockResolvedValue(undefined)
    render(<JogadorForm idPrefixo="novo" rotuloSalvar="Adicionar" salvando={false} erro={null} onSalvar={onSalvar} />)

    await user.type(screen.getByLabelText('Nº'), '9')
    await user.type(screen.getByLabelText('Nome'), 'Tião')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => expect(onSalvar).toHaveBeenCalledWith({ nome: 'Tião', apelido: null, numero: 9, posicao: null }))
    await waitFor(() => expect(screen.getByLabelText('Nome')).toHaveValue(''))
  })
})
