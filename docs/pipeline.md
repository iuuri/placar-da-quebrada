# Pipeline CI/CD

Tudo roda no **GitHub Actions**. Você só faz `git push`; o resto é automático.

```text
 git push / PR
      │
      ├─► frontend.yml ── detect ─► check (typecheck, lint, test, build) ─► deploy
      │                                                     │
      │                               PR  → Cloudflare Pages preview (URL comentada no PR)
      │                               main → Cloudflare Pages produção (placar-da-quebrada.pages.dev)
      │
      ├─► supabase.yml (só se mudar supabase/**)
      │         PR   → supabase db push --dry-run  (mostra migrations pendentes)
      │         main → supabase db push + supabase functions deploy
      │
      └─► keepalive.yml (agendado, a cada 3 dias) → evita pausa do Supabase Free
```

## Arquivos

| Arquivo | Função |
|---|---|
| [.github/workflows/frontend.yml](../.github/workflows/frontend.yml) | CI + deploy do site. Ignora o job enquanto não existir `package.json`. |
| [.github/workflows/supabase.yml](../.github/workflows/supabase.yml) | Aplica migrations e publica Edge Functions |
| [.github/workflows/keepalive.yml](../.github/workflows/keepalive.yml) | Ping para o projeto Supabase não pausar |
| [.github/pull_request_template.md](../.github/pull_request_template.md) | Checklist de PR |

Segredos necessários: ver [hosting.md](hosting.md#4-segredos-no-github).

## Scripts npm esperados (criados na Fase 1)

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "typecheck": "tsc -b --noEmit",
  "lint": "eslint .",
  "test": "vitest",
  "preview": "vite preview"
}
```

## Fluxo de trabalho (branches)

1. `main` = produção. Protegida: só entra via PR com CI verde (Settings → Branches → Add rule → *Require status checks*).
2. Para cada tarefa: branch `feat/<nome>` ou `fix/<nome>` → PR → preview automático → revisar no celular → merge.
3. Merge na `main` publica o site e aplica migrations.

> Ordem importa: se um PR tem migration **e** frontend que depende dela, o `supabase.yml` e o `frontend.yml` rodam em paralelo no merge. Para evitar o site novo apontar para um banco antigo por alguns segundos, prefira migrations **compatíveis com a versão anterior** (adicionar colunas antes de usar; remover só num PR seguinte).

## Primeiro push

A branch `main` e o remoto `origin` (`https://github.com/iuuri/placar-da-quebrada.git`) já estão configurados. Antes, configure a identidade do git ([connections.md](connections.md#11-identidade-do-autor-dos-commits)).

```bash
git commit -m "docs: planejamento inicial e pipeline"
```

```bash
git push -u origin main
```

Faça esse primeiro push você mesmo, porque é nele que o Git Credential Manager abre o login do GitHub. Depois disso o Claude consegue dar push sozinho.

Depois do push, confira a aba **Actions** no GitHub: o `frontend.yml` vai avisar que ainda não há `package.json`. Isso é esperado.

## Sem máquina local?

Se não quiser nem editar no computador, use o **GitHub Codespaces** (60 h/mês grátis) ou o **Claude Code na web** (claude.ai/code) apontando para o repositório — ambos editam e fazem push direto na nuvem.

## Rollback

- Frontend: Cloudflare → Pages → Deployments → *Rollback* em um deploy anterior (instantâneo).
- Banco: criar nova migration que desfaz a mudança (não existe "voltar migration" automático). O plano Free **não** tem backup diário acessível — exporte manualmente (Dashboard → Database → Backups / `pg_dump` via workflow futuro) antes de migrations destrutivas.
