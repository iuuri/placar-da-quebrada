import { useRef, useState } from 'react'
import { MAX_TEXTO_NOTA, type Acao, type Estado, type Lado, type Nota, type TipoNota } from '@/estado'
import { cn, novoId } from '@/lib/utils'
import { TIPOS, TIPOS_BOTAO } from '@/tipos'
import { Botao } from './Botao'
import { Dialogo } from './Dialogo'
import { Icone, IconeTipo } from './Icone'

type Nomes = Record<Lado, string>

type Props = {
  notas: Nota[]
  placar: Estado['placar']
  minuto: number
  decorridoMs: number
  despachar: (a: Acao) => void
}

type Pendente = { tipo: TipoNota; minuto: number; decorridoMs: number }

const CAMPO =
  'min-h-12 w-full rounded-xl bg-muro px-4 text-base font-normal ring-1 ring-inset ring-white/8 placeholder:text-tinta-suave/70 focus-visible:outline-2 focus-visible:outline-placa'

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
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h2 id="titulo-anotacoes" className="text-xl font-bold">
          Registros
          {notas.length > 0 ? (
            <span className="ml-2 rounded-full bg-painel-alto px-2 py-0.5 align-middle text-sm tabular-nums text-tinta-suave">
              {notas.length}
            </span>
          ) : null}
        </h2>
        <span className="text-sm text-tinta-suave">
          minuto <span className="font-display text-lg font-black text-tinta">{minuto}'</span>
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {TIPOS_BOTAO.map((tipo) => (
          <button
            key={tipo}
            type="button"
            aria-label={tipo === 'nota' ? 'Anotar' : TIPOS[tipo].rotulo}
            onClick={() => setPendente({ tipo, minuto, decorridoMs })}
            className="flex min-h-18 flex-col items-center justify-center gap-2 rounded-2xl bg-painel px-0.5 transition-[background-color,transform] hover:bg-painel-alto active:scale-[0.95]"
          >
            <IconeTipo tipo={tipo} className={cn('size-6', TIPOS[tipo].tom)} />
            <span className="max-w-full truncate text-[0.65rem] font-bold tracking-tight min-[360px]:text-xs min-[360px]:tracking-normal">{TIPOS[tipo].curto}</span>
          </button>
        ))}
      </div>

      {notas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-muro-escuro px-4 py-6 text-center text-sm text-tinta-suave">
          Cartões, trocas, punições e anotações aparecem aqui, com o minuto do jogo. Gols são marcados no placar.
        </p>
      ) : (
        <ol
          ref={lista}
          aria-label="Anotações, da mais recente para a mais antiga"
          className="flex max-h-[30rem] flex-col gap-1.5 overflow-y-auto overscroll-contain lg:max-h-[calc(100dvh-22rem)]"
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
        <span className="flex items-center gap-2.5">
          <IconeTipo tipo={pendente.tipo} className={cn('size-6', tipo.tom)} />
          {tipo.rotulo} aos {pendente.minuto}'
        </span>
      }
      onFechar={onFechar}
    >
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        <span>
          {geral ? 'Anotação' : 'Jogador'} <span className="font-normal text-tinta-suave">(opcional)</span>
        </span>
        <input
          value={texto}
          maxLength={MAX_TEXTO_NOTA}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={geral ? 'Ex.: jogo parado por chuva' : 'Ex.: Zé, camisa 10'}
          autoComplete="off"
          className={CAMPO}
        />
      </label>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold">{geral ? 'É sobre qual time?' : 'Para qual time?'}</p>
        <div className="grid grid-cols-2 gap-2">
          {(['casa', 'visitante'] as const).map((lado, i) => (
            <Botao
              key={lado}
              data-autofocus={i === 0 ? true : undefined}
              className="min-h-16 min-w-0 px-2 text-base"
              onClick={() => onEscolher(lado, texto)}
            >
              <span className="truncate">{nomes[lado]}</span>
            </Botao>
          ))}
        </div>
        {geral ? (
          <Botao variante="contorno" onClick={() => onEscolher(null, texto)}>
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
  // Gol não troca de time aqui: para corrigir, tira no placar do time errado e marca no certo.
  const opcoesLado: (Lado | null)[] =
    nota.tipo === 'nota' ? ['casa', 'visitante', null] : nota.tipo === 'gol' ? [] : ['casa', 'visitante']

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-painel p-3">
      <div className="flex items-center gap-2 min-[360px]:gap-3">
        <span className="w-8 shrink-0 text-right font-display text-2xl min-[360px]:w-10 font-black leading-none tabular-nums">
          {nota.minuto}'
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muro min-[360px]:size-10">
          <IconeTipo tipo={nota.tipo} className={tipo.tom} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-bold">
            <span>{tipo.rotulo}</span>
            {nota.lado ? (
              <span className="rounded-full bg-painel-alto px-2 py-px text-xs font-bold text-tinta-suave">
                {nomes[nota.lado]}
              </span>
            ) : null}
          </p>
          {modo === 'editar' ? null : (
            <p className={cn('break-words text-sm', nota.texto ? 'text-tinta' : 'text-tinta-suave italic')}>
              {nota.texto || 'sem descrição'}
            </p>
          )}
        </div>
        {modo === 'ver' ? (
          <div className="flex shrink-0">
            <button
              type="button"
              aria-label="Editar"
              title="Editar"
              className="grid size-10 place-items-center rounded-full text-tinta-suave hover:bg-white/8 hover:text-tinta"
              onClick={() => {
                setRascunho(nota.texto)
                setLadoRascunho(nota.lado)
                setModo('editar')
              }}
            >
              <Icone nome="lapis" className="size-[1.1rem]" />
            </button>
            <button
              type="button"
              aria-label="Apagar"
              title="Apagar"
              className="grid size-10 place-items-center rounded-full text-tinta-suave hover:bg-cartao/15 hover:text-cartao"
              onClick={() => setModo('apagar')}
            >
              <Icone nome="lixeira" className="size-[1.1rem]" />
            </button>
          </div>
        ) : null}
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
            placeholder={nota.tipo === 'nota' ? 'Anotação' : 'Jogador'}
            onChange={(e) => setRascunho(e.target.value)}
            className={cn(CAMPO, 'min-h-11')}
          />
          {opcoesLado.length > 0 ? (
            <div role="radiogroup" aria-label="Time" className="flex flex-wrap gap-1.5">
              {opcoesLado.map((lado) => (
                <button
                  key={lado ?? 'geral'}
                  type="button"
                  role="radio"
                  aria-checked={ladoRascunho === lado}
                  onClick={() => setLadoRascunho(lado)}
                  className={cn(
                    'min-h-10 rounded-full px-4 text-sm font-bold',
                    ladoRascunho === lado ? 'bg-tinta text-muro' : 'bg-painel-alto text-tinta-suave hover:text-tinta',
                  )}
                >
                  {lado ? nomes[lado] : 'Geral'}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Botao variante="texto" className="min-h-10 px-3 text-sm" onClick={() => setModo('ver')}>
              Cancelar
            </Botao>
            <Botao type="submit" className="min-h-10 px-4 text-sm">
              Salvar
            </Botao>
          </div>
        </form>
      ) : modo === 'apagar' ? (
        <div role="group" aria-label="Confirmar exclusão da anotação" className="flex flex-wrap items-center justify-end gap-2">
          <span className="mr-auto text-sm font-bold">
            {nota.tipo === 'gol' ? 'Apagar este gol? O placar também diminui.' : 'Apagar este registro?'}
          </span>
          <Botao variante="texto" className="min-h-10 px-3 text-sm" onClick={() => setModo('ver')}>
            Cancelar
          </Botao>
          <Botao variante="perigo" className="min-h-10 px-4 text-sm" onClick={() => despachar({ tipo: 'removerNota', id: nota.id })}>
            Sim, apagar
          </Botao>
        </div>
      ) : null}
    </li>
  )
}
