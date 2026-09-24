import { Link } from 'react-router'
import { cn } from '@/lib/utils'

// Wordmark em forma de placa pintada: é o elemento marcante da identidade.
export function Marca({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Placar da Quebrada, página inicial"
      className={cn(
        'inline-flex -rotate-1 flex-col bg-placa px-3 py-1 font-display leading-none text-tinta shadow-[4px_4px_0_var(--color-tinta)]',
        className,
      )}
    >
      <span className="text-[0.7rem] font-bold tracking-wide">placar da</span>
      <span className="text-2xl font-black uppercase">Quebrada</span>
    </Link>
  )
}
