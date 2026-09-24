import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'min-h-12 w-full rounded-md border-2 border-muro-escuro bg-white px-3 text-base text-tinta placeholder:text-tinta-suave/60',
        'focus-visible:border-tinta focus-visible:outline-none aria-invalid:border-cartao',
        className,
      )}
      {...props}
    />
  )
}
