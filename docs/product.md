# Produto

## Visão

Um "Scoreboard" de celular que vira sistema de campeonato: o operador controla placar, cronômetro e cartões na beira do campo, e tudo aparece ao vivo para a quebrada inteira no link público — com tabela, artilharia e cartões atualizados sozinhos.

## Problema

Campeonatos de bairro são controlados em papel, planilha e grupo de WhatsApp. Resultado: tabela errada, briga por suspensão, ninguém sabe o placar de quem não está no campo.

## Perfis

### Admin (organizador)
- Cria e configura campeonatos (regras de pontuação, duração, cartões).
- Cadastra times e jogadores.
- Monta a tabela de jogos (rodadas, datas, local).
- Cria, desativa e atribui **operadores** a campeonatos.
- Pode corrigir qualquer dado, inclusive súmula encerrada.

### Operador (mesário)
- Faz login e vê os jogos dos campeonatos em que foi escalado.
- Abre a partida no **modo placar**: inicia/pausa/encerra tempos, marca gols, cartões, substituições.
- Desfaz lançamento errado enquanto a partida não foi encerrada.
- Encerra a partida (a súmula fica travada para ele).

### Visitante (torcida)
- Sem login.
- Vê campeonatos públicos, jogos do dia, **placar ao vivo com cronômetro**, resultados, classificação, artilharia, cartões/suspensos e elenco dos times.
- Pode compartilhar o link de um jogo ao vivo.

## MVP (o que tem que funcionar para mostrar)

1. Login admin/operador; visitante sem login.
2. Admin cria campeonato de **pontos corridos** (todos contra todos).
3. Admin cadastra times (nome, sigla, escudo, cor) e jogadores (nome, apelido, número).
4. Admin cria partidas e escala operadores.
5. Operador controla a partida ao vivo: cronômetro, gols (com autor), cartões amarelo/vermelho.
6. Visitante acompanha em tempo real.
7. Classificação, artilharia e cartões calculados automaticamente.
8. Deploy automático a cada push na `main`.

## Fora do MVP (fases seguintes)

- Fase de grupos + mata-mata, pênaltis.
- Suspensão automática por cartões com aviso ao escalar.
- Modo "telão" (placar em tela cheia para TV/projetor).
- Upload de escudo e foto do jogador (Supabase Storage).
- Vários organizadores independentes (multi-tenant).
- Notificações push, compartilhamento de card de resultado.
- Domínio próprio.
