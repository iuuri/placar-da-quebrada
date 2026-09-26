import type { TipoNota } from '@/estado'
import { cn } from '@/lib/utils'

// Ícones de linha desenhados à mão (sem biblioteca): herdam a cor do texto.
const CAMINHOS = {
  play: <path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />,
  pausa: (
    <>
      <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  expandir: <path d="m6 9 6 6 6-6" />,
  recolher: <path d="m6 15 6-6 6 6" />,
  troca: (
    <>
      <path d="M4 8h14l-3.5-3.5" />
      <path d="M20 16H6l3.5 3.5" />
    </>
  ),
  cronometro: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.5 1.5M9.5 2.5h5M19 6l1.5-1.5" />
    </>
  ),
  lapis: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  lixeira: <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />,
  documento: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  instalar: (
    <>
      <path d="M12 3v11m-4.5-4.5L12 14l4.5-4.5" />
      <path d="M5 16v4h14v-4" />
    </>
  ),
  reiniciar: (
    <>
      <path d="M4 12a8 8 0 1 0 2.5-5.8" />
      <path d="M4 4v4.5h4.5" />
    </>
  ),
  janela: (
    <>
      <rect x="3" y="4.5" width="18" height="14" rx="2" />
      <rect x="12" y="11" width="6.5" height="5" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  mais: <path d="M12 5v14M5 12h14" />,
  menos: <path d="M5 12h14" />,
  compartilhar: (
    <>
      <path d="M12 15V3.5M8 7.5l4-4 4 4" />
      <path d="M6 11H5v9.5h14V11h-1" />
    </>
  ),
  bola: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7.5 4 2.9-1.5 4.7h-5L8 10.4zM12 3v4.5M16 10.4l4.2-1.6M14.5 15.1l2.6 3.8M9.5 15.1l-2.6 3.8M8 10.4 3.8 8.8" />
    </>
  ),
} as const

export type NomeIcone = keyof typeof CAMINHOS

export function Icone({ nome, className }: { nome: NomeIcone; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-5 shrink-0', className)}
    >
      {CAMINHOS[nome]}
    </svg>
  )
}

// Ícone de cada tipo de registro. Cartões são o próprio cartão (retângulo colorido).
export function IconeTipo({ tipo, className }: { tipo: TipoNota; className?: string }) {
  if (tipo === 'amarelo' || tipo === 'vermelho') {
    return (
      <span
        aria-hidden
        className={cn(
          'inline-block h-5 w-3.5 shrink-0 rotate-6 rounded-[3px]',
          tipo === 'amarelo' ? 'bg-placa' : 'bg-cartao',
          className,
        )}
      />
    )
  }
  const nome: NomeIcone = tipo === 'gol' ? 'bola' : tipo === 'troca' ? 'troca' : tipo === 'punicao' ? 'cronometro' : 'lapis'
  return <Icone nome={nome} className={className} />
}
