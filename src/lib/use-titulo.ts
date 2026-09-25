import { useEffect } from 'react'

const BASE = 'Placar da Quebrada'

// Título da aba/compartilhamento: "Copa da Vila · Placar da Quebrada".
export function useTitulo(titulo?: string | null) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${BASE}` : BASE
    return () => {
      document.title = BASE
    }
  }, [titulo])
}
