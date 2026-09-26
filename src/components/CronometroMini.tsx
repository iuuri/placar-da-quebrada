import type { Acao } from '@/estado'
import { prepararSom } from '@/lib/recursos'
import { cn } from '@/lib/utils'
import { Icone } from './Icone'
import { alemDoTempoMs, exibidoMs, formatar, type EstadoTimer } from '@/tempo'

type Props = {
  timer: EstadoTimer
  agora: number
  despachar: (a: Acao) => void
  onAbrir: () => void
}

// Cronômetro resumido: fica no topo, ao lado da logo, depois que o jogo começa.
// Libera a tela para o placar e as anotações e continua visível ao rolar a página.
export function CronometroMini({ timer, agora, despachar, onAbrir }: Props) {
  const alem = alemDoTempoMs(timer, agora)
  const detalhe =
    timer.modo === 'regressivo'
      ? timer.acrescimoSeg > 0
        ? `+${Math.round(timer.acrescimoSeg / 60)}' acrésc.`
        : 'Regressivo'
      : alem > 0
        ? `+${formatar(alem)} acrésc.`
        : 'Progressivo'

  const botao = 'grid size-10 shrink-0 place-items-center rounded-full'
  return (
    <section
      aria-label="Cronômetro resumido"
      className="flex min-w-0 items-center gap-1.5 rounded-full bg-painel-alto/90 py-1 pr-1 pl-3.5 ring-1 ring-white/8 min-[360px]:gap-2"
    >
      <span
        aria-hidden
        className={cn('size-2 shrink-0 rounded-full', timer.rodando ? 'ao-vivo bg-gramado' : 'bg-tinta-suave')}
      />
      <div role="timer" aria-label="Tempo" className="shrink-0">
        <p className="font-display text-[1.7rem] font-black leading-none tabular-nums">
          {formatar(exibidoMs(timer, agora), timer.modo === 'regressivo')}
        </p>
        <p
          className={cn(
            'max-w-[5rem] truncate text-[0.65rem] font-bold leading-tight',
            alem > 0 || timer.acrescimoSeg > 0 ? 'text-placa' : 'text-tinta-suave',
          )}
        >
          {timer.rodando ? detalhe : 'Pausado'}
        </p>
      </div>
      {timer.rodando ? (
        <button
          type="button"
          aria-label="Pausar"
          title="Pausar"
          onClick={() => despachar({ tipo: 'pausar', agora: Date.now() })}
          className={cn(botao, 'bg-placa text-muro')}
        >
          <Icone nome="pausa" className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          aria-label="Continuar"
          title="Continuar"
          onClick={() => {
            prepararSom()
            despachar({ tipo: 'iniciar', agora: Date.now() })
          }}
          className={cn(botao, 'bg-placa text-muro')}
        >
          <Icone nome="play" className="size-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onAbrir}
        aria-label="Abrir cronômetro completo"
        title="Abrir cronômetro completo"
        className={cn(botao, 'hover:bg-white/10')}
      >
        <Icone nome="expandir" />
      </button>
    </section>
  )
}
