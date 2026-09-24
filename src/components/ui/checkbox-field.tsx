import type { ComponentProps, ReactNode } from 'react'

type Props = Omit<ComponentProps<'input'>, 'type'> & {
  label: string
  descricao?: ReactNode
}

// Checkbox grande com rótulo clicável e texto de apoio.
export function CheckboxField({ id, label, descricao, ...props }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-md border-2 border-muro-escuro bg-white p-3">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-6 shrink-0 accent-tinta"
        aria-describedby={descricao ? `${id}-descricao` : undefined}
        {...props}
      />
      <div>
        <label htmlFor={id} className="font-bold">
          {label}
        </label>
        {descricao ? (
          <p id={`${id}-descricao`} className="text-sm text-tinta-suave">
            {descricao}
          </p>
        ) : null}
      </div>
    </div>
  )
}
