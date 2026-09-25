import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type Variante = 'placa' | 'contorno' | 'perigo' | 'texto'

const VARIANTES: Record<Variante, string> = {
  placa: 'bg-placa text-tinta shadow-[0_3px_0_var(--color-placa-escura)] hover:bg-placa-escura active:translate-y-px active:shadow-none',
  contorno: 'border-2 border-tinta bg-white text-tinta hover:bg-tinta hover:text-muro',
  perigo: 'bg-cartao text-white hover:bg-cartao/90',
  texto: 'text-tinta underline-offset-4 hover:underline',
}

type Props = ComponentProps<'button'> & { variante?: Variante }

export function Botao({ variante = 'placa', className, type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-4 font-bold transition-colors disabled:pointer-events-none disabled:opacity-40',
        VARIANTES[variante],
        className,
      )}
      {...props}
    />
  )
}
