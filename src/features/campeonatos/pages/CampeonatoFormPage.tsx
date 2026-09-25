import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Carregando } from '@/app/pages/Carregando'
import { ConfirmarExclusao } from '@/components/ConfirmarExclusao'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button-variants'
import { mensagemErroBanco } from '@/lib/erros'
import { CampeonatoForm } from '../components/CampeonatoForm'
import { useApagarCampeonato, useCampeonato, useSalvarCampeonato } from '../hooks'
import type { CampeonatoFormValues } from '../schemas'

const UNICOS = { campeonatos_slug_key: 'Já existe um campeonato com esse endereço. Escolha outro.' }

export function CampeonatoFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editando = Boolean(id)
  const { data: campeonato, isPending, error: erroCarregar } = useCampeonato(id)
  const salvar = useSalvarCampeonato(id)
  const apagar = useApagarCampeonato()
  const [salvo, setSalvo] = useState(false)

  if (editando && isPending) return <Carregando />
  if (editando && (erroCarregar || !campeonato)) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="font-display text-4xl font-black">Campeonato não encontrado</h1>
        <Link to="/admin" className="font-bold underline underline-offset-4">
          Voltar para campeonatos
        </Link>
      </section>
    )
  }

  function onSalvar(valores: CampeonatoFormValues) {
    setSalvo(false)
    salvar.mutate(valores, {
      onSuccess: (c) => {
        if (editando) setSalvo(true)
        else navigate(`/admin/campeonatos/${c.id}`, { replace: true })
      },
    })
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/admin" className="text-sm font-bold underline underline-offset-4">
            Campeonatos
          </Link>
          <h1 className="font-display text-4xl font-black">{editando ? campeonato!.nome : 'Novo campeonato'}</h1>
        </div>
        {editando ? (
          <div className="flex flex-wrap gap-2">
            <Link to={`/c/${campeonato!.slug}`} className={buttonVariants({ variant: 'secondary' })}>
              Ver página pública
            </Link>
            <Link to={`/admin/campeonatos/${id}/times`} className={buttonVariants()}>
              Times e jogadores
            </Link>
          </div>
        ) : null}
      </div>

      {salvo ? <Alert tone="sucesso">Alterações salvas.</Alert> : null}

      <CampeonatoForm
        key={campeonato?.id ?? 'novo'}
        campeonato={campeonato ?? undefined}
        salvando={salvar.isPending}
        erro={salvar.error ? mensagemErroBanco(salvar.error, UNICOS) : null}
        rotuloSalvar={editando ? 'Salvar alterações' : 'Criar campeonato'}
        onSalvar={onSalvar}
      />

      {editando ? (
        <ConfirmarExclusao
          titulo="Apagar campeonato"
          descricao="Apaga também todos os times e jogadores deste campeonato. Não dá para desfazer."
          pergunta={`Apagar “${campeonato!.nome}” de vez?`}
          rotulo="Apagar campeonato"
          apagando={apagar.isPending}
          erro={apagar.error ? mensagemErroBanco(apagar.error) : null}
          onConfirmar={() => apagar.mutate(id!, { onSuccess: () => navigate('/admin', { replace: true }) })}
        />
      ) : null}
    </section>
  )
}
