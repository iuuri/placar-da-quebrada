import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button-variants'

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-start gap-4 py-12">
      <p aria-hidden className="font-display text-8xl font-black leading-none">404</p>
      <h1 className="font-display text-4xl font-bold">Essa página não existe</h1>
      <p className="max-w-prose text-tinta-suave">O link pode estar errado ou o conteúdo foi removido.</p>
      <Link to="/" className={buttonVariants()}>
        Voltar para o início
      </Link>
    </section>
  )
}
