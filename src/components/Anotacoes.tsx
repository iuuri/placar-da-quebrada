import { useRef } from 'react'
import type { Acao } from '@/estado'
import { Botao } from './Botao'

type Props = { texto: string; minuto: number; despachar: (a: Acao) => void }

const ATALHOS = [
  { rotulo: '🟨 Amarelo', inserir: '🟨 ' },
  { rotulo: '🟥 Vermelho', inserir: '🟥 ' },
  { rotulo: '⚽ Gol', inserir: '⚽ ' },
  { rotulo: '🔁 Troca', inserir: '🔁 ' },
] as const

export function Anotacoes({ texto, minuto, despachar }: Props) {
  const campo = useRef<HTMLTextAreaElement>(null)

  // Insere "12' 🟨 " numa linha nova, onde está o cursor, e deixa pronto para digitar o nome.
  function inserir(marca: string) {
    const el = campo.current
    const inicio = el?.selectionStart ?? texto.length
    const fim = el?.selectionEnd ?? texto.length
    const antes = texto.slice(0, inicio)
    const quebra = antes === '' || antes.endsWith('\n') ? '' : '\n'
    const trecho = `${quebra}${minuto}' ${marca}`
    const novo = antes + trecho + texto.slice(fim)
    despachar({ tipo: 'anotacoes', texto: novo })
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = inicio + trecho.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <section aria-labelledby="titulo-anotacoes" className="flex flex-col gap-3">
      <h2 id="titulo-anotacoes" className="font-display text-3xl font-bold">
        Anotações
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
        {ATALHOS.map((a) => (
          <Botao key={a.rotulo} variante="contorno" className="px-2" onClick={() => inserir(a.inserir)}>
            {a.rotulo}
          </Botao>
        ))}
      </div>
      <p className="text-sm text-tinta-suave">Os botões anotam o minuto atual ({minuto}'). Depois é só escrever o nome.</p>
      <label htmlFor="anotacoes" className="sr-only">
        Anotações da partida
      </label>
      <textarea
        id="anotacoes"
        ref={campo}
        value={texto}
        onChange={(e) => despachar({ tipo: 'anotacoes', texto: e.target.value })}
        placeholder={"Jogadores, cartões, observações…\nEx.: 12' 🟨 Zé (Time A)"}
        rows={10}
        className="min-h-60 w-full flex-1 resize-y rounded-md border-2 border-muro-escuro bg-white p-3 text-base leading-relaxed focus-visible:border-tinta focus-visible:outline-none"
      />
    </section>
  )
}
