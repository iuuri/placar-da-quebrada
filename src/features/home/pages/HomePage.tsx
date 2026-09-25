import { Link } from 'react-router'
import { rotuloModalidade, rotuloStatus } from '@/features/campeonatos/rotulos'
import { useCampeonatosPublicos } from '@/features/publico/hooks'
import { useTitulo } from '@/lib/use-titulo'

export function HomePage() {
  useTitulo(null)
  const { data: campeonatos, isPending, error, refetch } = useCampeonatosPublicos()

  return (
    <>
      <section className="py-10 sm:py-16">
        <h1 className="max-w-3xl font-display text-5xl font-black leading-[0.95] sm:text-7xl">
          Placar, tabela e cartões do campeonato da quebrada, ao vivo no celular.
        </h1>
        <p className="mt-5 max-w-prose text-lg text-tinta-suave">
          Quem está no campo lança o gol; quem está em casa vê na hora. A classificação se atualiza sozinha.
        </p>
      </section>

      <section aria-labelledby="campeonatos" className="border-t-2 border-tinta pt-6">
        <h2 id="campeonatos" className="font-display text-3xl font-bold">
          Campeonatos
        </h2>

        {isPending ? <p className="mt-3 text-tinta-suave">Carregando campeonatos…</p> : null}
        {error ? (
          <p className="mt-3">
            Não foi possível carregar os campeonatos.{' '}
            <button type="button" className="font-bold underline" onClick={() => refetch()}>
              Tentar de novo
            </button>
          </p>
        ) : null}
        {campeonatos && campeonatos.length === 0 ? (
          <p className="mt-3 text-tinta-suave">
            Nenhum campeonato publicado ainda. Quando o organizador publicar, os jogos aparecem aqui.
          </p>
        ) : null}

        {campeonatos && campeonatos.length > 0 ? (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {campeonatos.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/c/${c.slug}`}
                  className="flex h-full flex-col gap-1 rounded-md border-2 border-tinta bg-white p-4 shadow-[4px_4px_0_var(--color-tinta)] transition-transform hover:-translate-y-0.5"
                >
                  <span className="font-display text-3xl font-black leading-tight">{c.nome}</span>
                  <span className="text-sm text-tinta-suave">
                    {c.temporada} · {rotuloModalidade(c.modalidade)} · {rotuloStatus(c.status)}
                  </span>
                  {c.local_padrao ? <span className="text-sm text-tinta-suave">{c.local_padrao}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </>
  )
}
