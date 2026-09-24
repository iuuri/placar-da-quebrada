import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { mensagemErroBanco } from '@/lib/erros'
import { cn } from '@/lib/utils'
import type { Jogador } from '@/types/database.types'
import { useAlternarJogadorAtivo, useApagarJogador, useJogadores, useSalvarJogador } from '../hooks'
import { JogadorForm } from './JogadorForm'

const UNICOS = { jogadores_numero_unico_idx: 'Já tem um jogador ativo com esse número neste time.' }

type Props = { timeId: string; campeonatoId: string }

export function JogadoresSecao({ timeId, campeonatoId }: Props) {
  const { data: jogadores, isPending, error } = useJogadores(timeId)
  const novo = useSalvarJogador(timeId, campeonatoId)
  const ativos = jogadores?.filter((j) => j.ativo).length ?? 0

  return (
    <section aria-labelledby="jogadores" className="flex max-w-2xl flex-col gap-4 border-t-2 border-tinta pt-4">
      <h2 id="jogadores" className="font-display text-3xl font-bold">
        Jogadores {jogadores ? <span className="text-tinta-suave">({ativos})</span> : null}
      </h2>

      <div className="rounded-md bg-white p-4">
        <h3 className="mb-3 font-bold">Adicionar jogador</h3>
        <JogadorForm
          idPrefixo="novo"
          rotuloSalvar="Adicionar"
          salvando={novo.isPending}
          erro={novo.error ? mensagemErroBanco(novo.error, UNICOS) : null}
          onSalvar={(valores) => novo.mutateAsync({ valores })}
        />
      </div>

      {isPending ? <p className="text-tinta-suave">Carregando jogadores…</p> : null}
      {error ? <Alert>Não foi possível carregar os jogadores.</Alert> : null}
      {jogadores && jogadores.length === 0 ? (
        <p className="text-tinta-suave">Nenhum jogador ainda. Adicione o elenco acima, um por vez.</p>
      ) : null}

      {jogadores && jogadores.length > 0 ? (
        <ul className="flex flex-col divide-y-2 divide-muro-escuro border-y-2 border-muro-escuro">
          {jogadores.map((j) => (
            <JogadorItem key={j.id} jogador={j} timeId={timeId} campeonatoId={campeonatoId} />
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function JogadorItem({ jogador, timeId, campeonatoId }: { jogador: Jogador; timeId: string; campeonatoId: string }) {
  const [modo, setModo] = useState<'ver' | 'editar' | 'apagar'>('ver')
  const salvar = useSalvarJogador(timeId, campeonatoId)
  const alternar = useAlternarJogadorAtivo(timeId, campeonatoId)
  const apagar = useApagarJogador(timeId, campeonatoId)
  const erro = alternar.error ?? apagar.error

  if (modo === 'editar') {
    return (
      <li className="py-4">
        <JogadorForm
          idPrefixo={`j-${jogador.id}`}
          jogador={jogador}
          rotuloSalvar="Salvar"
          salvando={salvar.isPending}
          erro={salvar.error ? mensagemErroBanco(salvar.error, UNICOS) : null}
          onSalvar={(valores) => salvar.mutateAsync({ id: jogador.id, valores }).then(() => setModo('ver'))}
          onCancelar={() => setModo('ver')}
        />
      </li>
    )
  }

  return (
    <li className={cn('flex flex-col gap-2 py-3', !jogador.ativo && 'opacity-60')}>
      <div className="flex items-center gap-3">
        <span className="w-10 shrink-0 text-center font-display text-3xl font-black leading-none">
          {jogador.numero ?? '–'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">
            {jogador.nome}
            {jogador.apelido ? <span className="font-normal text-tinta-suave"> ({jogador.apelido})</span> : null}
          </p>
          <p className="text-sm text-tinta-suave">
            {[jogador.posicao, jogador.ativo ? null : 'Desativado'].filter(Boolean).join(' · ') || ' '}
          </p>
        </div>
      </div>

      {erro ? <Alert>{mensagemErroBanco(erro, UNICOS)}</Alert> : null}

      {modo === 'apagar' ? (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Confirmar exclusão de ${jogador.nome}`}>
          <p className="w-full text-sm">
            Apagar de vez? Se ele já jogou, prefira <strong>desativar</strong> para manter as estatísticas.
          </p>
          <Button
            className="min-h-10 bg-cartao px-3 text-sm text-white shadow-none hover:bg-cartao/90"
            disabled={apagar.isPending}
            onClick={() => apagar.mutate(jogador.id)}
          >
            {apagar.isPending ? 'Apagando…' : 'Sim, apagar'}
          </Button>
          <Button variant="ghost" className="min-h-10 px-2 text-sm" onClick={() => setModo('ver')}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1 pl-13">
          <Button variant="ghost" className="min-h-10 px-2 text-sm" onClick={() => setModo('editar')}>
            Editar
          </Button>
          <Button
            variant="ghost"
            className="min-h-10 px-2 text-sm"
            disabled={alternar.isPending}
            onClick={() => alternar.mutate({ id: jogador.id, ativo: !jogador.ativo })}
          >
            {jogador.ativo ? 'Desativar' : 'Reativar'}
          </Button>
          <Button variant="ghost" className="min-h-10 px-2 text-sm text-cartao" onClick={() => setModo('apagar')}>
            Apagar
          </Button>
        </div>
      )}
    </li>
  )
}
