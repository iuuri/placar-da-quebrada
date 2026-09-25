# Roadmap

Cada fase termina **publicada** em `placar-da-quebrada.pages.dev`. Uma fase = um ou mais PRs pequenos.

## Fase 0 — Contas e pipeline (documentação pronta)
- [x] Criar repositório GitHub (`iuuri/placar-da-quebrada`)
- [ ] Configurar identidade do git e dar o primeiro push ([connections.md](connections.md))
- [ ] Criar projeto Supabase (região São Paulo), desligar signup público
- [ ] Criar projeto Cloudflare Pages (Direct Upload) e API token
- [ ] Cadastrar secrets/variables no GitHub ([hosting.md](hosting.md#4-segredos-no-github))
- [ ] Autenticar o MCP do Supabase no Claude Code

## Fase 1 — Esqueleto no ar
- [x] Scaffold Vite + React + TS + Tailwind + oxlint + Vitest + scripts npm
- [x] `supabase/config.toml` (projeto CLI) e client `src/lib/supabase.ts`
- [x] Migration 1: `profiles`, enums, trigger de novo usuário, `private.is_admin()`
- [x] Login / logout / recuperar senha; guardas de rota
- [x] Layout público + layout painel; rota 404 com fallback SPA (`public/_redirects`: `/* /index.html 200`)
- [ ] Configurar URLs do Auth no Supabase e criar o primeiro admin ([permissions.md](permissions.md#bootstrap-do-primeiro-admin))
- **Entrega:** site no ar, admin consegue logar.

## Fase 2 — Cadastros (admin)
- [x] 2.1 Migration `cadastros`: `campeonatos`, `times`, `jogadores` + RLS + `private.is_staff()`
- [x] 2.2 Tela: criar/editar/apagar campeonato
- [x] 2.3 Tela: times e jogadores
- [x] 2.4 Edge Function `admin-users` + tela de operadores (criar, trocar senha, ativar/desativar, mudar papel)
- [x] 2.5 Páginas públicas: início com campeonatos, página do campeonato (times) e do time (elenco)
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
- [ ] Definir e implementar as regras da seção "Fora das regras por enquanto" em [business-rules.md](business-rules.md)
- [ ] Grupos + mata-mata + pênaltis
- [ ] Segundo projeto Supabase para dev/preview
- [ ] Domínio próprio
- [ ] Multi-organizador (várias ligas)
