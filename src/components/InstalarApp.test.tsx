import { act, fireEvent, render, screen } from '@testing-library/react'
import { ehIphone } from '@/lib/instalar'
import { InstalarApp } from './InstalarApp'

const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'

describe('instalar app', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reconhece iPhone e iPad (que se apresenta como Mac com toque)', () => {
    expect(ehIphone(UA_IPHONE, 5)).toBe(true)
    expect(ehIphone('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 5)).toBe(true)
    expect(ehIphone('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 0)).toBe(false)
    expect(ehIphone('Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', 5)).toBe(false)
  })

  it('no iPhone mostra o passo a passo do Safari', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(UA_IPHONE)
    render(<InstalarApp />)
    fireEvent.click(screen.getByRole('button', { name: '📲 Instalar app' }))
    expect(screen.getByRole('dialog', { name: '📲 Instalar no iPhone' })).toHaveTextContent('Adicionar à Tela de Início')
    fireEvent.click(screen.getByRole('button', { name: 'Entendi' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('no Android usa a instalação do navegador', async () => {
    render(<InstalarApp />)
    const prompt = vi.fn().mockResolvedValue(undefined)
    const evento = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    })
    act(() => {
      window.dispatchEvent(evento)
    })
    expect(evento.defaultPrevented).toBe(true)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '📲 Instalar app' }))
    })
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(screen.getByText(/App instalado/)).toBeInTheDocument()
  })
})
