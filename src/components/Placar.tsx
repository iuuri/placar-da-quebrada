import { useState } from 'react'
import { MAX_TEXTO_NOTA, type Acao, type Periodo, type Estado, type Lado } from '@/estado'
import { novoId } from '@/lib/utils'
import { Botao } from './Botao'
import { Dialogo } from './Dialogo'
import { Icone, IconeTipo } from './Icone'

type Props = { placar: Estado['placar']; minuto: number; despachar: (a: Acao) => void; periodo: Periodo | null }

type GolAberto = { id: string; lado: Lado; minuto: number }

type TimeProps = {
  lado: Lado
  nome: string
  gols: number
  faltas: number
  despachar: Props['despachar']
  onGol: () => void
}

function Time({ lado, nome, gols, faltas, despachar, onGol }: TimeProps) {
  const id = `nome-${lado}`
  return (
    <div className="flex min-w-0 flex-col items-center gap-3">
      <label htmlFor={id} className="sr-only">
        Nome do {lado === 'casa' ? 'primeiro' : 'segundo'} time
      </label>
      <input
        id={id}
        value={nome}
        onChange={(e) => despachar({ tipo: 'nomeTime', lado, nome: e.target.value })}
        onFocus={(e) => e.target.select()}
        maxLength={30}
        className="w-full truncate rounded-lg bg-transparent px-1 py-1 text-center text-base font-bold text-tinta hover:bg-white/5 focus-visible:bg-muro focus-visible:outline-2 focus-visible:outline-placa sm:text-lg"
      />
      {/* key: o número "pula" a cada mudança */}
      <output
        key={gols}
        aria-live="polite"
        aria-label={`Gols de ${nome}`}
        className="pulo font-display text-[6.5rem] font-black leading-[0.8] tabular-nums sm:text-[8.5rem]"
      >
        {gols}
      </output>
      <div className="flex w-full max-w-64 gap-1.5">
        <Botao
          variante="contorno"
          className="w-11 shrink-0 px-0"
          aria-label={`Tirar um gol de ${nome}`}
          disabled={gols === 0}
          onClick={() => despachar({ tipo: 'tirarGol', lado })}
        >
          <Icone nome="menos" />
        </Botao>
        <Botao className="min-h-12 min-w-0 flex-1 gap-1.5 px-2 text-base" aria-label={`Gol de ${nome}`} onClick={onGol}>
          <Icone nome="bola" className="size-[1.1rem]" />
          Gol
        </Botao>
      </div>
      <div className="flex w-full max-w-64 flex-col items-center gap-1">
        <span className="text-[0.7rem] font-bold text-tinta-suave">Faltas</span>
        <div className="flex w-full items-center justify-between rounded-full bg-muro p-1">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full text-tinta-suave hover:bg-white/8 hover:text-tinta disabled:opacity-30"
            aria-label={`Tirar uma falta de ${nome}`}
            disabled={faltas === 0}
            onClick={() => despachar({ tipo: 'falta', lado, delta: -1 })}
          >
            <Icone nome="menos" className="size-4" />
          </button>
          <output
            aria-live="polite"
            aria-label={`Faltas de ${nome}`}
            className="min-w-6 text-center font-display text-2xl font-black leading-none tabular-nums"
          >
            {faltas}
          </output>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full bg-painel-alto text-tinta hover:bg-white/12"
            aria-label={`Falta de ${nome}`}
            onClick={() => despachar({ tipo: 'falta', lado, delta: 1 })}
          >
            <Icone nome="mais" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Placar({ placar, minuto, despachar, periodo }: Props) {
  const [gol, setGol] = useState<GolAberto | null>(null)
  const nomes = { casa: placar.casa.nome || 'Time A', visitante: placar.visitante.nome || 'Time B' }

  // O gol entra no placar (e nos registros) no toque; o pop-up só serve para pôr o nome do jogador.
  function marcar(lado: Lado) {
    const id = novoId()
    despachar({ tipo: 'marcarGol', lado, id, minuto })
    setGol({ id, lado, minuto })
  }

  return (
    <section aria-label="Placar" className="rounded-3xl bg-painel p-3 min-[360px]:p-4 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-5">
        <Time lado="casa" {...placar.casa} despachar={despachar} onGol={() => marcar('casa')} />
        <span aria-hidden className="mt-[4.6rem] font-display text-3xl font-black text-muro-escuro sm:mt-24 sm:text-4xl">
          ×
        </span>
        <Time lado="visitante" {...placar.visitante} despachar={despachar} onGol={() => marcar('visitante')} />
      </div>
      {gol ? (
        <DialogoGol
          gol={gol}
          periodo={periodo}
          nome={nomes[gol.lado]}
          onSalvar={(texto) => {
            if (texto.trim()) despachar({ tipo: 'editarNota', id: gol.id, texto, lado: gol.lado })
            setGol(null)
          }}
          onDesfazer={() => {
            despachar({ tipo: 'removerNota', id: gol.id })
            setGol(null)
          }}
        />
      ) : null}
    </section>
  )
}

function DialogoGol({
  gol,
  periodo,
  nome,
  onSalvar,
  onDesfazer,
}: {
  gol: GolAberto
  periodo: Periodo | null
  nome: string
  onSalvar: (texto: string) => void
  onDesfazer: () => void
}) {
  const [texto, setTexto] = useState('')
  return (
    <Dialogo
      titulo={
        <span className="flex items-center gap-2">
          <IconeTipo tipo="gol" className="size-7 text-gramado" />
          Gol de {nome} aos {gol.minuto}'{periodo ? ` do ${periodo}º tempo` : ''}
        </span>
      }
      // Fechar tocando fora ou no Esc mantém o gol (e o nome, se já foi digitado).
      onFechar={() => onSalvar(texto)}
    >
      <p className="-mt-2 text-sm text-tinta-suave">O gol já está no placar. Quer pôr quem fez?</p>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSalvar(texto)
        }}
      >
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          <span>
            Jogador <span className="font-normal text-tinta-suave">(opcional)</span>
          </span>
          <input
            value={texto}
            maxLength={MAX_TEXTO_NOTA}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex.: Zé, camisa 10"
            autoComplete="off"
            className="min-h-12 rounded-xl bg-muro px-4 text-base font-normal ring-1 ring-inset ring-white/8 placeholder:text-tinta-suave/70 focus-visible:outline-2 focus-visible:outline-placa"
          />
        </label>
        <Botao type="submit" className="min-h-14 text-lg" data-autofocus>
          Salvar gol
        </Botao>
      </form>
      <Botao variante="texto" onClick={onDesfazer}>
        Desfazer gol
      </Botao>
    </Dialogo>
  )
}
