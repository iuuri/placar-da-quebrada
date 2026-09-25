import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'
import { ehErroDeVersaoAntiga, recarregarParaNovaVersao } from '@/lib/nova-versao'

// Tela mostrada quando uma rota quebra (em vez da página em branco).
export function ErroRota() {
  const erro = useRouteError()
  const versaoAntiga = ehErroDeVersaoAntiga(erro)

  useEffect(() => {
    if (versaoAntiga) recarregarParaNovaVersao()
  }, [versaoAntiga])

  return (
    <section className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-16">
      <h1 className="font-display text-4xl font-black">
        {versaoAntiga ? 'Tem versão nova do site' : 'Algo deu errado nesta tela'}
      </h1>
      <p className="text-tinta-suave">
        {versaoAntiga
          ? 'O site foi atualizado enquanto estava aberto. Recarregue para continuar.'
          : 'Recarregue a página. Se continuar, avise o organizador dizendo o que você estava fazendo.'}
      </p>
      <Button onClick={() => window.location.reload()}>Recarregar a página</Button>
    </section>
  )
}
