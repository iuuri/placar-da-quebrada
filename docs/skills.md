# Skills e plugins do Claude Code

## Já instalados neste ambiente (usar!)

| Skill | Quando usar no projeto |
|---|---|
| `supabase:supabase` | Qualquer tarefa com Supabase: Auth, RLS, Realtime, Edge Functions, CLI |
| `supabase:supabase-postgres-best-practices` | **Antes** de escrever migration, tabela, view, índice ou política RLS |
| `frontend-design` | Direção visual das telas (identidade "quebrada", não parecer template) |
| `ui-ux-pro-max` | Paleta, tipografia, UX do modo placar e da área pública |
| `ui-styling` | Componentes shadcn/ui + Tailwind |
| `responsive-design` | Layout mobile-first do operador e modo telão |
| `web-design-guidelines` | Revisão de acessibilidade/UX antes de cada entrega |
| `design` / `brand` | Logo, escudos genéricos, identidade visual do Placar da Quebrada |
| `code-review` / `security-review` | Revisar PRs, especialmente políticas RLS e a Edge Function de usuários |

## Recomendado instalar / habilitar

| O quê | Por quê | Como |
|---|---|---|
| **MCP do Supabase** (plugin `supabase` já presente, falta autenticar) | Claude consulta o schema, roda SQL de leitura, gera tipos TypeScript e lê logs direto do projeto na nuvem — essencial já que não há banco local | Em um terminal `claude` interativo: `/mcp` → `supabase` → autenticar. Use modo **read-only** para produção |
| **Skills da Vercel Labs** (`vercel-labs/agent-skills` → `react-best-practices`) | Boas práticas de performance em React | `npx skills add vercel-labs/agent-skills` (verificar o repositório antes de instalar) |
| **Skill `webapp-testing` da Anthropic** (`anthropics/skills`) | Testes E2E com Playwright do modo placar e área pública (Fase 4) | `/plugin marketplace add anthropics/skills` e instalar `webapp-testing` |
| **MCP / skills da Cloudflare** (`cloudflare/skills` ou MCP de docs da Cloudflare) | Consultar docs de Pages/Wrangler, ver deploys | Verificar disponibilidade no marketplace antes; opcional |

> Busca em 24/09/2026 nos catálogos de skills e plugins da sua conta claude.ai (supabase, cloudflare, vercel, react, playwright, github): nenhum item extra disponível. Os itens acima vêm de repositórios públicos — confira a origem antes de instalar.

## Skills do projeto (criar conforme necessidade, em `.claude/skills/`)

Criar apenas quando um fluxo se repetir. Candidatos:

- `nova-migration` — gerar migration com RLS padrão + checklist de [database.md](database.md#rls).
- `nova-feature` — scaffold de `features/<nome>/{api,hooks,schemas}.ts` seguindo [architecture.md](architecture.md).

Use a skill `anthropic-skills:skill-creator` para criá-las.
