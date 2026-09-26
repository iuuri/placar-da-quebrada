# ⚽ Placar da Quebrada

Timer e placar para jogos de futebol de bairro, direto no navegador do celular, tablet ou computador.

**No ar:** https://placardaquebrada.pages.dev (o endereço antigo https://placar-da-quebrada.pages.dev continua funcionando)

## O que tem

- **Cronômetro regressivo (padrão) ou progressivo**, com tempo configurável (minutos e segundos)
  - Regressivo: para sozinho no zero, apita e vibra
  - Progressivo: mostra quanto já passou do tempo de jogo
  - **Acréscimo**: botões +1', +2', +3', +5' (também depois que o tempo acabou); no progressivo, apita quando o acréscimo termina
  - **1 ou 2 tempos** (padrão: 2). No fim do 1º tempo aparece **Encerrar 1º tempo**: o cronômetro zera para o 2º tempo (intervalo), o minuto recomeça e punições em andamento continuam com o que faltava. Registros, pop-ups e súmula dizem de qual tempo é cada minuto ("12' 2ºT"), e a súmula mostra o placar do 1º tempo e os gráficos separados por tempo
  - Continua certo se a tela apagar ou a página recarregar
  - Mantém a tela acesa enquanto o tempo corre (quando o aparelho permite)
  - **Janela flutuante** (experimental): botão 📺 no cronômetro completo abre o tempo, o placar e as punições numa janelinha que fica por cima de outros apps ao minimizar o navegador (picture-in-picture; depende do navegador). Fecha sozinha quando a pessoa volta para a página. Abrir sozinha ao minimizar não é possível: os navegadores só permitem isso para conteúdo com som
  - Fica **em cima do placar, fechado**: mostra só o tempo e o botão de iniciar/pausar. A seta abre os ajustes (tipo de contagem, tempo, acréscimo, zerar, janela flutuante) e fecha de novo; ao iniciar, fecha sozinho, e abre sozinho quando o tempo acaba
  - Rolando a página até os registros, o tempo aparece **pequeno no topo, ao lado da logo** (com pausar/continuar e a seta para voltar ao cronômetro)
- **Placar** com o nome dos dois times, gols e **faltas por time**. O botão **Gol** soma no placar na hora e abre um pop-up para pôr o jogador (opcional); o gol entra nos registros com o minuto. “Desfazer gol” no pop-up ou o − do placar tiram o gol e o registro
- **Registros por time**: toque em amarelo, vermelho, troca, punição 2' ou anotar e escolha o time num pop-up (nome do jogador opcional). O minuto do jogo é registrado sozinho. Cada registro vira um bloco (mais recente primeiro, com rolagem) que pode ser editado (texto e time) ou apagado
- **Punição de 2 minutos**: cronômetro regressivo por jogador, que anda junto com o tempo de jogo (pausa quando o jogo pausa) e avisa quando o jogador pode voltar
- **Súmula**: botão **Súmula** no fim da página abre a tela com placar, **destaques** (primeiro gol, maior tempo sem gol, artilheiro, fair play), **estatísticas da partida** (barras comparando os dois times), **linha do tempo** do jogo, **gols por tempo de jogo**, tabela de **jogadores** e todos os registros; tudo isso também vai no **PDF protegido contra edição**, que pode ser compartilhado (WhatsApp, e-mail…) ou baixado
- **Instalar como app (PWA)**: botão **📲 Instalar app** no fim da página. No Android/computador abre a instalação do navegador; no iPhone mostra o passo a passo do Safari (Compartilhar → Adicionar à Tela de Início). Instalado, abre em tela cheia com o ícone do Placar e funciona **sem internet**
- **Desfazer**: depois de marcar/tirar falta, tirar gol, registrar, editar ou apagar um registro, encerrar punição, zerar o tempo, encerrar o 1º tempo ou resetar tudo, aparece por alguns segundos um aviso com **Desfazer**
- **Resetar tudo** (no fim da página): zera placar, tempo e anotações (pede confirmação)

Visual em **tema escuro**, com o amarelo da placa como destaque.

Não há login nem banco de dados: tudo fica salvo **só no navegador do aparelho** que está usando.

## Tecnologia

React 19 + TypeScript + Vite + Tailwind CSS + vite-plugin-pwa (manifesto e service worker; ícones em `public/icons`). Hospedado no **Cloudflare Pages**; cada push na `main` publica automaticamente pelo GitHub Actions (`.github/workflows/frontend.yml`).

## Versão anterior (campeonatos)

O app completo de campeonatos (login, times, jogadores, Supabase) está arquivado na branch [`arquivo/v1-campeonatos`](https://github.com/iuuri/placar-da-quebrada/tree/arquivo/v1-campeonatos) e na tag `v1-campeonatos`, com toda a documentação em `docs/`.
