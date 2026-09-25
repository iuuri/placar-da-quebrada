import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Jogador } from '@/types/database.types'
import { jogadorSchema, POSICOES, type JogadorFormInput, type JogadorFormValues } from '../schemas'

type Props = {
  // Prefixo dos ids: a tela pode ter o formulário de novo jogador e o de edição ao mesmo tempo.
  idPrefixo: string
  jogador?: Jogador
  rotuloSalvar: string
  salvando: boolean
  erro: string | null
  onSalvar: (valores: JogadorFormValues) => Promise<unknown> | void
  onCancelar?: () => void
}

export function JogadorForm({ idPrefixo, jogador, rotuloSalvar, salvando, erro, onSalvar, onCancelar }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<JogadorFormInput, unknown, JogadorFormValues>({
    resolver: zodResolver(jogadorSchema),
    defaultValues: {
      nome: jogador?.nome ?? '',
      apelido: jogador?.apelido ?? '',
      numero: jogador?.numero?.toString() ?? '',
      posicao: jogador?.posicao ?? '',
    },
  })

  const id = (campo: string) => `${idPrefixo}-${campo}`
  const aria = (campo: keyof JogadorFormInput) => ({
    'aria-invalid': Boolean(errors[campo]),
    'aria-describedby': errors[campo] ? `${id(campo)}-erro` : undefined,
  })

  async function enviar(valores: JogadorFormValues) {
    try {
      await onSalvar(valores)
      // Formulário de "novo jogador": limpa e volta o foco para cadastrar o próximo rapidinho.
      if (!jogador) {
        reset()
        setFocus('numero')
      }
    } catch {
      // o erro já aparece pela prop `erro`
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="flex flex-col gap-3">
      {erro ? <Alert>{erro}</Alert> : null}
      <div className="grid grid-cols-[5rem_1fr] gap-3">
        <Field id={id('numero')} label="Nº" error={errors.numero?.message}>
          <Input id={id('numero')} inputMode="numeric" maxLength={2} {...aria('numero')} {...register('numero')} />
        </Field>
        <Field id={id('nome')} label="Nome" error={errors.nome?.message}>
          <Input id={id('nome')} autoComplete="off" {...aria('nome')} {...register('nome')} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field id={id('apelido')} label="Apelido (opcional)" error={errors.apelido?.message}>
          <Input id={id('apelido')} autoComplete="off" {...aria('apelido')} {...register('apelido')} />
        </Field>
        <Field id={id('posicao')} label="Posição (opcional)" error={errors.posicao?.message}>
          <Select id={id('posicao')} {...register('posicao')}>
            <option value="">—</option>
            {POSICOES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : rotuloSalvar}
        </Button>
        {onCancelar ? (
          <Button type="button" variant="secondary" onClick={onCancelar} disabled={salvando}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
