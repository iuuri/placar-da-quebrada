// Cálculos do cronômetro. Fonte de verdade = timestamps (não um contador com setInterval),
// assim o tempo continua certo se a tela apagar, a aba ficar em segundo plano ou a página recarregar.

export type Modo = 'progressivo' | 'regressivo'

export type EstadoTimer = {
  modo: Modo
  duracaoSeg: number // regressivo: tempo inicial; progressivo: tempo regulamentar (0 = sem limite)
  rodando: boolean
  iniciadoEm: number | null // Date.now() do último "iniciar"
  acumuladoMs: number // tempo corrido antes do último "iniciar"
}

export function decorridoMs(t: EstadoTimer, agora: number): number {
  return t.acumuladoMs + (t.rodando && t.iniciadoEm !== null ? Math.max(0, agora - t.iniciadoEm) : 0)
}

// Milissegundos mostrados no mostrador.
export function exibidoMs(t: EstadoTimer, agora: number): number {
  const passou = decorridoMs(t, agora)
  return t.modo === 'regressivo' ? Math.max(0, t.duracaoSeg * 1000 - passou) : passou
}

export function acabou(t: EstadoTimer, agora: number): boolean {
  return t.modo === 'regressivo' && t.duracaoSeg > 0 && decorridoMs(t, agora) >= t.duracaoSeg * 1000
}

// Progressivo com tempo regulamentar: quanto passou do limite (acréscimos), em ms.
export function acrescimoMs(t: EstadoTimer, agora: number): number {
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
  // No regressivo, não deixa acumular além do tempo total.
  const limite = t.modo === 'regressivo' ? Math.min(passou, t.duracaoSeg * 1000) : passou
  return { ...t, rodando: false, iniciadoEm: null, acumuladoMs: limite }
}

export function zerar(t: EstadoTimer): EstadoTimer {
  return { ...t, rodando: false, iniciadoEm: null, acumuladoMs: 0 }
}
