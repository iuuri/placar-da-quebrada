import { ESTADO_INICIAL, type Estado } from '@/estado'
import { contarNotas, contarPorTime, gerarSumulaPdf, nomeDoArquivo, textoSeguro } from './sumula'

const jogo: Estado = {
  ...ESTADO_INICIAL,
  placar: {
    casa: { nome: 'Unidos da Vila', gols: 3, faltas: 5 },
    visitante: { nome: 'São Jorge FC', gols: 2, faltas: 7 },
  },
  notas: [
    { id: '3', tipo: 'vermelho', minuto: 40, texto: 'Tião 🔥 (São Jorge)', lado: 'visitante' },
    { id: '2', tipo: 'amarelo', minuto: 20, texto: 'Zé', lado: 'casa' },
    { id: '1', tipo: 'amarelo', minuto: 12, texto: '', lado: 'visitante' },
  ],
}

describe('súmula', () => {
  it('conta as anotações por tipo', () => {
    expect(contarNotas(jogo.notas)).toEqual({ amarelo: 2, vermelho: 1, gol: 0, troca: 0, punicao: 0, nota: 0 })
    const porTime = contarPorTime(jogo.notas)
    expect(porTime.casa.amarelo).toBe(1)
    expect(porTime.visitante).toMatchObject({ amarelo: 1, vermelho: 1 })
  })

  it('tira emojis mas mantém acentos', () => {
    expect(textoSeguro('Tião 🔥 (São Jorge) — ok')).toBe('Tião (São Jorge) - ok')
  })

  it('monta um nome de arquivo sem acentos nem espaços', () => {
    // 23h30 no horário local: continua sendo dia 24
    expect(nomeDoArquivo(jogo, new Date(2026, 8, 24, 23, 30))).toBe('sumula-unidos-da-vila-x-sao-jorge-fc-2026-09-24.pdf')
  })

  it('gera um PDF protegido contra edição', async () => {
    const pdf = await gerarSumulaPdf(jogo, Date.now())
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      const leitor = new FileReader()
      leitor.onload = () => resolve(new Uint8Array(leitor.result as ArrayBuffer))
      leitor.onerror = reject
      leitor.readAsArrayBuffer(pdf)
    })
    const inicio = new TextDecoder('latin1').decode(bytes.slice(0, 5))
    const tudo = new TextDecoder('latin1').decode(bytes)
    expect(inicio).toBe('%PDF-')
    expect(tudo).toContain('/Encrypt')
    expect(pdf.size).toBeGreaterThan(1000)
  })
})
