import type { Estado, Lado, Nota, TipoNota } from '@/estado'
import { TIPOS } from '@/tipos'
import { decorridoMs, formatar } from '@/tempo'
import {
  COR_TIME,
  comparativo,
  destaques,
  duracaoEixo,
  duracaoTempo,
  eventosLinhaDoTempo,
  minutoLinha,
  rotuloMinuto,
  golsPorFaixa,
  porJogador,
  proporcao,
} from './estatisticas'

type RGB = [number, number, number]

// Súmula do jogo em PDF, gerada no próprio aparelho (sem servidor).
// O jsPDF é carregado só quando alguém pede a súmula, para não pesar na abertura do app.

export const ROTULO_TIPO: Record<TipoNota, string> = {
  amarelo: 'Cartão amarelo',
  vermelho: 'Cartão vermelho',
  gol: 'Gol',
  troca: 'Substituição',
  punicao: 'Punição 2 min',
  nota: 'Anotação',
}

export type Contagem = Record<TipoNota, number>

const vazia = (): Contagem => ({ amarelo: 0, vermelho: 0, gol: 0, troca: 0, punicao: 0, nota: 0 })

export function contarNotas(notas: Nota[]): Contagem {
  const c = vazia()
  for (const n of notas) c[n.tipo]++
  return c
}

// Contagem separada por time; "geral" guarda anotações sem time.
export function contarPorTime(notas: Nota[]): Record<Lado | 'geral', Contagem> {
  const c = { casa: vazia(), visitante: vazia(), geral: vazia() }
  for (const n of notas) c[n.lado ?? 'geral'][n.tipo]++
  return c
}

