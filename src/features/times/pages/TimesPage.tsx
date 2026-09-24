import { Link, useParams } from 'react-router'
import { Carregando } from '@/app/pages/Carregando'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button-variants'
import { useCampeonato } from '@/features/campeonatos/hooks'
import { EscudoSigla } from '../components/EscudoSigla'
import { useTimes } from '../hooks'

export function TimesPage() {
  const { id: campeonatoId } = useParams()
  const { data: campeonato } = useCampeonato(campeonatoId)
  const { data: times, isPending, error, refetch } = useTimes(campeonatoId!)

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to={`/admin/campeonatos/${campeonatoId}`} className="text-sm font-bold underline underline-offset-4">
            {campeonato?.nome ?? 'Campeonato'}
          </Link>
          <h1 className="font-display text-4xl font-black">Times</h1>
        </div>
        <Link to={`/admin/campeonatos/${campeonatoId}/times/novo`} className={buttonVariants()}>
          Novo time
        </Link>
      </div>

      {isPending ? <Carregando /> : null}
      {error ? (
        <Alert>
          <p>Não foi possível carregar os times.</p>
          <button type="button" className="font-bold underline" onClick={() => refetch()}>
            Tentar de novo
          </button>
        </Alert>
      ) : null}

      {times && times.length === 0 ? (
        <p className="max-w-prose text-tinta-suave">
          Nenhum time neste campeonato. Cadastre os times e depois o elenco de cada um.
        </p>
      ) : null}

      {times && times.length > 0 ? (
        <ul className="flex flex-col divide-y-2 divide-muro-escuro border-y-2 border-muro-escuro">
          {times.map((t) => {
            const qtd = t.jogadores[0]?.count ?? 0
            return (
              <li key={t.id}>
                <Link
                  to={`/admin/campeonatos/${campeonatoId}/times/${t.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-white"
                >
                  <EscudoSigla sigla={t.sigla} cor={t.cor_primaria} escudoUrl={t.escudo_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-2xl font-bold leading-tight">{t.nome}</p>
                    <p className="text-sm text-tinta-suave">
                      {t.sigla} · {qtd === 1 ? '1 jogador' : `${qtd} jogadores`}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
