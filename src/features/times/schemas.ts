import { z } from 'zod'

const PALAVRAS_IGNORADAS = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'fc', 'ec', 'sc'])

function semAcento(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// "Unidos da Vila" -> "UV"; "Palmeirinha" -> "PAL"; "Vila Nova FC" -> "VN". A pessoa pode editar.
export function gerarSigla(nome: string): string {
  const palavras = semAcento(nome)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const relevantes = palavras.filter((p) => !PALAVRAS_IGNORADAS.has(p.toLowerCase()))
  const base = relevantes.length > 0 ? relevantes : palavras
  if (base.length === 0) return ''
  if (base.length === 1) return base[0].slice(0, 3)
  return base
    .map((p) => p[0])
    .join('')
    .slice(0, 4)
}

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres.`)
    .transform((v) => (v === '' ? null : v))

const urlOpcional = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .refine((v) => v === null || /^https:\/\/\S+$/.test(v), 'Use um link que comece com https://')

export const timeSchema = z.object({
  nome: z.string().trim().min(2, 'O nome precisa ter pelo menos 2 letras.').max(60, 'Máximo de 60 caracteres.'),
  sigla: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,4}$/, 'Use de 2 a 4 letras ou números, sem espaço (ex.: UDV).'),
  cor_primaria: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Escolha uma cor.'),
  escudo_url: urlOpcional,
  responsavel: textoOpcional(80),
  contato: textoOpcional(40),
})

export type TimeFormInput = z.input<typeof timeSchema>
export type TimeFormValues = z.output<typeof timeSchema>

export const jogadorSchema = z.object({
  nome: z.string().trim().min(2, 'O nome precisa ter pelo menos 2 letras.').max(80, 'Máximo de 80 caracteres.'),
  apelido: textoOpcional(40),
  numero: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{1,2}$/.test(v), 'Use um número de 0 a 99.')
    .transform((v) => (v === '' ? null : Number(v))),
  posicao: textoOpcional(30),
})

export type JogadorFormInput = z.input<typeof jogadorSchema>
export type JogadorFormValues = z.output<typeof jogadorSchema>

export const POSICOES = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'] as const
