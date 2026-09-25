import { Link, useParams } from 'react-router'
import { Carregando } from '@/app/pages/Carregando'
import { EscudoSigla } from '@/components/EscudoSigla'
import { Alert } from '@/components/ui/alert'
import { rotuloModalidade, rotuloStatus } from '@/features/campeonatos/rotulos'
import { useTitulo } from '@/lib/use-titulo'
import { NaoEncontrado } from '../components/NaoEncontrado'
import { useCampeonatoPorSlug, useTimesDoCampeonato } from '../hooks'

export function CampeonatoPublicoPage() {
  const { slug } = useParams()
  const { data: campeonato, isPending, error } = useCampeonatoPorSlug(slug!)
  const times = useTimesDoCampeonato(campeonato?.id)
  useTitulo(campeonato?.nome)

  if (isPending) return <Carregando />
  if (error) return <Alert>Não foi possível carregar o campeonato. Verifique a conexão e recarregue.</Alert>
  if (!campeonato) {
    return (
      <NaoEncontrado
        titulo="Campeonato não encontrado"
        texto="O link pode estar errado, ou o campeonato ainda não foi publicado pelo organizador."
      />
    )
  }

  return (
    <article className="flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-2">
        {campeonato.publico ? null : (
          <Alert>Pré-visualização: este campeonato não está público. Só quem tem login consegue ver.</Alert>
        )}
        <h1 className="font-display text-5xl font-black leading-[0.95] sm:text-6xl">{campeonato.nome}</h1>
        <p className="text-tinta-suave">
          {campeonato.temporada} · {rotuloModalidade(campeonato.modalidade)} · {rotuloStatus(campeonato.status)}
          {campeonato.local_padrao ? ` · ${campeonato.local_padrao}` : ''}
        </p>
      </header>

      <section aria-labelledby="jogos" className="border-t-2 border-tinta pt-4">
        <h2 id="jogos" className="font-display text-3xl font-bold">
          Jogos
        </h2>
        <p className="mt-2 max-w-prose text-tinta-suave">
          A tabela de jogos e o placar ao vivo aparecem aqui quando o organizador cadastrar as partidas.
        </p>
      </section>

      <section aria-labelledby="times" className="border-t-2 border-tinta pt-4">
        <h2 id="times" className="font-display text-3xl font-bold">
          Times
        </h2>
        {times.isPending ? <p className="mt-2 text-tinta-suave">Carregando times…</p> : null}
        {times.error ? <p className="mt-2">Não foi possível carregar os times.</p> : null}
        {times.data && times.data.length === 0 ? (
          <p className="mt-2 text-tinta-suave">Os times inscritos aparecem aqui.</p>
        ) : null}
        {times.data && times.data.length > 0 ? (
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {times.data.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/c/${campeonato.slug}/time/${t.id}`}
                  className="flex items-center gap-3 rounded-md bg-white p-3 hover:bg-muro-escuro/40"
                >
                  <EscudoSigla sigla={t.sigla} cor={t.cor_primaria} escudoUrl={t.escudo_url} />
                  <span className="font-display text-xl font-bold leading-tight">{t.nome}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </article>
  )
}
