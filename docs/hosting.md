# Hospedagem gratuita — passo a passo

Tudo é criado no navegador. Nenhum serviço roda no seu computador.

## Resposta curta: dá para fazer de graça?

**Sim.** Frontend no Cloudflare Pages, backend + banco + login no Supabase, código e pipeline no GitHub. Os três têm plano gratuito suficiente para um campeonato de bairro.

## Por que Cloudflare Pages e não Vercel?

| | Cloudflare Pages (Free) | Vercel (Hobby) |
|---|---|---|
| Banda | Ilimitada para arquivos estáticos | 100 GB/mês |
| Uso comercial | Permitido | **Não permitido** no Hobby |
| Builds | 500/mês (usaremos GitHub Actions, não conta) | 6.000 min/mês |
| Preview por PR | Sim | Sim |

Se no futuro o campeonato tiver patrocínio/cobrança, o Vercel Hobby deixaria de servir. A arquitetura (SPA estática) funciona igual nos dois — trocar é só mudar o passo de deploy.

## Limites do Supabase Free (verificar valores atuais em supabase.com/pricing)

| Recurso | Limite aproximado | Nosso uso esperado |
|---|---|---|
| Banco | 500 MB | < 20 MB por temporada |
| Usuários ativos/mês | 50.000 | dezenas (só admin/operador logam) |
| Egress | 5 GB/mês | baixo (JSON pequeno) |
| Realtime | ~200 conexões simultâneas | torcida olhando o placar ao mesmo tempo |
| Edge Functions | 500 mil chamadas/mês | poucas (criar usuários) |
| Storage | 1 GB | escudos/fotos (fase 2) |
| Projetos | 2 gratuitos | prod + dev |
| ⚠️ Pausa | projeto **pausa após 7 dias sem atividade** | resolvido pelo workflow `keepalive.yml` |

## 1. GitHub

1. Crie o repositório `placar-da-quebrada` (pode ser **público** → Actions ilimitado; privado tem 2.000 min/mês, também suficiente).
2. Suba este projeto (ver [pipeline.md](pipeline.md#primeiro-push)).

## 2. Supabase

1. Crie conta em supabase.com (login com GitHub).
2. *New project* → nome `placar-da-quebrada`, região **South America (São Paulo)**, gere e guarde a senha do banco.
3. Anote em *Project Settings*:
   - **Project Ref** (ex.: `abcd1234`) → `SUPABASE_PROJECT_ID`
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / publishable key** → `VITE_SUPABASE_ANON_KEY`
   - Senha do banco → `SUPABASE_DB_PASSWORD`
4. Em *Account → Access Tokens* gere um token → `SUPABASE_ACCESS_TOKEN`.
5. *Authentication → Sign In / Providers*: desligue **Allow new users to sign up**. Mantenha Email habilitado.
6. *Authentication → URL Configuration*: Site URL = URL do Cloudflare Pages (após o passo 3).

## 3. Cloudflare Pages

1. Crie conta em cloudflare.com.
2. **Não crie nada em Workers & Pages.** O `frontend.yml` cria o projeto **Pages** `placar-da-quebrada` sozinho no primeiro deploy (`wrangler pages project create`). Não use *Import a repository* / conexão com o GitHub: isso cria um **Worker** com build próprio, que falha e duplica a pipeline.
3. Anote o **Account ID** (barra lateral do dashboard) → `CLOUDFLARE_ACCOUNT_ID`.
4. *My Profile → API Tokens → Create Token* → template **Edit Cloudflare Workers** (ou permissão custom *Account → Cloudflare Pages → Edit*) → `CLOUDFLARE_API_TOKEN`.
5. Site ficará em `https://placar-da-quebrada.pages.dev`.

## 4. Segredos no GitHub

Repositório → *Settings → Secrets and variables → Actions*:

| Nome | Tipo | Onde é usado |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Secret | deploy frontend |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | deploy frontend |
| `SUPABASE_ACCESS_TOKEN` | Secret | migrations / functions |
| `SUPABASE_DB_PASSWORD` | Secret | migrations |
| `SUPABASE_PROJECT_ID` | Secret | migrations / functions |
| `VITE_SUPABASE_URL` | Variable | build do frontend + keepalive |
| `VITE_SUPABASE_ANON_KEY` | Secret | build do frontend + keepalive (é pública por design, mas fica em Secrets) |

Crie também o *Environment* `production` (Settings → Environments) — os deploys usam ele, e você pode exigir aprovação manual se quiser.

## 5. Secrets da Edge Function

A função `admin-users` usa `SUPABASE_SERVICE_ROLE_KEY`, que o Supabase já injeta automaticamente nas Edge Functions. **Nunca** coloque essa chave no GitHub Variables nem no frontend.

## Evolução futura (quando sair do gratuito)

- Domínio próprio (`placardaquebrada.com.br`) apontado para Cloudflare Pages — domínio custa ~R$ 40/ano, o resto continua grátis.
- Supabase Pro (US$ 25/mês) se precisar de backups diários, sem pausa e mais conexões realtime.
