import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// Select nativo: melhor no celular (abre o seletor do sistema) e acessível por padrão.
export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'min-h-12 w-full rounded-md border-2 border-muro-escuro bg-white px-3 text-base text-tinta',
        'focus-visible:border-tinta focus-visible:outline-none aria-invalid:border-cartao',
        className,
      )}
      {...props}
    />
  )
}
