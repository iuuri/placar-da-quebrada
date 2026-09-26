import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { App } from './App'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'requestAnimationFrame'] })
  vi.setSystemTime(0)
})

afterEach(() => vi.useRealTimers())

function abrirAjustes() {
  fireEvent.click(screen.getByRole('button', { name: 'Abrir ajustes do cronômetro' }))
}

function tempo() {
  return screen.getByRole('timer').querySelector('p.font-display')!.textContent
}

describe('App', () => {
  it('conta, pausa e continua salvo depois de recarregar', () => {
    const { unmount } = render(<App />)
    abrirAjustes()
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
    abrirAjustes()
    expect(screen.getByRole('radio', { name: 'Regressivo' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.change(screen.getByLabelText('Minutos'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Segundos'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    act(() => vi.advanceTimersByTime(4_000))

    expect(tempo()).toBe('00:00')
    expect(screen.getByText(/Fim do 1º tempo!/)).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: 'Troca' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /Anotações/ })).not.toBeInTheDocument()
  })

  it('anotação geral pode ficar sem time; editar troca texto e time; apagar pede confirmação', () => {
    render(<App />)
    registrar(/Anotar/, 'Geral (sem time)', 'chuva')
    registrar(/Troca/, 'Time A', 'segunda')
    expect(blocos()[0]).toHaveTextContent('segunda')
    expect(blocos()[1]).toHaveTextContent('chuva')

    const troca = blocos()[0]
    fireEvent.click(within(troca).getByRole('button', { name: 'Editar' }))
    fireEvent.change(within(troca).getByLabelText('Texto da anotação'), { target: { value: 'corrigida' } })
    fireEvent.click(within(troca).getByRole('radio', { name: 'Time B' }))
    fireEvent.click(within(troca).getByRole('button', { name: 'Salvar' }))
    expect(troca).toHaveTextContent('corrigida')
    expect(troca).toHaveTextContent('Time B')

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

  // Gol pelo placar: soma na hora e o pop-up só pede o jogador (opcional).
  function marcarGol(time: string, jogador = '') {
    fireEvent.click(screen.getByRole('button', { name: `Gol de ${time}` }))
    const dialogo = screen.getByRole('dialog', { name: new RegExp(`Gol de ${time}`) })
    if (jogador) fireEvent.change(within(dialogo).getByRole('textbox'), { target: { value: jogador } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Salvar gol' }))
  }

  it('não tem botão de gol nos registros: o gol é marcado no placar e pede o jogador', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Gol' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    act(() => vi.advanceTimersByTime(9 * 60_000 + 30_000))

    fireEvent.click(screen.getByRole('button', { name: 'Gol de Time B' }))
    // o placar já mudou antes de salvar
    expect(screen.getByLabelText('Gols de Time B')).toHaveTextContent('1')
    const dialogo = screen.getByRole('dialog', { name: /Gol de Time B aos 10'/ })
    expect(within(dialogo).getByRole('button', { name: 'Salvar gol' })).toHaveFocus()
    fireEvent.change(within(dialogo).getByRole('textbox'), { target: { value: 'Zé' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Salvar gol' }))
    expect(blocos()[0]).toHaveTextContent("10'")
    expect(blocos()[0]).toHaveTextContent('Gol')
    expect(blocos()[0]).toHaveTextContent('Time B')
    expect(blocos()[0]).toHaveTextContent('Zé')

    // sem nome também vale; desfazer tira o gol e o registro
    marcarGol('Time A')
    expect(blocos()).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Gol de Time A' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desfazer gol' }))
    expect(screen.getByLabelText('Gols de Time A')).toHaveTextContent('1')
    expect(blocos()).toHaveLength(2)

    // tirar gol no placar apaga o registro mais recente daquele time
    fireEvent.click(screen.getByRole('button', { name: 'Tirar um gol de Time B' }))
    expect(screen.getByLabelText('Gols de Time B')).toHaveTextContent('0')
    expect(blocos()).toHaveLength(1)
    expect(blocos()[0]).toHaveTextContent('Time A')
  })

  it('marca gols e reseta tudo com confirmação', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Nome do primeiro time'), { target: { value: 'Unidos' } })
    marcarGol('Unidos')
    marcarGol('Unidos')
    expect(screen.getByLabelText('Gols de Unidos')).toHaveTextContent('2')
    registrar(/Amarelo/, 'Unidos')

    fireEvent.click(screen.getByRole('button', { name: 'Resetar tudo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sim, zerar tudo' }))
    expect(screen.queryByRole('list', { name: /Anotações/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Gols de Time A')).toHaveTextContent('0')
    expect(tempo()).toBe('25:00')
  })

  it('cronômetro fica em cima do placar, fechado (só o tempo), abre e fecha pela seta e abre sozinho no fim', () => {
    render(<App />)
    const cronometro = screen.getByRole('region', { name: 'Cronômetro' })
    const placar = screen.getByRole('region', { name: 'Placar' })
    expect(cronometro.compareDocumentPosition(placar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // fechado: tempo e iniciar, sem os ajustes
    expect(tempo()).toBe('25:00')
    expect(screen.queryByLabelText('Minutos')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir ajustes do cronômetro' })).toHaveAttribute('aria-expanded', 'false')

    abrirAjustes()
    fireEvent.change(screen.getByLabelText('Minutos'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Segundos'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    act(() => vi.advanceTimersByTime(1_000))
    // iniciar fecha os ajustes; pausar e continuar funcionam fechado
    expect(screen.queryByLabelText('Tipo de contagem')).not.toBeInTheDocument()
    expect(tempo()).toBe('00:04')
    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    abrirAjustes()
    expect(screen.getByRole('radiogroup', { name: 'Tipo de contagem' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar ajustes do cronômetro' }))
    expect(screen.queryByRole('radiogroup', { name: 'Tipo de contagem' })).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(5_000))
    // fim do tempo: abre sozinho para dar acréscimo
    fireEvent.click(screen.getByRole('button', { name: 'Dar 1 minuto de acréscimo' }))
    expect(screen.getByRole('button', { name: 'Dar 1 minuto de acréscimo' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    act(() => vi.advanceTimersByTime(1_000))
    expect(screen.queryByRole('button', { name: 'Dar 1 minuto de acréscimo' })).not.toBeInTheDocument()
  })

  it('botão Súmula abre a tela com o resumo e a opção de PDF', () => {
    render(<App />)
    registrar(/Amarelo/, 'Time B', 'Zé')
    fireEvent.click(screen.getByRole('button', { name: /Súmula/ }))
    const tela = screen.getByRole('dialog', { name: 'Súmula do jogo' })
    expect(within(tela).getByRole('table', { name: 'Resumo por time' })).toBeInTheDocument()
    expect(within(tela).getByRole('listitem')).toHaveTextContent('Amarelo · Time B · Zé')
    expect(within(tela).getByRole('img', { name: /Linha do tempo: 0' 1ºT Amarelo Time B Zé/ })).toBeInTheDocument()
    expect(within(tela).getByRole('table', { name: 'Gols e cartões por jogador' })).toHaveTextContent('Zé')
    expect(within(tela).getByRole('button', { name: /PDF/ })).toBeInTheDocument()
    fireEvent.click(within(tela).getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('jogo em 2 tempos: encerra o 1º, o minuto recomeça e os registros dizem o tempo', () => {
    render(<App />)
    abrirAjustes()
    expect(screen.getByRole('radio', { name: '2 tempos' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.change(screen.getByLabelText('Minutos'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    act(() => vi.advanceTimersByTime(30_000))
    registrar(/Amarelo/, 'Time A', 'Zé')
    expect(blocos()[0]).toHaveTextContent("1'1ºT")

    // fim do 1º tempo: abre os ajustes com o botão de encerrar
    act(() => vi.advanceTimersByTime(31_000))
    expect(screen.getByText(/Fim do 1º tempo!/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar 1º tempo' }))
    expect(screen.getByRole('region', { name: 'Cronômetro' })).toHaveTextContent('2º tempo · Intervalo')
    expect(tempo()).toBe('01:00')

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar 2º tempo' }))
    act(() => vi.advanceTimersByTime(20_000))
    fireEvent.click(screen.getByRole('button', { name: 'Vermelho' }))
    expect(screen.getByRole('dialog', { name: /Vermelho aos 1' do 2º tempo/ })).toBeInTheDocument()
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Time B' }))
    expect(blocos()[0]).toHaveTextContent("1'2ºT")
    expect(blocos()[1]).toHaveTextContent("1'1ºT")
  })

  it('jogo de 1 tempo só não mostra 1º/2º tempo', () => {
    render(<App />)
    abrirAjustes()
    fireEvent.click(screen.getByRole('radio', { name: '1 tempo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    registrar(/Amarelo/, 'Time A')
    expect(blocos()[0]).not.toHaveTextContent('ºT')
    expect(screen.queryByRole('button', { name: 'Encerrar 1º tempo' })).not.toBeInTheDocument()
  })

  it('desfazer: volta falta, registro apagado e até o reset', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Falta de Time B' }))
    expect(screen.getByText('Falta de Time B marcada')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(screen.getByLabelText('Faltas de Time B')).toHaveTextContent('0')
    expect(screen.queryByRole('button', { name: 'Desfazer' })).not.toBeInTheDocument()

    registrar(/Amarelo/, 'Time A', 'Zé')
    expect(screen.getByText('Amarelo de Time A registrado')).toBeInTheDocument()
    fireEvent.click(within(blocos()[0]).getByRole('button', { name: 'Apagar' }))
    fireEvent.click(within(blocos()[0]).getByRole('button', { name: 'Sim, apagar' }))
    expect(screen.queryByRole('list', { name: /Anotações/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(blocos()[0]).toHaveTextContent('Zé')

    marcarGol('Time A')
    fireEvent.click(screen.getByRole('button', { name: 'Resetar tudo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sim, zerar tudo' }))
    expect(screen.getByLabelText('Gols de Time A')).toHaveTextContent('0')
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(screen.getByLabelText('Gols de Time A')).toHaveTextContent('1')
    expect(blocos()).toHaveLength(2)
  })
})
