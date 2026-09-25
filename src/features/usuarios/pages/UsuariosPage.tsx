import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Carregando } from '@/app/pages/Carregando'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/context'
import { mensagemErroBanco } from '@/lib/erros'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database.types'
import { ErroAdminUsers } from '../api'
import { CampoSenha } from '../components/CampoSenha'
import { NovoUsuarioForm } from '../components/NovoUsuarioForm'
import { useAtualizarUsuario, useCriarUsuario, useDefinirAtivo, useTrocarSenha, useUsuarios } from '../hooks'
import { gerarSenhaProvisoria, trocarSenhaSchema, type NovoUsuarioValues, type TrocarSenhaValues } from '../schemas'

function mensagem(erro: unknown) {
  return erro instanceof ErroAdminUsers ? erro.message : mensagemErroBanco(erro)
}

function Credenciais({ titulo, email, senha }: { titulo: string; email: string; senha: string }) {
  return (
    <Alert tone="sucesso">
      <p className="font-bold">{titulo}</p>
      <p>
        Passe para a pessoa: e-mail <strong>{email}</strong> e senha <strong className="font-mono">{senha}</strong>.
      </p>
      <p className="text-sm text-tinta-suave">Esta senha não aparece de novo depois que você sair da tela.</p>
    </Alert>
  )
}

export function UsuariosPage() {
  const { profile: eu } = useAuth()
  const { data: usuarios, isPending, error, refetch } = useUsuarios()
  const criar = useCriarUsuario()
  const [criando, setCriando] = useState(false)
  const [criado, setCriado] = useState<NovoUsuarioValues | null>(null)

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-black">Operadores</h1>
        {criando ? null : (
          <Button
            onClick={() => {
              setCriado(null)
              setCriando(true)
            }}
          >
            Novo acesso
          </Button>
        )}
      </div>
      <p className="-mt-3 max-w-prose text-tinta-suave">
        Operadores (mesários) entram no painel e controlam qualquer jogo. Admins também cadastram campeonatos, times e
        acessos.
      </p>

      {criado ? <Credenciais titulo={`Acesso criado para ${criado.nome}.`} email={criado.email} senha={criado.senha} /> : null}

      {criando ? (
        <div className="flex max-w-2xl flex-col gap-3 rounded-md bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Novo acesso</h2>
            <Button variant="ghost" className="min-h-10 px-2" onClick={() => setCriando(false)}>
              Fechar
            </Button>
          </div>
          <NovoUsuarioForm
            salvando={criar.isPending}
            erro={criar.error ? mensagem(criar.error) : null}
            onSalvar={(valores) =>
              criar.mutateAsync(valores).then(() => {
                setCriado(valores)
                setCriando(false)
              })
            }
          />
        </div>
      ) : null}

      {isPending ? <Carregando /> : null}
      {error ? (
        <Alert>
          <p>Não foi possível carregar os usuários.</p>
          <button type="button" className="font-bold underline" onClick={() => refetch()}>
            Tentar de novo
          </button>
        </Alert>
      ) : null}

      {usuarios ? (
        <ul className="flex max-w-2xl flex-col divide-y-2 divide-muro-escuro border-y-2 border-muro-escuro">
          {usuarios.map((u) => (
            <UsuarioItem key={u.id} usuario={u} souEu={u.id === eu?.id} />
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function UsuarioItem({ usuario, souEu }: { usuario: Profile; souEu: boolean }) {
  const [trocandoSenha, setTrocandoSenha] = useState(false)
  const [senhaNova, setSenhaNova] = useState<string | null>(null)
  const ativo = useDefinirAtivo()
  const atualizar = useAtualizarUsuario()
  const erro = ativo.error ?? atualizar.error
  const ehAdmin = usuario.role === 'admin'

  return (
    <li className={cn('flex flex-col gap-2 py-4', !usuario.ativo && 'opacity-60')}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold">{usuario.nome || usuario.email}</p>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-bold',
            ehAdmin ? 'bg-tinta text-muro' : 'bg-muro-escuro text-tinta',
          )}
        >
          {ehAdmin ? 'Admin' : 'Operador'}
        </span>
        {usuario.ativo ? null : <span className="text-sm font-bold text-cartao">Desativado</span>}
        {souEu ? <span className="text-sm text-tinta-suave">(você)</span> : null}
      </div>
      <p className="-mt-1 text-sm text-tinta-suave">{usuario.email}</p>

      {erro ? <Alert>{mensagem(erro)}</Alert> : null}
      {senhaNova ? <Credenciais titulo="Senha trocada." email={usuario.email} senha={senhaNova} /> : null}

      {souEu ? null : trocandoSenha ? (
        <TrocarSenhaForm
          usuarioId={usuario.id}
          onPronto={(senha) => {
            setSenhaNova(senha)
            setTrocandoSenha(false)
          }}
          onCancelar={() => setTrocandoSenha(false)}
        />
      ) : (
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            className="min-h-10 px-2 text-sm"
            onClick={() => {
              setSenhaNova(null)
              setTrocandoSenha(true)
            }}
          >
            Trocar senha
          </Button>
          <Button
            variant="ghost"
            className="min-h-10 px-2 text-sm"
            disabled={ativo.isPending}
            onClick={() => ativo.mutate({ id: usuario.id, ativo: !usuario.ativo })}
          >
            {ativo.isPending ? 'Salvando…' : usuario.ativo ? 'Desativar acesso' : 'Reativar acesso'}
          </Button>
          <Button
            variant="ghost"
            className="min-h-10 px-2 text-sm"
            disabled={atualizar.isPending}
            onClick={() => atualizar.mutate({ id: usuario.id, role: ehAdmin ? 'operador' : 'admin' })}
          >
            {ehAdmin ? 'Tornar operador' : 'Tornar admin'}
          </Button>
        </div>
      )}
    </li>
  )
}

function TrocarSenhaForm({
  usuarioId,
  onPronto,
  onCancelar,
}: {
  usuarioId: string
  onPronto: (senha: string) => void
  onCancelar: () => void
}) {
  const trocar = useTrocarSenha()
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TrocarSenhaValues>({
    resolver: zodResolver(trocarSenhaSchema),
    defaultValues: { senha: gerarSenhaProvisoria() },
  })
  const id = `senha-${usuarioId}`

  return (
    <form
      noValidate
      className="flex flex-col gap-3 rounded-md bg-white p-3"
      onSubmit={handleSubmit((v) => trocar.mutate({ id: usuarioId, senha: v.senha }, { onSuccess: () => onPronto(v.senha) }))}
    >
      {trocar.error ? <Alert>{mensagem(trocar.error)}</Alert> : null}
      <CampoSenha
        id={id}
        label="Nova senha"
        erro={errors.senha?.message}
        registro={register('senha')}
        onGerar={() => setValue('senha', gerarSenhaProvisoria(), { shouldValidate: true })}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={trocar.isPending}>
          {trocar.isPending ? 'Salvando…' : 'Salvar senha'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancelar} disabled={trocar.isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
