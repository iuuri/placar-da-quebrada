import { converterTextoAntigo, ESTADO_INICIAL, reducer } from './estado'
import {
  acabou,
  acabouAcrescimo,
  ajustarAcrescimo,
  alemDoTempoMs,
  exibidoMs,
  formatar,
  iniciar,
  minutoDeJogo,
  pausar,
  restantePunicaoMs,
  zerar,
  type EstadoTimer,
} from './tempo'

const base: EstadoTimer = { modo: 'progressivo', duracaoSeg: 60, acrescimoSeg: 0, rodando: false, iniciadoEm: null, acumuladoMs: 0 }

describe('formatar', () => {
  it('mostra mm:ss e passa de 99 minutos', () => {
    expect(formatar(754_000)).toBe('12:34')
    expect(formatar(105 * 60_000)).toBe('105:00')
  })

  it('no regressivo arredonda para cima', () => {
    expect(formatar(200, true)).toBe('00:01')
    expect(formatar(0, true)).toBe('00:00')
  })
})

describe('cronômetro por timestamps', () => {
  it('progressivo soma trechos entre pausas', () => {
    let t = iniciar(base, 1_000)
    t = pausar(t, 11_000) // 10 s
    t = iniciar(t, 50_000)
    expect(exibidoMs(t, 55_000)).toBe(15_000)
  })

  it('regressivo desconta e acaba em zero', () => {
    const t = iniciar({ ...base, modo: 'regressivo' }, 0)
    expect(exibidoMs(t, 20_000)).toBe(40_000)
    expect(acabou(t, 59_999)).toBe(false)
    expect(acabou(t, 60_000)).toBe(true)
    expect(exibidoMs(t, 90_000)).toBe(0)
  })

  it('pausar no regressivo não passa do total', () => {
    const t = pausar(iniciar({ ...base, modo: 'regressivo' }, 0), 90_000)
    expect(t.acumuladoMs).toBe(60_000)
  })

  it('não inicia um regressivo que já acabou', () => {
    const t: EstadoTimer = { ...base, modo: 'regressivo', acumuladoMs: 60_000 }
    expect(iniciar(t, 0)).toBe(t)
  })

  it('progressivo mostra quanto passou do tempo de jogo', () => {
    const t = iniciar(base, 0)
    expect(alemDoTempoMs(t, 30_000)).toBe(0)
    expect(alemDoTempoMs(t, 72_000)).toBe(12_000)
  })

  it('acréscimo no regressivo: estende a contagem, inclusive depois de acabar', () => {
    let t = pausar(iniciar({ ...base, modo: 'regressivo' }, 0), 70_000) // acabou em 60 s
    expect(acabou(t, 70_000)).toBe(true)
    t = ajustarAcrescimo(t, 120)
    expect(acabou(t, 70_000)).toBe(false)
    expect(exibidoMs(t, 70_000)).toBe(120_000)
    t = iniciar(t, 100_000)
    expect(exibidoMs(t, 160_000)).toBe(60_000)
  })

  it('acréscimo no progressivo avisa quando termina, sem parar', () => {
    const t = iniciar(ajustarAcrescimo(base, 180), 0)
    expect(acabouAcrescimo(t, 200_000)).toBe(false)
    expect(acabouAcrescimo(t, 240_000)).toBe(true)
  })

  it('acréscimo nunca fica negativo e zerar o tempo tira o acréscimo', () => {
    expect(ajustarAcrescimo(base, -60).acrescimoSeg).toBe(0)
    expect(zerar(ajustarAcrescimo(base, 60)).acrescimoSeg).toBe(0)
  })

  it('minuto de jogo no estilo do futebol', () => {
    const t = iniciar(base, 0)
    expect(minutoDeJogo(base, 0)).toBe(0)
    expect(minutoDeJogo(t, 30_000)).toBe(1)
    expect(minutoDeJogo(t, 60_000)).toBe(2)
  })
})

describe('reducer', () => {
  it('não deixa gol negativo e limita nome', () => {
    let e = reducer(ESTADO_INICIAL, { tipo: 'tirarGol', lado: 'casa' })
    expect(e.placar.casa.gols).toBe(0)
    e = reducer(e, { tipo: 'nomeTime', lado: 'visitante', nome: 'x'.repeat(50) })
    expect(e.placar.visitante.nome).toHaveLength(30)
  })

  it('trocar de modo zera o tempo; não troca com o tempo correndo', () => {
    let e = reducer(ESTADO_INICIAL, { tipo: 'iniciar', agora: 0 })
    expect(reducer(e, { tipo: 'definirModo', modo: 'regressivo' })).toBe(e)
    e = reducer(e, { tipo: 'pausar', agora: 5_000 })
    e = reducer(e, { tipo: 'definirModo', modo: 'regressivo' })
    expect(e.timer).toMatchObject({ modo: 'regressivo', acumuladoMs: 0 })
  })

  it('começa no regressivo e conta faltas sem ficar negativo', () => {
    expect(ESTADO_INICIAL.timer.modo).toBe('regressivo')
    let e = reducer(ESTADO_INICIAL, { tipo: 'falta', lado: 'visitante', delta: 1 })
    e = reducer(e, { tipo: 'falta', lado: 'visitante', delta: 1 })
    e = reducer(e, { tipo: 'falta', lado: 'casa', delta: -1 })
    expect(e.placar.visitante.faltas).toBe(2)
    expect(e.placar.casa.faltas).toBe(0)
  })

  it('resetar tudo volta ao estado inicial', () => {
    let e = reducer(ESTADO_INICIAL, { tipo: 'marcarGol', lado: 'casa', id: 'g', minuto: 0 })
    e = reducer(e, { tipo: 'adicionarNota', nota: { id: '1', tipo: 'nota', minuto: 3, texto: 'oi', lado: null }, decorridoMs: 0 })
    expect(reducer(e, { tipo: 'resetarTudo' })).toEqual(ESTADO_INICIAL)
  })
})

