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

// Cronômetro resumido: barra flutuante e um pouco transparente no rodapé da tela,
// para liberar espaço para o placar e as anotações enquanto o jogo corre.
export function CronometroMini({ timer, agora, despachar, onAbrir }: Props) {
  const alem = alemDoTempoMs(timer, agora)
  const detalhe =
    timer.modo === 'regressivo'
      ? timer.acrescimoSeg > 0
        ? `Acréscimo +${Math.round(timer.acrescimoSeg / 60)}'`
        : 'Regressivo'
      : alem > 0
        ? `Acréscimo +${formatar(alem)}`
        : 'Progressivo'

  return (
    <section
      aria-label="Cronômetro resumido"
      className={cn(
        'fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-lg items-center gap-3 rounded-xl px-3 py-2 text-muro',
        'bg-tinta/80 shadow-[0_6px_24px_rgb(20_33_61/0.35)] backdrop-blur-sm transition-opacity',
        'opacity-90 hover:opacity-100 focus-within:opacity-100',
      )}
    >
      <div role="timer" aria-label="Tempo" className="min-w-0 flex-1">
        <p className="font-display text-4xl font-black leading-none tabular-nums">
          {formatar(exibidoMs(timer, agora), timer.modo === 'regressivo')}
        </p>
        <p className={cn('truncate text-xs font-bold', alem > 0 || timer.acrescimoSeg > 0 ? 'text-placa' : 'text-muro/70')}>
          {timer.rodando ? detalhe : `Pausado · ${detalhe}`}
        </p>
      </div>
      {timer.rodando ? (
        <button
          type="button"
          onClick={() => despachar({ tipo: 'pausar', agora: Date.now() })}
          className="min-h-11 rounded-md bg-placa px-4 font-bold text-tinta"
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
          className="min-h-11 rounded-md bg-placa px-4 font-bold text-tinta"
        >
          Continuar
        </button>
      )}
      <button
        type="button"
        onClick={onAbrir}
        aria-label="Abrir cronômetro completo"
        className="min-h-11 rounded-md border-2 border-muro/60 px-3 text-sm font-bold"
      >
        Abrir
      </button>
    </section>
  )
}
