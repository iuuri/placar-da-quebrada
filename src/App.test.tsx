import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { App } from './App'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'requestAnimationFrame'] })
  vi.setSystemTime(0)
})

afterEach(() => vi.useRealTimers())

function tempo() {
  return screen.getByRole('timer').querySelector('p')!.textContent
}

describe('App', () => {
  it('conta, pausa e continua salvo depois de recarregar', () => {
    const { unmount } = render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: 'Progressivo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    act(() => vi.advanceTimersByTime(65_000))
    expect(tempo()).toBe('01:05')

    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    unmount()

    render(<App />)
    expect(tempo()).toBe('01:05')
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
  })

  it('regressivo é o padrão, para sozinho no zero e aceita acréscimo', () => {
    render(<App />)
    expect(screen.getByRole('radio', { name: 'Regressivo' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.change(screen.getByLabelText('Minutos'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Segundos'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    act(() => vi.advanceTimersByTime(4_000))

    expect(tempo()).toBe('00:00')
    expect(screen.getByText(/Fim do tempo!/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dar 1 minuto de acréscimo' }))
    expect(tempo()).toBe('01:00')
    expect(screen.getByText('Com acréscimo de +01:00')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    act(() => vi.advanceTimersByTime(30_000))
    expect(tempo()).toBe('00:30')
  })

  it('marca faltas por time', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Falta de Time B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Falta de Time B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tirar uma falta de Time B' }))
    expect(screen.getByLabelText('Faltas de Time B')).toHaveTextContent('1')
    expect(screen.getByLabelText('Faltas de Time A')).toHaveTextContent('0')
  })

  it('marca gols, anota com o minuto e reseta tudo com confirmação', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Nome do primeiro time'), { target: { value: 'Unidos' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gol de Unidos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gol de Unidos' }))
    expect(screen.getByLabelText('Gols de Unidos')).toHaveTextContent('2')

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    act(() => vi.advanceTimersByTime(12 * 60_000 + 5_000))
    fireEvent.change(screen.getByLabelText(/Jogador ou observação/), { target: { value: 'Zé' } })
    fireEvent.click(screen.getByRole('button', { name: '🟨 Amarelo' }))
    const blocos = within(screen.getByRole('list', { name: /Anotações/ })).getAllByRole('listitem')
    expect(blocos[0]).toHaveTextContent("13'")
    expect(blocos[0]).toHaveTextContent('Amarelo')
    expect(blocos[0]).toHaveTextContent('Zé')
    expect(screen.getByLabelText(/Jogador ou observação/)).toHaveValue('')

    fireEvent.click(screen.getByRole('button', { name: 'Resetar tudo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sim, zerar tudo' }))
    expect(screen.queryByRole('list', { name: /Anotações/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Gols de Time A')).toHaveTextContent('0')
    expect(tempo()).toBe('25:00')
  })

  it('anotações: mais recente primeiro, editar e apagar com confirmação', () => {
    render(<App />)
    const campo = screen.getByLabelText(/Jogador ou observação/)
    fireEvent.change(campo, { target: { value: 'primeira' } })
    fireEvent.click(screen.getByRole('button', { name: 'Anotar observação' }))
    fireEvent.change(campo, { target: { value: 'segunda' } })
    fireEvent.click(screen.getByRole('button', { name: '⚽ Gol' }))

    const lista = screen.getByRole('list', { name: /Anotações/ })
    let blocos = within(lista).getAllByRole('listitem')
    expect(blocos[0]).toHaveTextContent('segunda')
    expect(blocos[1]).toHaveTextContent('primeira')

    fireEvent.click(within(blocos[1]).getByRole('button', { name: 'Editar' }))
    fireEvent.change(within(blocos[1]).getByLabelText('Texto da anotação'), { target: { value: 'corrigida' } })
    fireEvent.click(within(blocos[1]).getByRole('button', { name: 'Salvar' }))
    expect(blocos[1]).toHaveTextContent('corrigida')

    fireEvent.click(within(blocos[0]).getByRole('button', { name: 'Apagar' }))
    fireEvent.click(within(blocos[0]).getByRole('button', { name: 'Sim, apagar' }))
    blocos = within(lista).getAllByRole('listitem')
    expect(blocos).toHaveLength(1)
    expect(blocos[0]).toHaveTextContent('corrigida')
  })

  it('não cria anotação vazia pelo botão Anotar', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Anotar observação' }))
    expect(screen.queryByRole('list', { name: /Anotações/ })).not.toBeInTheDocument()
  })
})
