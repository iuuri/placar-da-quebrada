import { useState } from 'react'
import type { Estado } from '@/estado'
import { compartilharOuBaixar, contarNotas, gerarSumulaPdf, nomeDoArquivo } from '@/lib/sumula'
import { Botao } from './Botao'

type Status = { tipo: 'ok' | 'erro'; texto: string } | null

export function Sumula({ estado }: { estado: Estado }) {
  const [gerando, setGerando] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const { casa, visitante } = estado.placar
  const c = contarNotas(estado.notas)

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

  const resumo: [string, number][] = [
    ['🟨 Amarelos', c.amarelo],
    ['🟥 Vermelhos', c.vermelho],
    ['⚽ Gols anotados', c.gol],
    ['🔁 Trocas', c.troca],
  ]

  return (
    <section aria-labelledby="titulo-sumula" className="flex flex-col gap-3 rounded-md border-2 border-tinta bg-white p-3">
      <h2 id="titulo-sumula" className="font-display text-3xl font-bold">
        Súmula do jogo
      </h2>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <dt className="font-bold">Faltas</dt>
        <dd className="text-right tabular-nums">
          {casa.faltas} × {visitante.faltas}
        </dd>
        {resumo.map(([rotulo, n]) => (
          <div key={rotulo} className="contents">
            <dt>{rotulo}</dt>
            <dd className="text-right font-bold tabular-nums">{n}</dd>
          </div>
        ))}
      </dl>
      <Botao className="min-h-14 text-lg" disabled={gerando} onClick={gerar}>
        {gerando ? 'Gerando PDF…' : '📄 Gerar súmula em PDF'}
      </Botao>
      <p className="text-sm text-tinta-suave">
        Placar, faltas, tempo e todas as anotações num PDF protegido contra edição, pronto para mandar no WhatsApp.
      </p>
      {status ? (
        <p role="status" className={status.tipo === 'erro' ? 'font-bold text-cartao' : 'font-bold text-gramado'}>
          {status.texto}
        </p>
      ) : null}
    </section>
  )
}
