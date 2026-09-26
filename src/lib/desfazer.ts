import type { Acao, Estado, Lado } from '@/estado'
import { TIPOS } from '@/tipos'

// Desfazer: depois de uma ação que muda o jogo, aparece um aviso com "Desfazer" por alguns segundos.
// "completo" volta tudo (inclusive o cronômetro); os outros voltam só placar, registros e punições,
// para não mexer no tempo que continuou correndo.

export type Desfazivel = { texto: string; completo: boolean }

export function descreverAcao(acao: Acao, estado: Estado): Desfazivel | null {
  const nome = (lado: Lado) => estado.placar[lado].nome || (lado === 'casa' ? 'Time A' : 'Time B')
  const parcial = (texto: string) => ({ texto, completo: false })
  switch (acao.tipo) {
    case 'tirarGol':
      return estado.placar[acao.lado].gols > 0 ? parcial(`Gol de ${nome(acao.lado)} retirado`) : null
    case 'falta':
      if (acao.delta < 0 && estado.placar[acao.lado].faltas === 0) return null
      return parcial(acao.delta > 0 ? `Falta de ${nome(acao.lado)} marcada` : `Falta de ${nome(acao.lado)} retirada`)
    case 'adicionarNota': {
      const { tipo, lado } = acao.nota
      return parcial(lado ? `${TIPOS[tipo].rotulo} de ${nome(lado)} registrado` : 'Anotação registrada')
    }
    case 'editarNota':
      return parcial('Registro alterado')
    case 'removerNota': {
      const alvo = estado.notas.find((n) => n.id === acao.id)
      return parcial(alvo?.tipo === 'gol' ? 'Gol apagado' : 'Registro apagado')
    }
    case 'encerrarPunicao':
      return parcial('Punição encerrada')
    case 'zerarTempo':
      return { texto: 'Tempo zerado', completo: true }
    case 'encerrarTempo':
      return { texto: '1º tempo encerrado', completo: true }
    case 'resetarTudo':
      return { texto: 'Jogo zerado', completo: true }
    default:
      return null
  }
}

// Estado depois de desfazer: volta ao "antes", mas sem desfazer o que não tem a ver com a ação.
export function voltar(antes: Estado, atual: Estado, completo: boolean): Estado {
  if (completo) return antes
  return {
    ...atual,
    placar: {
      // nomes digitados depois continuam
      casa: { ...antes.placar.casa, nome: atual.placar.casa.nome },
      visitante: { ...antes.placar.visitante, nome: atual.placar.visitante.nome },
    },
    notas: antes.notas,
    punicoes: antes.punicoes,
  }
}
