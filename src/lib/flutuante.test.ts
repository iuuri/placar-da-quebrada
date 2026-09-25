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
