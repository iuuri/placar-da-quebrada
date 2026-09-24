import { mensagemErroBanco } from '@/lib/erros'
import { campeonatoSchema, gerarSlug } from './schemas'

describe('gerarSlug', () => {
  it('tira acentos, espaços e símbolos', () => {
    expect(gerarSlug('Copa da Várzea São João 2026!')).toBe('copa-da-varzea-sao-joao-2026')
  })

  it('não deixa hífen no começo ou no fim', () => {
    expect(gerarSlug('  --Taça  ')).toBe('taca')
  })

  it('limita a 60 caracteres sem terminar em hífen', () => {
    const slug = gerarSlug('a'.repeat(59) + ' b')
    expect(slug.length).toBeLessThanOrEqual(60)
    expect(slug.endsWith('-')).toBe(false)
  })
})

const valido = {
  nome: 'Copa da Vila',
  slug: 'copa-da-vila',
  temporada: '2026',
  modalidade: 'society',
  local_padrao: '',
  status: 'rascunho',
  publico: false,
  pontos_vitoria: '3',
  pontos_empate: '1',
  pontos_derrota: '0',
  qtd_periodos: '2',
  minutos_periodo: '25',
}

describe('campeonatoSchema', () => {
  it('aceita um campeonato válido e converte números e local vazio', () => {
    const r = campeonatoSchema.parse(valido)
    expect(r.pontos_vitoria).toBe(3)
    expect(r.local_padrao).toBeNull()
  })

  it('recusa endereço com maiúsculas ou espaços', () => {
    expect(campeonatoSchema.safeParse({ ...valido, slug: 'Copa Vila' }).success).toBe(false)
  })

  it('recusa minutos por tempo fora do limite', () => {
    const r = campeonatoSchema.safeParse({ ...valido, minutos_periodo: '120' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toEqual(['minutos_periodo'])
  })
})

describe('mensagemErroBanco', () => {
  it('usa a mensagem específica da constraint única', () => {
    const erro = { code: '23505', message: 'duplicate key value violates unique constraint "campeonatos_slug_key"' }
    expect(mensagemErroBanco(erro, { campeonatos_slug_key: 'Endereço em uso.' })).toBe('Endereço em uso.')
  })

  it('traduz falta de permissão', () => {
    expect(mensagemErroBanco({ code: '42501' })).toMatch(/permissão/)
  })
})
