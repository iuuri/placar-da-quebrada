import type { Acao } from '@/estado'
import { prepararSom } from '@/lib/recursos'
import { cn } from '@/lib/utils'
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

  return (
    <section
      aria-label="Cronômetro resumido"
      className="flex min-w-0 items-center gap-1.5 rounded-lg bg-tinta/85 py-1 pr-1 pl-2.5 text-muro shadow-[0_4px_14px_rgb(20_33_61/0.25)] min-[360px]:gap-2"
    >
      <div role="timer" aria-label="Tempo" className="shrink-0">
        <p className="font-display text-3xl font-black leading-none tabular-nums">
          {formatar(exibidoMs(timer, agora), timer.modo === 'regressivo')}
        </p>
        <p
          className={cn(
            'max-w-[5rem] truncate text-[0.65rem] font-bold leading-tight',
            alem > 0 || timer.acrescimoSeg > 0 ? 'text-placa' : 'text-muro/70',
          )}
        >
          {timer.rodando ? detalhe : 'Pausado'}
        </p>
      </div>
      {timer.rodando ? (
        <button
          type="button"
          onClick={() => despachar({ tipo: 'pausar', agora: Date.now() })}
          className="min-h-10 shrink-0 rounded-md bg-placa px-2 text-sm font-bold text-tinta min-[360px]:px-3"
        >
          Pausar
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            prepararSom()
            despachar({ tipo: 'iniciar', agora: Date.now() })
          }}
          className="min-h-10 shrink-0 rounded-md bg-placa px-2 text-sm font-bold text-tinta min-[360px]:px-3"
        >
          Continuar
        </button>
      )}
      <button
        type="button"
        onClick={onAbrir}
        aria-label="Abrir cronômetro completo"
        title="Abrir cronômetro completo"
        className="min-h-10 min-w-9 shrink-0 rounded-md border-2 border-muro/50 text-lg font-bold leading-none"
      >
        ▾
      </button>
    </section>
  )
}
