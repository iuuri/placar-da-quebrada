import type { Estado, Lado, TipoNota } from '@/estado'
import {
  COR_TIME,
  comparativo,
  destaques,
  duracaoEixo,
  duracaoTempo,
  eventosLinhaDoTempo,
  minutoLinha,
  rotuloMinuto,
  golsPorFaixa,
  porJogador,
  proporcao,
} from '@/lib/estatisticas'
import { cn } from '@/lib/utils'
import { TIPOS } from '@/tipos'
import { IconeTipo } from './Icone'

type Nomes = Record<Lado, string>

// Cor de cada tipo de registro nos marcadores da linha do tempo (mesmas cores dos ícones).
const COR_TIPO: Record<TipoNota, string> = {
  gol: 'var(--color-gramado)',
  amarelo: 'var(--color-placa)',
  vermelho: 'var(--color-cartao)',
  troca: 'var(--color-tinta)',
  punicao: 'var(--color-laranja)',
  nota: 'var(--color-tinta-suave)',
}

function Titulo({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold text-tinta-suave">{children}</h3>
}

function Bolinha({ lado }: { lado: Lado }) {
  return <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: COR_TIME.tela[lado] }} />
}

// Legenda dos times: vale para todos os gráficos da súmula.
export function LegendaTimes({ nomes }: { nomes: Nomes }) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-bold">
      {(['casa', 'visitante'] as const).map((lado) => (
        <span key={lado} className="inline-flex min-w-0 items-center gap-1.5">
          <Bolinha lado={lado} />
          <span className="truncate">{nomes[lado]}</span>
        </span>
      ))}
    </p>
  )
}

