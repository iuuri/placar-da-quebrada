import { ESTADO_INICIAL, type Estado, type Nota } from '@/estado'
import { comparativo, destaques, duracaoEixo, eventosLinhaDoTempo, golsPorFaixa, porJogador, proporcao } from './estatisticas'

// Notas ficam da mais recente para a mais antiga, como no app.
function jogo(notas: Omit<Nota, 'id'>[], extra: Partial<Estado> = {}): Estado {
  return {
    ...ESTADO_INICIAL,
    placar: { casa: { nome: 'Unidos', gols: 2, faltas: 4 }, visitante: { nome: 'São Jorge', gols: 1, faltas: 1 } },
    notas: notas.map((n, i) => ({ ...n, id: String(i) })).reverse(),
    ...extra,
  }
}

const notas: Omit<Nota, 'id'>[] = [
  { tipo: 'gol', minuto: 3, texto: 'Zé', lado: 'casa' },
  { tipo: 'amarelo', minuto: 8, texto: 'Tião', lado: 'visitante' },
  { tipo: 'gol', minuto: 12, texto: 'Beto', lado: 'visitante' },
  { tipo: 'nota', minuto: 13, texto: 'chuva', lado: null },
  { tipo: 'troca', minuto: 14, texto: 'sai Léo, entra Nando', lado: 'casa' },
  { tipo: 'vermelho', minuto: 15, texto: 'tiao ', lado: 'visitante' },
  { tipo: 'gol', minuto: 22, texto: 'zé', lado: 'casa' },
]

describe('estatísticas da súmula', () => {
  it('compara os dois times, com a proporção de cada um', () => {
    const linhas = comparativo(jogo(notas))
    expect(linhas.slice(0, 4)).toEqual([
      { rotulo: 'Gols', casa: 2, visitante: 1 },
      { rotulo: 'Faltas', casa: 4, visitante: 1 },
      { rotulo: 'Cartões amarelos', casa: 0, visitante: 1 },
      { rotulo: 'Cartões vermelhos', casa: 0, visitante: 1 },
    ])
    expect(proporcao(linhas[1])).toEqual({ casa: 0.8, visitante: 0.2 })
    expect(proporcao(linhas[4])).toBeNull()
  })

  it('linha do tempo em ordem, sem anotações gerais; eixo cobre o tempo de jogo', () => {
    const e = jogo(notas)
    expect(eventosLinhaDoTempo(e.notas).map((n) => n.minuto)).toEqual([3, 8, 12, 14, 15, 22])
    expect(duracaoEixo(e, 0)).toBe(25)
    expect(duracaoEixo({ ...e, timer: { ...e.timer, duracaoSeg: 600 } }, 0)).toBe(22)
  })

  it('gols por faixa de 5 minutos em jogo curto', () => {
    const faixas = golsPorFaixa(jogo(notas).notas, 25)
    expect(faixas.map((f) => `${f.inicio}-${f.fim}:${f.casa}/${f.visitante}`)).toEqual([
      '0-5:1/0',
      '5-10:0/0',
      '10-15:0/1',
      '15-20:0/0',
      '20-25:1/0',
    ])
    expect(golsPorFaixa([], 50)).toHaveLength(5) // de 10 em 10
  })

  it('agrupa o mesmo jogador escrito de jeitos diferentes; artilheiro primeiro; trocas ficam de fora', () => {
    const jogadores = porJogador(jogo(notas).notas)
    expect(jogadores.map((j) => [j.nome, j.lado, j.gols, j.amarelos, j.vermelhos])).toEqual([
      ['Zé', 'casa', 2, 0, 0],
      ['Beto', 'visitante', 1, 0, 0],
      ['Tião', 'visitante', 0, 1, 1],
    ])
  })

  it('destaques: primeiro gol, maior tempo sem gol, artilheiro e fair play', () => {
    expect(destaques(jogo(notas), 0)).toEqual([
      { titulo: 'Primeiro gol', valor: "3'", detalhe: 'Unidos · Zé' },
      { titulo: 'Maior tempo sem gol', valor: '10 min' },
      { titulo: 'Artilheiro', valor: 'Zé', detalhe: '2 gols · Unidos' },
      { titulo: 'Fair play', valor: 'Unidos', detalhe: 'Unidos 0 pt · São Jorge 4 pt' },
    ])
    expect(destaques(jogo([]), 0)).toEqual([])
  })
})
