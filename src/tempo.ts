// Cálculos do cronômetro. Fonte de verdade = timestamps (não um contador com setInterval),
// assim o tempo continua certo se a tela apagar, a aba ficar em segundo plano ou a página recarregar.

export type Modo = 'progressivo' | 'regressivo'

export type EstadoTimer = {
  modo: Modo
  duracaoSeg: number // regressivo: tempo inicial; progressivo: tempo regulamentar (0 = sem limite)
  acrescimoSeg: number // acréscimo dado pelo juiz, somado ao tempo de jogo
  rodando: boolean
  iniciadoEm: number | null // Date.now() do último "iniciar"
  acumuladoMs: number // tempo corrido antes do último "iniciar"
}

export function decorridoMs(t: EstadoTimer, agora: number): number {
  return t.acumuladoMs + (t.rodando && t.iniciadoEm !== null ? Math.max(0, agora - t.iniciadoEm) : 0)
}

// Tempo de jogo + acréscimo, em ms.
export function totalMs(t: EstadoTimer): number {
  return (t.duracaoSeg + t.acrescimoSeg) * 1000
}

// Milissegundos mostrados no mostrador.
export function exibidoMs(t: EstadoTimer, agora: number): number {
  const passou = decorridoMs(t, agora)
  return t.modo === 'regressivo' ? Math.max(0, totalMs(t) - passou) : passou
}

// Regressivo chegou a zero (já contando o acréscimo).
export function acabou(t: EstadoTimer, agora: number): boolean {
  return t.modo === 'regressivo' && totalMs(t) > 0 && decorridoMs(t, agora) >= totalMs(t)
}

// Progressivo com acréscimo dado: passou do tempo de jogo + acréscimo (o tempo continua correndo).
export function acabouAcrescimo(t: EstadoTimer, agora: number): boolean {
  return t.modo === 'progressivo' && t.duracaoSeg > 0 && t.acrescimoSeg > 0 && decorridoMs(t, agora) >= totalMs(t)
}

// Progressivo com tempo de jogo: quanto já passou do tempo regulamentar, em ms.
export function alemDoTempoMs(t: EstadoTimer, agora: number): number {
  if (t.modo !== 'progressivo' || t.duracaoSeg <= 0) return 0
  return Math.max(0, decorridoMs(t, agora) - t.duracaoSeg * 1000)
}

// 754_000 -> "12:34"; passa de 99 min sem quebrar ("105:00").
// Regressivo arredonda para cima (mostra 00:01 até o último segundo acabar).
export function formatar(ms: number, arredondarParaCima = false): string {
  const total = arredondarParaCima ? Math.ceil(ms / 1000) : Math.floor(ms / 1000)
  const min = Math.floor(total / 60)
  const seg = total % 60
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`
}

// Minuto de jogo no estilo do futebol: 0:30 jogado é o 1º minuto ("1'").
export function minutoDeJogo(t: EstadoTimer, agora: number): number {
  const passou = decorridoMs(t, agora)
  return passou <= 0 ? 0 : Math.floor(passou / 60_000) + 1
}

export function iniciar(t: EstadoTimer, agora: number): EstadoTimer {
  if (t.rodando || acabou(t, agora)) return t
  return { ...t, rodando: true, iniciadoEm: agora }
}

export function pausar(t: EstadoTimer, agora: number): EstadoTimer {
  if (!t.rodando) return t
  const passou = decorridoMs(t, agora)
  // No regressivo, não deixa acumular além do tempo total (senão o acréscimo "sumiria").
  const limite = t.modo === 'regressivo' ? Math.min(passou, totalMs(t)) : passou
  return { ...t, rodando: false, iniciadoEm: null, acumuladoMs: limite }
}

// Soma (ou tira) acréscimo; nunca fica negativo. Funciona com o tempo correndo ou parado.
export function ajustarAcrescimo(t: EstadoTimer, deltaSeg: number): EstadoTimer {
  return { ...t, acrescimoSeg: Math.min(Math.max(0, t.acrescimoSeg + deltaSeg), 60 * 60) }
}

export function zerar(t: EstadoTimer): EstadoTimer {
  return { ...t, rodando: false, iniciadoEm: null, acumuladoMs: 0, acrescimoSeg: 0 }
}

// Tempo que falta numa punição, contado pelo tempo de jogo (pausa junto com o jogo).
export function restantePunicaoMs(p: { inicioMs: number; duracaoMs: number }, t: EstadoTimer, agora: number): number {
  return Math.max(0, p.duracaoMs - Math.max(0, decorridoMs(t, agora) - p.inicioMs))
}
