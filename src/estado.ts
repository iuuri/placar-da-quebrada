import { useEffect, useReducer } from 'react'
import { ajustarAcrescimo, iniciar, pausar, zerar, type EstadoTimer, type Modo } from './tempo'

// Tudo fica só neste aparelho (localStorage). Não há banco de dados.

export type Lado = 'casa' | 'visitante'

export type TipoNota = 'amarelo' | 'vermelho' | 'gol' | 'troca' | 'punicao' | 'nota'

export type Nota = {
  id: string
  tipo: TipoNota
  minuto: number
  texto: string
  lado: Lado | null // time do registro; null = geral (só em anotações)
}

// Punição de 2 minutos em andamento. Anda junto com o cronômetro do jogo:
// se o jogo pausa, a punição pausa. O registro fica nas notas (mesmo id).
export type Punicao = {
  id: string
  lado: Lado
  texto: string
  inicioMs: number // tempo de jogo decorrido quando a punição começou
  duracaoMs: number
}

export const PUNICAO_MS = 2 * 60_000

export type Estado = {
  timer: EstadoTimer
  placar: Record<Lado, { nome: string; gols: number; faltas: number }>
  notas: Nota[] // mais recente primeiro
  punicoes: Punicao[] // em andamento
}

export const ESTADO_INICIAL: Estado = {
  timer: { modo: 'regressivo', duracaoSeg: 25 * 60, acrescimoSeg: 0, rodando: false, iniciadoEm: null, acumuladoMs: 0 },
  placar: { casa: { nome: 'Time A', gols: 0, faltas: 0 }, visitante: { nome: 'Time B', gols: 0, faltas: 0 } },
  notas: [],
  punicoes: [],
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
  // Gol pelo placar: soma no placar e já cria o registro do gol (o nome do jogador entra depois, editando).
  | { tipo: 'marcarGol'; lado: Lado; id: string; minuto: number }
  // Tirar gol: diminui o placar e apaga o registro de gol mais recente daquele time.
  | { tipo: 'tirarGol'; lado: Lado }
  | { tipo: 'falta'; lado: Lado; delta: 1 | -1 }
  | { tipo: 'adicionarNota'; nota: Nota; decorridoMs: number }
  | { tipo: 'editarNota'; id: string; texto: string; lado: Lado | null }
  | { tipo: 'removerNota'; id: string }
  | { tipo: 'encerrarPunicao'; id: string }
  | { tipo: 'resetarTudo' }

function somarGols(estado: Estado, lado: Lado, delta: number): Estado {
  const atual = estado.placar[lado]
  return {
    ...estado,
    placar: { ...estado.placar, [lado]: { ...atual, gols: Math.max(0, Math.min(99, atual.gols + delta)) } },
  }
}

export function reducer(estado: Estado, acao: Acao): Estado {
  switch (acao.tipo) {
    case 'iniciar':
      return { ...estado, timer: iniciar(estado.timer, acao.agora) }
    case 'pausar':
      return { ...estado, timer: pausar(estado.timer, acao.agora) }
    case 'zerarTempo':
      // Punições contam pelo tempo de jogo: zerando o tempo, elas deixam de fazer sentido.
      return { ...estado, timer: zerar(estado.timer), punicoes: [] }
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
    case 'marcarGol': {
      if (estado.placar[acao.lado].gols >= 99) return estado
      const nota: Nota = { id: acao.id, tipo: 'gol', minuto: acao.minuto, texto: '', lado: acao.lado }
      return { ...somarGols(estado, acao.lado, 1), notas: [nota, ...estado.notas] }
    }
    case 'tirarGol': {
      if (estado.placar[acao.lado].gols === 0) return estado
      const ultimo = estado.notas.find((n) => n.tipo === 'gol' && n.lado === acao.lado)
      return {
        ...somarGols(estado, acao.lado, -1),
        notas: ultimo ? estado.notas.filter((n) => n.id !== ultimo.id) : estado.notas,
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
      // Só anotação geral pode ficar sem time.
      if (nota.tipo !== 'nota' && nota.lado === null) return estado
      const punicoes =
        nota.tipo === 'punicao' && nota.lado
          ? [
              ...estado.punicoes,
              { id: nota.id, lado: nota.lado, texto: nota.texto, inicioMs: acao.decorridoMs, duracaoMs: PUNICAO_MS },
            ]
          : estado.punicoes
      return { ...estado, notas: [nota, ...estado.notas], punicoes }
    }
    case 'editarNota': {
      const texto = acao.texto.trim().slice(0, MAX_TEXTO_NOTA)
      const alvo = estado.notas.find((n) => n.id === acao.id)
      if (!alvo) return estado
      // Gol não troca de time pela edição: o placar já foi somado para aquele time.
      const lado = alvo.tipo === 'nota' ? acao.lado : alvo.tipo === 'gol' ? alvo.lado : (acao.lado ?? alvo.lado)
      return {
        ...estado,
        notas: estado.notas.map((n) => (n.id === acao.id ? { ...n, texto, lado } : n)),
        punicoes: estado.punicoes.map((p) => (p.id === acao.id && lado ? { ...p, texto, lado } : p)),
      }
    }
    case 'removerNota': {
      // Apagar o registro de um gol também tira o gol do placar.
      const alvo = estado.notas.find((n) => n.id === acao.id)
      const base = alvo?.tipo === 'gol' && alvo.lado ? somarGols(estado, alvo.lado, -1) : estado
      return {
        ...base,
        notas: estado.notas.filter((n) => n.id !== acao.id),
        punicoes: estado.punicoes.filter((p) => p.id !== acao.id),
      }
    }
    case 'encerrarPunicao':
      return { ...estado, punicoes: estado.punicoes.filter((p) => p.id !== acao.id) }
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
        lado: null,
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
        ? salvo.notas.map((n) => ({ ...n, lado: n.lado ?? null }))
        : typeof salvo.anotacoes === 'string'
          ? converterTextoAntigo(salvo.anotacoes)
          : [],
      punicoes: Array.isArray(salvo.punicoes) ? salvo.punicoes : [],
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
