import { useRef, useState, type FormEvent } from 'react'
import { MAX_TEXTO_NOTA, type Acao, type Nota, type TipoNota } from '@/estado'
import { cn } from '@/lib/utils'
import { Botao } from './Botao'

type Props = { notas: Nota[]; minuto: number; despachar: (a: Acao) => void }

const TIPOS: Record<TipoNota, { emoji: string; rotulo: string; faixa: string }> = {
  amarelo: { emoji: '🟨', rotulo: 'Amarelo', faixa: 'border-l-placa' },
  vermelho: { emoji: '🟥', rotulo: 'Vermelho', faixa: 'border-l-cartao' },
  gol: { emoji: '⚽', rotulo: 'Gol', faixa: 'border-l-gramado' },
  troca: { emoji: '🔁', rotulo: 'Troca', faixa: 'border-l-tinta-suave' },
  nota: { emoji: '📝', rotulo: 'Anotação', faixa: 'border-l-muro-escuro' },
}

const BOTOES: TipoNota[] = ['amarelo', 'vermelho', 'gol', 'troca']

function novoId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function Anotacoes({ notas, minuto, despachar }: Props) {
  const [texto, setTexto] = useState('')
  const campo = useRef<HTMLInputElement>(null)
  const lista = useRef<HTMLOListElement>(null)

  function adicionar(tipo: TipoNota) {
    if (tipo === 'nota' && texto.trim() === '') {
      campo.current?.focus()
      return
    }
    despachar({ tipo: 'adicionarNota', nota: { id: novoId(), tipo, minuto, texto } })
    setTexto('')
    // O bloco novo entra no topo: garante que ele aparece.
    lista.current?.scrollTo?.({ top: 0 })
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    adicionar('nota')
  }

  return (
    <section aria-labelledby="titulo-anotacoes" className="flex min-h-0 flex-col gap-3">
      <h2 id="titulo-anotacoes" className="font-display text-3xl font-bold">
        Anotações {notas.length > 0 ? <span className="text-tinta-suave">({notas.length})</span> : null}
      </h2>

      <form onSubmit={enviar} className="flex flex-col gap-2 rounded-md bg-white p-3">
        <label htmlFor="texto-nota" className="font-bold">
          Jogador ou observação <span className="font-normal text-tinta-suave">(opcional)</span>
        </label>
        <div className="flex gap-2">
          <input
            id="texto-nota"
            ref={campo}
            value={texto}
            maxLength={MAX_TEXTO_NOTA}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex.: Zé, camisa 10 (Time A)"
            autoComplete="off"
            className="min-h-12 w-full min-w-0 rounded-md border-2 border-muro-escuro px-3 text-base focus-visible:border-tinta focus-visible:outline-none"
          />
          <Botao type="submit" variante="contorno" className="shrink-0 px-3" aria-label="Anotar observação">
            📝 Anotar
          </Botao>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          {BOTOES.map((tipo) => (
            <Botao key={tipo} className="px-2" onClick={() => adicionar(tipo)}>
              {TIPOS[tipo].emoji} {TIPOS[tipo].rotulo}
            </Botao>
          ))}
        </div>
        <p className="text-sm text-tinta-suave">
          Toque no tipo para registrar no minuto atual ({minuto}'). Cada anotação vira um bloco separado.
        </p>
      </form>

      {notas.length === 0 ? (
        <p className="text-tinta-suave">Nenhuma anotação ainda. As mais recentes aparecem primeiro.</p>
      ) : (
        <ol
          ref={lista}
          aria-label="Anotações, da mais recente para a mais antiga"
          className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto overscroll-contain pr-1 lg:max-h-[calc(100dvh-26rem)]"
        >
          {notas.map((n) => (
            <BlocoNota key={n.id} nota={n} despachar={despachar} />
          ))}
        </ol>
      )}
    </section>
  )
}

function BlocoNota({ nota, despachar }: { nota: Nota; despachar: Props['despachar'] }) {
  const [modo, setModo] = useState<'ver' | 'editar' | 'apagar'>('ver')
  const [rascunho, setRascunho] = useState(nota.texto)
  const tipo = TIPOS[nota.tipo]
  const idCampo = `editar-${nota.id}`

  return (
    <li className={cn('flex flex-col gap-2 rounded-md border-l-8 bg-white p-3', tipo.faixa)}>
      <div className="flex items-start gap-3">
        <span className="w-12 shrink-0 font-display text-3xl font-black leading-none tabular-nums">{nota.minuto}'</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            <span aria-hidden>{tipo.emoji}</span> {tipo.rotulo}
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
            despachar({ tipo: 'editarNota', id: nota.id, texto: rascunho })
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
