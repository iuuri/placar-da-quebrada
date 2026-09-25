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

  // Toca no tipo, escreve (opcional) no pop-up e escolhe o time.
  function registrar(tipo: RegExp, time: string, texto = '') {
    fireEvent.click(screen.getByRole('button', { name: tipo }))
    const dialogo = screen.getByRole('dialog')
    if (texto) fireEvent.change(within(dialogo).getByRole('textbox'), { target: { value: texto } })
    fireEvent.click(within(dialogo).getByRole('button', { name: time }))
  }

  function blocos() {
    return within(screen.getByRole('list', { name: /Anotações/ })).getAllByRole('listitem')
  }

  it('registro abre pop-up para escolher o time, com minuto e nome opcional', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Nome do primeiro time'), { target: { value: 'Unidos' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    act(() => vi.advanceTimersByTime(12 * 60_000 + 5_000))

    fireEvent.click(screen.getByRole('button', { name: /Amarelo/ }))
    const dialogo = screen.getByRole('dialog', { name: /Amarelo aos 13'/ })
    expect(within(dialogo).getByRole('button', { name: 'Unidos' })).toHaveFocus()
    fireEvent.change(within(dialogo).getByRole('textbox'), { target: { value: 'Zé' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Unidos' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(blocos()[0]).toHaveTextContent("13'")
    expect(blocos()[0]).toHaveTextContent('Amarelo')
    expect(blocos()[0]).toHaveTextContent('Unidos')
    expect(blocos()[0]).toHaveTextContent('Zé')

    // sem nome também vale
    registrar(/Vermelho/, 'Time B')
    expect(blocos()[0]).toHaveTextContent('Time B')
    expect(blocos()[0]).toHaveTextContent('sem descrição')
  })

  it('cancelar o pop-up não registra nada', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Gol$/ }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /Anotações/ })).not.toBeInTheDocument()
  })

  it('anotação geral pode ficar sem time; editar troca texto e time; apagar pede confirmação', () => {
    render(<App />)
    registrar(/Anotar/, 'Geral (sem time)', 'chuva')
    registrar(/Gol$/, 'Time A', 'segunda')
    expect(blocos()[0]).toHaveTextContent('segunda')
    expect(blocos()[1]).toHaveTextContent('chuva')

    const gol = blocos()[0]
    fireEvent.click(within(gol).getByRole('button', { name: 'Editar' }))
    fireEvent.change(within(gol).getByLabelText('Texto da anotação'), { target: { value: 'corrigida' } })
    fireEvent.click(within(gol).getByRole('radio', { name: 'Time B' }))
    fireEvent.click(within(gol).getByRole('button', { name: 'Salvar' }))
    expect(gol).toHaveTextContent('corrigida')
    expect(gol).toHaveTextContent('Time B')

    fireEvent.click(within(blocos()[1]).getByRole('button', { name: 'Apagar' }))
    fireEvent.click(within(blocos()[1]).getByRole('button', { name: 'Sim, apagar' }))
    expect(blocos()).toHaveLength(1)
  })

  it('punição de 2 minutos anda com o jogo, pausa junto e avisa quando termina', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    act(() => vi.advanceTimersByTime(5_000))
    registrar(/Punição/, 'Time A', 'Tião')

    const painel = () => screen.getByRole('region', { name: /Punições/ })
    expect(within(painel()).getByRole('timer')).toHaveTextContent('02:00')
    expect(blocos()[0]).toHaveTextContent('Punição')

    act(() => vi.advanceTimersByTime(30_000))
    expect(within(painel()).getByRole('timer')).toHaveTextContent('01:30')

    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    act(() => vi.advanceTimersByTime(60_000))
    expect(within(painel()).getByRole('timer')).toHaveTextContent('01:30')

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    act(() => vi.advanceTimersByTime(90_000))
    expect(within(painel()).getByText('Pode voltar ao jogo!')).toBeInTheDocument()
    fireEvent.click(within(painel()).getByRole('button', { name: /Confirmar volta de Tião/ }))
    expect(screen.queryByRole('region', { name: /Punições/ })).not.toBeInTheDocument()
    expect(blocos()[0]).toHaveTextContent('Tião') // o registro continua nas anotações
  })

  it('marca gols e reseta tudo com confirmação', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Nome do primeiro time'), { target: { value: 'Unidos' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gol de Unidos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gol de Unidos' }))
    expect(screen.getByLabelText('Gols de Unidos')).toHaveTextContent('2')
    registrar(/Amarelo/, 'Unidos')

    fireEvent.click(screen.getByRole('button', { name: 'Resetar tudo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sim, zerar tudo' }))
    expect(screen.queryByRole('list', { name: /Anotações/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Gols de Time A')).toHaveTextContent('0')
    expect(tempo()).toBe('25:00')
  })
})
