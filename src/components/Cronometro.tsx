import type { Acao } from '@/estado'
import { prepararSom } from '@/lib/recursos'
import { cn } from '@/lib/utils'
import { acabou, acrescimoMs, decorridoMs, exibidoMs, formatar, type EstadoTimer, type Modo } from '@/tempo'
import { Botao } from './Botao'

type Props = { timer: EstadoTimer; agora: number; despachar: (a: Acao) => void }

const MODOS: { valor: Modo; rotulo: string }[] = [
  { valor: 'progressivo', rotulo: 'Progressivo' },
  { valor: 'regressivo', rotulo: 'Regressivo' },
]

export function Cronometro({ timer, agora, despachar }: Props) {
  const fim = acabou(timer, agora)
  const extra = acrescimoMs(timer, agora)
  const comecou = decorridoMs(timer, agora) > 0
  const minutos = Math.floor(timer.duracaoSeg / 60)
  const segundos = timer.duracaoSeg % 60
  const podeConfigurar = !timer.rodando

  function definirDuracao(min: number, seg: number) {
    despachar({ tipo: 'definirDuracao', segundos: (Number.isFinite(min) ? min : 0) * 60 + (Number.isFinite(seg) ? seg : 0) })
  }

  return (
    <section aria-label="Cronômetro" className="flex flex-col gap-4 rounded-md bg-tinta p-4 text-muro sm:p-5">
      <div role="radiogroup" aria-label="Tipo de contagem" className="grid grid-cols-2 gap-1 rounded-md bg-white/10 p-1">
        {MODOS.map((m) => (
          <button
            key={m.valor}
            type="button"
            role="radio"
            aria-checked={timer.modo === m.valor}
            disabled={!podeConfigurar}
            onClick={() => despachar({ tipo: 'definirModo', modo: m.valor })}
            className={cn(
              'min-h-11 rounded font-bold transition-colors disabled:opacity-50',
              timer.modo === m.valor ? 'bg-placa text-tinta' : 'text-muro hover:bg-white/10',
            )}
          >
            {m.rotulo}
          </button>
        ))}
      </div>

      <div
        className={cn('rounded-md py-2 text-center', fim && 'alarme')}
        role="timer"
        aria-live="off"
        aria-label={fim ? 'Tempo esgotado' : 'Tempo'}
      >
        <p className="font-display text-[5.5rem] font-black leading-none tabular-nums sm:text-[8rem]">
          {formatar(exibidoMs(timer, agora), timer.modo === 'regressivo')}
        </p>
        <p className="mt-1 min-h-6 font-bold">
          {fim ? (
            'Fim do tempo!'
          ) : extra > 0 ? (
            <span className="text-placa">Acréscimo +{formatar(extra)}</span>
          ) : comecou && timer.modo === 'progressivo' && timer.duracaoSeg > 0 ? (
            <span className="text-muro/70">Tempo de jogo: {formatar(timer.duracaoSeg * 1000)}</span>
          ) : null}
        </p>
      </div>

      {podeConfigurar ? (
        <fieldset className="flex flex-wrap items-end justify-center gap-2">
          <legend className="mb-1 w-full text-center text-sm text-muro/80">
            {timer.modo === 'regressivo' ? 'Contar a partir de' : 'Tempo de jogo (0 = sem limite)'}
          </legend>
          <label className="flex flex-col items-center text-sm">
            Minutos
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={999}
              value={minutos}
              onChange={(e) => definirDuracao(e.target.valueAsNumber, segundos)}
              className="mt-1 h-12 w-24 rounded-md bg-white text-center font-display text-2xl font-bold text-tinta"
            />
          </label>
          <span className="pb-2 font-display text-3xl font-black">:</span>
          <label className="flex flex-col items-center text-sm">
            Segundos
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              value={segundos}
              onChange={(e) => definirDuracao(minutos, Math.min(59, e.target.valueAsNumber))}
              className="mt-1 h-12 w-24 rounded-md bg-white text-center font-display text-2xl font-bold text-tinta"
            />
          </label>
        </fieldset>
      ) : null}

      <div className="flex gap-2">
        {timer.rodando ? (
          <Botao className="min-h-16 flex-1 text-2xl" onClick={() => despachar({ tipo: 'pausar', agora: Date.now() })}>
            Pausar
          </Botao>
        ) : (
          <Botao
            className="min-h-16 flex-1 text-2xl"
            disabled={fim || (timer.modo === 'regressivo' && timer.duracaoSeg === 0)}
            onClick={() => {
              prepararSom()
              despachar({ tipo: 'iniciar', agora: Date.now() })
            }}
          >
            {comecou ? 'Continuar' : 'Iniciar'}
          </Botao>
        )}
        <Botao
          variante="contorno"
          className="min-h-16 border-muro bg-transparent text-muro hover:bg-muro hover:text-tinta"
          disabled={timer.rodando || !comecou}
          onClick={() => despachar({ tipo: 'zerarTempo' })}
        >
          Zerar tempo
        </Botao>
      </div>
    </section>
  )
}
