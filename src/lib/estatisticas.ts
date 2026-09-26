import type { Estado, Lado, Nota, TipoNota } from '@/estado'
import { decorridoMs, minutoDeJogo } from '@/tempo'

// Estatísticas da súmula, calculadas só com o que já é registrado no jogo (placar, faltas e registros).

// Cores dos dois times nos gráficos (testadas para daltonismo e contraste).
// Tela escura e PDF (fundo branco) usam tons diferentes do mesmo par.
export const COR_TIME: { tela: Record<Lado, string>; pdf: Record<Lado, [number, number, number]> } = {
  tela: { casa: '#c08900', visitante: '#3a8fe6' },
  pdf: { casa: [176, 124, 0], visitante: [31, 111, 196] },
}

export type LinhaComparativo = { rotulo: string; casa: number; visitante: number }

const conta = (notas: Nota[], lado: Lado, tipo: TipoNota) => notas.filter((n) => n.lado === lado && n.tipo === tipo).length

// "Estatísticas da partida": um número de cada time por linha.
export function comparativo(estado: Estado): LinhaComparativo[] {
  const { placar, notas } = estado
  const linha = (rotulo: string, tipo: TipoNota) => ({
    rotulo,
    casa: conta(notas, 'casa', tipo),
    visitante: conta(notas, 'visitante', tipo),
  })
  return [
    { rotulo: 'Gols', casa: placar.casa.gols, visitante: placar.visitante.gols },
    { rotulo: 'Faltas', casa: placar.casa.faltas, visitante: placar.visitante.faltas },
    linha('Cartões amarelos', 'amarelo'),
    linha('Cartões vermelhos', 'vermelho'),
    linha('Punições 2 min', 'punicao'),
    linha('Substituições', 'troca'),
  ]
}

// Parte de cada time numa linha (0 a 1). Sem nenhum dos dois, não há barra.
export function proporcao(l: LinhaComparativo): { casa: number; visitante: number } | null {
  const total = l.casa + l.visitante
  return total === 0 ? null : { casa: l.casa / total, visitante: l.visitante / total }
}

// Tamanho do eixo da linha do tempo, em minutos: o tempo de jogo, ou até onde o jogo (ou algum registro) já foi.
export function duracaoEixo(estado: Estado, agora: number): number {
  const { timer, notas } = estado
  const previsto = Math.ceil((timer.duracaoSeg + timer.acrescimoSeg) / 60)
  const jogado = Math.ceil(decorridoMs(timer, agora) / 60_000)
  const ultimo = notas.reduce((m, n) => Math.max(m, n.minuto), 0)
  return Math.max(previsto, jogado, ultimo, 1)
}

// Eventos da linha do tempo (sem anotações gerais), do mais antigo para o mais recente.
export function eventosLinhaDoTempo(notas: Nota[]): (Nota & { lado: Lado })[] {
  return [...notas]
    .reverse()
    .filter((n): n is Nota & { lado: Lado } => n.lado !== null && n.tipo !== 'nota')
    .sort((a, b) => a.minuto - b.minuto)
}

export type Faixa = { inicio: number; fim: number; casa: number; visitante: number }

// Gols por faixa de tempo: de 5 em 5 minutos em jogos curtos, de 10 em 10 nos longos.
export function golsPorFaixa(notas: Nota[], eixoMin: number): Faixa[] {
  const passo = eixoMin <= 30 ? 5 : 10
  const faixas: Faixa[] = []
  for (let inicio = 0; inicio < eixoMin; inicio += passo) faixas.push({ inicio, fim: inicio + passo, casa: 0, visitante: 0 })
  for (const n of notas) {
    if (n.tipo !== 'gol' || !n.lado) continue
    // Gol no minuto 10 (de 1 a 10) entra na faixa 0–10: o minuto do jogo é "o minuto em andamento".
    const i = Math.min(faixas.length - 1, Math.max(0, Math.ceil(n.minuto / passo) - 1))
    faixas[i][n.lado]++
  }
  return faixas
}

