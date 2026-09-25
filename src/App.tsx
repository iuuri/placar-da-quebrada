import { useEffect, useRef, useState } from 'react'
import { Anotacoes } from './components/Anotacoes'
import { Cronometro } from './components/Cronometro'
import { Placar } from './components/Placar'
import { ResetarTudo } from './components/ResetarTudo'
import { useEstado } from './estado'
import { apitar, manterTelaAcesa } from './lib/recursos'
import { acabou, acabouAcrescimo, minutoDeJogo } from './tempo'

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
        <ResetarTudo onResetar={() => despachar({ tipo: 'resetarTudo' })} />
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 pb-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-5">
          <Placar placar={estado.placar} despachar={despachar} />
          <Cronometro timer={timer} agora={agora} despachar={despachar} />
        </div>
        <Anotacoes notas={estado.notas} minuto={minutoDeJogo(timer, agora)} despachar={despachar} />
      </main>

      <footer className="px-4 pb-4 text-center text-xs text-tinta-suave">
        Os dados ficam salvos só neste aparelho. “Resetar tudo” apaga placar, tempo e anotações.
      </footer>
    </div>
  )
}
