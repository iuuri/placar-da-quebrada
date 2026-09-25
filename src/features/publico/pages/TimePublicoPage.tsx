import { Link, useParams } from 'react-router'
import { Carregando } from '@/app/pages/Carregando'
import { EscudoSigla } from '@/components/EscudoSigla'
import { Alert } from '@/components/ui/alert'
import { useTitulo } from '@/lib/use-titulo'
import { NaoEncontrado } from '../components/NaoEncontrado'
import { useCampeonatoPorSlug, useTimeComElenco } from '../hooks'

export function TimePublicoPage() {
  const { slug, timeId } = useParams()
  const campeonato = useCampeonatoPorSlug(slug!)
  const { data: time, isPending, error } = useTimeComElenco(timeId!)
  useTitulo(time?.nome)

  if (isPending || campeonato.isPending) return <Carregando />
  if (error || campeonato.error) return <Alert>Não foi possível carregar o time. Verifique a conexão e recarregue.</Alert>
  // Também trata link de um time com o endereço de outro campeonato.
  if (!time || !campeonato.data || time.campeonato_id !== campeonato.data.id) {
    return <NaoEncontrado titulo="Time não encontrado" texto="O link pode estar errado ou o time foi removido." />
  }

  return (
    <article className="flex flex-col gap-6 py-6">
      <header className="flex items-center gap-4">
        <EscudoSigla sigla={time.sigla} cor={time.cor_primaria} escudoUrl={time.escudo_url} tamanho="lg" />
        <div>
          <Link to={`/c/${campeonato.data.slug}`} className="text-sm font-bold underline underline-offset-4">
            {campeonato.data.nome}
          </Link>
          <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">{time.nome}</h1>
        </div>
      </header>

      <section aria-labelledby="elenco" className="border-t-2 border-tinta pt-4">
        <h2 id="elenco" className="font-display text-3xl font-bold">
          Elenco
        </h2>
        {time.jogadores.length === 0 ? (
          <p className="mt-2 text-tinta-suave">O elenco ainda não foi cadastrado.</p>
        ) : (
          <ul className="mt-3 flex max-w-xl flex-col divide-y-2 divide-muro-escuro border-y-2 border-muro-escuro">
            {time.jogadores.map((j) => (
              <li key={j.id} className="flex items-center gap-3 py-2">
                <span className="w-10 shrink-0 text-center font-display text-3xl font-black leading-none">
                  {j.numero ?? '–'}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold">{j.apelido || j.nome}</p>
                  <p className="truncate text-sm text-tinta-suave">
                    {[j.apelido ? j.nome : null, j.posicao].filter(Boolean).join(' · ') || ' '}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  )
}
