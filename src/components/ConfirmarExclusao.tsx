import { useState, type ReactNode } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type Props = {
  titulo: string
  descricao: ReactNode
  pergunta: string
  rotulo: string
  apagando: boolean
  erro: string | null
  onConfirmar: () => void
}

// Exclusão em dois passos na própria tela (sem window.confirm, que trava no celular e em automações).
export function ConfirmarExclusao({ titulo, descricao, pergunta, rotulo, apagando, erro, onConfirmar }: Props) {
  const [confirmando, setConfirmando] = useState(false)

  return (
    <div className="mt-6 flex max-w-2xl flex-col gap-3 border-t-2 border-cartao pt-4">
      <h2 className="font-display text-2xl font-bold">{titulo}</h2>
      <p className="text-tinta-suave">{descricao}</p>
      {erro ? <Alert>{erro}</Alert> : null}
      {confirmando ? (
        <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Confirmar exclusão">
          <p className="w-full font-bold">{pergunta}</p>
          <Button
            className="bg-cartao text-white shadow-none hover:bg-cartao/90"
            disabled={apagando}
            onClick={onConfirmar}
          >
            {apagando ? 'Apagando…' : 'Sim, apagar'}
          </Button>
          <Button variant="secondary" onClick={() => setConfirmando(false)} disabled={apagando}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          className="self-start border-cartao text-cartao hover:bg-cartao hover:text-white"
          onClick={() => setConfirmando(true)}
        >
          {rotulo}
        </Button>
      )}
    </div>
  )
}
