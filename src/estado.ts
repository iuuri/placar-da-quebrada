import { useEffect, useReducer } from 'react'
import { iniciar, pausar, zerar, type EstadoTimer, type Modo } from './tempo'

// Tudo fica só neste aparelho (localStorage). Não há banco de dados.

export type Lado = 'casa' | 'visitante'

export type Estado = {
  timer: EstadoTimer
  placar: Record<Lado, { nome: string; gols: number }>
  anotacoes: string
}

export const ESTADO_INICIAL: Estado = {
  timer: { modo: 'progressivo', duracaoSeg: 25 * 60, rodando: false, iniciadoEm: null, acumuladoMs: 0 },
  placar: { casa: { nome: 'Time A', gols: 0 }, visitante: { nome: 'Time B', gols: 0 } },
  anotacoes: '',
}

export type Acao =
  | { tipo: 'iniciar'; agora: number }
  | { tipo: 'pausar'; agora: number }
  | { tipo: 'zerarTempo' }
  | { tipo: 'definirModo'; modo: Modo }
  | { tipo: 'definirDuracao'; segundos: number }
  | { tipo: 'nomeTime'; lado: Lado; nome: string }
  | { tipo: 'gol'; lado: Lado; delta: 1 | -1 }
  | { tipo: 'anotacoes'; texto: string }
  | { tipo: 'resetarTudo' }

export function reducer(estado: Estado, acao: Acao): Estado {
  switch (acao.tipo) {
    case 'iniciar':
      return { ...estado, timer: iniciar(estado.timer, acao.agora) }
    case 'pausar':
      return { ...estado, timer: pausar(estado.timer, acao.agora) }
    case 'zerarTempo':
      return { ...estado, timer: zerar(estado.timer) }
    case 'definirModo':
      // Trocar de modo no meio confundiria o mostrador: recomeça o tempo.
      if (estado.timer.rodando) return estado
      return { ...estado, timer: zerar({ ...estado.timer, modo: acao.modo }) }
    case 'definirDuracao': {
      if (estado.timer.rodando) return estado
      const segundos = Math.min(Math.max(0, Math.round(acao.segundos)), 999 * 60)
      return { ...estado, timer: { ...estado.timer, duracaoSeg: segundos } }
    }
    case 'nomeTime':
      return {
        ...estado,
        placar: { ...estado.placar, [acao.lado]: { ...estado.placar[acao.lado], nome: acao.nome.slice(0, 30) } },
      }
    case 'gol': {
      const atual = estado.placar[acao.lado]
      return {
        ...estado,
        placar: { ...estado.placar, [acao.lado]: { ...atual, gols: Math.max(0, Math.min(99, atual.gols + acao.delta)) } },
      }
    }
    case 'anotacoes':
      return { ...estado, anotacoes: acao.texto }
    case 'resetarTudo':
      return ESTADO_INICIAL
  }
}

const CHAVE = 'placar-da-quebrada:v1'

export function carregar(): Estado {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return ESTADO_INICIAL
    const salvo = JSON.parse(bruto) as Partial<Estado>
    // Mescla com o inicial para aguentar versões antigas do que foi salvo.
    return {
      timer: { ...ESTADO_INICIAL.timer, ...salvo.timer },
      placar: {
        casa: { ...ESTADO_INICIAL.placar.casa, ...salvo.placar?.casa },
        visitante: { ...ESTADO_INICIAL.placar.visitante, ...salvo.placar?.visitante },
      },
      anotacoes: typeof salvo.anotacoes === 'string' ? salvo.anotacoes : '',
    }
  } catch {
    return ESTADO_INICIAL
  }
}

function salvar(estado: Estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado))
  } catch {
    // armazenamento cheio ou bloqueado (aba anônima): segue funcionando sem salvar
  }
}

export function useEstado() {
  const [estado, despachar] = useReducer(reducer, undefined, carregar)
  useEffect(() => salvar(estado), [estado])
  return [estado, despachar] as const
}
