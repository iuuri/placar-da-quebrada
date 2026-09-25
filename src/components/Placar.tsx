import type { Acao, Estado, Lado } from '@/estado'
import { Botao } from './Botao'

type Props = { placar: Estado['placar']; despachar: (a: Acao) => void }

function Time({ lado, nome, gols, despachar }: { lado: Lado; nome: string; gols: number; despachar: Props['despachar'] }) {
  const id = `nome-${lado}`
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <label htmlFor={id} className="sr-only">
        Nome do {lado === 'casa' ? 'primeiro' : 'segundo'} time
      </label>
      <input
        id={id}
        value={nome}
        onChange={(e) => despachar({ tipo: 'nomeTime', lado, nome: e.target.value })}
        onFocus={(e) => e.target.select()}
        maxLength={30}
        className="w-full rounded-md border-2 border-transparent bg-transparent px-1 text-center font-display text-2xl font-bold leading-tight hover:border-muro-escuro focus-visible:border-tinta focus-visible:bg-white focus-visible:outline-none sm:text-3xl"
      />
      <output
        aria-live="polite"
        aria-label={`Gols de ${nome}`}
        className="font-display text-8xl font-black leading-none tabular-nums sm:text-9xl"
      >
        {gols}
      </output>
      <div className="flex w-full gap-2">
        <Botao
          variante="contorno"
          className="w-14 shrink-0 text-2xl"
          aria-label={`Tirar um gol de ${nome}`}
          disabled={gols === 0}
          onClick={() => despachar({ tipo: 'gol', lado, delta: -1 })}
        >
          −
        </Botao>
        <Botao
          className="min-h-14 flex-1 whitespace-nowrap px-2 text-lg sm:text-xl"
          aria-label={`Gol de ${nome}`}
          onClick={() => despachar({ tipo: 'gol', lado, delta: 1 })}
        >
          + Gol
        </Botao>
      </div>
    </div>
  )
}

export function Placar({ placar, despachar }: Props) {
  return (
    <section aria-label="Placar" className="rounded-md border-2 border-tinta bg-white p-3 shadow-[4px_4px_0_var(--color-tinta)] sm:p-5">
      <div className="flex items-start gap-2 sm:gap-4">
        <Time lado="casa" {...placar.casa} despachar={despachar} />
        <span aria-hidden className="mt-16 font-display text-4xl font-black text-tinta-suave sm:mt-20">
          ×
        </span>
        <Time lado="visitante" {...placar.visitante} despachar={despachar} />
      </div>
    </section>
  )
}
