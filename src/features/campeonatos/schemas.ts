import { z } from 'zod'

// "Copa da Vila 2026!" -> "copa-da-vila-2026" (mesma regra do check no banco).
export function gerarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
}

const inteiro = (min: number, max: number, rotulo: string) =>
  z.coerce
    .number({ error: `Informe ${rotulo}.` })
    .int(`${rotulo[0].toUpperCase()}${rotulo.slice(1)} precisa ser um número inteiro.`)
    .min(min, `Mínimo ${min}.`)
    .max(max, `Máximo ${max}.`)

export const campeonatoSchema = z.object({
  nome: z.string().trim().min(2, 'O nome precisa ter pelo menos 2 letras.').max(80, 'Máximo de 80 caracteres.'),
  slug: z
    .string()
    .trim()
    .min(1, 'Informe o endereço.')
    .max(60, 'Máximo de 60 caracteres.')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use só letras minúsculas, números e hífens (ex.: copa-da-vila-2026).'),
  temporada: z.string().trim().min(1, 'Informe a temporada.').max(20, 'Máximo de 20 caracteres.'),
  modalidade: z.enum(['campo', 'society', 'futsal']),
  local_padrao: z
    .string()
    .trim()
    .max(120, 'Máximo de 120 caracteres.')
    .transform((v) => (v === '' ? null : v)),
  status: z.enum(['rascunho', 'inscricoes', 'em_andamento', 'finalizado']),
  publico: z.boolean(),
  pontos_vitoria: inteiro(0, 10, 'os pontos por vitória'),
  pontos_empate: inteiro(0, 10, 'os pontos por empate'),
  pontos_derrota: inteiro(0, 10, 'os pontos por derrota'),
  qtd_periodos: inteiro(1, 4, 'a quantidade de tempos'),
  minutos_periodo: inteiro(1, 90, 'os minutos por tempo'),
})

export type CampeonatoFormInput = z.input<typeof campeonatoSchema>
export type CampeonatoFormValues = z.output<typeof campeonatoSchema>

export const MODALIDADES = [
  { valor: 'society', rotulo: 'Society' },
  { valor: 'campo', rotulo: 'Campo' },
  { valor: 'futsal', rotulo: 'Futsal' },
] as const

export const STATUS_CAMPEONATO = [
  { valor: 'rascunho', rotulo: 'Rascunho' },
  { valor: 'inscricoes', rotulo: 'Inscrições abertas' },
  { valor: 'em_andamento', rotulo: 'Em andamento' },
  { valor: 'finalizado', rotulo: 'Finalizado' },
] as const

export function rotuloStatus(valor: string) {
  return STATUS_CAMPEONATO.find((s) => s.valor === valor)?.rotulo ?? valor
}

export function rotuloModalidade(valor: string) {
  return MODALIDADES.find((m) => m.valor === valor)?.rotulo ?? valor
}
