import { useState } from 'react'
import type { Estado } from '@/estado'
import { compartilharOuBaixar, contarPorTime, gerarSumulaPdf, nomeDoArquivo } from '@/lib/sumula'
import { decorridoMs, formatar } from '@/tempo'
import { ORDEM_TIPOS, TIPOS } from '@/tipos'
import { Botao } from './Botao'
import { Dialogo } from './Dialogo'

type Status = { tipo: 'ok' | 'erro'; texto: string } | null

// Botão do topo: abre a tela da súmula (o card saiu da página para liberar espaço).
export function BotaoSumula({ estado }: { estado: Estado }) {
  const [aberta, setAberta] = useState(false)
  return (
    <>
      <Botao variante="contorno" className="min-h-11 px-3" onClick={() => setAberta(true)}>
        📄 Súmula
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
  const c = contarPorTime(estado.notas)
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
      <p className="-mt-2 text-center font-display text-3xl font-black leading-tight">
        {nomeA} {casa.gols} × {visitante.gols} {nomeB}
      </p>
      <p className="-mt-3 text-center text-sm text-tinta-suave">
        Tempo jogado: {formatar(decorridoMs(estado.timer, abertaEm))}
      </p>

      <table className="w-full table-fixed text-sm">
        <caption className="sr-only">Resumo por time</caption>
        <thead>
          <tr className="border-b-2 border-muro-escuro">
            <th scope="col" className="w-[46%] pb-1 text-left font-normal text-tinta-suave">
              Resumo
            </th>
            <th scope="col" className="truncate pb-1 text-center font-bold">
              {nomeA}
            </th>
            <th scope="col" className="truncate pb-1 text-center font-bold">
              {nomeB}
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          <tr>
            <th scope="row" className="py-0.5 text-left font-normal">
              Faltas
            </th>
            <td className="text-center font-bold">{casa.faltas}</td>
            <td className="text-center font-bold">{visitante.faltas}</td>
          </tr>
          {ORDEM_TIPOS.filter((t) => t !== 'nota').map((tipo) => (
            <tr key={tipo}>
              <th scope="row" className="truncate py-0.5 text-left font-normal">
                <span aria-hidden>{TIPOS[tipo].emoji}</span> {TIPOS[tipo].plural}
              </th>
              <td className="text-center font-bold">{c.casa[tipo]}</td>
              <td className="text-center font-bold">{c.visitante[tipo]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-1">
        <h3 className="font-bold">Registros ({registros.length})</h3>
        {registros.length === 0 ? (
          <p className="text-sm text-tinta-suave">Nenhum registro ainda.</p>
        ) : (
          <ol className="flex max-h-48 flex-col divide-y divide-muro-escuro overflow-y-auto rounded-md bg-muro px-2 text-sm">
            {registros.map((n) => (
              <li key={n.id} className="flex gap-2 py-1.5">
                <span className="w-8 shrink-0 font-bold tabular-nums">{n.minuto}'</span>
                <span className="min-w-0 flex-1 truncate">
                  <span aria-hidden>{TIPOS[n.tipo].emoji}</span> {TIPOS[n.tipo].rotulo}
                  {n.lado ? ` · ${n.lado === 'casa' ? nomeA : nomeB}` : ''}
                  {n.texto ? ` · ${n.texto}` : ''}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Botao className="min-h-14 text-lg" disabled={gerando} onClick={gerar} data-autofocus>
        {gerando ? 'Gerando PDF…' : compartilhar ? '📤 Compartilhar PDF' : '⬇️ Baixar PDF'}
      </Botao>
      <p className="-mt-2 text-center text-xs text-tinta-suave">PDF protegido contra edição, pronto para o WhatsApp.</p>
      {status ? (
        <p role="status" className={status.tipo === 'erro' ? 'font-bold text-cartao' : 'font-bold text-placa'}>
          {status.texto}
        </p>
      ) : null}
      <Botao variante="texto" onClick={onFechar}>
        Fechar
      </Botao>
    </Dialogo>
  )
}
