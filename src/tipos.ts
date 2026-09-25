import type { TipoNota } from './estado'

// Como cada tipo de registro aparece na tela e na súmula.
export const TIPOS: Record<
  TipoNota,
  { emoji: string; rotulo: string; plural: string; faixa: string; rgb: [number, number, number] }
> = {
  amarelo: { emoji: '🟨', rotulo: 'Amarelo', plural: 'Cartões amarelos', faixa: 'border-l-placa', rgb: [255, 201, 40] },
  vermelho: { emoji: '🟥', rotulo: 'Vermelho', plural: 'Cartões vermelhos', faixa: 'border-l-cartao', rgb: [214, 40, 57] },
  gol: { emoji: '⚽', rotulo: 'Gol', plural: 'Gols', faixa: 'border-l-gramado', rgb: [31, 122, 58] },
  troca: { emoji: '🔁', rotulo: 'Troca', plural: 'Substituições', faixa: 'border-l-tinta-suave', rgb: [74, 86, 114] },
  punicao: { emoji: '⏱️', rotulo: "Punição 2'", plural: "Punições 2'", faixa: 'border-l-laranja', rgb: [247, 127, 0] },
  nota: { emoji: '📝', rotulo: 'Anotação', plural: 'Outras anotações', faixa: 'border-l-muro-escuro', rgb: [201, 206, 214] },
}

// Ordem dos botões e do resumo.
export const ORDEM_TIPOS: TipoNota[] = ['amarelo', 'vermelho', 'gol', 'troca', 'punicao', 'nota']