export type Jogador = {
  nome: string
  lado: Lado
  gols: number
  amarelos: number
  vermelhos: number
  punicoes: number
}

// Junta "Zé", "zé " e "ZE" como a mesma pessoa (do mesmo time).
export function chaveJogador(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// Jogadores citados em gols, cartões e punições (quando o nome foi preenchido). Artilheiros primeiro.
// Trocas ficam de fora: o texto costuma ser "sai X, entra Y", não um jogador só.
export function porJogador(notas: Nota[]): Jogador[] {
  const mapa = new Map<string, Jogador>()
  for (const n of [...notas].reverse()) {
    if (!n.lado || n.tipo === 'nota' || n.tipo === 'troca' || !n.texto.trim()) continue
    const chave = `${n.lado}|${chaveJogador(n.texto)}`
    const j = mapa.get(chave) ?? { nome: n.texto.trim(), lado: n.lado, gols: 0, amarelos: 0, vermelhos: 0, punicoes: 0 }
    if (n.tipo === 'gol') j.gols++
    if (n.tipo === 'amarelo') j.amarelos++
    if (n.tipo === 'vermelho') j.vermelhos++
    if (n.tipo === 'punicao') j.punicoes++
    mapa.set(chave, j)
  }
  return [...mapa.values()].sort(
    (a, b) => b.gols - a.gols || b.vermelhos - a.vermelhos || b.amarelos - a.amarelos || a.nome.localeCompare(b.nome),
  )
}

// Fair play: amarelo vale 1, punição 2, vermelho 3. Menos pontos = time mais disciplinado.
export function pontosDisciplina(notas: Nota[], lado: Lado): number {
  return conta(notas, lado, 'amarelo') + conta(notas, lado, 'punicao') * 2 + conta(notas, lado, 'vermelho') * 3
}

export type Destaque = { titulo: string; valor: string; detalhe?: string }

export function destaques(estado: Estado, agora: number): Destaque[] {
  const { notas, placar, timer } = estado
  const nome = (lado: Lado) => placar[lado].nome || (lado === 'casa' ? 'Time A' : 'Time B')
  const gols = eventosLinhaDoTempo(notas).filter((n) => n.tipo === 'gol')
  const lista: Destaque[] = []

  if (gols.length > 0) {
    const primeiro = gols[0]
    lista.push({ titulo: 'Primeiro gol', valor: `${primeiro.minuto}'`, detalhe: [nome(primeiro.lado), primeiro.texto].filter(Boolean).join(' · ') })
    // Maior tempo sem gol: entre o início, cada gol e o minuto atual do jogo.
    const marcos = [0, ...gols.map((g) => g.minuto), Math.max(minutoDeJogo(timer, agora), gols.at(-1)!.minuto)]
    let maior = 0
    for (let i = 1; i < marcos.length; i++) maior = Math.max(maior, marcos[i] - marcos[i - 1])
    if (maior > 0) lista.push({ titulo: 'Maior tempo sem gol', valor: `${maior} min` })
  }

  const artilheiro = porJogador(notas).find((j) => j.gols > 0)
  if (artilheiro) {
    lista.push({ titulo: 'Artilheiro', valor: artilheiro.nome, detalhe: `${artilheiro.gols} gol${artilheiro.gols > 1 ? 's' : ''} · ${nome(artilheiro.lado)}` })
  }

  const pc = pontosDisciplina(notas, 'casa')
  const pv = pontosDisciplina(notas, 'visitante')
  if (pc + pv > 0) {
    const detalhe = `${nome('casa')} ${pc} pt · ${nome('visitante')} ${pv} pt`
    lista.push({ titulo: 'Fair play', valor: pc === pv ? 'Empate' : nome(pc < pv ? 'casa' : 'visitante'), detalhe })
  }
  return lista
}
