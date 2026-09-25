# ⚽ Placar da Quebrada

Timer e placar para jogos de futebol de bairro, direto no navegador do celular, tablet ou computador.

**No ar:** https://placar-da-quebrada.pages.dev

## O que tem

- **Cronômetro progressivo ou regressivo**, com tempo configurável (minutos e segundos)
  - Progressivo: mostra o acréscimo quando passa do tempo de jogo
  - Regressivo: para sozinho no zero, apita e vibra
  - Continua certo se a tela apagar ou a página recarregar
  - Mantém a tela acesa enquanto o tempo corre (quando o aparelho permite)
- **Placar** com o nome dos dois times e botões de gol (+1 / −1)
- **Anotações em blocos separados**, da mais recente para a mais antiga (com rolagem): escreva o jogador (opcional) e toque em 🟨 amarelo, 🟥 vermelho, ⚽ gol, 🔁 troca ou 📝 anotar; o minuto do jogo é registrado sozinho. Cada bloco pode ser editado ou apagado (com confirmação)
- **Resetar tudo**: zera placar, tempo e anotações (pede confirmação)

Não há login nem banco de dados: tudo fica salvo **só no navegador do aparelho** que está usando.

## Tecnologia

React 19 + TypeScript + Vite + Tailwind CSS. Hospedado no **Cloudflare Pages**; cada push na `main` publica automaticamente pelo GitHub Actions (`.github/workflows/frontend.yml`).

## Versão anterior (campeonatos)

O app completo de campeonatos (login, times, jogadores, Supabase) está arquivado na branch [`arquivo/v1-campeonatos`](https://github.com/iuuri/placar-da-quebrada/tree/arquivo/v1-campeonatos) e na tag `v1-campeonatos`, com toda a documentação em `docs/`.
