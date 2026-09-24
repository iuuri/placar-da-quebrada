import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Time } from '@/types/database.types'
import { gerarSigla, timeSchema, type TimeFormInput, type TimeFormValues } from '../schemas'
import { EscudoSigla } from './EscudoSigla'

type Props = {
  time?: Time
  salvando: boolean
  erro: string | null
  rotuloSalvar: string
  onSalvar: (valores: TimeFormValues) => void
}

function valoresIniciais(t?: Time): TimeFormInput {
  return {
    nome: t?.nome ?? '',
    sigla: t?.sigla ?? '',
    cor_primaria: t?.cor_primaria ?? '#14213d',
    escudo_url: t?.escudo_url ?? '',
    responsavel: t?.responsavel ?? '',
    contato: t?.contato ?? '',
  }
}

export function TimeForm({ time, salvando, erro, rotuloSalvar, onSalvar }: Props) {
  // Na criação, a sigla acompanha o nome até a pessoa editar a sigla à mão.
  const [siglaManual, setSiglaManual] = useState(Boolean(time))
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<TimeFormInput, unknown, TimeFormValues>({
    resolver: zodResolver(timeSchema),
    defaultValues: valoresIniciais(time),
  })

  const [sigla, cor] = useWatch({ control, name: ['sigla', 'cor_primaria'] })
  const erroDe = (campo: keyof TimeFormInput) => errors[campo]?.message
  const aria = (campo: keyof TimeFormInput) => ({
    'aria-invalid': Boolean(errors[campo]),
    'aria-describedby': errors[campo] ? `${campo}-erro` : undefined,
  })

  const nomeRegistro = register('nome', {
    onChange: (e) => {
      if (!siglaManual) setValue('sigla', gerarSigla(e.target.value), { shouldValidate: Boolean(errors.sigla) })
    },
  })
  const siglaRegistro = register('sigla', { onChange: () => setSiglaManual(true) })

  return (
    <form onSubmit={handleSubmit(onSalvar)} noValidate className="flex max-w-2xl flex-col gap-5">
      {erro ? <Alert>{erro}</Alert> : null}

      <div className="flex items-center gap-4">
        <EscudoSigla sigla={sigla || '?'} cor={cor} tamanho="lg" />
        <div className="flex-1">
          <Field id="nome" label="Nome do time" error={erroDe('nome')}>
            <Input id="nome" placeholder="Unidos da Vila" {...aria('nome')} {...nomeRegistro} />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-4">
        <Field id="sigla" label="Sigla" error={erroDe('sigla')}>
          <Input
            id="sigla"
            maxLength={4}
            autoCapitalize="characters"
            spellCheck={false}
            className="uppercase"
            {...aria('sigla')}
            {...siglaRegistro}
          />
        </Field>
        <Field id="cor_primaria" label="Cor" error={erroDe('cor_primaria')}>
          <Input id="cor_primaria" type="color" className="w-20 cursor-pointer p-1" {...register('cor_primaria')} />
        </Field>
      </div>

      <Field id="escudo_url" label="Link do escudo (opcional)" error={erroDe('escudo_url')}>
        <Input id="escudo_url" type="url" inputMode="url" placeholder="https://…" {...aria('escudo_url')} {...register('escudo_url')} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="responsavel" label="Responsável (opcional)" error={erroDe('responsavel')}>
          <Input id="responsavel" autoComplete="off" {...aria('responsavel')} {...register('responsavel')} />
        </Field>
        <Field id="contato" label="Telefone de contato (opcional)" error={erroDe('contato')}>
          <Input id="contato" type="tel" inputMode="tel" autoComplete="off" {...aria('contato')} {...register('contato')} />
        </Field>
      </div>
      <p className="-mt-2 text-sm text-tinta-suave">Responsável e telefone só aparecem para o organizador e os mesários.</p>

      <Button type="submit" size="lg" disabled={salvando} className="sm:self-start">
        {salvando ? 'Salvando…' : rotuloSalvar}
      </Button>
    </form>
  )
}
