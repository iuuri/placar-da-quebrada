import { useEffect, useId, useRef, type ReactNode } from 'react'

type Props = {
  titulo: ReactNode
  onFechar: () => void
  children: ReactNode
  largo?: boolean
}

// Pop-up simples: foca o item marcado com data-autofocus (ou o primeiro botão), fecha com Esc ou tocando fora, e devolve o foco ao sair.
export function Dialogo({ titulo, onFechar, children, largo = false }: Props) {
  const idTitulo = useId()
  const caixa = useRef<HTMLDivElement>(null)
  // Guarda a função num ref: o efeito abaixo roda só ao abrir, sem roubar o foco a cada digitação.
  const fechar = useRef(onFechar)
  useEffect(() => {
    fechar.current = onFechar
  }, [onFechar])

  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null
    // [data-autofocus] marca o que deve receber o foco (no celular, focar um campo de texto abriria o teclado).
    const primeiro =
      caixa.current?.querySelector<HTMLElement>('[data-autofocus]') ?? caixa.current?.querySelector<HTMLElement>('button, input')
    primeiro?.focus()
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar.current()
    }
    document.addEventListener('keydown', aoTeclar)
    const rolagem = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = rolagem
      antes?.focus?.()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/60 p-3 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar()
      }}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className={`flex max-h-[90dvh] w-full ${largo ? 'max-w-lg' : 'max-w-md'} flex-col gap-4 overflow-y-auto rounded-md bg-muro p-4 shadow-[6px_6px_0_var(--color-tinta)]`}
      >
        <h2 id={idTitulo} className="font-display text-3xl font-black leading-tight">
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  )
}
