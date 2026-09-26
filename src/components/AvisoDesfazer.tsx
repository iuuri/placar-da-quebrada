import { useEffect, useRef } from 'react'
import { Icone } from './Icone'

const DURACAO_MS = 6000

// Aviso no rodapé depois de uma ação, com o botão Desfazer. Some sozinho depois de alguns segundos.
export function AvisoDesfazer({ id, texto, onDesfazer, onFechar }: { id: number; texto: string; onDesfazer: () => void; onFechar: () => void }) {
  const fechar = useRef(onFechar)
  useEffect(() => {
    fechar.current = onFechar
  }, [onFechar])
  // Recomeça a contagem a cada aviso novo (id).
  useEffect(() => {
    const t = window.setTimeout(() => fechar.current(), DURACAO_MS)
    return () => window.clearTimeout(t)
  }, [id])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        key={id}
        role="status"
        className="subir pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl bg-tinta py-2 pr-2 pl-4 text-muro shadow-[0_8px_28px_rgb(0_0_0/0.45)]"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-bold">{texto}</span>
        <button
          type="button"
          onClick={onDesfazer}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-muro px-3 text-sm font-bold text-placa active:scale-95"
        >
          <Icone nome="reiniciar" className="size-4" />
          Desfazer
        </button>
      </div>
    </div>
  )
}
