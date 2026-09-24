# Roadmap

Cada fase termina **publicada** em `placar-da-quebrada.pages.dev`. Uma fase = um ou mais PRs pequenos.

## Fase 0 — Contas e pipeline (documentação pronta)
- [x] Criar repositório GitHub (`iuuri/placar-da-quebrada`)
- [ ] Configurar identidade do git e dar o primeiro push ([connections.md](connections.md))
- [ ] Criar projeto Supabase (região São Paulo), desligar signup público
- [ ] Criar projeto Cloudflare Pages (Direct Upload) e API token
- [ ] Cadastrar secrets/variables no GitHub ([hosting.md](hosting.md#4-segredos-no-github))
- [ ] Autenticar o MCP do Supabase no Claude Code
- [ ] Responder as regras ❓ em [business-rules.md](business-rules.md)

## Fase 1 — Esqueleto no ar
- [ ] Scaffold Vite + React + TS + Tailwind + shadcn/ui + ESLint + Vitest + scripts npm
- [ ] `supabase/config.toml` (projeto CLI) e client `src/lib/supabase.ts`
- [ ] Migration 1: `profiles`, enums, trigger de novo usuário, `is_admin()`
- [ ] Login / logout / recuperar senha; guardas de rota
- [ ] Layout público + layout painel; rota 404 com fallback SPA (`public/_redirects`: `/* /index.html 200`)
- **Entrega:** site no ar, admin consegue logar.

## Fase 2 — Cadastros (admin)
- [ ] Migration 2: `campeonatos`, `campeonato_operadores`, `times`, `jogadores` + RLS
- [ ] CRUD campeonato com regras
- [ ] CRUD times e jogadores
- [ ] Edge Function `admin-users` + tela de operadores
- [ ] Página pública do campeonato e do time
- **Entrega:** campeonato cadastrado visível publicamente.

## Fase 3 — Partidas e placar ao vivo (coração do app)
- [ ] Migration 3: `partidas`, `eventos_partida`, `auditoria`, RPCs de cronômetro, trigger de placar, realtime
- [ ] Agenda de partidas + gerar tabela pontos corridos
- [ ] **Modo placar** do operador (cronômetro, gol, cartões, desfazer, encerrar)
- [ ] Página pública do jogo ao vivo (Realtime)
- [ ] Testes Vitest: cálculo do cronômetro, geração round-robin
- **Entrega:** jogo real sendo acompanhado ao vivo. 🎯 *Versão para mostrar.*

## Fase 4 — Tabela e estatísticas
- [ ] Views `v_classificacao`, `v_artilharia`, `v_cartoes`, `v_suspensos`
- [ ] Ordenação por desempate (incl. confronto direto) com testes
- [ ] Abas Classificação, Artilharia, Cartões/Suspensos
- [ ] E2E Playwright do fluxo principal
- **Entrega:** MVP completo.

## Fase 5 — Polimento
- [ ] PWA instalável + fila offline de eventos
- [ ] Modo telão (placar tela cheia)
- [ ] Upload de escudos/fotos (Supabase Storage)
- [ ] Substituições, observações de súmula, W.O.
- [ ] Card de resultado para compartilhar no WhatsApp

## Fase 6 — Evolução
- [ ] Grupos + mata-mata + pênaltis
- [ ] Segundo projeto Supabase para dev/preview
- [ ] Domínio próprio
- [ ] Multi-organizador (várias ligas)
