import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampeonatoForm } from './components/CampeonatoForm'

function renderForm(onSalvar = vi.fn()) {
  render(<CampeonatoForm salvando={false} erro={null} rotuloSalvar="Criar campeonato" onSalvar={onSalvar} />)
  return onSalvar
}

describe('CampeonatoForm', () => {
  it('preenche o endereço a partir do nome e envia valores convertidos', async () => {
    const user = userEvent.setup()
    const onSalvar = renderForm()

    await user.type(screen.getByLabelText('Nome do campeonato'), 'Copa da Várzea')
    expect(screen.getByLabelText('Endereço no site')).toHaveValue('copa-da-varzea')

    await user.click(screen.getByLabelText('Mostrar para a torcida'))
    await user.click(screen.getByRole('button', { name: 'Criar campeonato' }))

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1))
    expect(onSalvar.mock.calls[0][0]).toMatchObject({
      nome: 'Copa da Várzea',
      slug: 'copa-da-varzea',
      publico: true,
      pontos_vitoria: 3,
      minutos_periodo: 25,
      local_padrao: null,
    })
  })

  it('para de mexer no endereço depois que a pessoa edita à mão', async () => {
    const user = userEvent.setup()
    renderForm()

    const slug = screen.getByLabelText('Endereço no site')
    await user.type(screen.getByLabelText('Nome do campeonato'), 'Copa')
    await user.clear(slug)
    await user.type(slug, 'meu-endereco')
    await user.type(screen.getByLabelText('Nome do campeonato'), ' Nova')
    expect(slug).toHaveValue('meu-endereco')
  })

  it('mostra erro e não envia sem nome', async () => {
    const user = userEvent.setup()
    const onSalvar = renderForm()

    await user.click(screen.getByRole('button', { name: 'Criar campeonato' }))
    expect(await screen.findByText('O nome precisa ter pelo menos 2 letras.')).toBeInTheDocument()
    expect(onSalvar).not.toHaveBeenCalled()
  })
})