describe('gols', () => {
  it('gol pelo placar soma e cria o registro; editar põe o jogador sem trocar o time', () => {
    let e = reducer(ESTADO_INICIAL, { tipo: 'marcarGol', lado: 'visitante', id: 'g1', minuto: 7 })
    expect(e.placar.visitante.gols).toBe(1)
    expect(e.notas[0]).toEqual({ id: 'g1', tipo: 'gol', minuto: 7, texto: '', lado: 'visitante' })
    e = reducer(e, { tipo: 'editarNota', id: 'g1', texto: ' Zé ', lado: 'casa' })
    expect(e.notas[0]).toMatchObject({ texto: 'Zé', lado: 'visitante' })
  })

  it('tirar gol apaga o registro de gol mais recente daquele time', () => {
    let e = reducer(ESTADO_INICIAL, { tipo: 'marcarGol', lado: 'casa', id: 'a', minuto: 1 })
    e = reducer(e, { tipo: 'marcarGol', lado: 'visitante', id: 'b', minuto: 2 })
    e = reducer(e, { tipo: 'marcarGol', lado: 'casa', id: 'c', minuto: 3 })
    e = reducer(e, { tipo: 'tirarGol', lado: 'casa' })
    expect(e.placar.casa.gols).toBe(1)
    expect(e.notas.map((n) => n.id)).toEqual(['b', 'a'])
  })

  it('apagar o registro de um gol também tira do placar', () => {
    let e = reducer(ESTADO_INICIAL, { tipo: 'marcarGol', lado: 'casa', id: 'a', minuto: 1 })
    e = reducer(e, { tipo: 'removerNota', id: 'a' })
    expect(e.placar.casa.gols).toBe(0)
    expect(e.notas).toEqual([])
  })
})

describe('notas', () => {
  it('novas entram no topo e o texto é limitado', () => {
    let e = reducer(ESTADO_INICIAL, { tipo: 'adicionarNota', nota: { id: 'a', tipo: 'gol', minuto: 2, texto: ' Zé ', lado: 'casa' }, decorridoMs: 0 })
    e = reducer(e, { tipo: 'adicionarNota', nota: { id: 'b', tipo: 'nota', minuto: 5, texto: 'x'.repeat(200), lado: null }, decorridoMs: 0 })
    expect(e.notas.map((n) => n.id)).toEqual(['b', 'a'])
    expect(e.notas[1].texto).toBe('Zé')
    expect(e.notas[0].texto).toHaveLength(140)
  })

  it('converte o texto livre da versão anterior em blocos', () => {
    const notas = converterTextoAntigo(["12' 🟨 Zé", '', 'observação solta', "30' ⚽ Tião"].join('\n'))
    expect(notas).toEqual([
      { id: 'antiga-2', minuto: 30, tipo: 'gol', texto: 'Tião', lado: null },
      { id: 'antiga-1', minuto: 0, tipo: 'nota', texto: 'observação solta', lado: null },
      { id: 'antiga-0', minuto: 12, tipo: 'amarelo', texto: 'Zé', lado: null },
    ])
  })
})

describe('registros por time e punições', () => {
  it('cartão sem time é recusado (só anotação geral pode ficar sem time)', () => {
    const e = reducer(ESTADO_INICIAL, {
      tipo: 'adicionarNota',
      nota: { id: 'x', tipo: 'amarelo', minuto: 1, texto: '', lado: null },
      decorridoMs: 0,
    })
    expect(e).toBe(ESTADO_INICIAL)
  })

  it('punição cria o registro e o cronômetro; apagar o registro tira a punição', () => {
    let e = reducer(ESTADO_INICIAL, {
      tipo: 'adicionarNota',
      nota: { id: 'p', tipo: 'punicao', minuto: 3, texto: 'Tião', lado: 'visitante' },
      decorridoMs: 150_000,
    })
    expect(e.notas[0].id).toBe('p')
    expect(e.punicoes).toEqual([{ id: 'p', lado: 'visitante', texto: 'Tião', inicioMs: 150_000, duracaoMs: 120_000 }])
    e = reducer(e, { tipo: 'editarNota', id: 'p', texto: 'Tião 4', lado: 'casa' })
    expect(e.punicoes[0]).toMatchObject({ texto: 'Tião 4', lado: 'casa' })
    e = reducer(e, { tipo: 'removerNota', id: 'p' })
    expect(e.punicoes).toEqual([])
  })

  it('zerar o tempo encerra as punições, mas mantém os registros', () => {
    let e = reducer(ESTADO_INICIAL, {
      tipo: 'adicionarNota',
      nota: { id: 'p', tipo: 'punicao', minuto: 1, texto: '', lado: 'casa' },
      decorridoMs: 0,
    })
    e = reducer(e, { tipo: 'zerarTempo' })
    expect(e.punicoes).toEqual([])
    expect(e.notas).toHaveLength(1)
  })

  it('tempo restante da punição segue o tempo de jogo', () => {
    const t = iniciar({ ...base, duracaoSeg: 0 }, 0)
    const p = { inicioMs: 10_000, duracaoMs: 120_000 }
    expect(restantePunicaoMs(p, t, 40_000)).toBe(90_000)
    expect(restantePunicaoMs(p, pausar(t, 40_000), 999_000)).toBe(90_000)
    expect(restantePunicaoMs(p, t, 200_000)).toBe(0)
  })
})
