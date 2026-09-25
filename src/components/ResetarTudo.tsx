import { useState } from 'react'
import { Botao } from './Botao'

// Reset em dois passos na própria tela (sem window.confirm): evita zerar o jogo com um toque sem querer.
export function ResetarTudo({ onResetar }: { onResetar: () => void }) {
  const [confirmando, setConfirmando] = useState(false)

  if (!confirmando) {
    return (
      <Botao variante="contorno" className="min-h-11 border-cartao text-cartao hover:bg-cartao hover:text-white" onClick={() => setConfirmando(true)}>
        Resetar tudo
      </Botao>
    )
  }

  return (
    <div role="group" aria-label="Confirmar reset" className="flex flex-wrap items-center justify-end gap-2">
      <span className="font-bold">Zerar placar, tempo e anotações?</span>
      <Botao
        variante="perigo"
        className="min-h-11"
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
