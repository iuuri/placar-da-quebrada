import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Carregando } from '@/app/pages/Carregando'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
      <div>
        <Link to="/admin" className="text-sm font-bold underline underline-offset-4">
          Campeonatos
        </Link>
        <h1 className="font-display text-4xl font-black">{editando ? campeonato!.nome : 'Novo campeonato'}</h1>
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

      {editando ? <ZonaApagar id={id!} nome={campeonato!.nome} /> : null}
    </section>
  )
}

function ZonaApagar({ id, nome }: { id: string; nome: string }) {
  const navigate = useNavigate()
  const apagar = useApagarCampeonato()
  const [confirmando, setConfirmando] = useState(false)

  return (
    <div className="mt-6 flex max-w-2xl flex-col gap-3 border-t-2 border-cartao pt-4">
      <h2 className="font-display text-2xl font-bold">Apagar campeonato</h2>
      <p className="text-tinta-suave">Apaga também todos os times e jogadores deste campeonato. Não dá para desfazer.</p>
      {apagar.error ? <Alert>{mensagemErroBanco(apagar.error)}</Alert> : null}
      {confirmando ? (
        <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Confirmar exclusão">
          <p className="w-full font-bold">Apagar “{nome}” de vez?</p>
          <Button
            className="bg-cartao text-white shadow-none hover:bg-cartao/90"
            disabled={apagar.isPending}
            onClick={() => apagar.mutate(id, { onSuccess: () => navigate('/admin', { replace: true }) })}
          >
            {apagar.isPending ? 'Apagando…' : 'Sim, apagar'}
          </Button>
          <Button variant="secondary" onClick={() => setConfirmando(false)} disabled={apagar.isPending}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button variant="secondary" className="self-start border-cartao text-cartao hover:bg-cartao hover:text-white" onClick={() => setConfirmando(true)}>
          Apagar campeonato
        </Button>
      )}
    </div>
  )
}
