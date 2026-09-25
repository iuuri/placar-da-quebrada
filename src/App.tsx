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
      {/* Topo fixo: logo e, depois de iniciar, o cronômetro resumido ao lado. */}
      <header className="sticky top-0 z-40 bg-muro/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-2">
          <h1 className="inline-flex shrink-0 -rotate-1 flex-col bg-placa px-2.5 py-1 font-display leading-none text-muro shadow-[3px_3px_0_var(--color-placa-escura)] min-[360px]:px-3">
            <span className="text-[0.65rem] font-bold tracking-wide">placar da</span>
            <span className="text-lg font-black uppercase min-[360px]:text-2xl">Quebrada</span>
          </h1>
          {cronometroCompleto ? null : (
            <CronometroMini timer={timer} agora={agora} despachar={despachar} onAbrir={() => setCronometroAberto(true)} />
          )}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-[minmax(0,1fr)] gap-6 px-4 pt-2 pb-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-5">
          <Placar placar={estado.placar} despachar={despachar} />
          {cronometroCompleto ? (
            <Cronometro
              timer={timer}
              agora={agora}
              despachar={despachar}
              onRecolher={() => setCronometroAberto(false)}
              flutuante={flutuante}
            />
          ) : null}
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
      <footer className="border-t-2 border-muro-escuro px-4 pt-4 pb-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <BotaoSumula estado={estado} />
            <ResetarTudo
              onResetar={() => {
                despachar({ tipo: 'resetarTudo' })
                setCronometroAberto(true)
              }}
            />
          </div>
          <InstalarApp />
          <p className="text-center text-xs text-tinta-suave">
            Os dados ficam salvos só neste aparelho. “Resetar tudo” apaga placar, tempo e anotações.
          </p>
        </div>
      </footer>
    </div>
  )
}
