import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { enviarEmailRecuperacao } from '../api'
import { mensagemErroAuth } from '../errors'
import { recuperarSchema, type RecuperarInput } from '../schemas'

export function EsqueciSenhaPage() {
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecuperarInput>({ resolver: zodResolver(recuperarSchema) })

  async function onSubmit(values: RecuperarInput) {
    setErro(null)
    try {
      await enviarEmailRecuperacao(values.email)
      setEnviado(true)
    } catch (e) {
      setErro(mensagemErroAuth(e))
    }
  }

  return (
    <section className="mx-auto flex max-w-sm flex-col gap-6 py-10">
      <div>
        <h1 className="font-display text-4xl font-black">Recuperar senha</h1>
        <p className="mt-2 text-tinta-suave">
          Enviamos um link para o seu e-mail. Mesários que não receberem o e-mail podem pedir ao organizador para
          trocar a senha.
        </p>
      </div>

      {enviado ? (
        <Alert tone="sucesso">
          Se o e-mail estiver cadastrado, o link chega em alguns minutos. Confira também o spam.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {erro ? <Alert>{erro}</Alert> : null}
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
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando…' : 'Enviar link'}
          </Button>
        </form>
      )}

      <Link to="/login" className="font-bold underline underline-offset-4">
        Voltar para o login
      </Link>
    </section>
  )
}
