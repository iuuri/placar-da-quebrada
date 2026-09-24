import { Link } from 'react-router'
import { Carregando } from '@/app/pages/Carregando'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { useCampeonatos } from '../hooks'
import { rotuloModalidade, rotuloStatus } from '../schemas'

export function CampeonatosAdminPage() {
  const { data: campeonatos, isPending, error, refetch } = useCampeonatos()

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-black">Campeonatos</h1>
        <Link to="/admin/campeonatos/novo" className={buttonVariants()}>
          Novo campeonato
        </Link>
      </div>

      {isPending ? <Carregando /> : null}

      {error ? (
        <Alert>
          <p>Não foi possível carregar os campeonatos.</p>
          <button type="button" className="font-bold underline" onClick={() => refetch()}>
            Tentar de novo
          </button>
        </Alert>
      ) : null}

      {campeonatos && campeonatos.length === 0 ? (
        <p className="max-w-prose text-tinta-suave">
          Nenhum campeonato cadastrado. Crie o primeiro para começar a cadastrar times e jogos.
        </p>
      ) : null}

      {campeonatos && campeonatos.length > 0 ? (
        <ul className="flex flex-col divide-y-2 divide-muro-escuro border-y-2 border-muro-escuro">
          {campeonatos.map((c) => (
            <li key={c.id}>
              <Link
                to={`/admin/campeonatos/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-2 py-4 hover:bg-white"
              >
                <div>
                  <p className="font-display text-2xl font-bold leading-tight">{c.nome}</p>
                  <p className="text-sm text-tinta-suave">
                    {c.temporada} · {rotuloModalidade(c.modalidade)} · {rotuloStatus(c.status)}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-sm font-bold',
                    c.publico ? 'bg-gramado text-white' : 'bg-muro-escuro text-tinta',
                  )}
                >
                  {c.publico ? 'Público' : 'Só no painel'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
