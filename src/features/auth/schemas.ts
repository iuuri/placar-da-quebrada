import { z } from 'zod'

// trim antes de validar: teclado de celular costuma deixar espaço no fim
const email = z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.'))

export const loginSchema = z.object({
  email,
  senha: z.string().min(1, 'Informe a senha.'),
})

export const recuperarSchema = z.object({ email })

export const novaSenhaSchema = z
  .object({
    senha: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
    confirmacao: z.string(),
  })
  .refine((v) => v.senha === v.confirmacao, {
    message: 'As senhas não são iguais.',
    path: ['confirmacao'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RecuperarInput = z.infer<typeof recuperarSchema>
export type NovaSenhaInput = z.infer<typeof novaSenhaSchema>
