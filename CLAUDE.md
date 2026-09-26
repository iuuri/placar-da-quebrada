# Placar da Quebrada — Instruções para o Claude Code

## Objetivo atual

Um único app de página única: **cronômetro (progressivo/regressivo) + placar com nome dos times + anotações + resetar tudo**. Sem login, sem banco de dados, sem backend. Os dados ficam no `localStorage` do aparelho.

A versão anterior (campeonatos com Supabase) está arquivada na branch `arquivo/v1-campeonatos` / tag `v1-campeonatos`. Não trazer código de lá sem o usuário pedir.

## Hospedagem

- Cloudflare Pages, projeto `placardaquebrada` → https://placardaquebrada.pages.dev (endereço principal; previews de PR também saem nele)
- Projeto antigo `placar-da-quebrada` → https://placar-da-quebrada.pages.dev: recebe a mesma versão da `main` para não quebrar links antigos nem os jogos salvos nos aparelhos (o `localStorage` é separado por endereço)
- Deploy pelo GitHub Actions (`frontend.yml`): PR gera preview; merge na `main` publica.
- Secrets usados: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Stack

React 19 + TypeScript 6 + Vite 8 · Tailwind CSS 4 · vite-plugin-pwa (PWA: manifesto + service worker com autoUpdate, configurado no `vite.config.ts`) · jsPDF (carregado sob demanda, só ao gerar a súmula) · Vitest + Testing Library · oxlint. Não adicionar dependências sem justificar.

## Estrutura

```text
src/
  App.tsx          # tela única e efeitos (alarme, tela acesa)
  estado.ts        # estado, reducer e persistência no localStorage
  tempo.ts         # cálculos do cronômetro (funções puras, testadas)
  components/      # Placar (+ pop-up do gol), Cronometro(Mini), Anotacoes, Punicoes, Sumula, InstalarApp, Dialogo, ResetarTudo, Botao, Icone (ícones SVG próprios)
  lib/             # utils (cn), recursos do aparelho (som, vibração, wake lock), sumula.ts (PDF), flutuante.ts (janela flutuante), instalar.ts (PWA)
```

## Regras

1. Cronômetro usa timestamps (`iniciadoEm` + `acumuladoMs`); `setInterval` só redesenha a tela.
2. Mobile-first: botões grandes, funciona a partir de 320px, sem rolagem lateral (o grid usa `grid-cols-[minmax(0,1fr)]`).
3. Textos da interface em português do Brasil.
4. Ações destrutivas (resetar) sempre com confirmação na própria tela, nunca `window.confirm`.
5. Não fazer commit/push sem o usuário pedir. Trabalhar em branch `feat/*` ou `fix/*` e abrir PR para a `main` (a `main` é protegida).

6. O service worker só existe na build: para testar PWA/offline use `npm run build && npm run preview` (config `preview` no launch.json). Ícones gerados a partir de `public/favicon.svg`.

## Antes de concluir

```bash
npm run typecheck && npm run lint && npm run test -- --run && npm run build
```
