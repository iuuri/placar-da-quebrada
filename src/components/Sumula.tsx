import { useState } from 'react'
import type { Estado } from '@/estado'
import { rotuloMinuto } from '@/lib/estatisticas'
import { compartilharOuBaixar, gerarSumulaPdf, nomeDoArquivo } from '@/lib/sumula'
import { decorridoMs, formatar } from '@/tempo'
import { TIPOS } from '@/tipos'
import { cn } from '@/lib/utils'
import { Botao } from './Botao'
import { Dialogo } from './Dialogo'
import { Comparativo, Destaques, GolsPorFaixa, Jogadores, LegendaTimes, LinhaDoTempo } from './Estatisticas'
import { Icone, IconeTipo } from './Icone'

type Status = { tipo: 'ok' | 'erro'; texto: string } | null

// Botão do topo: abre a tela da súmula (o card saiu da página para liberar espaço).
export function BotaoSumula({ estado }: { estado: Estado }) {
  const [aberta, setAberta] = useState(false)
  return (
    <>
      <Botao variante="contorno" className="min-h-12 px-4" onClick={() => setAberta(true)}>
        <Icone nome="documento" className="size-[1.1rem]" />
        Súmula
      </Botao>
      {aberta ? <TelaSumula estado={estado} onFechar={() => setAberta(false)} /> : null}
    </>
  )
}

// Sem o menu de compartilhar (ex.: computador), o PDF é baixado.
const podeCompartilhar = () => typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'

function TelaSumula({ estado, onFechar }: { estado: Estado; onFechar: () => void }) {
  const [gerando, setGerando] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  // Foto do momento em que a tela abriu (o tempo jogado não precisa correr aqui).
  const [abertaEm] = useState(() => Date.now())
  const { casa, visitante } = estado.placar
  const nomeA = casa.nome || 'Time A'
  const nomeB = visitante.nome || 'Time B'
  const nomes = { casa: nomeA, visitante: nomeB }
  const registros = [...estado.notas].reverse()
  const compartilhar = podeCompartilhar()

  async function gerar() {
    setGerando(true)
    setStatus(null)
    try {
      const agora = Date.now()
      const pdf = await gerarSumulaPdf(estado, agora)
      const nome = nomeDoArquivo(estado, new Date(agora))
      const resultado = await compartilharOuBaixar(pdf, nome, `Súmula ${nomeA} x ${nomeB}`)
      if (resultado === 'baixado') setStatus({ tipo: 'ok', texto: `PDF baixado: ${nome}` })
      if (resultado === 'compartilhado') setStatus({ tipo: 'ok', texto: 'Súmula compartilhada.' })
    } catch {
      setStatus({ tipo: 'erro', texto: 'Não foi possível gerar o PDF. Tente de novo.' })
    } finally {
      setGerando(false)
    }
  }

  return (
    <Dialogo titulo="Súmula do jogo" onFechar={onFechar} largo>
      <div className="flex flex-col gap-2 rounded-2xl bg-muro px-3 py-4">
        <p className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-center">
          <span className="truncate font-bold">{nomeA}</span>
          <span className="font-display text-5xl font-black leading-none tabular-nums">
            {casa.gols}
            <span className="px-2 text-muro-escuro">×</span>
            {visitante.gols}
          </span>
          <span className="truncate font-bold">{nomeB}</span>
        </p>
        <p className="text-center text-sm text-tinta-suave">Tempo jogado: {formatar(decorridoMs(estado.timer, abertaEm))}</p>
      </div>

      <LegendaTimes nomes={nomes} />
      <Destaques estado={estado} agora={abertaEm} />
      <Comparativo estado={estado} nomes={nomes} />
      <LinhaDoTempo estado={estado} agora={abertaEm} nomes={nomes} />
      <GolsPorFaixa estado={estado} agora={abertaEm} nomes={nomes} />
      <Jogadores estado={estado} nomes={nomes} />

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-tinta-suave">Registros ({registros.length})</h3>
        {registros.length === 0 ? (
          <p className="text-sm text-tinta-suave">Nenhum registro ainda.</p>
        ) : (
          <ol className="flex max-h-48 flex-col divide-y divide-muro-escuro overflow-y-auto rounded-2xl bg-muro px-3 text-sm">
            {registros.map((n) => (
              <li key={n.id} className="flex items-center gap-2 py-2">
                <span className={cn('shrink-0 font-bold tabular-nums', estado.tempos === 2 ? 'w-14' : 'w-8')}>{rotuloMinuto(n, estado)}</span>
                <IconeTipo tipo={n.tipo} className={cn('size-4', TIPOS[n.tipo].tom)} />
                <span className="min-w-0 flex-1 truncate">
                  {TIPOS[n.tipo].rotulo}
                  {n.lado ? ` · ${n.lado === 'casa' ? nomeA : nomeB}` : ''}
                  {n.texto ? ` · ${n.texto}` : ''}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="text-center text-xs text-tinta-suave">O PDF sai protegido contra edição, pronto para o WhatsApp.</p>

      {/* Ações ficam presas no fim da folha: a súmula pode ficar longa com os gráficos. */}
      <div className="sticky -bottom-5 -mx-5 flex flex-col gap-2 border-t border-muro-escuro bg-painel px-5 py-3">
        {status ? (
          <p role="status" className={status.tipo === 'erro' ? 'text-sm font-bold text-cartao' : 'text-sm font-bold text-gramado'}>
            {status.texto}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Botao variante="contorno" className="min-h-14 px-5" onClick={onFechar}>
            Fechar
          </Botao>
          <Botao className="min-h-14 flex-1 text-lg" disabled={gerando} onClick={gerar} data-autofocus>
            <Icone nome={compartilhar ? 'compartilhar' : 'instalar'} />
            {gerando ? 'Gerando PDF…' : compartilhar ? 'Compartilhar PDF' : 'Baixar PDF'}
          </Botao>
        </div>
      </div>
    </Dialogo>
  )
}
