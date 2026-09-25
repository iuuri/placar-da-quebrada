import { ESTADO_INICIAL, reducer } from './estado'
import { acabou, acrescimoMs, exibidoMs, formatar, iniciar, minutoDeJogo, pausar, type EstadoTimer } from './tempo'

const base: EstadoTimer = { modo: 'progressivo', duracaoSeg: 60, rodando: false, iniciadoEm: null, acumuladoMs: 0 }

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

  it('progressivo mostra acréscimo depois do tempo de jogo', () => {
    const t = iniciar(base, 0)
    expect(acrescimoMs(t, 30_000)).toBe(0)
    expect(acrescimoMs(t, 72_000)).toBe(12_000)
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
    let e = reducer(ESTADO_INICIAL, { tipo: 'gol', lado: 'casa', delta: -1 })
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

  it('resetar tudo volta ao estado inicial', () => {
    let e = reducer(ESTADO_INICIAL, { tipo: 'gol', lado: 'casa', delta: 1 })
    e = reducer(e, { tipo: 'anotacoes', texto: 'oi' })
    expect(reducer(e, { tipo: 'resetarTudo' })).toEqual(ESTADO_INICIAL)
  })
})
