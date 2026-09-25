import { useState } from 'react'
import type { Estado } from '@/estado'
import { compartilharOuBaixar, contarPorTime, gerarSumulaPdf, nomeDoArquivo } from '@/lib/sumula'
import { ORDEM_TIPOS, TIPOS } from '@/tipos'
import { Botao } from './Botao'

type Status = { tipo: 'ok' | 'erro'; texto: string } | null

export function Sumula({ estado }: { estado: Estado }) {
  const [gerando, setGerando] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const { casa, visitante } = estado.placar
  const c = contarPorTime(estado.notas)
  const nomeA = casa.nome || 'Time A'
  const nomeB = visitante.nome || 'Time B'

  async function gerar() {
    setGerando(true)
    setStatus(null)
    try {
      const agora = Date.now()
      const pdf = await gerarSumulaPdf(estado, agora)
      const nome = nomeDoArquivo(estado, new Date(agora))
      const resultado = await compartilharOuBaixar(pdf, nome, `Súmula ${casa.nome} x ${visitante.nome}`)
      if (resultado === 'baixado') setStatus({ tipo: 'ok', texto: `PDF baixado: ${nome}` })
      if (resultado === 'compartilhado') setStatus({ tipo: 'ok', texto: 'Súmula compartilhada.' })
    } catch {
      setStatus({ tipo: 'erro', texto: 'Não foi possível gerar o PDF. Tente de novo.' })
    } finally {
      setGerando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-sumula" className="flex flex-col gap-3 rounded-md border-2 border-tinta bg-white p-3">
      <h2 id="titulo-sumula" className="font-display text-3xl font-bold">
        Súmula do jogo
      </h2>
      <table className="w-full table-fixed text-sm">
        <caption className="sr-only">Resumo por time</caption>
        <thead>
          <tr className="border-b-2 border-muro-escuro text-left">
            <th scope="col" className="w-[46%] pb-1 font-normal text-tinta-suave">
              &nbsp;
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
      <Botao className="min-h-14 text-lg" disabled={gerando} onClick={gerar}>
        {gerando ? 'Gerando PDF…' : '📄 Gerar súmula em PDF'}
      </Botao>
      <p className="text-sm text-tinta-suave">
        Placar, faltas, tempo, contagem por time e todas as anotações num PDF protegido contra edição, pronto para mandar no WhatsApp.
      </p>
      {status ? (
        <p role="status" className={status.tipo === 'erro' ? 'font-bold text-cartao' : 'font-bold text-gramado'}>
          {status.texto}
        </p>
      ) : null}
    </section>
  )
}
