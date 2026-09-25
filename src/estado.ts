import { useEffect, useReducer } from 'react'
import { ajustarAcrescimo, iniciar, pausar, zerar, type EstadoTimer, type Modo } from './tempo'

// Tudo fica só neste aparelho (localStorage). Não há banco de dados.

export type Lado = 'casa' | 'visitante'

export type TipoNota = 'amarelo' | 'vermelho' | 'gol' | 'troca' | 'nota'

export type Nota = {
  id: string
  tipo: TipoNota
  minuto: number
  texto: string
}

export type Estado = {
  timer: EstadoTimer
  placar: Record<Lado, { nome: string; gols: number; faltas: number }>
  notas: Nota[] // mais recente primeiro
}

export const ESTADO_INICIAL: Estado = {
  timer: { modo: 'regressivo', duracaoSeg: 25 * 60, acrescimoSeg: 0, rodando: false, iniciadoEm: null, acumuladoMs: 0 },
  placar: { casa: { nome: 'Time A', gols: 0, faltas: 0 }, visitante: { nome: 'Time B', gols: 0, faltas: 0 } },
  notas: [],
}

export const MAX_TEXTO_NOTA = 140

export type Acao =
  | { tipo: 'iniciar'; agora: number }
  | { tipo: 'pausar'; agora: number }
  | { tipo: 'zerarTempo' }
  | { tipo: 'definirModo'; modo: Modo }
  | { tipo: 'definirDuracao'; segundos: number }
  | { tipo: 'acrescimo'; segundos: number }
  | { tipo: 'nomeTime'; lado: Lado; nome: string }
  | { tipo: 'gol'; lado: Lado; delta: 1 | -1 }
  | { tipo: 'falta'; lado: Lado; delta: 1 | -1 }
  | { tipo: 'adicionarNota'; nota: Nota }
  | { tipo: 'editarNota'; id: string; texto: string }
  | { tipo: 'removerNota'; id: string }
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
    case 'acrescimo':
      return { ...estado, timer: ajustarAcrescimo(estado.timer, acao.segundos) }
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
    case 'falta': {
      const atual = estado.placar[acao.lado]
      return {
        ...estado,
        placar: { ...estado.placar, [acao.lado]: { ...atual, faltas: Math.max(0, Math.min(99, atual.faltas + acao.delta)) } },
      }
    }
    case 'adicionarNota': {
      const nota = { ...acao.nota, texto: acao.nota.texto.trim().slice(0, MAX_TEXTO_NOTA) }
      return { ...estado, notas: [nota, ...estado.notas] }
    }
    case 'editarNota':
      return {
        ...estado,
        notas: estado.notas.map((n) =>
          n.id === acao.id ? { ...n, texto: acao.texto.trim().slice(0, MAX_TEXTO_NOTA) } : n,
        ),
      }
    case 'removerNota':
      return { ...estado, notas: estado.notas.filter((n) => n.id !== acao.id) }
    case 'resetarTudo':
      return ESTADO_INICIAL
  }
}

const EMOJI_PARA_TIPO: Record<string, TipoNota> = { '🟨': 'amarelo', '🟥': 'vermelho', '⚽': 'gol', '🔁': 'troca' }

// Versão anterior guardava as anotações num texto livre ("12' 🟨 Zé" por linha).
// Converte cada linha num bloco, do mais recente para o mais antigo.
export function converterTextoAntigo(texto: string): Nota[] {
  return texto
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha, i) => {
      const m = /^(\d{1,3})'\s*(🟨|🟥|⚽|🔁)?\s*(.*)$/u.exec(linha)
      return {
        id: `antiga-${i}`,
        minuto: m ? Number(m[1]) : 0,
        tipo: (m?.[2] && EMOJI_PARA_TIPO[m[2]]) || 'nota',
        texto: (m ? m[3] : linha).slice(0, MAX_TEXTO_NOTA),
      }
    })
    .reverse()
}

const CHAVE = 'placar-da-quebrada:v1'

export function carregar(): Estado {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return ESTADO_INICIAL
    const salvo = JSON.parse(bruto) as Partial<Estado> & { anotacoes?: unknown }
    // Mescla com o inicial para aguentar versões antigas do que foi salvo.
    return {
      timer: { ...ESTADO_INICIAL.timer, ...salvo.timer },
      placar: {
        casa: { ...ESTADO_INICIAL.placar.casa, ...salvo.placar?.casa },
        visitante: { ...ESTADO_INICIAL.placar.visitante, ...salvo.placar?.visitante },
      },
      notas: Array.isArray(salvo.notas)
        ? salvo.notas
        : typeof salvo.anotacoes === 'string'
          ? converterTextoAntigo(salvo.anotacoes)
          : [],
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
