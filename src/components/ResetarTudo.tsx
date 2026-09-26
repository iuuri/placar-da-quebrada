import { useState } from 'react'
import { Botao } from './Botao'
import { Icone } from './Icone'

// Reset em dois passos na própria tela (sem window.confirm): evita zerar o jogo com um toque sem querer.
export function ResetarTudo({ onResetar }: { onResetar: () => void }) {
  const [confirmando, setConfirmando] = useState(false)

  if (!confirmando) {
    return (
      <Botao variante="contorno" className="min-h-12 px-4 text-cartao hover:bg-cartao/15" onClick={() => setConfirmando(true)}>
        <Icone nome="reiniciar" className="size-[1.1rem]" />
        Resetar tudo
      </Botao>
    )
  }

  return (
    <div role="group" aria-label="Confirmar reset" className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-cartao/10 p-3 ring-1 ring-cartao/30">
      <span className="w-full text-center font-bold sm:w-auto">Zerar placar, tempo e anotações?</span>
      <Botao
        variante="perigo"
        className="min-h-11 px-4"
        autoFocus
        onClick={() => {
          onResetar()
          setConfirmando(false)
        }}
      >
        Sim, zerar tudo
      </Botao>
      <Botao variante="texto" className="min-h-11" onClick={() => setConfirmando(false)}>
        Cancelar
      </Botao>
    </div>
  )
}
