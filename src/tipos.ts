import type { TipoNota } from './estado'

// Como cada tipo de registro aparece na tela e na súmula. "tom" é a cor do ícone na lista.
export const TIPOS: Record<
  TipoNota,
  { rotulo: string; curto: string; plural: string; tom: string; rgb: [number, number, number] }
> = {
  amarelo: { rotulo: 'Amarelo', curto: 'Amarelo', plural: 'Cartões amarelos', tom: 'text-placa', rgb: [255, 201, 40] },
  vermelho: { rotulo: 'Vermelho', curto: 'Vermelho', plural: 'Cartões vermelhos', tom: 'text-cartao', rgb: [214, 40, 57] },
  gol: { rotulo: 'Gol', curto: 'Gol', plural: 'Gols', tom: 'text-gramado', rgb: [31, 122, 58] },
  troca: { rotulo: 'Troca', curto: 'Troca', plural: 'Substituições', tom: 'text-tinta', rgb: [74, 86, 114] },
  punicao: { rotulo: "Punição 2'", curto: '2 min', plural: "Punições 2'", tom: 'text-laranja', rgb: [247, 127, 0] },
  nota: { rotulo: 'Anotação', curto: 'Anotar', plural: 'Outras anotações', tom: 'text-tinta-suave', rgb: [201, 206, 214] },
}

// Ordem do resumo da súmula.
export const ORDEM_TIPOS: TipoNota[] = ['amarelo', 'vermelho', 'gol', 'troca', 'punicao', 'nota']

// Botões de registro: gol fica fora, porque é marcado direto no placar.
export const TIPOS_BOTAO: TipoNota[] = ['amarelo', 'vermelho', 'troca', 'punicao', 'nota']
