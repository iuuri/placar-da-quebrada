# Placar da Quebrada — Instruções para o Claude Code

## Objetivo atual

Um único app de página única: **cronômetro (progressivo/regressivo) + placar com nome dos times + anotações + resetar tudo**. Sem login, sem banco de dados, sem backend. Os dados ficam no `localStorage` do aparelho.

A versão anterior (campeonatos com Supabase) está arquivada na branch `arquivo/v1-campeonatos` / tag `v1-campeonatos`. Não trazer código de lá sem o usuário pedir.

## Hospedagem

- Cloudflare Pages, projeto `placar-da-quebrada` → https://placar-da-quebrada.pages.dev
- Deploy pelo GitHub Actions (`frontend.yml`): PR gera preview; merge na `main` publica.
- Secrets usados: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Stack

React 19 + TypeScript 6 + Vite 8 · Tailwind CSS 4 · jsPDF (carregado sob demanda, só ao gerar a súmula) · Vitest + Testing Library · oxlint. Não adicionar dependências sem justificar.

## Estrutura

```text
src/
  App.tsx          # tela única e efeitos (alarme, tela acesa)
  estado.ts        # estado, reducer e persistência no localStorage
  tempo.ts         # cálculos do cronômetro (funções puras, testadas)
  components/      # Placar, Cronometro, Anotacoes, ResetarTudo, Botao
  lib/             # utils (cn), recursos do aparelho (som, vibração, wake lock), sumula.ts (PDF)
```

## Regras

1. Cronômetro usa timestamps (`iniciadoEm` + `acumuladoMs`); `setInterval` só redesenha a tela.
2. Mobile-first: botões grandes, funciona a partir de 320px, sem rolagem lateral (o grid usa `grid-cols-[minmax(0,1fr)]`).
3. Textos da interface em português do Brasil.
4. Ações destrutivas (resetar) sempre com confirmação na própria tela, nunca `window.confirm`.
5. Não fazer commit/push sem o usuário pedir. Trabalhar em branch `feat/*` ou `fix/*` e abrir PR para a `main` (a `main` é protegida).

## Antes de concluir

```bash
npm run typecheck && npm run lint && npm run test -- --run && npm run build
```
