import type { Estado, Nota, TipoNota } from '@/estado'
import { decorridoMs, formatar } from '@/tempo'

// Súmula do jogo em PDF, gerada no próprio aparelho (sem servidor).
// O jsPDF é carregado só quando alguém pede a súmula, para não pesar na abertura do app.

export const ROTULO_TIPO: Record<TipoNota, string> = {
  amarelo: 'Cartão amarelo',
  vermelho: 'Cartão vermelho',
  gol: 'Gol',
  troca: 'Substituição',
  nota: 'Anotação',
}

const COR_TIPO: Record<TipoNota, [number, number, number]> = {
  amarelo: [255, 201, 40],
  vermelho: [214, 40, 57],
  gol: [31, 122, 58],
  troca: [74, 86, 114],
  nota: [201, 206, 214],
}

const ROTULO_RESUMO: Record<TipoNota, string> = {
  amarelo: 'Cartões amarelos',
  vermelho: 'Cartões vermelhos',
  gol: 'Gols',
  troca: 'Substituições',
  nota: 'Outras anotações',
}

export type Contagem = Record<TipoNota, number>

export function contarNotas(notas: Nota[]): Contagem {
  const c: Contagem = { amarelo: 0, vermelho: 0, gol: 0, troca: 0, nota: 0 }
  for (const n of notas) c[n.tipo]++
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
  linha('Tempo de jogo', t.duracaoSeg > 0 ? formatar(t.duracaoSeg * 1000) : 'Sem limite')
  linha('Acréscimo', t.acrescimoSeg > 0 ? formatar(t.acrescimoSeg * 1000) : 'Nenhum')
  linha('Tempo jogado', formatar(decorridoMs(t, agora)))

  // Resumo das anotações
  const c = contarNotas(estado.notas)
  y += 3
  doc.line(L, y - 5, L + largura, y - 5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Resumo', L, y + 1)
  y += 8
  const tipos: TipoNota[] = ['amarelo', 'vermelho', 'gol', 'troca', 'nota']
  const colunas = [L, L + 60, L + 120]
  tipos.forEach((tipo, i) => {
    const x = colunas[i % 3]
    const yy = y + Math.floor(i / 3) * 7
    doc.setFillColor(...COR_TIPO[tipo])
    doc.rect(x, yy - 3.5, 4, 4, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`${ROTULO_RESUMO[tipo]}: ${c[tipo]}`, x + 6, yy)
  })
  y += 18

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
    const linhas = doc.splitTextToSize(descricao || '-', largura - 60) as string[]
    const altura = Math.max(1, linhas.length) * 5.5 + 2
    if (y + altura > 280) {
      doc.addPage()
      y = 20
    }
    doc.setFillColor(...COR_TIPO[n.tipo])
    doc.rect(L, y - 3.8, 3, 4.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text(`${n.minuto}'`, L + 6, y)
    doc.text(ROTULO_TIPO[n.tipo], L + 18, y)
    doc.setFont('helvetica', 'normal')
    doc.text(linhas, L + 60, y)
    y += altura
  }

  // Rodapé em todas as páginas
  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(74, 86, 114)
    doc.text('Gerado pelo Placar da Quebrada - placar-da-quebrada.pages.dev - documento protegido contra edição', L, 290)
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
