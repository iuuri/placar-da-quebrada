import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { entrar, sair } from '../api'
import { useAuth } from '../context'
import { mensagemErroAuth } from '../errors'
import { loginSchema, type LoginInput } from '../schemas'

export function LoginPage() {
  const { session, profile, carregando } = useAuth()
  const location = useLocation()
  const [params] = useSearchParams()
  const [erro, setErro] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const inativo = params.get('motivo') === 'inativo' || (profile !== null && !profile.ativo)
  const destino = (location.state as { de?: string } | null)?.de ?? '/painel'

  if (!carregando && session && profile?.ativo) return <Navigate to={destino} replace />

  async function onSubmit(values: LoginInput) {
    setErro(null)
    try {
      await entrar(values.email, values.senha)
    } catch (e) {
      setErro(mensagemErroAuth(e))
    }
  }

  return (
    <section className="mx-auto flex max-w-sm flex-col gap-6 py-10">
      <div>
        <h1 className="font-display text-4xl font-black">Entrar</h1>
        <p className="mt-2 text-tinta-suave">
          Acesso para organizadores e mesários. Para acompanhar os jogos não precisa de conta.
        </p>
      </div>

      {inativo && session ? (
        <Alert>
          <p>Seu acesso está desativado. Fale com o organizador do campeonato.</p>
          <Button variant="ghost" className="min-h-0 px-0" onClick={() => sair()}>
            Sair desta conta
          </Button>
        </Alert>
      ) : null}
      {erro ? <Alert>{erro}</Alert> : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Field id="email" label="E-mail" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-erro' : undefined}
            {...register('email')}
          />
        </Field>
        <Field id="senha" label="Senha" error={errors.senha?.message}>
          <Input
            id="senha"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.senha)}
            aria-describedby={errors.senha ? 'senha-erro' : undefined}
            {...register('senha')}
          />
        </Field>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <Link to="/esqueci-senha" className="font-bold underline underline-offset-4">
        Esqueci minha senha
      </Link>
    </section>
  )
}
