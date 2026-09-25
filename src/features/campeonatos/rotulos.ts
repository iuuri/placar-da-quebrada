// Rótulos sem dependência do Zod: usados também na área pública (bundle inicial leve).

export const MODALIDADES = [
  { valor: 'society', rotulo: 'Society' },
  { valor: 'campo', rotulo: 'Campo' },
  { valor: 'futsal', rotulo: 'Futsal' },
] as const

export const STATUS_CAMPEONATO = [
  { valor: 'rascunho', rotulo: 'Rascunho' },
  { valor: 'inscricoes', rotulo: 'Inscrições abertas' },
  { valor: 'em_andamento', rotulo: 'Em andamento' },
  { valor: 'finalizado', rotulo: 'Finalizado' },
] as const

export function rotuloStatus(valor: string) {
  return STATUS_CAMPEONATO.find((s) => s.valor === valor)?.rotulo ?? valor
}

export function rotuloModalidade(valor: string) {
  return MODALIDADES.find((m) => m.valor === valor)?.rotulo ?? valor
}
