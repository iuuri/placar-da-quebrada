import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 font-bold transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-placa text-tinta shadow-[0_3px_0_var(--color-placa-escura)] hover:bg-placa-escura active:translate-y-px active:shadow-none',
        secondary: 'border-2 border-tinta bg-transparent text-tinta hover:bg-tinta hover:text-muro',
        ghost: 'text-tinta underline-offset-4 hover:underline',
      },
      size: {
        md: 'text-base',
        lg: 'min-h-14 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)
