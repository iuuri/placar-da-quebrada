# Decisões (ADR)

Formato: contexto → decisão → consequência. Adicione novas no fim; não apague antigas (marque como *substituída*).

## ADR-001 — Supabase como backend e banco
- **Contexto:** precisa de banco, login, permissões e tempo real, grátis e sem servidor local.
- **Decisão:** Supabase Free (Postgres + Auth + RLS + Realtime + Edge Functions).
- **Consequência:** sem servidor próprio; regras de acesso ficam em SQL (RLS). Projeto pausa após 7 dias inativo → workflow keepalive.

## ADR-002 — Cloudflare Pages para o frontend
- **Contexto:** Vercel e Cloudflare servem SPA de graça; Vercel Hobby proíbe uso comercial.
- **Decisão:** Cloudflare Pages, deploy via GitHub Actions + Wrangler.
- **Consequência:** banda ilimitada; um único pipeline controla CI e deploy. Migrar para Vercel exige só trocar o job `deploy`.

## ADR-003 — SPA React + Vite (sem SSR)
- **Contexto:** não há necessidade de SEO forte; SSR exigiria runtime de servidor.
- **Decisão:** SPA estática com React + Vite + TypeScript.
- **Consequência:** hospedagem trivial; carregamento inicial depende do tamanho do bundle (meta < 250 KB gz).

## ADR-004 — Classificação e placar derivados
- **Contexto:** tabelas digitadas à mão divergem dos resultados.
- **Decisão:** eventos da partida são a fonte de verdade; placar em `partidas` é cache por trigger; classificação/artilharia/suspensões são views.
- **Consequência:** corrigir um gol corrige tudo automaticamente.

## ADR-005 — Cronômetro por timestamps do servidor
- **Contexto:** vários aparelhos precisam mostrar o mesmo tempo; internet no campo é instável.
- **Decisão:** guardar `inicio` + `acumulado`; cada cliente calcula o tempo; ações via RPC com `now()` do servidor.
- **Consequência:** zero escrita por segundo; placar consistente em todos os celulares.

## ADR-006 — Criação de usuários via Edge Function
- **Contexto:** criar usuário no Supabase Auth exige `service_role`, que não pode ir ao navegador.
- **Decisão:** Edge Function `admin-users` valida que o chamador é admin e cria/desativa operadores. Signup público desligado.
- **Consequência:** só admin cria contas; a chave privilegiada fica apenas no Supabase.

## ADR-007 — Operador controla qualquer partida
- **Contexto:** campeonato de bairro com poucos mesários; vincular operador a cada campeonato gera trabalho sem ganho real.
- **Decisão:** sem tabela `campeonato_operadores`. Todo usuário ativo (admin ou operador) vê todos os campeonatos e pode operar qualquer partida não encerrada. Só admin cadastra.
- **Consequência:** menos telas e regras. Para restringir no futuro (ex.: várias ligas), criar o vínculo e ajustar `private.pode_operar`.
