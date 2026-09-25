import { z } from 'zod'

const senha = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(72, 'Máximo de 72 caracteres.')

export const novoUsuarioSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome.').max(80, 'Máximo de 80 caracteres.'),
  email: z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.')),
  senha,
  role: z.enum(['operador', 'admin']),
})

export const trocarSenhaSchema = z.object({ senha })

export type NovoUsuarioInput = z.input<typeof novoUsuarioSchema>
export type NovoUsuarioValues = z.output<typeof novoUsuarioSchema>
export type TrocarSenhaValues = z.output<typeof trocarSenhaSchema>

// Senha provisória fácil de ditar por telefone: 3 palavras curtas + 2 números.
const PALAVRAS = ['bola', 'gol', 'rede', 'trave', 'campo', 'chute', 'placa', 'juiz', 'drible', 'passe', 'meta', 'lance']
export function gerarSenhaProvisoria(aleatorio: () => number = Math.random): string {
  const p = () => PALAVRAS[Math.floor(aleatorio() * PALAVRAS.length)]
  const n = String(Math.floor(aleatorio() * 90) + 10)
  return `${p()}-${p()}-${p()}-${n}`
}
