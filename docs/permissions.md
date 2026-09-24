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
| Ver campeonatos privados/rascunho | ❌ | só vinculados | ✅ |
| Criar/editar/excluir campeonato | ❌ | ❌ | ✅ |
| Criar/editar times e jogadores | ❌ | ❌ | ✅ |
| Criar/editar partidas (agenda) | ❌ | ❌ | ✅ |
| Controlar cronômetro / status da partida | ❌ | ✅ partidas dos campeonatos vinculados, não encerradas | ✅ |
| Lançar / anular eventos (gol, cartão…) | ❌ | ✅ idem | ✅ |
| Editar partida encerrada | ❌ | ❌ | ✅ |
| Criar/desativar usuários, vincular operadores | ❌ | ❌ | ✅ |
| Ver log de auditoria | ❌ | ❌ | ✅ |

## Como é garantido

1. **RLS em todas as tabelas** (ver [database.md](database.md#rls)).
   - `select` público: `using (campeonato publico = true)` para `anon`.
   - Escrita de admin: `using ((select private.is_admin()))`.
   - Escrita de operador em `partidas`/`eventos_partida`: `using ((select private.pode_operar(partida_id)))`.
2. Funções auxiliares no schema `private` (fora da API), `security definer` com `search_path` fixo:
   - `is_admin()` → `profiles.role = 'admin' and ativo`.
   - `pode_operar(partida_id)` → admin, ou operador ativo vinculado ao campeonato da partida e partida não encerrada.
3. **Criação de usuários** exige a `service_role` key → só dentro da Edge Function `admin-users`, que valida se o chamador é admin antes de agir. A key fica em Supabase Secrets, nunca no frontend.
4. **Signup público desabilitado** no Supabase Auth.
5. Frontend esconde o que o usuário não pode fazer (UX), mas a segurança real é o item 1.

## Bootstrap do primeiro admin

1. Supabase Dashboard → Authentication → Users → *Add user* (e-mail + senha, "auto confirm").
2. SQL Editor: `update public.profiles set role = 'admin' where email = '<seu-email>';`
   (o trigger `on_auth_user_created` cria o profile como `operador` por padrão.)

## Recuperação de senha

Sem SMTP próprio, o Supabase Free só envia e-mail para membros da organização no Supabase (o admin). Operadores que esquecerem a senha pedem ao admin, que define uma nova pela tela de usuários (Fase 2) ou pelo Dashboard → Authentication → Users. Configurar SMTP gratuito (ex.: Resend, Brevo) resolve isso numa fase futura.
