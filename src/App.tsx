import { useEffect, useRef, useState } from 'react'
import { Anotacoes } from './components/Anotacoes'
import { Cronometro } from './components/Cronometro'
import { InstalarApp } from './components/InstalarApp'
import { CronometroMini } from './components/CronometroMini'
import { Placar } from './components/Placar'
import { Punicoes } from './components/Punicoes'
import { ResetarTudo } from './components/ResetarTudo'
import { BotaoSumula } from './components/Sumula'
import { useEstado } from './estado'
import { cn } from './lib/utils'
import { abrirFlutuante, suportaFlutuante } from './lib/flutuante'
import { apitar, manterTelaAcesa } from './lib/recursos'
import { acabou, acabouAcrescimo, decorridoMs, minutoDeJogo, restantePunicaoMs } from './tempo'

// Relógio da tela: só "bate" enquanto o tempo corre (o valor certo vem dos timestamps).
function useAgora(ativo: boolean) {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    if (!ativo) return
    const bater = () => setAgora(Date.now())
    bater()
    const id = window.setInterval(bater, 200)
    return () => window.clearInterval(id)
  }, [ativo])
  return agora
}

export function App() {
  const [estado, despachar] = useEstado()
  const { timer } = estado
  const agora = useAgora(timer.rodando)

  // Janela flutuante: lê sempre o estado mais recente (atualizado a cada render).
  const estadoAtual = useRef(estado)
  useEffect(() => {
    estadoAtual.current = estado
  }, [estado])
  const [flutuanteAberta, setFlutuanteAberta] = useState(false)
  const [erroFlutuante, setErroFlutuante] = useState<string | null>(null)
  const fecharFlutuante = useRef<(() => void) | null>(null)
  async function alternarFlutuante() {
    setErroFlutuante(null)
    if (fecharFlutuante.current) {
      fecharFlutuante.current()
      return
    }
    try {
      fecharFlutuante.current = await abrirFlutuante(
        () => estadoAtual.current,
        () => {
          fecharFlutuante.current = null
          setFlutuanteAberta(false)
        },
      )
      setFlutuanteAberta(true)
    } catch {
      setErroFlutuante('Este navegador não abriu a janela flutuante.')
    }
  }
  const flutuante = suportaFlutuante()
    ? { aberta: flutuanteAberta, alternar: () => void alternarFlutuante(), erro: erroFlutuante }
    : undefined
  const fim = acabou(timer, agora)
  // O cronômetro fica em cima do placar, fechado por padrão (só o tempo); os ajustes abrem na seta.
  const [cronometroAberto, setCronometroAberto] = useState(false)
  // Regressivo parado com o tempo normal esgotado (acabou, ou já deu acréscimo e falta tocar em Continuar):
  // abre os ajustes sozinho para dar acréscimo com calma.
  const esperandoAcrescimo =
    timer.modo === 'regressivo' && !timer.rodando && timer.duracaoSeg > 0 && timer.acumuladoMs >= timer.duracaoSeg * 1000
  const ajustesAbertos = cronometroAberto || fim || esperandoAcrescimo

  // Quando o cronômetro sai da tela (rolando até os registros), o tempo aparece pequeno no topo.
  const areaCronometro = useRef<HTMLDivElement>(null)
  const [cronometroNaTela, setCronometroNaTela] = useState(true)
  useEffect(() => {
    const alvo = areaCronometro.current
    if (!alvo || typeof IntersectionObserver === 'undefined') return
    // A margem desconta a altura do topo fixo.
    const observador = new IntersectionObserver(([e]) => setCronometroNaTela(e.isIntersecting), { rootMargin: '-72px 0px 0px 0px' })
    observador.observe(alvo)
    return () => observador.disconnect()
  }, [])
  const mostrarMini = !cronometroNaTela

  // Regressivo chegou a zero: para o tempo e apita.
  useEffect(() => {
    if (timer.rodando && fim) {
      despachar({ tipo: 'pausar', agora: Date.now() })
      apitar()
    }
  }, [timer.rodando, fim, despachar])

  // Progressivo: apita uma vez quando termina o acréscimo dado (o tempo continua correndo).
  const fimAcrescimo = acabouAcrescimo(timer, agora)
  const apitouAcrescimo = useRef(fimAcrescimo)
  useEffect(() => {
    if (fimAcrescimo && !apitouAcrescimo.current && timer.rodando) apitar()
    apitouAcrescimo.current = fimAcrescimo
  }, [fimAcrescimo, timer.rodando])

  // Apita quando alguma punição de 2 minutos termina.
  const cumpridas = estado.punicoes
    .filter((p) => restantePunicaoMs(p, timer, agora) === 0)
    .map((p) => p.id)
    .join(',')
  const cumpridasAntes = useRef(cumpridas)
  useEffect(() => {
    const antes = new Set(cumpridasAntes.current.split(',').filter(Boolean))
    if (cumpridas.split(',').some((id) => id && !antes.has(id))) apitar()
    cumpridasAntes.current = cumpridas
  }, [cumpridas])

  useEffect(() => {
    if (!timer.rodando) return
    let liberar: (() => void) | undefined
    let cancelado = false
    void manterTelaAcesa().then((fn) => (cancelado ? fn() : (liberar = fn)))
    return () => {
      cancelado = true
      liberar?.()
    }
  }, [timer.rodando])

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Topo fixo: logo e, depois de iniciar, o cronômetro resumido ao lado. */}
      <header className="sticky top-0 z-40 bg-muro/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 py-2">
          <h1 className="flex shrink-0 items-center gap-2.5">
            <img src="/favicon.svg" alt="" width={40} height={40} className="size-10 rounded-xl" />
            {/* Com o cronômetro resumido no topo, em tela bem estreita, o nome fica só para leitores de tela. */}
            <span className={cn('flex flex-col leading-none', mostrarMini && 'max-[419px]:sr-only')}>
              <span className="text-xs font-bold text-tinta-suave">Placar da</span>
              <span className="font-display text-2xl font-black">Quebrada</span>
            </span>
          </h1>
          {mostrarMini ? (
            <CronometroMini
              timer={timer}
              agora={agora}
              despachar={despachar}
              onAbrir={() => areaCronometro.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
          ) : null}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-[minmax(0,1fr)] gap-5 px-4 pt-2 pb-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <div ref={areaCronometro} className="scroll-mt-20">
            <Cronometro
              timer={timer}
              agora={agora}
              despachar={despachar}
              aberto={ajustesAbertos}
              onAlternar={setCronometroAberto}
              flutuante={flutuante}
            />
          </div>
          <Placar placar={estado.placar} minuto={minutoDeJogo(timer, agora)} despachar={despachar} />
          <Punicoes punicoes={estado.punicoes} placar={estado.placar} timer={timer} agora={agora} despachar={despachar} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <Anotacoes
            notas={estado.notas}
            placar={estado.placar}
            minuto={minutoDeJogo(timer, agora)}
            decorridoMs={decorridoMs(timer, agora)}
            despachar={despachar}
          />
        </div>
      </main>

      {/* Ações de fim de jogo ficam no fim da página, longe dos botões do dia a dia. */}
      <footer className="border-t border-muro-escuro px-4 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <BotaoSumula estado={estado} />
            <InstalarApp />
            <ResetarTudo
              onResetar={() => {
                despachar({ tipo: 'resetarTudo' })
                setCronometroAberto(false)
              }}
            />
          </div>
          <p className="text-center text-xs text-tinta-suave">
            Os dados ficam salvos só neste aparelho. “Resetar tudo” apaga placar, tempo e anotações.
          </p>
        </div>
      </footer>
    </div>
  )
}
