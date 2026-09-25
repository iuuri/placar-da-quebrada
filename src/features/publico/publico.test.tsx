import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import * as api from './api'
import { CampeonatoPublicoPage } from './pages/CampeonatoPublicoPage'
import { TimePublicoPage } from './pages/TimePublicoPage'

vi.mock('./api')

const copa: api.CampeonatoPublico = {
  id: 'c1',
  nome: 'Copa da Vila',
  slug: 'copa-da-vila',
  temporada: '2026',
  modalidade: 'society',
  local_padrao: 'Campo do Jardim',
  status: 'em_andamento',
  publico: true,
}

function renderRota(inicial: string) {
  const router = createMemoryRouter(
    [
      { path: '/c/:slug', element: <CampeonatoPublicoPage /> },
      { path: '/c/:slug/time/:timeId', element: <TimePublicoPage /> },
    ],
    { initialEntries: [inicial] },
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('CampeonatoPublicoPage', () => {
  it('mostra o campeonato e os times com link', async () => {
    vi.mocked(api.buscarCampeonatoPorSlug).mockResolvedValue(copa)
    vi.mocked(api.listarTimesDoCampeonato).mockResolvedValue([
      { id: 't1', campeonato_id: 'c1', nome: 'Unidos da Vila', sigla: 'UV', cor_primaria: '#ff0000', escudo_url: null },
    ])
    renderRota('/c/copa-da-vila')

    expect(await screen.findByRole('heading', { name: 'Copa da Vila' })).toBeInTheDocument()
    expect(screen.getByText(/2026 · Society · Em andamento · Campo do Jardim/)).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Unidos da Vila/ })).toHaveAttribute('href', '/c/copa-da-vila/time/t1')
    expect(document.title).toBe('Copa da Vila · Placar da Quebrada')
  })

  it('avisa quando o campeonato é privado (pré-visualização de quem tem login)', async () => {
    vi.mocked(api.buscarCampeonatoPorSlug).mockResolvedValue({ ...copa, publico: false })
    vi.mocked(api.listarTimesDoCampeonato).mockResolvedValue([])
    renderRota('/c/copa-da-vila')
    expect(await screen.findByText(/não está público/)).toBeInTheDocument()
  })

  it('mostra "não encontrado" para visitante em campeonato inexistente ou privado', async () => {
    vi.mocked(api.buscarCampeonatoPorSlug).mockResolvedValue(null)
    renderRota('/c/nao-existe')
    expect(await screen.findByRole('heading', { name: 'Campeonato não encontrado' })).toBeInTheDocument()
  })
})

describe('TimePublicoPage', () => {
  const time: api.TimeComElenco = {
    id: 't1',
    campeonato_id: 'c1',
    nome: 'Unidos da Vila',
    sigla: 'UV',
    cor_primaria: '#ff0000',
    escudo_url: null,
    jogadores: [{ id: 'j1', nome: 'José Silva', apelido: 'Zé', numero: 10, posicao: 'Meia' }],
  }

  it('mostra o elenco usando o apelido', async () => {
    vi.mocked(api.buscarCampeonatoPorSlug).mockResolvedValue(copa)
    vi.mocked(api.buscarTimeComElenco).mockResolvedValue(time)
    renderRota('/c/copa-da-vila/time/t1')

    expect(await screen.findByRole('heading', { name: 'Unidos da Vila' })).toBeInTheDocument()
    expect(screen.getByText('Zé')).toBeInTheDocument()
    expect(screen.getByText('José Silva · Meia')).toBeInTheDocument()
  })

  it('não mostra time de outro campeonato com o endereço trocado', async () => {
    vi.mocked(api.buscarCampeonatoPorSlug).mockResolvedValue(copa)
    vi.mocked(api.buscarTimeComElenco).mockResolvedValue({ ...time, campeonato_id: 'outro' })
    renderRota('/c/copa-da-vila/time/t1')
    expect(await screen.findByRole('heading', { name: 'Time não encontrado' })).toBeInTheDocument()
  })
})
