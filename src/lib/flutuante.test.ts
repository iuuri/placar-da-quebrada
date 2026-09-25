import { ESTADO_INICIAL, type Estado } from '@/estado'
import { suportaFlutuante, textosFlutuante } from './flutuante'

const jogo: Estado = {
  ...ESTADO_INICIAL,
  placar: { casa: { nome: 'Unidos', gols: 2, faltas: 0 }, visitante: { nome: 'São Jorge', gols: 1, faltas: 0 } },
}

describe('janela flutuante', () => {
  it('mostra tempo e placar; parado aparece "Pausado"', () => {
    const t = textosFlutuante(jogo, 0)
    expect(t).toEqual({ tempo: '25:00', placar: 'Unidos 2 × 1 São Jorge', detalhe: 'Pausado', alerta: false })
  })

  it('conta com o tempo correndo e mostra a punição que acaba primeiro', () => {
    const e: Estado = {
      ...jogo,
      timer: { ...jogo.timer, rodando: true, iniciadoEm: 0 },
      punicoes: [
        { id: 'a', lado: 'casa', texto: 'Zé', inicioMs: 0, duracaoMs: 120_000 },
        { id: 'b', lado: 'visitante', texto: 'Tião', inicioMs: 30_000, duracaoMs: 120_000 },
      ],
    }
    const t = textosFlutuante(e, 60_000)
    expect(t.tempo).toBe('24:00')
    expect(t.detalhe).toBe('Punição 01:00 (+1)')
  })

  it('avisa o fim do tempo em destaque', () => {
    const e: Estado = { ...jogo, timer: { ...jogo.timer, duracaoSeg: 60, acumuladoMs: 60_000 } }
    expect(textosFlutuante(e, 0)).toMatchObject({ tempo: '00:00', detalhe: 'Fim do tempo!', alerta: true })
  })

  it('fica escondida onde o navegador não suporta (ex.: ambiente de teste)', () => {
    expect(suportaFlutuante()).toBe(false)
  })
})

describe('abrirFlutuante', () => {
  let visibilidade: DocumentVisibilityState = 'visible'

  beforeEach(() => {
    visibilidade = 'visible'
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibilidade })
    const ctx = { fillRect: vi.fn(), fillText: vi.fn(), measureText: () => ({ width: 10 }) }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
    Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', {
      configurable: true,
      value: () => ({ getTracks: () => [{ stop: vi.fn() }] }),
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', { configurable: true, set: () => {} })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    Object.defineProperty(HTMLVideoElement.prototype, 'requestPictureInPicture', {
      configurable: true,
      value: vi.fn().mockResolvedValue({}),
    })
  })

  afterEach(() => vi.restoreAllMocks())

  function mudarVisibilidade(estado: DocumentVisibilityState) {
    visibilidade = estado
    document.dispatchEvent(new Event('visibilitychange'))
  }

  it('fecha sozinha quando a pessoa volta para a página depois de sair', async () => {
    const onFechar = vi.fn()
    const { abrirFlutuante } = await import('./flutuante')
    await abrirFlutuante(() => jogo, onFechar)
    expect(document.querySelector('video')).not.toBeNull()

    mudarVisibilidade('hidden')
    expect(onFechar).not.toHaveBeenCalled()
    mudarVisibilidade('visible')
    expect(onFechar).toHaveBeenCalledTimes(1)
    expect(document.querySelector('video')).toBeNull()
  })

  it('não fecha se a pessoa não saiu da página', async () => {
    const onFechar = vi.fn()
    const { abrirFlutuante } = await import('./flutuante')
    const fechar = await abrirFlutuante(() => jogo, onFechar)
    mudarVisibilidade('visible')
    expect(onFechar).not.toHaveBeenCalled()
    fechar()
    expect(onFechar).toHaveBeenCalledTimes(1)
  })
})
