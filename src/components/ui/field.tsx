import type { ReactNode } from 'react'

type FieldProps = {
  id: string
  label: string
  error?: string
  children: ReactNode
}

// Label + controle + mensagem de erro ligada por aria-describedby (o controle recebe `${id}-erro`).
export function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-erro`} role="alert" className="text-sm font-bold text-cartao">
          {error}
        </p>
      ) : null}
    </div>
  )
}
