import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type Variante = 'placa' | 'contorno' | 'perigo' | 'texto'

// placa: ação principal (amarelo) · contorno: ação secundária (superfície elevada) · perigo: destrutiva · texto: discreta
const VARIANTES: Record<Variante, string> = {
  placa: 'bg-placa text-muro hover:bg-placa-escura',
  contorno: 'bg-painel-alto text-tinta ring-1 ring-inset ring-white/8 hover:bg-white/12',
  perigo: 'bg-cartao text-white hover:bg-cartao/90',
  texto: 'text-tinta-suave hover:bg-white/6 hover:text-tinta',
}

type Props = ComponentProps<'button'> & { variante?: Variante }

export function Botao({ variante = 'placa', className, type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 font-bold transition-[background-color,transform] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35',
        VARIANTES[variante],
        className,
      )}
      {...props}
    />
  )
}