// As fontes padrão do PDF só têm caracteres latinos: tira emojis e símbolos fora disso.
export function textoSeguro(texto: string): string {
  return texto
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function paraArquivo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function nomeDoArquivo(estado: Estado, data: Date): string {
  // Data local do aparelho (toISOString usaria UTC: 22h no Brasil já seria o dia seguinte).
  const dia = [data.getFullYear(), data.getMonth() + 1, data.getDate()].map((n) => String(n).padStart(2, '0')).join('-')
  const casa = paraArquivo(estado.placar.casa.nome) || 'time-a'
  const visitante = paraArquivo(estado.placar.visitante.nome) || 'time-b'
  return `sumula-${casa}-x-${visitante}-${dia}.pdf`
}

function senhaAleatoria(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function gerarSumulaPdf(estado: Estado, agora: number, data = new Date(agora)): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  // Protegido: quem abre pode ler, imprimir e copiar, mas não editar.
  // A senha do "dono" é aleatória e descartada, então ninguém tem permissão de edição.
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    encryption: { userPassword: '', ownerPassword: senhaAleatoria(), userPermissions: ['print', 'copy'] },
  })

  const { casa, visitante } = estado.placar
  const nomeCasa = textoSeguro(casa.nome) || 'Time A'
  const nomeVisitante = textoSeguro(visitante.nome) || 'Time B'
  const t = estado.timer
  const L = 18 // margem
  const largura = 210 - L * 2
  let y = 0

  doc.setProperties({
    title: `Súmula ${nomeCasa} x ${nomeVisitante}`,
    subject: 'Súmula do jogo',
    creator: 'Placar da Quebrada',
  })

  // Cabeçalho
  doc.setFillColor(255, 201, 40)
  doc.rect(0, 0, 210, 26, 'F')
  doc.setTextColor(20, 33, 61)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('PLACAR DA QUEBRADA', L, 13)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Súmula do jogo', L, 20)
  const quando = data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  doc.text(`Gerada em ${quando}`, 210 - L, 20, { align: 'right' })
  y = 42

  // Placar
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(nomeCasa, 105 - 30, y, { align: 'right', maxWidth: 62 })
  doc.text(nomeVisitante, 105 + 30, y, { maxWidth: 62 })
  doc.setFontSize(40)
  doc.text(`${casa.gols}  x  ${visitante.gols}`, 105, y + 4, { align: 'center' })
  y += 22

  // Tabela: faltas e tempo
  const linha = (rotulo: string, valor: string) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(rotulo, L, y)
    doc.setFont('helvetica', 'normal')
    doc.text(valor, L + 55, y)
    y += 7
  }
  doc.setDrawColor(20, 33, 61)
  doc.line(L, y - 5, L + largura, y - 5)
  linha('Faltas', `${nomeCasa}: ${casa.faltas}   |   ${nomeVisitante}: ${visitante.faltas}`)
  linha('Cronômetro', t.modo === 'regressivo' ? 'Regressivo' : 'Progressivo')
  const duracao = t.duracaoSeg > 0 ? formatar(t.duracaoSeg * 1000) : 'Sem limite'
  linha('Tempo de jogo', estado.tempos === 2 ? `2 tempos de ${duracao}` : duracao)
  if (estado.tempos === 2) {
    linha('Andamento', estado.periodo === 2 ? `2º tempo (1º tempo durou ${estado.fimPrimeiroTempoMin ?? '-'} min)` : '1º tempo')
  }
  linha('Acréscimo', t.acrescimoSeg > 0 ? formatar(t.acrescimoSeg * 1000) : 'Nenhum')
  linha(estado.tempos === 2 ? `Tempo jogado (${estado.periodo}º)` : 'Tempo jogado', formatar(decorridoMs(t, agora)))

  // Estatísticas: mesmas da tela (destaques, comparativo, linha do tempo, gols por faixa, jogadores)
  const nomes = { casa: nomeCasa, visitante: nomeVisitante }
  const COR = COR_TIME.pdf
  const TINTA: RGB = [20, 33, 61]
  const SUAVE: RGB = [110, 120, 140]
  const LINHA: RGB = [215, 220, 228]
  const espaco = (altura: number) => {
    if (y + altura > 280) {
      doc.addPage()
      y = 20
    }
  }
  const titulo = (texto: string) => {
    espaco(16)
    doc.setDrawColor(...LINHA)
    doc.line(L, y - 5, L + largura, y - 5)
    doc.setTextColor(...TINTA)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(texto, L, y + 1)
    y += 9
  }

  // Legenda dos times (vale para todos os gráficos)
  y += 2
  doc.setFontSize(10)
  let lx = L
  for (const lado of ['casa', 'visitante'] as const) {
    doc.setFillColor(...COR[lado])
    doc.circle(lx + 1.6, y - 1.2, 1.6, 'F')
    doc.setTextColor(...TINTA)
    doc.setFont('helvetica', 'bold')
    doc.text(nomes[lado], lx + 5, y)
    lx += doc.getTextWidth(nomes[lado]) + 14
  }
  y += 10

  // Destaques: até 4 quadros lado a lado
  const lista = destaques(estado, agora)
  if (lista.length > 0) {
    titulo('Destaques')
    const w = (largura - 3 * 4) / 4
    // 4 quadros por linha
    lista.forEach((d, i) => {
      if (i > 0 && i % 4 === 0) y += 24
      const x = L + (i % 4) * (w + 4)
      doc.setFillColor(243, 245, 248)
      doc.roundedRect(x, y - 4, w, 20, 2, 2, 'F')
      doc.setTextColor(...SUAVE)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(textoSeguro(d.titulo), x + 3, y)
      doc.setTextColor(...TINTA)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text(textoSeguro(d.valor), x + 3, y + 7, { maxWidth: w - 6 })
      if (d.detalhe) {
        doc.setTextColor(...SUAVE)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.text(doc.splitTextToSize(textoSeguro(d.detalhe), w - 6)[0] as string, x + 3, y + 12.5)
      }
    })
    y += 26
  }

  // Estatísticas da partida: número nas pontas e barra dividida na proporção
  titulo('Estatísticas da partida')
  for (const l of comparativo(estado)) {
    espaco(12)
    doc.setTextColor(...TINTA)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(String(l.casa), L, y)
    doc.text(String(l.visitante), L + largura, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...SUAVE)
    doc.text(l.rotulo, 105, y - 1, { align: 'center' })
    const bx = L + 14
    const bw = largura - 28
    const p = proporcao(l)
    if (!p) {
      doc.setFillColor(...LINHA)
      doc.roundedRect(bx, y + 1, bw, 1.8, 0.9, 0.9, 'F')
    } else {
      const gap = p.casa > 0 && p.visitante > 0 ? 0.8 : 0
      const wc = (bw - gap) * p.casa
      if (p.casa > 0) {
        doc.setFillColor(...COR.casa)
        doc.roundedRect(bx, y + 1, wc, 1.8, 0.9, 0.9, 'F')
      }
      if (p.visitante > 0) {
        doc.setFillColor(...COR.visitante)
        doc.roundedRect(bx + wc + gap, y + 1, bw - wc - gap, 1.8, 0.9, 0.9, 'F')
      }
    }
    y += 10
  }
  y += 2

  // Linha do tempo: um time em cima, o outro embaixo
  const eventos = eventosLinhaDoTempo(estado.notas)
  if (eventos.length > 0) {
    // título e gráfico sempre na mesma página
    espaco(62)
    titulo('Linha do tempo')
    const eixo = duracaoEixo(estado, agora)
    const passo = eixo <= 30 ? 5 : 10
    const x0 = L + 4
    const x1 = L + largura - 4
    const px = (min: number) => x0 + (Math.min(min, eixo) / eixo) * (x1 - x0)
    const ey = y + 16
    doc.setDrawColor(...LINHA)
    doc.setLineWidth(0.2)
    doc.setFontSize(8)
    doc.setTextColor(...SUAVE)
    // No 2º tempo o eixo segue depois do 1º, e os minutos recomeçam do zero.
    const dois = estado.periodo === 2
    const fimPrimeiro = duracaoTempo(estado, agora, 1)
    const tick = (pos: number, rotulo: string) => {
      doc.line(px(pos), y, px(pos), y + 32)
      doc.text(rotulo, px(pos), y + 36, { align: 'center' })
    }
    for (let m = 0; m <= (dois ? fimPrimeiro - 1 : eixo); m += passo) tick(m, `${m}'`)
    if (dois) {
      for (let m = passo; fimPrimeiro + m <= eixo; m += passo) tick(fimPrimeiro + m, `${m}'`)
      doc.setDrawColor(...SUAVE)
      doc.setLineWidth(0.4)
      doc.line(px(fimPrimeiro), y - 3, px(fimPrimeiro), y + 33)
      doc.setFont('helvetica', 'bold')
      doc.text('1º tempo', px(fimPrimeiro) - 1.5, y - 0.5, { align: 'right' })
      doc.text('2º tempo', px(fimPrimeiro) + 1.5, y - 0.5)
      doc.setFont('helvetica', 'normal')
    }
    doc.setDrawColor(...SUAVE)
    doc.setLineWidth(0.6)
    doc.line(x0, ey, x1, ey)
    const colocados: Record<Lado, number[]> = { casa: [], visitante: [] }
    for (const n of eventos) {
      const cx = px(minutoLinha(n, estado, agora))
      const nivel = Math.min(2, colocados[n.lado].filter((o) => Math.abs(o - cx) < 4).length)
      colocados[n.lado].push(cx)
      const d = 6 + nivel * 4.5
      const cy = n.lado === 'casa' ? ey - d : ey + d
      doc.setDrawColor(...COR[n.lado])
      doc.setLineWidth(0.6)
      doc.line(cx, ey, cx, cy)
      doc.setFillColor(...TIPOS[n.tipo].rgb)
      doc.setDrawColor(255, 255, 255)
      if (n.tipo === 'amarelo' || n.tipo === 'vermelho') doc.roundedRect(cx - 1.4, cy - 2, 2.8, 4, 0.5, 0.5, 'FD')
      else doc.circle(cx, cy, 1.9, 'FD')
    }
    doc.setLineWidth(0.2)
    y += 42
    // legenda dos tipos
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    let tx = L
    for (const lado of ['casa', 'visitante'] as const) {
      const rotulo = `${nomes[lado]} ${lado === 'casa' ? 'em cima' : 'embaixo'}`
      doc.setFillColor(...COR[lado])
      doc.rect(tx, y - 1.8, 3, 0.9, 'F')
      doc.setTextColor(...TINTA)
      doc.text(rotulo, tx + 4.5, y)
      tx += doc.getTextWidth(rotulo) + 9
    }
    // tipos numa segunda linha, quebrando se não couber na largura
    tx = L
    y += 5.5
    for (const t of [...new Set(eventos.map((e) => e.tipo))]) {
      if (tx + doc.getTextWidth(ROTULO_TIPO[t]) + 4 > L + largura) {
        tx = L
        y += 5.5
      }
      doc.setFillColor(...TIPOS[t].rgb)
      if (t === 'amarelo' || t === 'vermelho') doc.rect(tx, y - 3, 2.2, 3.2, 'F')
      else doc.circle(tx + 1.1, y - 1.3, 1.3, 'F')
      doc.setTextColor(...TINTA)
      doc.text(ROTULO_TIPO[t], tx + 4, y)
      tx += doc.getTextWidth(ROTULO_TIPO[t]) + 10
    }
    y += 10
  }

  // Gols por faixa de tempo
  const faixas = golsPorFaixa(estado, agora)
  const faixasEmDoisTempos = faixas.some((f) => f.periodo === 2)
  const maior = Math.max(0, ...faixas.flatMap((f) => [f.casa, f.visitante]))
  if (maior > 0) {
    espaco(52)
    titulo('Gols por tempo de jogo')
    const alturaMax = 20
    const base = y + alturaMax + 4
    const slot = largura / faixas.length
    const bw = Math.min(5, slot / 3)
    doc.setDrawColor(...LINHA)
    doc.line(L, base, L + largura, base)
    faixas.forEach((f, i) => {
      const cx = L + slot * i + slot / 2
      ;(['casa', 'visitante'] as const).forEach((lado, j) => {
        const v = f[lado]
        const bx = j === 0 ? cx - bw - 0.4 : cx + 0.4
        if (v > 0) {
          const h = (v / maior) * alturaMax
          doc.setFillColor(...COR[lado])
          doc.rect(bx, base - h, bw, h, 'F')
          doc.setTextColor(...TINTA)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8)
          doc.text(String(v), bx + bw / 2, base - h - 1.2, { align: 'center' })
        }
      })
      doc.setTextColor(...SUAVE)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(`${f.inicio}-${f.fim}'`, cx, base + 4.5, { align: 'center' })
      // início do 2º tempo: linha divisória e nome de cada tempo
      if (faixasEmDoisTempos && (i === 0 || f.periodo !== faixas[i - 1].periodo)) {
        const qtd = faixas.filter((o) => o.periodo === f.periodo).length
        doc.setFont('helvetica', 'bold')
        doc.text(`${f.periodo}º tempo`, L + slot * i + (slot * qtd) / 2, base + 9.5, { align: 'center' })
        if (i > 0) {
          doc.setDrawColor(...SUAVE)
          doc.line(L + slot * i, base - alturaMax - 4, L + slot * i, base)
        }
      }
    })
    y = base + (faixasEmDoisTempos ? 18 : 14)
  }

  // Jogadores (gols, cartões e punições por nome)
  const jogadores = porJogador(estado.notas)
  if (jogadores.length > 0) {
    espaco(30)
    titulo('Jogadores')
    doc.setFontSize(9)
    doc.setTextColor(...SUAVE)
    doc.setFont('helvetica', 'bold')
    doc.text('Jogador', L, y)
    doc.text('Time', L + 56, y)
    doc.text('Gols', L + 104, y, { align: 'center' })
    doc.text('Amarelos', L + 124, y, { align: 'center' })
    doc.text('Vermelhos', L + 146, y, { align: 'center' })
    doc.text('Punições', L + 166, y, { align: 'center' })
    y += 6
    doc.setFontSize(10)
    for (const j of jogadores) {
      espaco(7)
      doc.setFillColor(...COR[j.lado])
      doc.circle(L + 1.2, y - 1.2, 1.2, 'F')
      doc.setTextColor(...TINTA)
      doc.setFont('helvetica', 'bold')
      doc.text(doc.splitTextToSize(textoSeguro(j.nome), 48)[0] as string, L + 4, y)
      doc.setFont('helvetica', 'normal')
      doc.text(doc.splitTextToSize(nomes[j.lado], 40)[0] as string, L + 56, y)
      const num = (v: number, x: number) => doc.text(v ? String(v) : '-', x, y, { align: 'center' })
      num(j.gols, L + 104)
      num(j.amarelos, L + 124)
      num(j.vermelhos, L + 146)
      num(j.punicoes, L + 166)
      y += 6.5
    }
    y += 6
  }

  doc.setTextColor(...TINTA)
  espaco(20)
  // Lista de anotações, em ordem cronológica
  doc.line(L, y - 5, L + largura, y - 5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(`Anotações (${estado.notas.length})`, L, y + 1)
  y += 9
  doc.setFontSize(11)
  if (estado.notas.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.text('Nenhuma anotação.', L, y)
  }
  const cronologica = [...estado.notas].reverse()
  for (const n of cronologica) {
    const descricao = textoSeguro(n.texto)
    const time = n.lado ? (n.lado === 'casa' ? nomeCasa : nomeVisitante) : 'Geral'
    const linhas = doc.splitTextToSize(descricao || '-', largura - 98) as string[]
    const altura = Math.max(1, linhas.length) * 5.5 + 2
    if (y + altura > 280) {
      doc.addPage()
      y = 20
    }
    doc.setFillColor(...TIPOS[n.tipo].rgb)
    doc.rect(L, y - 3.8, 3, 4.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text(rotuloMinuto(n, estado), L + 6, y)
    doc.text(ROTULO_TIPO[n.tipo], L + (estado.tempos === 2 ? 22 : 18), y)
    doc.setFont('helvetica', 'normal')
    doc.text(time, L + 60, y, { maxWidth: 36 })
    doc.text(linhas, L + 98, y)
    y += altura
  }

  // Rodapé em todas as páginas
  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(74, 86, 114)
    doc.text('Gerado pelo Placar da Quebrada - placardaquebrada.pages.dev - documento protegido contra edição', L, 290)
    doc.text(`${p}/${paginas}`, 210 - L, 290, { align: 'right' })
  }

  return doc.output('blob')
}

// Abre o menu de compartilhar do celular (WhatsApp, e-mail…); se não existir, baixa o arquivo.
export async function compartilharOuBaixar(pdf: Blob, nome: string, titulo: string): Promise<'compartilhado' | 'baixado' | 'cancelado'> {
  const arquivo = new File([pdf], nome, { type: 'application/pdf' })
  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: titulo })
      return 'compartilhado'
    } catch (erro) {
      if (erro instanceof DOMException && erro.name === 'AbortError') return 'cancelado'
      // outro erro (ex.: permissão): cai no download
    }
  }
  const url = URL.createObjectURL(pdf)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'baixado'
}
