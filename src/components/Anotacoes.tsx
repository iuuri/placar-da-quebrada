import { useRef, useState } from 'react'
import { MAX_TEXTO_NOTA, type Acao, type Estado, type Lado, type Nota, type TipoNota } from '@/estado'
import { cn } from '@/lib/utils'
import { ORDEM_TIPOS, TIPOS } from '@/tipos'
import { Botao } from './Botao'
import { Dialogo } from './Dialogo'

type Nomes = Record<Lado, string>

type Props = {
  notas: Nota[]
  placar: Estado['placar']
  minuto: number
  decorridoMs: number
  despachar: (a: Acao) => void
}

type Pendente = { tipo: TipoNota; minuto: number; decorridoMs: number }

function novoId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function Anotacoes({ notas, placar, minuto, decorridoMs, despachar }: Props) {
  // O minuto e o tempo são guardados no toque do botão (não quando o time é escolhido).
  const [pendente, setPendente] = useState<Pendente | null>(null)
  const lista = useRef<HTMLOListElement>(null)
  const nomes: Nomes = { casa: placar.casa.nome || 'Time A', visitante: placar.visitante.nome || 'Time B' }

  function registrar(lado: Lado | null, texto: string) {
    if (!pendente) return
    despachar({
      tipo: 'adicionarNota',
      nota: { id: novoId(), tipo: pendente.tipo, minuto: pendente.minuto, texto, lado },
      decorridoMs: pendente.decorridoMs,
    })
    setPendente(null)
    lista.current?.scrollTo?.({ top: 0 })
  }

  return (
    <section aria-labelledby="titulo-anotacoes" className="flex min-h-0 flex-col gap-3">
      <h2 id="titulo-anotacoes" className="font-display text-3xl font-bold">
        Anotações {notas.length > 0 ? <span className="text-tinta-suave">({notas.length})</span> : null}
      </h2>

      <div className="flex flex-col gap-2 rounded-md bg-painel p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
          {ORDEM_TIPOS.map((tipo) => (
            <Botao
              key={tipo}
              variante={tipo === 'nota' ? 'contorno' : 'placa'}
              className="px-2"
              onClick={() => setPendente({ tipo, minuto, decorridoMs })}
            >
              {TIPOS[tipo].emoji} {tipo === 'nota' ? 'Anotar' : TIPOS[tipo].rotulo}
            </Botao>
          ))}
        </div>
        <p className="text-sm text-tinta-suave">
          Toque no tipo e escolha o time. O minuto ({minuto}') é registrado sozinho; o nome do jogador é opcional.
        </p>
      </div>

      {notas.length === 0 ? (
        <p className="text-tinta-suave">Nenhuma anotação ainda. As mais recentes aparecem primeiro.</p>
      ) : (
        <ol
          ref={lista}
          aria-label="Anotações, da mais recente para a mais antiga"
          className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto overscroll-contain pr-1 lg:max-h-[calc(100dvh-26rem)]"
        >
          {notas.map((n) => (
            <BlocoNota key={n.id} nota={n} nomes={nomes} despachar={despachar} />
          ))}
        </ol>
      )}

      {pendente ? (
        <EscolherTime pendente={pendente} nomes={nomes} onEscolher={registrar} onFechar={() => setPendente(null)} />
      ) : null}
    </section>
  )
}

function EscolherTime({
  pendente,
  nomes,
  onEscolher,
  onFechar,
}: {
  pendente: Pendente
  nomes: Nomes
  onEscolher: (lado: Lado | null, texto: string) => void
  onFechar: () => void
}) {
  const [texto, setTexto] = useState('')
  const tipo = TIPOS[pendente.tipo]
  const geral = pendente.tipo === 'nota'

  return (
    <Dialogo
      titulo={
        <>
          <span aria-hidden>{tipo.emoji}</span> {tipo.rotulo} aos {pendente.minuto}'
        </>
      }
      onFechar={onFechar}
    >
      <label className="flex flex-col gap-1 font-bold">
        <span>
          {geral ? 'Anotação' : 'Jogador'} <span className="text-sm font-normal text-tinta-suave">(opcional)</span>
        </span>
        <input
          value={texto}
          maxLength={MAX_TEXTO_NOTA}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={geral ? 'Ex.: jogo parado por chuva' : 'Ex.: Zé, camisa 10'}
          autoComplete="off"
          className="min-h-12 rounded-md border-2 border-muro-escuro bg-muro px-3 font-normal focus-visible:border-tinta focus-visible:outline-none"
        />
      </label>
      <div className="flex flex-col gap-2">
        <p className="font-bold">{geral ? 'É sobre qual time?' : 'Para qual time?'}</p>
        {(['casa', 'visitante'] as const).map((lado, i) => (
          <Botao
            key={lado}
            data-autofocus={i === 0 ? true : undefined}
            className="min-h-14 text-lg"
            onClick={() => onEscolher(lado, texto)}
          >
            {nomes[lado]}
          </Botao>
        ))}
        {geral ? (
          <Botao variante="contorno" className="min-h-12" onClick={() => onEscolher(null, texto)}>
            Geral (sem time)
          </Botao>
        ) : null}
      </div>
      <Botao variante="texto" onClick={onFechar}>
        Cancelar
      </Botao>
    </Dialogo>
  )
}

function BlocoNota({ nota, nomes, despachar }: { nota: Nota; nomes: Nomes; despachar: Props['despachar'] }) {
  const [modo, setModo] = useState<'ver' | 'editar' | 'apagar'>('ver')
  const [rascunho, setRascunho] = useState(nota.texto)
  const [ladoRascunho, setLadoRascunho] = useState<Lado | null>(nota.lado)
  const tipo = TIPOS[nota.tipo]
  const idCampo = `editar-${nota.id}`
  const opcoesLado: (Lado | null)[] = nota.tipo === 'nota' ? ['casa', 'visitante', null] : ['casa', 'visitante']

  return (
    <li className={cn('flex flex-col gap-2 rounded-md border-l-8 bg-painel p-3', tipo.faixa)}>
      <div className="flex items-start gap-3">
        <span className="w-12 shrink-0 font-display text-3xl font-black leading-none tabular-nums">{nota.minuto}'</span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 text-sm font-bold">
            <span>
              <span aria-hidden>{tipo.emoji}</span> {tipo.rotulo}
            </span>
            {nota.lado ? (
              <span className="rounded bg-tinta px-1.5 py-0.5 text-xs text-muro">{nomes[nota.lado]}</span>
            ) : null}
          </p>
          {modo === 'editar' ? null : (
            <p className={cn('break-words', !nota.texto && 'text-tinta-suave italic')}>{nota.texto || 'sem descrição'}</p>
          )}
        </div>
      </div>

      {modo === 'editar' ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            despachar({ tipo: 'editarNota', id: nota.id, texto: rascunho, lado: ladoRascunho })
            setModo('ver')
          }}
        >
          <label htmlFor={idCampo} className="sr-only">
            Texto da anotação
          </label>
          <input
            id={idCampo}
            value={rascunho}
            maxLength={MAX_TEXTO_NOTA}
            autoFocus
            onChange={(e) => setRascunho(e.target.value)}
            className="min-h-11 w-full rounded-md border-2 border-tinta px-3"
          />
          <div role="radiogroup" aria-label="Time" className="flex flex-wrap gap-1">
            {opcoesLado.map((lado) => (
              <button
                key={lado ?? 'geral'}
                type="button"
                role="radio"
                aria-checked={ladoRascunho === lado}
                onClick={() => setLadoRascunho(lado)}
                className={cn(
                  'min-h-10 rounded-md border-2 px-3 text-sm font-bold',
                  ladoRascunho === lado ? 'border-tinta bg-tinta text-muro' : 'border-muro-escuro bg-painel',
                )}
              >
                {lado ? nomes[lado] : 'Geral'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Botao type="submit" className="min-h-10 px-3 text-sm">
              Salvar
            </Botao>
            <Botao variante="texto" className="min-h-10 px-2 text-sm" onClick={() => setModo('ver')}>
              Cancelar
            </Botao>
          </div>
        </form>
      ) : modo === 'apagar' ? (
        <div role="group" aria-label="Confirmar exclusão da anotação" className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">Apagar esta anotação?</span>
          <Botao variante="perigo" className="min-h-10 px-3 text-sm" onClick={() => despachar({ tipo: 'removerNota', id: nota.id })}>
            Sim, apagar
          </Botao>
          <Botao variante="texto" className="min-h-10 px-2 text-sm" onClick={() => setModo('ver')}>
            Cancelar
          </Botao>
        </div>
      ) : (
        <div className="flex justify-end gap-1">
          <Botao
            variante="texto"
            className="min-h-10 px-2 text-sm"
            onClick={() => {
              setRascunho(nota.texto)
              setLadoRascunho(nota.lado)
              setModo('editar')
            }}
          >
            Editar
          </Botao>
          <Botao variante="texto" className="min-h-10 px-2 text-sm text-cartao" onClick={() => setModo('apagar')}>
            Apagar
          </Botao>
        </div>
      )}
    </li>
  )
}
