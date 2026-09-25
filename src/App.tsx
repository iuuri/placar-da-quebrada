import { useEffect, useRef, useState } from 'react'
import { Anotacoes } from './components/Anotacoes'
import { Cronometro } from './components/Cronometro'
import { CronometroMini } from './components/CronometroMini'
import { Placar } from './components/Placar'
import { Punicoes } from './components/Punicoes'
import { ResetarTudo } from './components/ResetarTudo'
import { BotaoSumula } from './components/Sumula'
import { useEstado } from './estado'
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
  const fim = acabou(timer, agora)
  const comecou = timer.rodando || decorridoMs(timer, agora) > 0
  // Depois de iniciar, o cronômetro vira uma barra pequena no rodapé; abre de novo no fim do tempo.
  const [cronometroAberto, setCronometroAberto] = useState(!comecou)
  // Regressivo parado com o tempo normal esgotado (acabou, ou já deu acréscimo e falta tocar em Continuar):
  // mostra o completo para dar acréscimo com calma.
  const esperandoAcrescimo =
    timer.modo === 'regressivo' && !timer.rodando && timer.duracaoSeg > 0 && timer.acumuladoMs >= timer.duracaoSeg * 1000
  const cronometroCompleto = cronometroAberto || fim || !comecou || esperandoAcrescimo

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
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h1 className="inline-flex -rotate-1 flex-col bg-placa px-3 py-1 font-display leading-none text-tinta shadow-[4px_4px_0_var(--color-tinta)]">
          <span className="text-[0.7rem] font-bold tracking-wide">placar da</span>
          <span className="text-2xl font-black uppercase">Quebrada</span>
        </h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <BotaoSumula estado={estado} />
          <ResetarTudo
            onResetar={() => {
              despachar({ tipo: 'resetarTudo' })
              setCronometroAberto(true)
            }}
          />
        </div>
      </header>

      <main
        className={`mx-auto grid w-full max-w-6xl flex-1 grid-cols-[minmax(0,1fr)] gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_22rem] ${cronometroCompleto ? 'pb-10' : 'pb-28'}`}
      >
        <div className="flex flex-col gap-5">
          <Placar placar={estado.placar} despachar={despachar} />
          {cronometroCompleto ? (
            <Cronometro timer={timer} agora={agora} despachar={despachar} onRecolher={() => setCronometroAberto(false)} />
          ) : (
            <CronometroMini timer={timer} agora={agora} despachar={despachar} onAbrir={() => setCronometroAberto(true)} />
          )}
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

      <footer className="px-4 pb-4 text-center text-xs text-tinta-suave">
        Os dados ficam salvos só neste aparelho. “Resetar tudo” apaga placar, tempo e anotações.
      </footer>
    </div>
  )
}