export function Destaques({ estado, agora }: { estado: Estado; agora: number }) {
  const lista = destaques(estado, agora)
  if (lista.length === 0) return null
  return (
    <section aria-labelledby="titulo-destaques" className="flex flex-col gap-2">
      <h3 id="titulo-destaques" className="text-sm font-bold text-tinta-suave">
        Destaques
      </h3>
      <dl className="grid grid-cols-2 gap-2">
        {lista.map((d) => (
          <div key={d.titulo} className="flex min-w-0 flex-col gap-0.5 rounded-2xl bg-muro p-3">
            <dt className="text-xs font-bold text-tinta-suave">{d.titulo}</dt>
            <dd className="truncate font-display text-2xl font-black leading-tight">{d.valor}</dd>
            {d.detalhe ? <dd className="truncate text-xs text-tinta-suave">{d.detalhe}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  )
}

// "Estatísticas da partida": número de cada time nas pontas e uma barra dividida na proporção.
// É uma tabela de verdade (leitores de tela leem os números); a barra é só visual.
export function Comparativo({ estado, nomes }: { estado: Estado; nomes: Nomes }) {
  return (
    <section className="flex flex-col gap-2">
      <Titulo>Estatísticas da partida</Titulo>
      <table className="w-full table-fixed">
        <caption className="sr-only">Resumo por time</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{nomes.casa}</th>
            <th scope="col">Estatística</th>
            <th scope="col">{nomes.visitante}</th>
          </tr>
        </thead>
        <tbody>
          {comparativo(estado).map((l) => {
            const p = proporcao(l)
            return (
              <tr key={l.rotulo}>
                <td className="w-10 pb-3 align-top font-display text-2xl font-black leading-none tabular-nums">{l.casa}</td>
                <th scope="row" className="pb-3 align-top font-normal">
                  <span className="block text-center text-xs font-bold text-tinta-suave">{l.rotulo}</span>
                  <span aria-hidden className="mt-1.5 flex h-1.5 gap-0.5">
                    {p ? (
                      <>
                        {p.casa > 0 ? (
                          <span
                            title={`${nomes.casa}: ${l.casa}`}
                            className="rounded-full"
                            style={{ flexGrow: p.casa, background: COR_TIME.tela.casa }}
                          />
                        ) : null}
                        {p.visitante > 0 ? (
                          <span
                            title={`${nomes.visitante}: ${l.visitante}`}
                            className="rounded-full"
                            style={{ flexGrow: p.visitante, background: COR_TIME.tela.visitante }}
                          />
                        ) : null}
                      </>
                    ) : (
                      <span className="flex-1 rounded-full bg-muro-escuro" />
                    )}
                  </span>
                </th>
                <td className="w-10 pb-3 text-right align-top font-display text-2xl font-black leading-none tabular-nums">
                  {l.visitante}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

// Linha do tempo: um time em cima, o outro embaixo; cada marcador é um registro no minuto em que aconteceu.
const LARGURA = 320
const MARGEM = 14
const EIXO_Y = 62

export function LinhaDoTempo({ estado, agora, nomes }: { estado: Estado; agora: number; nomes: Nomes }) {
  const eventos = eventosLinhaDoTempo(estado.notas)
  if (eventos.length === 0) return null
  const eixo = duracaoEixo(estado, agora)
  const passo = eixo <= 30 ? 5 : 10
  const x = (min: number) => MARGEM + (Math.min(min, eixo) / eixo) * (LARGURA - MARGEM * 2)
  // No 2º tempo, o eixo segue depois do 1º; os minutos de cada tempo recomeçam do zero.
  const dois = estado.periodo === 2
  const fimPrimeiro = duracaoTempo(estado, agora, 1)

  // Registros no mesmo minuto (ou muito perto) se empilham para fora do eixo, sem se cobrir.
  const colocados: Record<Lado, number[]> = { casa: [], visitante: [] }
  const marcadores = eventos.map((n) => {
    const cx = x(minutoLinha(n, estado, agora))
    const nivel = colocados[n.lado].filter((outro) => Math.abs(outro - cx) < 13).length
    colocados[n.lado].push(cx)
    const distancia = 20 + Math.min(nivel, 2) * 15
    return { n, cx, cy: n.lado === 'casa' ? EIXO_Y - distancia : EIXO_Y + distancia }
  })
  const ticks: { pos: number; rotulo: string }[] = []
  for (let m = 0; m <= (dois ? fimPrimeiro - 1 : eixo); m += passo) ticks.push({ pos: m, rotulo: `${m}'` })
  if (dois) for (let m = passo; fimPrimeiro + m <= eixo; m += passo) ticks.push({ pos: fimPrimeiro + m, rotulo: `${m}'` })
  const tiposUsados = [...new Set(eventos.map((e) => e.tipo))]
  const resumo = eventos
    .map((e) => `${rotuloMinuto(e, estado)} ${TIPOS[e.tipo].rotulo} ${nomes[e.lado]}${e.texto ? ` ${e.texto}` : ''}`)
    .join('; ')

  return (
    <section className="flex flex-col gap-2">
      <Titulo>Linha do tempo</Titulo>
      <div className="rounded-2xl bg-muro px-1 pt-2 pb-1">
        <svg viewBox={`0 0 ${LARGURA} 132`} role="img" aria-label={`Linha do tempo: ${resumo}`} className="w-full">
          {ticks.map((t) => (
            <g key={t.pos}>
              <line x1={x(t.pos)} x2={x(t.pos)} y1={8} y2={116} stroke="var(--color-muro-escuro)" strokeWidth={1} />
              <text x={x(t.pos)} y={128} textAnchor="middle" fontSize={9} fill="var(--color-tinta-suave)">
                {t.rotulo}
              </text>
            </g>
          ))}
          {dois ? (
            <g>
              <line x1={x(fimPrimeiro)} x2={x(fimPrimeiro)} y1={2} y2={120} stroke="var(--color-tinta-suave)" strokeWidth={1.5} />
              <text x={x(fimPrimeiro) - 4} y={9} textAnchor="end" fontSize={9} fontWeight={700} fill="var(--color-tinta-suave)">
                1º tempo
              </text>
              <text x={x(fimPrimeiro) + 4} y={9} fontSize={9} fontWeight={700} fill="var(--color-tinta-suave)">
                2º tempo
              </text>
            </g>
          ) : null}
          <line x1={MARGEM} x2={LARGURA - MARGEM} y1={EIXO_Y} y2={EIXO_Y} stroke="var(--color-tinta-suave)" strokeWidth={2} strokeLinecap="round" />
          {/* faixa de cada time sobre o eixo, com a cor do time */}
          <circle cx={MARGEM} cy={EIXO_Y - 6} r={3} fill={COR_TIME.tela.casa} />
          <circle cx={MARGEM} cy={EIXO_Y + 6} r={3} fill={COR_TIME.tela.visitante} />
          {marcadores.map(({ n, cx, cy }) => (
            <g key={n.id}>
              <title>{`${rotuloMinuto(n, estado)} · ${TIPOS[n.tipo].rotulo} · ${nomes[n.lado]}${n.texto ? ` · ${n.texto}` : ''}`}</title>
              <line x1={cx} x2={cx} y1={EIXO_Y} y2={cy} stroke={COR_TIME.tela[n.lado]} strokeWidth={2} />
              {n.tipo === 'amarelo' || n.tipo === 'vermelho' ? (
                <rect
                  x={cx - 4.5}
                  y={cy - 6.5}
                  width={9}
                  height={13}
                  rx={2}
                  fill={COR_TIPO[n.tipo]}
                  stroke="var(--color-muro)"
                  strokeWidth={2}
                />
              ) : (
                <circle cx={cx} cy={cy} r={6.5} fill={COR_TIPO[n.tipo]} stroke="var(--color-muro)" strokeWidth={2} />
              )}
            </g>
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-xs text-tinta-suave">
        <span className="inline-flex items-center gap-1.5">
          <Bolinha lado="casa" /> {nomes.casa} em cima · <Bolinha lado="visitante" /> {nomes.visitante} embaixo
        </span>
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {tiposUsados.map((t) => (
            <span key={t} className="inline-flex items-center gap-1">
              <IconeTipo tipo={t} className={cn('size-3.5', TIPOS[t].tom)} />
              {TIPOS[t].rotulo}
            </span>
          ))}
        </span>
      </div>
    </section>
  )
}

// Gols por faixa de tempo: colunas lado a lado, uma de cada time por faixa.
export function GolsPorFaixa({ estado, agora, nomes }: { estado: Estado; agora: number; nomes: Nomes }) {
  const faixas = golsPorFaixa(estado, agora)
  const dois = faixas.some((f) => f.periodo === 2)
  const maior = Math.max(0, ...faixas.flatMap((f) => [f.casa, f.visitante]))
  if (maior === 0) return null
  const ALTURA = 72 // px da coluna mais alta
  return (
    <section className="flex flex-col gap-2">
      <Titulo>Gols por tempo de jogo</Titulo>
      <table className="w-full table-fixed border-separate border-spacing-0 rounded-2xl bg-muro px-2 pt-3 pb-2">
        <caption className="sr-only">Gols de cada time por faixa de minutos</caption>
        <thead className="sr-only">
          <tr>
            {faixas.map((f) => (
              <th key={`${f.periodo}-${f.inicio}`} scope="col">
                {dois ? `${f.periodo}º tempo, ` : ''}
                {f.inicio} a {f.fim} minutos
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {faixas.map((f, i) => (
              <td
                key={`${f.periodo}-${f.inicio}`}
                className={cn(
                  'border-b border-muro-escuro align-bottom',
                  // separa os dois tempos com uma linha
                  i > 0 && f.periodo !== faixas[i - 1].periodo && 'border-l border-l-tinta-suave',
                )}
              >
                <div className="flex items-end justify-center gap-0.5" style={{ height: ALTURA + 16 }}>
                  {(['casa', 'visitante'] as const).map((lado) => (
                    <div key={lado} className="flex w-full max-w-4 flex-col items-center justify-end gap-0.5">
                      {f[lado] > 0 ? (
                        <span className="text-[0.65rem] font-bold leading-none tabular-nums">
                          <span className="sr-only">{nomes[lado]}: </span>
                          {f[lado]}
                        </span>
                      ) : null}
                      <span
                        aria-hidden
                        title={`${nomes[lado]}: ${f[lado]}`}
                        className="w-full rounded-t-[4px]"
                        style={{ height: (f[lado] / maior) * ALTURA, background: COR_TIME.tela[lado] }}
                      />
                    </div>
                  ))}
                </div>
              </td>
            ))}
          </tr>
          <tr aria-hidden>
            {faixas.map((f) => (
              <td key={`${f.periodo}-${f.inicio}`} className="pt-1 text-center text-[0.6rem] text-tinta-suave tabular-nums">
                {f.inicio}–{f.fim}'
              </td>
            ))}
          </tr>
          {dois ? (
            <tr aria-hidden>
              {([1, 2] as const).map((p) => (
                <td
                  key={p}
                  colSpan={faixas.filter((f) => f.periodo === p).length}
                  className="pt-1 text-center text-[0.65rem] font-bold text-tinta-suave"
                >
                  {p}º tempo
                </td>
              ))}
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  )
}

export function Jogadores({ estado, nomes }: { estado: Estado; nomes: Nomes }) {
  const jogadores = porJogador(estado.notas)
  if (jogadores.length === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <Titulo>Jogadores</Titulo>
      <table className="w-full text-sm">
        <caption className="sr-only">Gols e cartões por jogador</caption>
        <thead>
          <tr className="text-xs text-tinta-suave">
            <th scope="col" className="pb-1 text-left font-bold">
              Jogador
            </th>
            <th scope="col" className="w-12 pb-1 font-bold">
              Gols
            </th>
            <th scope="col" className="w-20 pb-1 font-bold">
              Cartões
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-muro-escuro">
          {jogadores.slice(0, 10).map((j) => (
            <tr key={`${j.lado}-${j.nome}`}>
              <th scope="row" className="max-w-0 py-2 text-left font-bold">
                <span className="flex items-center gap-2">
                  <Bolinha lado={j.lado} />
                  <span className="truncate">{j.nome}</span>
                  <span className="sr-only">({nomes[j.lado]})</span>
                </span>
              </th>
              <td className="text-center font-display text-xl font-black tabular-nums">
                {j.gols || <span className="font-sans text-sm font-normal text-tinta-suave">–</span>}
              </td>
              <td className="text-center">
                <span className="inline-flex items-center gap-1.5">
                  {j.amarelos + j.vermelhos + j.punicoes === 0 ? <span className="text-tinta-suave">–</span> : null}
                  {j.amarelos > 0 ? <Contador tipo="amarelo" n={j.amarelos} /> : null}
                  {j.vermelhos > 0 ? <Contador tipo="vermelho" n={j.vermelhos} /> : null}
                  {j.punicoes > 0 ? <Contador tipo="punicao" n={j.punicoes} /> : null}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Contador({ tipo, n }: { tipo: TipoNota; n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 font-bold tabular-nums">
      <IconeTipo tipo={tipo} className={cn('size-3.5', TIPOS[tipo].tom)} />
      <span className="sr-only">{TIPOS[tipo].rotulo}:</span>
      {n > 1 ? n : ''}
    </span>
  )
}
