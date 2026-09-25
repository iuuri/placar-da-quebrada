import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { gerarSenhaProvisoria, novoUsuarioSchema, type NovoUsuarioInput, type NovoUsuarioValues } from '../schemas'
import { CampoSenha } from './CampoSenha'

type Props = {
  salvando: boolean
  erro: string | null
  onSalvar: (valores: NovoUsuarioValues) => Promise<unknown>
}

export function NovoUsuarioForm({ salvando, erro, onSalvar }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NovoUsuarioInput, unknown, NovoUsuarioValues>({
    resolver: zodResolver(novoUsuarioSchema),
    defaultValues: { nome: '', email: '', senha: gerarSenhaProvisoria(), role: 'operador' },
  })

  async function enviar(valores: NovoUsuarioValues) {
    try {
      await onSalvar(valores)
      reset({ nome: '', email: '', senha: gerarSenhaProvisoria(), role: 'operador' })
    } catch {
      // a mensagem aparece pela prop `erro`
    }
  }

  const aria = (campo: keyof NovoUsuarioInput) => ({
    'aria-invalid': Boolean(errors[campo]),
    'aria-describedby': errors[campo] ? `novo-${campo}-erro` : undefined,
  })

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="flex flex-col gap-4">
      {erro ? <Alert>{erro}</Alert> : null}
      <Field id="novo-nome" label="Nome" error={errors.nome?.message}>
        <Input id="novo-nome" autoComplete="off" {...aria('nome')} {...register('nome')} />
      </Field>
      <Field id="novo-email" label="E-mail (usado para entrar)" error={errors.email?.message}>
        <Input
          id="novo-email"
          type="email"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          {...aria('email')}
          {...register('email')}
        />
      </Field>
      <CampoSenha
        id="novo-senha"
        label="Senha provisória"
        erro={errors.senha?.message}
        registro={register('senha')}
        onGerar={() => setValue('senha', gerarSenhaProvisoria(), { shouldValidate: true })}
      />
      <Field id="novo-role" label="Papel" error={errors.role?.message}>
        <Select id="novo-role" {...register('role')}>
          <option value="operador">Operador (mesário): controla os jogos</option>
          <option value="admin">Admin (organizador): acesso total</option>
        </Select>
      </Field>
      <Button type="submit" disabled={salvando} className="sm:self-start">
        {salvando ? 'Criando…' : 'Criar acesso'}
      </Button>
    </form>
  )
}
