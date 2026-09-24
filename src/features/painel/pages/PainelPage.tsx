import { useAuth } from '@/features/auth/context'

export function PainelPage() {
  const { profile, isAdmin } = useAuth()
  const nome = profile?.nome || profile?.email

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-display text-4xl font-black">Meus jogos</h1>
      <p className="text-tinta-suave">Olá, {nome}.</p>
      <p className="max-w-prose">
        {isAdmin
          ? 'Ainda não há partidas. Crie um campeonato em Administração para montar a tabela de jogos.'
          : 'Nenhum jogo escalado para você ainda. Quando o organizador te colocar em uma partida, ela aparece aqui.'}
      </p>
    </section>
  )
}
