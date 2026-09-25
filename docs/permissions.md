# Permissões

## Perfis

| Perfil | Origem | Armazenado em |
|---|---|---|
| `admin` | Criado manualmente (1º) ou promovido por outro admin | `profiles.role = 'admin'` |
| `operador` | Criado por um admin (Edge Function `admin-users`) | `profiles.role = 'operador'` |
| visitante | Qualquer pessoa sem login | papel `anon` do Supabase |

## Matriz

| Recurso / ação | Visitante | Operador | Admin |
|---|:-:|:-:|:-:|
| Ver campeonatos **públicos**, jogos, tabela, estatísticas | ✅ | ✅ | ✅ |
| Ver campeonatos privados/rascunho | ❌ | ✅ | ✅ |
| Criar/editar/excluir campeonato | ❌ | ❌ | ✅ |
| Criar/editar times e jogadores | ❌ | ❌ | ✅ |
| Criar/editar partidas (agenda) | ❌ | ❌ | ✅ |
| Controlar cronômetro / status da partida | ❌ | ✅ qualquer partida não encerrada | ✅ |
| Lançar / anular eventos (gol, cartão…) | ❌ | ✅ idem | ✅ |
| Editar partida encerrada | ❌ | ❌ | ✅ |
| Criar/desativar usuários | ❌ | ❌ | ✅ |
| Ver log de auditoria | ❌ | ❌ | ✅ |

## Como é garantido

1. **RLS em todas as tabelas** (ver [database.md](database.md#rls)).
   - `select` público: `using (campeonato publico = true)` para `anon`.
   - Escrita de admin: `using ((select private.is_admin()))`.
   - Escrita de operador em `partidas`/`eventos_partida`: `using ((select private.pode_operar(partida_id)))`.
2. Funções auxiliares no schema `private` (fora da API), `security definer` com `search_path` fixo:
   - `is_admin()` → `profiles.role = 'admin' and ativo`.
   - `is_staff()` → perfil ativo (admin ou operador).
   - `pode_operar(partida_id)` → admin, ou operador ativo e partida não encerrada. **Operadores não são vinculados a campeonatos** (ADR-007).
   - Visitante não lê `times.responsavel`/`times.contato` (grant por coluna).
3. **Gestão de usuários** exige a `service_role` key → só dentro da Edge Function `admin-users` (`supabase/functions/admin-users`), que valida o JWT e se o chamador é admin ativo antes de agir. Ações: `criar` (e-mail já confirmado, senha provisória), `trocar_senha`, `definir_ativo` (marca `profiles.ativo` e bloqueia/desbloqueia o login no Auth com `ban_duration`, derrubando sessões). Admin não usa a função na própria conta. Nome e papel são alterados direto em `profiles` (RLS de admin). A key é injetada pelo Supabase na função, nunca vai ao frontend.
4. **Signup público desabilitado** no Supabase Auth.
5. Frontend esconde o que o usuário não pode fazer (UX), mas a segurança real é o item 1.

## Bootstrap do primeiro admin

1. Supabase Dashboard → Authentication → Users → *Add user* (e-mail + senha, "auto confirm").
2. SQL Editor: `update public.profiles set role = 'admin' where email = '<seu-email>';`
   (o trigger `on_auth_user_created` cria o profile como `operador` por padrão.)

## Recuperação de senha

Sem SMTP próprio, o Supabase Free só envia e-mail para membros da organização no Supabase (o admin). Operadores que esquecerem a senha pedem ao admin, que define uma nova pela tela de usuários (Fase 2) ou pelo Dashboard → Authentication → Users. Configurar SMTP gratuito (ex.: Resend, Brevo) resolve isso numa fase futura.
