import type { Acao } from '@/estado'
import { prepararSom } from '@/lib/recursos'
import { cn } from '@/lib/utils'
import {
  acabou,
  acabouAcrescimo,
  alemDoTempoMs,
  decorridoMs,
  exibidoMs,
  formatar,
  type EstadoTimer,
  type Modo,
} from '@/tempo'
import { Botao } from './Botao'

type Props = {
  timer: EstadoTimer
  agora: number
  despachar: (a: Acao) => void
  // Chamado ao iniciar/continuar e no botão Recolher: a tela troca pelo cronômetro resumido.
  onRecolher: () => void
  // Janela flutuante (picture-in-picture); ausente quando o navegador não suporta.
  flutuante?: { aberta: boolean; alternar: () => void; erro: string | null }
}

const MODOS: { valor: Modo; rotulo: string }[] = [
  { valor: 'regressivo', rotulo: 'Regressivo' },
  { valor: 'progressivo', rotulo: 'Progressivo' },
]

const OPCOES_ACRESCIMO = [1, 2, 3, 5]

function Situacao({ timer, agora }: { timer: EstadoTimer; agora: number }) {
  const acrescimo = timer.acrescimoSeg * 1000
  if (acabou(timer, agora)) return <>Fim do tempo! Dê acréscimo ou zere o tempo.</>
  if (acabouAcrescimo(timer, agora)) return <span className="rounded bg-cartao px-2 text-white">Fim do acréscimo!</span>
  if (timer.modo === 'regressivo') {
    return acrescimo > 0 ? <span className="text-placa">Com acréscimo de +{formatar(acrescimo)}</span> : null
  }
  const alem = alemDoTempoMs(timer, agora)
  if (alem > 0) {
    return (
      <span className="text-placa">
        Acréscimo +{formatar(alem)}
        {acrescimo > 0 ? ` de +${formatar(acrescimo)}` : ''}
      </span>
    )
  }
  if (decorridoMs(timer, agora) > 0 && timer.duracaoSeg > 0) {
    return (
      <span className="text-muro/70">
        Tempo de jogo: {formatar(timer.duracaoSeg * 1000)}
        {acrescimo > 0 ? ` + ${formatar(acrescimo)} de acréscimo` : ''}
      </span>
    )
  }
  return null
}

function Acrescimo({ timer, despachar, destaque }: { timer: EstadoTimer; despachar: Props['despachar']; destaque: boolean }) {
  const minutos = Math.round(timer.acrescimoSeg / 60)
  return (
    <div
      role="group"
      aria-label="Acréscimo"
      className={cn('flex flex-col gap-2 rounded-md p-2', destaque ? 'bg-placa/20 ring-2 ring-placa' : 'bg-white/10')}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold">Acréscimo{minutos > 0 ? `: ${minutos}'` : ''}</span>
        {timer.acrescimoSeg > 0 ? (
          <button
            type="button"
            className="min-h-10 px-2 text-sm underline underline-offset-4"
            onClick={() => despachar({ tipo: 'acrescimo', segundos: -timer.acrescimoSeg })}
          >
            Tirar acréscimo
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {OPCOES_ACRESCIMO.map((min) => (
          <button
            key={min}
            type="button"
            aria-label={`Dar ${min} minuto${min > 1 ? 's' : ''} de acréscimo`}
            onClick={() => despachar({ tipo: 'acrescimo', segundos: min * 60 })}
            className="min-h-12 rounded-md bg-white font-display text-2xl font-black text-tinta hover:bg-placa"
          >
            +{min}'
          </button>
        ))}
      </div>
    </div>
  )
}

export function Cronometro({ timer, agora, despachar, onRecolher, flutuante }: Props) {
  const fim = acabou(timer, agora)
  const comecou = decorridoMs(timer, agora) > 0
  const minutos = Math.floor(timer.duracaoSeg / 60)
  const segundos = timer.duracaoSeg % 60
  const podeConfigurar = !timer.rodando
  // Acréscimo só faz sentido quando existe um tempo de jogo definido.
  const mostrarAcrescimo = comecou && timer.duracaoSeg > 0

  function definirDuracao(min: number, seg: number) {
    despachar({ tipo: 'definirDuracao', segundos: (Number.isFinite(min) ? min : 0) * 60 + (Number.isFinite(seg) ? seg : 0) })
  }

  return (
    <section aria-label="Cronômetro" className="flex flex-col gap-4 rounded-md bg-tinta p-4 text-muro sm:p-5">
      {(comecou && !fim) || flutuante ? (
        <div className="-mb-2 flex flex-wrap items-center justify-between gap-2">
          {flutuante ? (
            <button
              type="button"
              onClick={flutuante.alternar}
              aria-pressed={flutuante.aberta}
              className="min-h-10 rounded-md border-2 border-muro/60 px-2.5 text-sm font-bold"
            >
              {flutuante.aberta ? '📺 Fechar janela flutuante' : '📺 Janela flutuante'}
            </button>
          ) : (
            <span />
          )}
          {comecou && !fim ? (
            <button
              type="button"
              onClick={onRecolher}
              aria-label="Recolher cronômetro"
              className="min-h-10 text-sm font-bold underline underline-offset-4"
            >
              Recolher ▴
            </button>
          ) : null}
        </div>
      ) : null}
      {flutuante?.erro ? (
        <p role="alert" className="-mb-2 rounded bg-cartao px-2 py-1 text-sm font-bold text-white">
          {flutuante.erro}
        </p>
      ) : null}
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
          <Situacao timer={timer} agora={agora} />
        </p>
      </div>

      {mostrarAcrescimo ? <Acrescimo timer={timer} despachar={despachar} destaque={fim} /> : null}

      {podeConfigurar && !comecou ? (
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
              onRecolher()
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
