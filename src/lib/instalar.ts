import { useSyncExternalStore } from 'react'

// Instalação como aplicativo (PWA).
// Android/computador (Chrome, Edge): o navegador avisa com "beforeinstallprompt" e o botão abre a instalação.
// iPhone: a Apple não deixa instalar por botão; a tela mostra o passo a passo do Safari.

export type PedidoInstalar = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let pedido: PedidoInstalar | null = null
let instalou = false
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((f) => f())

// Registrado ao carregar o módulo: o aviso do navegador pode chegar antes da tela montar.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // o app tem o próprio botão
    pedido = e as PedidoInstalar
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    pedido = null
    instalou = true
    avisar()
  })
}

function assinar(f: () => void) {
  ouvintes.add(f)
  return () => ouvintes.delete(f)
}

export function usePedidoInstalar() {
  return useSyncExternalStore(assinar, () => pedido)
}

export function useInstalou() {
  return useSyncExternalStore(assinar, () => instalou)
}

// Abre a instalação do navegador. O pedido só pode ser usado uma vez.
export async function instalar(): Promise<boolean> {
  if (!pedido) return false
  const atual = pedido
  pedido = null
  avisar()
  await atual.prompt()
  const { outcome } = await atual.userChoice
  return outcome === 'accepted'
}

export function ehIphone(ua = navigator.userAgent, toques = navigator.maxTouchPoints): boolean {
  // iPad novo se apresenta como "Macintosh", mas tem tela de toque.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && toques > 1)
}

// Já está aberto como app instalado (sem barra do navegador)?
export function abertoComoApp(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
