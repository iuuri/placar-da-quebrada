import { cn } from '@/lib/utils'

type Props = {
  sigla: string
  cor: string
  escudoUrl?: string | null
  tamanho?: 'sm' | 'lg'
}

// Texto branco ou tinta, o que contrastar melhor com a cor do time.
function corDoTexto(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16)
  if (Number.isNaN(n)) return '#ffffff'
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#14213d' : '#ffffff'
}

// Escudo do time; sem imagem, mostra a sigla na cor do time.
export function EscudoSigla({ sigla, cor, escudoUrl, tamanho = 'sm' }: Props) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center rounded-md font-display font-black leading-none',
    tamanho === 'lg' ? 'size-16 text-xl' : 'size-10 text-sm',
  )
  if (escudoUrl) {
    return <img src={escudoUrl} alt="" className={cn(classes, 'bg-white object-contain')} loading="lazy" />
  }
  return (
    <span aria-hidden className={classes} style={{ backgroundColor: cor, color: corDoTexto(cor) }}>
      {sigla}
    </span>
  )
}
