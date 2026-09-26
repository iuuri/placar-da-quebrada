import type { Acao, Periodo } from '@/estado'
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
import { Icone } from './Icone'

type Props = {
  timer: EstadoTimer
  agora: number
  despachar: (a: Acao) => void
  // Fechado mostra só o tempo (e iniciar/pausar); aberto mostra os ajustes.
  aberto: boolean
  onAlternar: (abrir: boolean) => void
  // Jogo em 1 ou 2 tempos, e em qual tempo está.
  jogo: { tempos: 1 | 2; periodo: Periodo }
  // Janela flutuante (picture-in-picture); ausente quando o navegador não suporta.
  flutuante?: { aberta: boolean; alternar: () => void; erro: string | null }
}

const MODOS: { valor: Modo; rotulo: string }[] = [
  { valor: 'regressivo', rotulo: 'Regressivo' },
  { valor: 'progressivo', rotulo: 'Progressivo' },
]

const OPCOES_ACRESCIMO = [1, 2, 3, 5]

const TEMPOS: { valor: 1 | 2; rotulo: string }[] = [
  { valor: 1, rotulo: '1 tempo' },
  { valor: 2, rotulo: '2 tempos' },
]

function Situacao({
  timer,
  agora,
  jogo,
  curta = false,
}: {
  timer: EstadoTimer
  agora: number
  jogo: Props['jogo']
  curta?: boolean
}) {
  const acrescimo = timer.acrescimoSeg * 1000
  if (curta) {
    const alem = alemDoTempoMs(timer, agora)
    if (acabouAcrescimo(timer, agora)) return <span className="text-cartao"> · fim do acréscimo</span>
    if (timer.modo === 'progressivo' && alem > 0) return <span className="text-placa"> · acréscimo +{formatar(alem)}</span>
    if (acrescimo > 0) return <span className="text-placa"> · +{Math.round(timer.acrescimoSeg / 60)}' de acréscimo</span>
    return timer.duracaoSeg > 0 ? <> · {formatar(timer.duracaoSeg * 1000)}</> : null
  }
  if (acabou(timer, agora)) {
    if (jogo.tempos === 1) return <>Fim do tempo! Dê acréscimo ou zere o tempo.</>
    return jogo.periodo === 1 ? <>Fim do 1º tempo! Dê acréscimo ou encerre o tempo.</> : <>Fim do jogo! Dê acréscimo se precisar.</>
  }
  if (acabouAcrescimo(timer, agora)) return <span className="rounded-full bg-cartao px-3 py-0.5 text-white">Fim do acréscimo!</span>
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
      <span className="text-tinta-suave">
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
      className={cn('flex flex-col gap-2 rounded-2xl bg-muro p-3', destaque && 'ring-2 ring-placa')}
    >
      <div className="flex min-h-8 items-center justify-between gap-2">
        <span className="text-sm font-bold">
          Acréscimo{minutos > 0 ? <span className="text-placa">: +{minutos}'</span> : ''}
        </span>
        {timer.acrescimoSeg > 0 ? (
          <button
            type="button"
            className="min-h-8 rounded-full px-3 text-sm text-tinta-suave hover:bg-white/8 hover:text-tinta"
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
            className="min-h-12 rounded-xl bg-painel-alto font-display text-2xl font-black transition-[background-color,transform] hover:bg-placa hover:text-muro active:scale-[0.95]"
          >
            +{min}'
          </button>
        ))}
      </div>
    </div>
  )
}

function Alternar({ aberto, onAlternar }: Pick<Props, 'aberto' | 'onAlternar'>) {
  return (
    <button
      type="button"
      onClick={() => onAlternar(!aberto)}
      aria-expanded={aberto}
      aria-label={aberto ? 'Fechar ajustes do cronômetro' : 'Abrir ajustes do cronômetro'}
      title={aberto ? 'Fechar ajustes' : 'Abrir ajustes'}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-painel-alto hover:bg-white/12"
    >
      <Icone nome={aberto ? 'recolher' : 'expandir'} />
    </button>
  )
}

