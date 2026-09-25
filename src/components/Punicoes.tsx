import type { Acao, Estado } from '@/estado'
import { cn } from '@/lib/utils'
import { formatar, restantePunicaoMs, type EstadoTimer } from '@/tempo'
import { Botao } from './Botao'

type Props = {
  punicoes: Estado['punicoes']
  placar: Estado['placar']
  timer: EstadoTimer
  agora: number
  despachar: (a: Acao) => void
}

// Cronômetros de 2 minutos dos jogadores punidos. Andam junto com o tempo de jogo.
export function Punicoes({ punicoes, placar, timer, agora, despachar }: Props) {
  if (punicoes.length === 0) return null

  return (
    <section aria-labelledby="titulo-punicoes" className="flex flex-col gap-2 rounded-md border-2 border-laranja bg-white p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-punicoes" className="font-display text-2xl font-bold">
          ⏱️ Punições
        </h2>
        {!timer.rodando ? <span className="text-sm text-tinta-suave">Paradas: o jogo está pausado</span> : null}
      </div>
      <ul className="flex flex-col gap-2">
        {punicoes.map((p) => {
          const restante = restantePunicaoMs(p, timer, agora)
          const cumprida = restante === 0
          const time = placar[p.lado].nome || (p.lado === 'casa' ? 'Time A' : 'Time B')
          return (
            <li
              key={p.id}
              className={cn(
                'flex items-center gap-3 rounded-md p-2',
                cumprida ? 'alarme bg-gramado text-white' : 'bg-muro',
              )}
            >
              <span
                role="timer"
                aria-label={`Tempo restante da punição: ${formatar(restante, true)}`}
                className="w-20 shrink-0 text-center font-display text-4xl font-black leading-none tabular-nums"
              >
                {formatar(restante, true)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{p.texto || 'Jogador'}</p>
                <p className="truncate text-sm">{cumprida ? 'Pode voltar ao jogo!' : time}</p>
              </div>
              <Botao
                variante={cumprida ? 'placa' : 'texto'}
                className="min-h-10 shrink-0 px-2 text-sm"
                aria-label={cumprida ? `Confirmar volta de ${p.texto || 'jogador'}` : `Encerrar punição de ${p.texto || 'jogador'}`}
                onClick={() => despachar({ tipo: 'encerrarPunicao', id: p.id })}
              >
                {cumprida ? 'OK' : 'Encerrar'}
              </Botao>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
