import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar()
      }}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className={cn(
          'subir flex max-h-[92dvh] w-full flex-col gap-4 overflow-y-auto rounded-t-3xl bg-painel px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] ring-1 ring-white/8 sm:rounded-3xl sm:pt-5',
          largo ? 'sm:max-w-lg' : 'sm:max-w-md',
        )}
      >
        {/* alça de folha (bottom sheet) no celular */}
        <span aria-hidden className="mx-auto h-1.5 w-10 shrink-0 rounded-full bg-muro-escuro sm:hidden" />
        <h2 id={idTitulo} className="text-xl font-bold leading-tight">
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  )
}
