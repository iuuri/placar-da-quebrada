# Regras de negócio

Valores entre `[ ]` são padrões configuráveis por campeonato. Regras marcadas com ❓ precisam de confirmação do organizador antes de implementar.

## Pontuação

- Vitória `[3]`, empate `[1]`, derrota `[0]`.
- **W.O.**: vencedor recebe os pontos de vitória e placar `[3 x 0]`; perdedor `[0]` pontos. ❓ Perde também pontos extras?
- Partida `cancelada` ou `adiada` não conta na classificação.
- Só partidas `encerrada` ou `wo` entram na classificação.

## Critérios de desempate (ordem padrão, configurável)

1. Pontos
2. Número de vitórias
3. Saldo de gols
4. Gols pró
5. Confronto direto (só entre 2 times empatados)
6. Menos cartões vermelhos
7. Menos cartões amarelos
8. Sorteio (manual pelo admin)

## Placar

- O placar é a soma dos eventos `gol` e `gol_contra` **não anulados**.
- `gol_contra` marcado por jogador do time A conta para o time B e **não** entra na artilharia.
- Admin pode lançar resultado final sem eventos (jogo sem súmula detalhada): nesse caso usa-se `placar_manual`. ❓ Permitir no MVP?

## Partida e cronômetro

- Tempos: `[2]` tempos de `[25]` minutos (configurável por campeonato; futsal/society variam).
- Cronômetro progressivo; pode passar do tempo regulamentar (acréscimos), exibindo `25+2'`.
- Fluxo de status:
  `agendada → em_andamento (1º tempo) → intervalo → em_andamento (2º tempo) → encerrada`
- Prorrogação e pênaltis: fase de mata-mata (não MVP).
- Após `encerrada`, operador **não** edita mais; só admin pode reabrir/corrigir.

## Cartões e suspensões

- Amarelo; 2º amarelo no mesmo jogo = vermelho automático (evento `segundo_amarelo`).
- Vermelho direto = suspenso `[1]` jogo seguinte.
- Acúmulo de `[3]` amarelos (em jogos diferentes) = suspenso `[1]` jogo; contagem zera após cumprir. ❓
- Suspensão é **calculada** (view), não digitada. Admin pode registrar suspensão extra manualmente (punição disciplinar).
- No MVP a suspensão é **informativa** (aparece na lista de suspensos e alerta na partida), não bloqueia o lançamento.

## Times e jogadores

- Número da camisa único por time (entre jogadores ativos).
- Jogador pertence a um único time por campeonato. ❓ Transferência no meio do campeonato?
- Limite de inscritos por time `[sem limite]`.
- Jogador desativado continua nas estatísticas históricas.

## Tabela de jogos

- Pontos corridos: geração automática por algoritmo de rodízio (round-robin), turno único `[padrão]` ou turno e returno.
- Com número ímpar de times, um time folga por rodada.
