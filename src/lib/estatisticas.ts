import type { Estado, Lado, Nota, Periodo, TipoNota } from '@/estado'
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

export const periodoDe = (n: Nota): Periodo => n.periodo ?? 1

// Quantos minutos cada tempo ocupa no eixo dos gráficos. O 1º tempo, depois de encerrado, usa o quanto durou;
// o tempo em andamento usa o previsto (com acréscimo), ou até onde o jogo (ou algum registro) já foi.
export function duracaoTempo(estado: Estado, agora: number, periodo: Periodo): number {
  const { timer, notas } = estado
  if (periodo === 1 && estado.periodo === 2) return estado.fimPrimeiroTempoMin ?? Math.max(1, Math.ceil(timer.duracaoSeg / 60))
  const emAndamento = estado.periodo === periodo
  const previsto = Math.ceil((timer.duracaoSeg + (emAndamento ? timer.acrescimoSeg : 0)) / 60)
  const jogado = emAndamento ? Math.ceil(decorridoMs(timer, agora) / 60_000) : 0
  const ultimo = notas.filter((n) => periodoDe(n) === periodo).reduce((m, n) => Math.max(m, n.minuto), 0)
  return Math.max(previsto, jogado, ultimo, 1)
}

// Tamanho do eixo da linha do tempo, em minutos (os dois tempos em sequência).
export function duracaoEixo(estado: Estado, agora: number): number {
  const primeiro = duracaoTempo(estado, agora, 1)
  return estado.periodo === 2 ? primeiro + duracaoTempo(estado, agora, 2) : primeiro
}

// Minuto do registro no eixo: o 2º tempo começa onde o 1º terminou.
export function minutoLinha(n: Nota, estado: Estado, agora: number): number {
  return periodoDe(n) === 2 ? duracaoTempo(estado, agora, 1) + n.minuto : n.minuto
}

// Eventos da linha do tempo (sem anotações gerais), do mais antigo para o mais recente.
export function eventosLinhaDoTempo(notas: Nota[]): (Nota & { lado: Lado })[] {
  return [...notas]
    .reverse()
    .filter((n): n is Nota & { lado: Lado } => n.lado !== null && n.tipo !== 'nota')
    .sort((a, b) => periodoDe(a) - periodoDe(b) || a.minuto - b.minuto)
}

export type Faixa = { periodo: Periodo; inicio: number; fim: number; casa: number; visitante: number }

// Gols por faixa de tempo, em cada tempo do jogo: de 5 em 5 minutos em tempos curtos, de 10 em 10 nos longos.
export function golsPorFaixa(estado: Estado, agora: number): Faixa[] {
  const periodos: Periodo[] = estado.periodo === 2 ? [1, 2] : [1]
  return periodos.flatMap((periodo) => {
    const eixo = duracaoTempo(estado, agora, periodo)
    const passo = eixo <= 30 ? 5 : 10
    const faixas: Faixa[] = []
    for (let inicio = 0; inicio < eixo; inicio += passo) faixas.push({ periodo, inicio, fim: inicio + passo, casa: 0, visitante: 0 })
    for (const n of estado.notas) {
      if (n.tipo !== 'gol' || !n.lado || periodoDe(n) !== periodo) continue
      // Gol no minuto 10 (de 1 a 10) entra na faixa 0–10: o minuto do jogo é "o minuto em andamento".
      const i = Math.min(faixas.length - 1, Math.max(0, Math.ceil(n.minuto / passo) - 1))
      faixas[i][n.lado]++
    }
    return faixas
  })
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

  // Placar do intervalo, quando o jogo já está no 2º tempo.
  if (estado.tempos === 2 && estado.periodo === 2) {
    const noPrimeiro = (lado: Lado) => gols.filter((g) => g.lado === lado && periodoDe(g) === 1).length
    lista.push({ titulo: 'Placar do 1º tempo', valor: `${noPrimeiro('casa')} × ${noPrimeiro('visitante')}`, detalhe: `${nome('casa')} × ${nome('visitante')}` })
  }

  if (gols.length > 0) {
    const primeiro = gols[0]
    const minuto = rotuloMinuto(primeiro, estado)
    lista.push({ titulo: 'Primeiro gol', valor: minuto, detalhe: [nome(primeiro.lado), primeiro.texto].filter(Boolean).join(' · ') })
    // Maior tempo sem gol: entre o início, cada gol e o minuto atual do jogo (os dois tempos em sequência).
    const linha = (n: Nota) => minutoLinha(n, estado, agora)
    const atual = (estado.periodo === 2 ? duracaoTempo(estado, agora, 1) : 0) + minutoDeJogo(timer, agora)
    const marcos = [0, ...gols.map(linha), Math.max(atual, linha(gols.at(-1)!))]
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

// Minuto como aparece para quem lê: em jogo de 2 tempos, diz de qual tempo ("12' 2ºT").
export function rotuloMinuto(n: Nota, estado: Pick<Estado, 'tempos'>): string {
  return estado.tempos === 2 ? `${n.minuto}' ${periodoDe(n)}ºT` : `${n.minuto}'`
}
