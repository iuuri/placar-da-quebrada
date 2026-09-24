import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { Carregando } from '@/app/pages/Carregando'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { atualizarSenha } from '../api'
import { useAuth } from '../context'
import { mensagemErroAuth } from '../errors'
import { novaSenhaSchema, type NovaSenhaInput } from '../schemas'

// Aberta pelo link do e-mail de recuperação: o Supabase cria a sessão a partir da URL.
export function RedefinirSenhaPage() {
  const { session, carregando } = useAuth()
  const navigate = useNavigate()
  const [erro, setErro] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NovaSenhaInput>({ resolver: zodResolver(novaSenhaSchema) })

  if (carregando) return <Carregando />

  if (!session) {
    return (
      <section className="mx-auto flex max-w-sm flex-col gap-4 py-10">
        <h1 className="font-display text-4xl font-black">Link expirado</h1>
        <p className="text-tinta-suave">Este link de recuperação não vale mais. Peça um novo.</p>
        <Link to="/esqueci-senha" className="font-bold underline underline-offset-4">
          Pedir novo link
        </Link>
      </section>
    )
  }

  async function onSubmit(values: NovaSenhaInput) {
    setErro(null)
    try {
      await atualizarSenha(values.senha)
      navigate('/painel', { replace: true })
    } catch (e) {
      setErro(mensagemErroAuth(e))
    }
  }

  return (
    <section className="mx-auto flex max-w-sm flex-col gap-6 py-10">
      <h1 className="font-display text-4xl font-black">Nova senha</h1>
      {erro ? <Alert>{erro}</Alert> : null}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Field id="senha" label="Nova senha" error={errors.senha?.message}>
          <Input
            id="senha"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.senha)}
            aria-describedby={errors.senha ? 'senha-erro' : undefined}
            {...register('senha')}
          />
        </Field>
        <Field id="confirmacao" label="Repita a nova senha" error={errors.confirmacao?.message}>
          <Input
            id="confirmacao"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmacao)}
            aria-describedby={errors.confirmacao ? 'confirmacao-erro' : undefined}
            {...register('confirmacao')}
          />
        </Field>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
        </Button>
      </form>
    </section>
  )
}