export function Cronometro({ timer, agora, despachar, aberto, onAlternar, jogo, flutuante }: Props) {
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

  const bloqueado = fim || (timer.modo === 'regressivo' && timer.duracaoSeg === 0)
  const doisTempos = jogo.tempos === 2
  // Fechar o 1º tempo: com o tempo parado (no regressivo, ele para sozinho no zero).
  const podeEncerrar = doisTempos && jogo.periodo === 1 && comecou && !timer.rodando
  const intervalo = doisTempos && jogo.periodo === 2 && !comecou
  const rotuloIniciar = comecou ? 'Continuar' : intervalo ? 'Iniciar 2º tempo' : 'Iniciar'
  const nomeTempo = doisTempos ? `${jogo.periodo}º tempo` : null
  function iniciar() {
    prepararSom()
    despachar({ tipo: 'iniciar', agora: Date.now() })
  }

  if (!aberto) {
    return (
      <section aria-label="Cronômetro" className="flex items-center gap-3 rounded-3xl bg-painel py-3 pr-3 pl-5">
        <div role="timer" aria-live="off" aria-label="Tempo" className="min-w-0 flex-1">
          <p className="font-display text-[3.25rem] font-black leading-none tabular-nums">
            {formatar(exibidoMs(timer, agora), timer.modo === 'regressivo')}
          </p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs font-bold text-tinta-suave">
            <span
              aria-hidden
              className={cn('size-2 shrink-0 rounded-full', timer.rodando ? 'ao-vivo bg-gramado' : 'bg-tinta-suave')}
            />
            <span className="truncate">
              {nomeTempo ? `${nomeTempo} · ` : ''}
              {timer.rodando ? (timer.modo === 'regressivo' ? 'Regressivo' : 'Progressivo') : comecou ? 'Pausado' : intervalo ? 'Intervalo' : 'Pronto para começar'}
              <Situacao timer={timer} agora={agora} jogo={jogo} curta />
            </span>
          </p>
        </div>
        {timer.rodando ? (
          <button
            type="button"
            aria-label="Pausar"
            title="Pausar"
            onClick={() => despachar({ tipo: 'pausar', agora: Date.now() })}
            className="grid size-14 shrink-0 place-items-center rounded-full bg-placa text-muro transition-transform active:scale-95"
          >
            <Icone nome="pausa" className="size-6" />
          </button>
        ) : (
          <button
            type="button"
            aria-label={rotuloIniciar}
            title={rotuloIniciar}
            disabled={bloqueado}
            onClick={iniciar}
            className="grid size-14 shrink-0 place-items-center rounded-full bg-placa text-muro transition-transform active:scale-95 disabled:opacity-35"
          >
            <Icone nome="play" className="size-6" />
          </button>
        )}
        <Alternar aberto={aberto} onAlternar={onAlternar} />
      </section>
    )
  }

  return (
    <section aria-label="Cronômetro" className="flex flex-col gap-4 rounded-3xl bg-painel p-4 sm:p-5">
      <div className="-mb-1 flex items-center justify-between gap-2">
        {flutuante ? (
          <button
            type="button"
            onClick={flutuante.alternar}
            aria-pressed={flutuante.aberta}
            className={cn(
              'inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-sm font-bold',
              flutuante.aberta ? 'bg-tinta text-muro' : 'bg-painel-alto text-tinta hover:bg-white/12',
            )}
          >
            <Icone nome="janela" className="size-4" />
            {flutuante.aberta ? 'Fechar janela flutuante' : 'Janela flutuante'}
          </button>
        ) : (
          <span />
        )}
        <Alternar aberto={aberto} onAlternar={onAlternar} />
      </div>
      {flutuante?.erro ? (
        <p role="alert" className="rounded-xl bg-cartao/15 px-3 py-2 text-sm font-bold text-cartao">
          {flutuante.erro}
        </p>
      ) : null}
      <div role="radiogroup" aria-label="Tipo de contagem" className="grid grid-cols-2 gap-1 rounded-xl bg-muro p-1">
        {MODOS.map((m) => (
          <button
            key={m.valor}
            type="button"
            role="radio"
            aria-checked={timer.modo === m.valor}
            disabled={!podeConfigurar}
            onClick={() => despachar({ tipo: 'definirModo', modo: m.valor })}
            className={cn(
              'min-h-10 rounded-lg text-sm font-bold transition-colors disabled:opacity-50',
              timer.modo === m.valor ? 'bg-painel-alto text-tinta shadow-sm' : 'text-tinta-suave hover:text-tinta',
            )}
          >
            {m.rotulo}
          </button>
        ))}
      </div>

      <div
        className={cn('rounded-2xl py-2 text-center', fim && 'alarme')}
        role="timer"
        aria-live="off"
        aria-label={fim ? 'Tempo esgotado' : 'Tempo'}
      >
        {nomeTempo ? <p className="mb-1 text-sm font-bold opacity-70">{intervalo ? `Intervalo · próximo: ${nomeTempo}` : nomeTempo}</p> : null}
        <p className="font-display text-[6rem] font-black leading-none tabular-nums sm:text-[8.5rem]">
          {formatar(exibidoMs(timer, agora), timer.modo === 'regressivo')}
        </p>
        <p className="mt-1 min-h-6 text-sm font-bold">
          <Situacao timer={timer} agora={agora} jogo={jogo} />
        </p>
      </div>

      {mostrarAcrescimo ? <Acrescimo timer={timer} despachar={despachar} destaque={fim} /> : null}

      {podeEncerrar ? (
        <Botao
          variante={fim ? 'placa' : 'contorno'}
          className="min-h-14 text-lg"
          onClick={() => {
            despachar({ tipo: 'encerrarTempo' })
            onAlternar(false)
          }}
        >
          Encerrar 1º tempo
        </Botao>
      ) : null}

      {podeConfigurar && !comecou && jogo.periodo === 1 ? (
        <div role="radiogroup" aria-label="Tempos de jogo" className="grid grid-cols-2 gap-1 rounded-xl bg-muro p-1">
          {TEMPOS.map((t) => (
            <button
              key={t.valor}
              type="button"
              role="radio"
              aria-checked={jogo.tempos === t.valor}
              onClick={() => despachar({ tipo: 'definirTempos', tempos: t.valor })}
              className={cn(
                'min-h-10 rounded-lg text-sm font-bold transition-colors',
                jogo.tempos === t.valor ? 'bg-painel-alto text-tinta shadow-sm' : 'text-tinta-suave hover:text-tinta',
              )}
            >
              {t.rotulo}
            </button>
          ))}
        </div>
      ) : null}

      {podeConfigurar && !comecou ? (
        <fieldset className="flex flex-wrap items-end justify-center gap-2">
          <legend className="mb-2 w-full text-center text-sm text-tinta-suave">
            {timer.modo === 'regressivo'
              ? doisTempos
                ? 'Cada tempo começa em'
                : 'Contar a partir de'
              : doisTempos
                ? 'Duração de cada tempo (0 = sem limite)'
                : 'Tempo de jogo (0 = sem limite)'}
          </legend>
          <label className="flex flex-col items-center gap-1 text-xs font-bold text-tinta-suave">
            Minutos
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={999}
              value={minutos}
              onChange={(e) => definirDuracao(e.target.valueAsNumber, segundos)}
              className={CAMPO_TEMPO}
            />
          </label>
          <span className="pb-2 font-display text-3xl font-black text-tinta-suave">:</span>
          <label className="flex flex-col items-center gap-1 text-xs font-bold text-tinta-suave">
            Segundos
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              value={segundos}
              onChange={(e) => definirDuracao(minutos, Math.min(59, e.target.valueAsNumber))}
              className={CAMPO_TEMPO}
            />
          </label>
        </fieldset>
      ) : null}

      <div className="flex gap-2">
        {timer.rodando ? (
          <Botao className="min-h-16 flex-1 text-xl" onClick={() => despachar({ tipo: 'pausar', agora: Date.now() })}>
            <Icone nome="pausa" />
            Pausar
          </Botao>
        ) : (
          <Botao
            className="min-h-16 flex-1 text-xl"
            disabled={bloqueado}
            onClick={() => {
              iniciar()
              onAlternar(false)
            }}
          >
            <Icone nome="play" />
            {rotuloIniciar}
          </Botao>
        )}
        <Botao
          variante="contorno"
          className="min-h-16 px-4"
          disabled={timer.rodando || !comecou}
          onClick={() => despachar({ tipo: 'zerarTempo' })}
        >
          <Icone nome="reiniciar" className="size-4" />
          Zerar tempo
        </Botao>
      </div>
    </section>
  )
}

const CAMPO_TEMPO =
  'h-14 w-24 rounded-xl bg-muro text-center font-display text-3xl font-black text-tinta ring-1 ring-inset ring-white/8 focus-visible:outline-2 focus-visible:outline-placa'
