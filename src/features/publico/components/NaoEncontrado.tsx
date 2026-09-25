import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button-variants'

export function NaoEncontrado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <section className="flex flex-col items-start gap-4 py-12">
      <h1 className="font-display text-4xl font-black">{titulo}</h1>
      <p className="max-w-prose text-tinta-suave">{texto}</p>
      <Link to="/" className={buttonVariants()}>
        Ver campeonatos
      </Link>
    </section>
  )
}
