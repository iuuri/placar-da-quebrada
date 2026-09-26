import { useState } from 'react'
import { abertoComoApp, ehIphone, instalar, useInstalou, usePedidoInstalar } from '@/lib/instalar'
import { Botao } from './Botao'
import { Dialogo } from './Dialogo'
import { Icone } from './Icone'

// Botão "Instalar app" do fim da página. Some quando a página já está aberta como app.
export function InstalarApp() {
  const pedido = usePedidoInstalar()
  const instalou = useInstalou()
  const [ajuda, setAjuda] = useState(false)
  const [comoApp] = useState(abertoComoApp)

  if (comoApp) return null
  if (instalou) return <p className="text-sm font-bold text-gramado">App instalado! Procure o ícone do Placar no aparelho.</p>

  return (
    <>
      <Botao
        variante="contorno"
        className="min-h-12 px-4"
        onClick={async () => {
          if (pedido) await instalar()
          else setAjuda(true)
        }}
      >
        <Icone nome="instalar" className="size-[1.1rem]" />
        Instalar app
      </Botao>
      {ajuda ? <ComoInstalar iphone={ehIphone()} onFechar={() => setAjuda(false)} /> : null}
    </>
  )
}

function ComoInstalar({ iphone, onFechar }: { iphone: boolean; onFechar: () => void }) {
  return (
    <Dialogo titulo={iphone ? 'Instalar no iPhone' : 'Instalar o app'} onFechar={onFechar}>
      {iphone ? (
        <>
          <p>No iPhone a instalação é feita pelo próprio navegador, em poucos toques:</p>
          <ol className="flex list-decimal flex-col gap-2 pl-6">
            <li>
              Abra esta página no <strong>Safari</strong>.
            </li>
            <li>
              Toque em <strong>Compartilhar</strong> (o quadrado com a seta para cima{' '}
              <Icone nome="compartilhar" className="inline size-4 align-[-3px]" />), na barra do Safari.
            </li>
            <li>
              Role a lista e toque em <strong>Adicionar à Tela de Início</strong>.
            </li>
            <li>
              Toque em <strong>Adicionar</strong>. O ícone do Placar aparece junto com os outros apps.
            </li>
          </ol>
          <p className="text-sm text-tinta-suave">
            No iPhone, o app instalado guarda os jogos separado do Safari: comece o jogo já pelo ícone.
          </p>
        </>
      ) : (
        <>
          <p>Este navegador não abriu a instalação automática. Dá para instalar pelo menu:</p>
          <ol className="flex list-decimal flex-col gap-2 pl-6">
            <li>
              Toque no menu do navegador (<strong>⋮</strong>, no canto de cima).
            </li>
            <li>
              Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.
            </li>
          </ol>
          <p className="text-sm text-tinta-suave">
            Se a opção não aparecer, abra a página no <strong>Chrome</strong>. Se o app já estiver instalado, procure o ícone
            do Placar no aparelho.
          </p>
        </>
      )}
      <Botao onClick={onFechar}>Entendi</Botao>
    </Dialogo>
  )
}
