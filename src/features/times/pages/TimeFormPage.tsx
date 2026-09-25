import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Carregando } from '@/app/pages/Carregando'
import { ConfirmarExclusao } from '@/components/ConfirmarExclusao'
import { Alert } from '@/components/ui/alert'
import { mensagemErroBanco } from '@/lib/erros'
import { JogadoresSecao } from '../components/JogadoresSecao'
import { TimeForm } from '../components/TimeForm'
import { useApagarTime, useSalvarTime, useTime } from '../hooks'
import type { TimeFormValues } from '../schemas'

const UNICOS = {
  times_campeonato_id_nome_key: 'Já existe um time com esse nome neste campeonato.',
  times_campeonato_id_sigla_key: 'Já existe um time com essa sigla neste campeonato.',
}

export function TimeFormPage() {
  const { id: campeonatoId, timeId } = useParams()
  const editando = Boolean(timeId)
  return editando ? (
    <EditarTime campeonatoId={campeonatoId!} timeId={timeId!} />
  ) : (
    <NovoTime campeonatoId={campeonatoId!} />
  )
}

function Cabecalho({ campeonatoId, titulo }: { campeonatoId: string; titulo: string }) {
  return (
    <div>
      <Link to={`/admin/campeonatos/${campeonatoId}/times`} className="text-sm font-bold underline underline-offset-4">
        Times
      </Link>
      <h1 className="font-display text-4xl font-black">{titulo}</h1>
    </div>
  )
}

function NovoTime({ campeonatoId }: { campeonatoId: string }) {
  const navigate = useNavigate()
  const salvar = useSalvarTime(campeonatoId)

  function onSalvar(valores: TimeFormValues) {
    // Depois de criar, abre o time para cadastrar o elenco.
    salvar.mutate(valores, {
      onSuccess: (t) => navigate(`/admin/campeonatos/${campeonatoId}/times/${t.id}`, { replace: true }),
    })
  }

  return (
    <section className="flex flex-col gap-6">
      <Cabecalho campeonatoId={campeonatoId} titulo="Novo time" />
      <TimeForm
        salvando={salvar.isPending}
        erro={salvar.error ? mensagemErroBanco(salvar.error, UNICOS) : null}
        rotuloSalvar="Criar time"
        onSalvar={onSalvar}
      />
    </section>
  )
}

function EditarTime({ campeonatoId, timeId }: { campeonatoId: string; timeId: string }) {
  const navigate = useNavigate()
  const { data: time, isPending, error } = useTime(timeId)
  const salvar = useSalvarTime(campeonatoId, timeId)
  const apagar = useApagarTime(campeonatoId)
  const [salvo, setSalvo] = useState(false)

  if (isPending) return <Carregando />
  if (error || !time) {
    return (
      <section className="flex flex-col gap-4">
        <Cabecalho campeonatoId={campeonatoId} titulo="Time não encontrado" />
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <Cabecalho campeonatoId={campeonatoId} titulo={time.nome} />
      {salvo ? <Alert tone="sucesso">Alterações salvas.</Alert> : null}
      <TimeForm
        key={time.id}
        time={time}
        salvando={salvar.isPending}
        erro={salvar.error ? mensagemErroBanco(salvar.error, UNICOS) : null}
        rotuloSalvar="Salvar time"
        onSalvar={(valores) => {
          setSalvo(false)
          salvar.mutate(valores, { onSuccess: () => setSalvo(true) })
        }}
      />

      <JogadoresSecao timeId={timeId} campeonatoId={campeonatoId} />

      <ConfirmarExclusao
        titulo="Apagar time"
        descricao="Apaga também todos os jogadores deste time. Não dá para desfazer."
        pergunta={`Apagar “${time.nome}” de vez?`}
        rotulo="Apagar time"
        apagando={apagar.isPending}
        erro={apagar.error ? mensagemErroBanco(apagar.error) : null}
        onConfirmar={() =>
          apagar.mutate(timeId, {
            onSuccess: () => navigate(`/admin/campeonatos/${campeonatoId}/times`, { replace: true }),
          })
        }
      />
    </section>
  )
}
