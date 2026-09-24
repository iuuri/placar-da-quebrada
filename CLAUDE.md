# Placar da Quebrada — Instruções para o Claude Code

Leia este arquivo antes de qualquer tarefa. Detalhes ficam em `docs/`.

## Objetivo

Web app (PWA) para campeonatos de futebol de bairro: campeonatos, times, jogadores, partidas, placar ao vivo, cronômetro, gols, cartões, súmula e classificação. Três perfis: **admin**, **operador** e **visitante** (não logado, só leitura).

## Restrição principal

**Tudo hospedado em serviços gratuitos na nuvem. Nada em máquina local.**
- Frontend: Cloudflare Pages (build via GitHub Actions).
- Backend + banco: Supabase (Postgres, Auth, Realtime, Edge Functions).
- Não criar servidor Node próprio, não usar Docker, não depender de `supabase start` local.
- Migrations são aplicadas no Supabase pela pipeline (`supabase db push`), não manualmente.

## Stack oficial

React 19 + TypeScript + Vite · Tailwind CSS + shadcn/ui · React Router · TanStack Query · `@supabase/supabase-js` · Zod + React Hook Form · Vitest (+ Testing Library) · Playwright (E2E, fase posterior) · ESLint + Prettier · PWA via `vite-plugin-pwa`.

Não adicionar dependências fora dessa lista sem justificar.

## Estrutura de pastas (alvo)

```text
src/
  app/            # rotas, layout, providers
  features/       # por domínio: campeonatos, times, jogadores, partidas, classificacao, usuarios, auth
    <feature>/
      api.ts      # chamadas ao Supabase (único lugar que usa o client)
      hooks.ts    # hooks TanStack Query
      components/
      pages/
      schemas.ts  # Zod
  components/ui/  # shadcn
  lib/            # supabase client, utils, cronometro, formatadores
  types/          # database.types.ts gerado pelo Supabase
supabase/
  migrations/     # SQL versionado (única forma de alterar o banco)
  functions/      # Edge Functions (Deno)
  seed.sql
docs/
.github/workflows/
```

## Regras de desenvolvimento

1. Leia a documentação relevante em `docs/` antes de implementar.
2. Tarefas pequenas, uma fase do [roadmap](docs/roadmap.md) por vez. Não implementar fora do escopo pedido.
3. Não inventar regra de negócio: se não estiver em [docs/business-rules.md](docs/business-rules.md), pergunte.
4. Toda mudança de banco = nova migration em `supabase/migrations/` (nome `AAAAMMDDHHMMSS_descricao.sql`). Nunca editar migration já aplicada.
5. Toda tabela nova: RLS habilitado + políticas explícitas conforme [docs/permissions.md](docs/permissions.md).
6. Segurança fica no banco (RLS / funções `security definer`). Esconder botão no frontend não é segurança.
7. Nunca colocar `service_role` key, senha de banco ou tokens no frontend ou no repositório. Frontend só usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
8. Classificação, artilharia e suspensões são **derivadas** (views SQL), nunca digitadas.
9. Placar é derivado dos eventos da partida (gols); colunas de placar em `partidas` são cache mantido por trigger.
10. Cronômetro usa timestamps do servidor (ver [docs/architecture.md](docs/architecture.md#cronômetro)); nunca `setInterval` como fonte de verdade.
11. Mobile-first: o operador usa celular na beira do campo. Botões grandes, poucas telas, funciona com internet ruim.
12. Textos da interface em português do Brasil.
13. Não fazer commit/push sem o usuário pedir. Trabalhar em branch `feat/*` ou `fix/*` e abrir PR para a `main`; nunca dar push direto na `main` depois do primeiro commit.
14. Conexões (GitHub, MCP do Supabase, secrets): ver [docs/connections.md](docs/connections.md). Nunca pedir tokens no chat.

## Qualidade antes de concluir

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Revise estados de loading/erro/vazio e a tela em 375px de largura.

## Skills recomendadas

Ver [docs/skills.md](docs/skills.md). Use `supabase:supabase` e `supabase:supabase-postgres-best-practices` para qualquer tarefa de banco/RLS/Auth; `frontend-design`/`ui-ux-pro-max` para telas.
