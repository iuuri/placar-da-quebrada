# Arquitetura

## Visão geral

```text
                    ┌──────────────────────────────┐
  Visitante ───────►│  Cloudflare Pages (CDN)      │
  Operador  ───────►│  SPA React + Vite (PWA)      │
  Admin     ───────►└──────────────┬───────────────┘
                                   │ supabase-js (HTTPS + WebSocket)
                    ┌──────────────▼───────────────┐
                    │  Supabase (Free)              │
                    │  ├─ Auth (email/senha)        │
                    │  ├─ PostgREST API  ── RLS ──┐ │
                    │  ├─ Realtime (placar ao vivo)│ │
                    │  ├─ Edge Function admin-users│ │
                    │  └─ PostgreSQL ◄────────────┘ │
                    └──────────────▲───────────────┘
                                   │ supabase db push / functions deploy
  GitHub (código) ──► GitHub Actions ──► wrangler pages deploy ──► Cloudflare
```

- **Não existe servidor próprio.** O "backend" é o Supabase: API REST gerada automaticamente sobre o Postgres, com RLS garantindo as permissões, e Edge Functions (Deno) só para o que precisa da `service_role` (criar usuários).
- A SPA é estática → cabe no Cloudflare Pages gratuito sem limite de banda.

## Frontend

- Rotas (React Router):

| Rota | Acesso | Tela |
|---|---|---|
| `/` | público | Campeonatos públicos + jogos ao vivo agora |
| `/c/:slug` | público | Campeonato: abas Jogos · Classificação · Artilharia · Cartões · Times |
| `/c/:slug/jogo/:id` | público | Placar ao vivo + linha do tempo |
| `/c/:slug/time/:id` | público | Elenco e jogos do time |
| `/login` | público | Login |
| `/painel` | operador/admin | Meus jogos (hoje / próximos) |
| `/painel/jogo/:id` | operador/admin | **Modo placar** (controle ao vivo) |
| `/admin` | admin | Lista de campeonatos |
| `/admin/campeonatos/novo`, `/admin/campeonatos/:id` | admin | Criar/editar/apagar campeonato e regras |
| `/admin/campeonatos/:id/times` | admin | Times e jogadores |
| `/admin/campeonatos/:id/partidas` | admin | Agenda e operadores |
| `/admin/usuarios` | admin | Operadores |

- Guardas de rota por perfil (`RequireRole`) — apenas UX; a proteção real é RLS.
- Dados via TanStack Query; o client Supabase só é usado em `features/*/api.ts`.
- `src/types/database.types.ts` gerado com `supabase gen types typescript` (na pipeline ou via MCP do Supabase).

## Identidade visual

Conceito: **placa pintada de várzea**. Letreiro de campo, muro chapiscado, placar escrito à mão. Tokens em `src/index.css` (`@theme`).

| Token | Hex | Uso |
|---|---|---|
| `muro` | #eef1f4 | fundo |
| `muro-escuro` | #c9ced6 | bordas, separadores |
| `tinta` | #14213d | texto e contornos |
| `tinta-suave` | #4a5672 | texto secundário |
| `placa` | #ffc928 | ação principal, marca, destaque do placar |
| `gramado` | #1f7a3a | ao vivo, sucesso |
| `cartao` | #d62839 | cartão vermelho, erro |

- Tipografia: **Big Shoulders Display** (títulos, placar, cronômetro; condensada como letreiro de estádio) e **Atkinson Hyperlegible** (texto; leitura no sol, no celular). Auto-hospedadas via `@fontsource`.
- A marca (placa amarela inclinada com sombra dura) é o único elemento "barulhento"; o resto fica sóbrio.
- Botões de ação com no mínimo 48px de altura; foco visível; `prefers-reduced-motion` respeitado.

## Realtime (placar ao vivo)

- Tabelas `partidas` e `eventos_partida` adicionadas à publicação `supabase_realtime`.
- Página pública do jogo assina `postgres_changes` filtrando `partida_id=eq.<id>` e invalida o cache do TanStack Query ao receber mudança.
- RLS também vale para Realtime: o visitante só recebe mudanças de campeonatos públicos.
- Fallback: se o WebSocket cair, refetch a cada 15s.

## Cronômetro

O cronômetro **não** é contado no navegador do operador e enviado a cada segundo (isso gastaria cota e falharia com internet ruim). Em vez disso a partida guarda:

| Coluna | Significado |
|---|---|
| `periodo_atual` | 1, 2 (3/4 = prorrogação) |
| `cronometro_rodando` | boolean |
| `cronometro_inicio` | `timestamptz` do último "play" (hora do servidor) |
| `cronometro_acumulado_seg` | segundos já corridos antes do último play |

- **Tempo exibido** = `acumulado + (rodando ? now() - inicio : 0)`, calculado em cada cliente a cada 1s.
- Play/pause/fim do tempo são chamadas a funções SQL (`rpc('partida_iniciar_periodo')`, `partida_pausar`, `partida_encerrar_periodo`, `partida_encerrar`) que usam `now()` do servidor → todos os aparelhos ficam sincronizados.
- O cliente corrige a diferença de relógio medindo o offset com o servidor ao carregar (`select now()` via RPC `server_time`).

## Lançamento de eventos

- Operador toca **Gol → Time → Jogador** (3 toques). Minuto vem do cronômetro.
- Insert em `eventos_partida`; trigger recalcula `gols_mandante/gols_visitante` na partida.
- Atualização otimista na UI; em erro, desfaz e mostra aviso.
- "Desfazer" = marcar `anulado = true` (nunca apagar — mantém auditoria).

## Offline / internet ruim (fase 2)

- PWA com cache do app shell.
- Fila local de eventos quando offline, enviada ao reconectar (evento carrega `client_id` UUID para evitar duplicidade).

## Ambientes

| Ambiente | Frontend | Supabase |
|---|---|---|
| Produção | Cloudflare Pages branch `main` | projeto `placar-da-quebrada` |
| Preview | Cloudflare Pages preview por PR | mesmo projeto (MVP) — depois um 2º projeto gratuito `placar-da-quebrada-dev` |
