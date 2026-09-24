-- Fase 2.1: campeonatos, times e jogadores.
-- Operadores não são vinculados a campeonatos: qualquer usuário ativo (admin ou operador) vê tudo
-- e poderá operar qualquer partida (ADR-007). Só admin cadastra.

create type public.status_campeonato as enum ('rascunho', 'inscricoes', 'em_andamento', 'finalizado');
create type public.modalidade as enum ('campo', 'society', 'futsal');

-- true se o usuário logado tem perfil ativo (admin ou operador).
create function private.is_staff()
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
      and p.ativo
  );
$$;

revoke execute on function private.is_staff() from public, anon;
grant execute on function private.is_staff() to authenticated;

-- Campeonatos -----------------------------------------------------------------

create table public.campeonatos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 60),
  temporada text not null default extract(year from now())::text,
  modalidade public.modalidade not null default 'society',
  local_padrao text,
  status public.status_campeonato not null default 'rascunho',
  publico boolean not null default false,
  pontos_vitoria smallint not null default 3 check (pontos_vitoria >= 0),
  pontos_empate smallint not null default 1 check (pontos_empate >= 0),
  pontos_derrota smallint not null default 0 check (pontos_derrota >= 0),
  qtd_periodos smallint not null default 2 check (qtd_periodos between 1 and 4),
  minutos_periodo smallint not null default 25 check (minutos_periodo between 1 and 90),
  criterios_desempate text[] not null default array[
    'pontos', 'vitorias', 'saldo_gols', 'gols_pro', 'confronto_direto', 'menos_vermelhos', 'menos_amarelos'
  ],
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.campeonatos.publico is 'Visitantes (sem login) só veem campeonatos com publico = true.';

create index campeonatos_created_by_idx on public.campeonatos (created_by);

create trigger campeonatos_set_updated_at
  before update on public.campeonatos
  for each row execute function private.set_updated_at();

alter table public.campeonatos enable row level security;

create policy campeonatos_select_publico on public.campeonatos
  for select to anon
  using (publico);

create policy campeonatos_select_logado on public.campeonatos
  for select to authenticated
  using (publico or (select private.is_staff()));

create policy campeonatos_insert_admin on public.campeonatos
  for insert to authenticated
  with check ((select private.is_admin()));

create policy campeonatos_update_admin on public.campeonatos
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy campeonatos_delete_admin on public.campeonatos
  for delete to authenticated
  using ((select private.is_admin()));

revoke all on table public.campeonatos from anon, authenticated;
grant select on table public.campeonatos to anon;
grant select, insert, update, delete on table public.campeonatos to authenticated;

-- Times -------------------------------------------------------------------------

create table public.times (
  id uuid primary key default gen_random_uuid(),
  campeonato_id uuid not null references public.campeonatos (id) on delete cascade,
  nome text not null check (length(trim(nome)) between 2 and 60),
  sigla text not null check (sigla ~ '^[A-Z0-9]{2,4}$'),
  cor_primaria text not null default '#14213d' check (cor_primaria ~ '^#[0-9a-fA-F]{6}$'),
  escudo_url text check (escudo_url is null or escudo_url ~ '^https://'),
  -- Dados de contato: não são expostos para visitantes (ver grants abaixo).
  responsavel text,
  contato text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campeonato_id, nome),
  unique (campeonato_id, sigla)
);

create trigger times_set_updated_at
  before update on public.times
  for each row execute function private.set_updated_at();

alter table public.times enable row level security;

create policy times_select_publico on public.times
  for select to anon
  using (exists (
    select 1 from public.campeonatos c where c.id = campeonato_id and c.publico
  ));

create policy times_select_logado on public.times
  for select to authenticated
  using (
    (select private.is_staff())
    or exists (select 1 from public.campeonatos c where c.id = campeonato_id and c.publico)
  );

create policy times_insert_admin on public.times
  for insert to authenticated
  with check ((select private.is_admin()));

create policy times_update_admin on public.times
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy times_delete_admin on public.times
  for delete to authenticated
  using ((select private.is_admin()));

revoke all on table public.times from anon, authenticated;
-- Visitante não lê responsavel/contato: a área pública deve listar as colunas (sem select=*).
grant select (id, campeonato_id, nome, sigla, cor_primaria, escudo_url, created_at, updated_at)
  on table public.times to anon;
grant select, insert, update, delete on table public.times to authenticated;

-- Jogadores ---------------------------------------------------------------------

create table public.jogadores (
  id uuid primary key default gen_random_uuid(),
  time_id uuid not null references public.times (id) on delete cascade,
  nome text not null check (length(trim(nome)) between 2 and 80),
  apelido text,
  numero smallint check (numero between 0 and 99),
  posicao text,
  foto_url text check (foto_url is null or foto_url ~ '^https://'),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jogadores_time_id_idx on public.jogadores (time_id);

-- Número da camisa único por time entre jogadores ativos.
create unique index jogadores_numero_unico_idx on public.jogadores (time_id, numero)
  where ativo and numero is not null;

create trigger jogadores_set_updated_at
  before update on public.jogadores
  for each row execute function private.set_updated_at();

alter table public.jogadores enable row level security;

create policy jogadores_select_publico on public.jogadores
  for select to anon
  using (exists (
    select 1
    from public.times t
    join public.campeonatos c on c.id = t.campeonato_id
    where t.id = time_id and c.publico
  ));

create policy jogadores_select_logado on public.jogadores
  for select to authenticated
  using (
    (select private.is_staff())
    or exists (
      select 1
      from public.times t
      join public.campeonatos c on c.id = t.campeonato_id
      where t.id = time_id and c.publico
    )
  );

create policy jogadores_insert_admin on public.jogadores
  for insert to authenticated
  with check ((select private.is_admin()));

create policy jogadores_update_admin on public.jogadores
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy jogadores_delete_admin on public.jogadores
  for delete to authenticated
  using ((select private.is_admin()));

revoke all on table public.jogadores from anon, authenticated;
grant select on table public.jogadores to anon;
grant select, insert, update, delete on table public.jogadores to authenticated;
