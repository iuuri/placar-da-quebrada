-- Fase 1: perfis de usuário (admin / operador) e funções auxiliares de permissão.
-- Ver docs/permissions.md e docs/database.md.

-- Schema não exposto pela Data API: guarda funções usadas pelas políticas RLS.
create schema if not exists private;
grant usage on schema private to authenticated;

create type public.papel_usuario as enum ('admin', 'operador');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  email text not null,
  role public.papel_usuario not null default 'operador',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de cada usuário logado. Visitantes não têm perfil.';

-- updated_at automático (reutilizado pelas próximas tabelas)
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Cria o profile quando um usuário é criado no Supabase Auth (sempre como operador).
-- O papel nunca vem de user_metadata (editável pelo usuário).
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, nome)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'nome', '')
  );
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- true se o usuário logado é admin ativo. security definer para ler profiles sem cair na própria RLS.
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.ativo
  );
$$;

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- Ninguém muda o próprio papel ou se desativa (evita admin se trancar para fora).
create function private.profiles_protege_proprio()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id = (select auth.uid())
     and (new.role is distinct from old.role or new.ativo is distinct from old.ativo) then
    raise exception 'Não é permitido alterar o próprio papel ou status.';
  end if;
  return new;
end;
$$;

create trigger profiles_protege_proprio
  before update on public.profiles
  for each row execute function private.profiles_protege_proprio();

-- RLS
alter table public.profiles enable row level security;

create policy profiles_select_proprio_ou_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Data API: novas tabelas não são expostas por padrão; liberar só o necessário.
-- Insert vem do trigger; delete acontece em cascata ao remover o usuário do Auth.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (nome, role, ativo) on table public.profiles to authenticated;
