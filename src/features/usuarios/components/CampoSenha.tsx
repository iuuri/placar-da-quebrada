import type { UseFormRegisterReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type Props = {
  id: string
  label: string
  erro?: string
  registro: UseFormRegisterReturn
  onGerar: () => void
}

// Senha visível (o admin precisa passar para o operador) com botão para sugerir uma.
export function CampoSenha({ id, label, erro, registro, onGerar }: Props) {
  return (
    <Field id={id} label={label} error={erro}>
      <div className="flex gap-2">
        <Input
          id={id}
          type="text"
          autoComplete="new-password"
          spellCheck={false}
          autoCapitalize="none"
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${id}-erro` : undefined}
          {...registro}
        />
        <Button type="button" variant="secondary" onClick={onGerar} className="shrink-0">
          Gerar
        </Button>
      </div>
    </Field>
  )
}
