import { act, fireEvent, render, screen } from '@testing-library/react'
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
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    act(() => vi.advanceTimersByTime(65_000))
    expect(tempo()).toBe('01:05')

    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    unmount()

    render(<App />)
    expect(tempo()).toBe('01:05')
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
  })

  it('regressivo para sozinho no zero', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: 'Regressivo' }))
    fireEvent.change(screen.getByLabelText('Minutos'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Segundos'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    act(() => vi.advanceTimersByTime(4_000))

    expect(tempo()).toBe('00:00')
    expect(screen.getByText('Fim do tempo!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()
  })

  it('marca gols, anota com o minuto e reseta tudo com confirmação', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Nome do primeiro time'), { target: { value: 'Unidos' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gol de Unidos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gol de Unidos' }))
    expect(screen.getByLabelText('Gols de Unidos')).toHaveTextContent('2')

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    act(() => vi.advanceTimersByTime(12 * 60_000 + 5_000))
    fireEvent.click(screen.getByRole('button', { name: '🟨 Amarelo' }))
    expect(screen.getByLabelText('Anotações da partida')).toHaveValue("13' 🟨 ")

    fireEvent.click(screen.getByRole('button', { name: 'Resetar tudo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sim, zerar tudo' }))
    expect(screen.getByLabelText('Anotações da partida')).toHaveValue('')
    expect(screen.getByLabelText('Gols de Time A')).toHaveTextContent('0')
    expect(tempo()).toBe('00:00')
  })
})
