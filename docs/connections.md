# Conexões — como o Claude Code acessa GitHub, Supabase e Cloudflare

Objetivo: o Claude consegue **commitar e dar push** no GitHub e **consultar o Supabase**. Deploy do site e migrations do banco ficam por conta do GitHub Actions. O Claude nunca precisa da senha do banco nem do token da Cloudflare.

```text
Claude Code ──git push──► GitHub ──Actions──► Cloudflare Pages (site)
     │                                  └──► Supabase (migrations, Edge Functions)
     └──MCP Supabase (leitura/SQL/tipos)──► Supabase
```

| Serviço | Quem acessa | Credencial | Onde fica |
|---|---|---|---|
| GitHub (push) | Claude, via git | Login do Git Credential Manager ou token fine-grained | Gerenciador de credenciais do Windows |
| Supabase (consulta) | Claude, via MCP | OAuth do MCP (login no navegador) | Configuração do Claude Code |
| Supabase (migrations) | GitHub Actions | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID` | GitHub Secrets |
| Cloudflare Pages (deploy) | GitHub Actions | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | GitHub Secrets |
| Frontend → Supabase | Navegador do usuário | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (públicas) | URL em GitHub Variables, anon key em GitHub Secrets; `.env` local (ignorado pelo git) |

> **Nunca cole tokens, senhas ou a `service_role` key no chat do Claude, em arquivo versionado ou no frontend.** Todos os segredos vão direto nas telas do GitHub e do Supabase.

## Estado atual deste repositório (24/09/2026)

- Projeto Supabase criado: ref `uoszdwwqzhilwbsilmkn` (`https://uoszdwwqzhilwbsilmkn.supabase.co`), cadastro público desligado. O ref não é segredo.
- Repositório `https://github.com/iuuri/placar-da-quebrada`, com o primeiro commit (`d29de1f`) já na `main`. Identidade do git configurada (Iuri).
- `gh` (GitHub CLI) não instalado. É opcional; sem ele o Claude cria PRs pelo site do GitHub.
- `.env` local existe, aponta para esse projeto e está no `.gitignore` (deve conter só URL e anon key).
- O MCP do Supabase aparece no Claude Code, mas **ainda não foi autenticado**.

## 1. GitHub — permitir que o Claude faça commit e push

### 1.1 Identidade do autor dos commits

Rode uma vez no terminal:

```bash
git config --global user.name "Seu Nome"
```

```bash
git config --global user.email "iuri.souzasantos@gmail.com"
```

(Se quiser manter o e-mail privado, use o endereço `...@users.noreply.github.com` que aparece em GitHub → Settings → Emails.)

### 1.2 Autenticação do push (escolha uma opção)

**Opção A — Git Credential Manager (recomendada, já instalado).**
O Windows já usa `credential.helper=manager`. No primeiro `git push`, uma janela do navegador pede login no GitHub. Depois disso a credencial fica salva e o Claude consegue dar push sem pedir nada. Faça esse primeiro push você mesmo, num terminal:

```bash
git push -u origin main
```

**Opção B — Token fine-grained (se a janela de login não abrir).**
1. GitHub → Settings → Developer settings → *Fine-grained tokens* → *Generate new token*.
2. Repository access: **Only select repositories** → `placar-da-quebrada`.
3. Permissions: *Contents: Read and write*, *Pull requests: Read and write*, *Workflows: Read and write* (necessário para alterar `.github/workflows`).
4. Validade: 90 dias.
5. No primeiro `git push`, use o token como senha. O Credential Manager guarda o token, e você não precisa colar ele no chat.

### 1.3 GitHub CLI (opcional, para o Claude abrir PRs e ver o CI)

```bash
winget install --id GitHub.cli
```

```bash
gh auth login
```

### 1.4 Proteção da `main` (depois do primeiro push)

GitHub → Settings → Branches → *Add rule* para `main`: exigir PR e o check `check` verde. Assim o Claude trabalha em branches `feat/*` e abre PR, e nada vai para produção sem revisão.

## 2. Supabase — permitir que o Claude consulte o banco

O Claude **não** aplica migrations direto em produção: ele escreve o arquivo em `supabase/migrations/` e o workflow `supabase.yml` aplica no merge. O MCP serve para ler o schema, rodar SELECTs, gerar os tipos TypeScript, ler logs e consultar os Advisors.

1. Crie o projeto (ver [hosting.md](hosting.md#2-supabase)).
2. Num terminal `claude` interativo (fora do app desktop), rode `/mcp`, escolha `supabase` e faça login no navegador.
3. Se a configuração pedir, restrinja ao projeto (`project_ref=<seu-ref>`) e ative **read-only** (`read_only=true`) para produção.
4. Teste: peça ao Claude "liste as tabelas do Supabase".

Alternativa sem MCP: o Claude escreve o SQL e você cola no *SQL Editor* do Dashboard (só para consultas, nunca para mudar schema).

## 3. Cloudflare Pages — o Claude não acessa

O deploy é feito pelo `frontend.yml` usando `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` nos GitHub Secrets (ver [hosting.md](hosting.md#3-cloudflare-pages)). Para conferir um deploy, abra o link do preview comentado no PR ou a aba Actions.

## 4. Segredos do GitHub Actions

Cadastre tudo em GitHub → Settings → Secrets and variables → Actions (tabela em [hosting.md](hosting.md#4-segredos-no-github)). Checklist:

- [ ] `CLOUDFLARE_API_TOKEN` (secret)
- [ ] `CLOUDFLARE_ACCOUNT_ID` (secret)
- [ ] `SUPABASE_ACCESS_TOKEN` (secret)
- [ ] `SUPABASE_DB_PASSWORD` (secret)
- [ ] `SUPABASE_PROJECT_ID` (secret)
- [ ] `VITE_SUPABASE_URL` (variable)
- [ ] `VITE_SUPABASE_ANON_KEY` (secret; os workflows leem de `secrets.`)
- [ ] Environments `production` e `preview` criados

## 5. Teste de ponta a ponta

1. Peça ao Claude: "crie a branch `chore/teste-pipeline`, altere o README, faça commit e push".
2. Abra o PR no GitHub e veja o Actions rodar.
3. Faça o merge; o workflow da `main` roda.
4. Pronto: o Claude comita e a nuvem faz o resto.

## Se trocar para Vercel no futuro

Crie o projeto na Vercel importando o repositório (framework Vite, output `dist`) e cadastre `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` nas Environment Variables da Vercel. Depois remova o job `deploy` do `frontend.yml`, porque a Vercel publica sozinha a cada push. Lembre que o plano Hobby da Vercel não permite uso comercial.
