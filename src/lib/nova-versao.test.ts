import { ehErroDeVersaoAntiga, recarregarParaNovaVersao } from './nova-versao'

describe('ehErroDeVersaoAntiga', () => {
  it('reconhece falha de import dinâmico do Chrome e do Safari', () => {
    expect(ehErroDeVersaoAntiga(new TypeError('Failed to fetch dynamically imported module: /assets/x.js'))).toBe(true)
    expect(ehErroDeVersaoAntiga(new TypeError('Importing a module script failed.'))).toBe(true)
  })

  it('ignora outros erros', () => {
    expect(ehErroDeVersaoAntiga(new Error('permission denied'))).toBe(false)
  })
})

describe('recarregarParaNovaVersao', () => {
  const reload = vi.fn()

  beforeEach(() => {
    sessionStorage.clear()
    reload.mockClear()
    vi.stubGlobal('location', { ...window.location, reload })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('recarrega uma vez e não entra em loop', () => {
    expect(recarregarParaNovaVersao()).toBe(true)
    expect(recarregarParaNovaVersao()).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
