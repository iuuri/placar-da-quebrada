# Banco de dados (Supabase / PostgreSQL)

Todas as tabelas no schema `public`, com RLS habilitado. IDs `uuid default gen_random_uuid()`. Toda tabela tem `created_at timestamptz default now()` e `updated_at` (trigger).

## Diagrama

```text
auth.users 1─1 profiles
campeonatos 1─N times 1─N jogadores
campeonatos 1─N partidas N─1 times (mandante / visitante)
partidas 1─N eventos_partida N─1 jogadores
campeonatos N─N profiles  (via campeonato_operadores)
```

## Enums

```sql
create type papel_usuario   as enum ('admin', 'operador');
create type status_camp     as enum ('rascunho', 'inscricoes', 'em_andamento', 'finalizado');
create type modalidade      as enum ('campo', 'society', 'futsal');
create type status_partida  as enum ('agendada', 'em_andamento', 'intervalo', 'encerrada', 'adiada', 'cancelada', 'wo');
create type tipo_evento     as enum ('gol', 'gol_contra', 'amarelo', 'segundo_amarelo', 'vermelho',
                                     'substituicao', 'inicio_periodo', 'fim_periodo', 'observacao');
```

## Tabelas

### profiles
| coluna | tipo | obs |
|---|---|---|
| id | uuid PK | = `auth.users.id` (on delete cascade) |
| nome | text | |
| email | text | cópia para listagem |
| role | papel_usuario | default `operador` |
| ativo | boolean | default true |

Trigger `on_auth_user_created` em `auth.users` cria o profile.

### campeonatos
| coluna | tipo | obs |
|---|---|---|
| id | uuid PK | |
| nome | text | |
| slug | text unique | usado na URL pública |
| temporada | text | ex. "2026" |
| modalidade | modalidade | |
| local_padrao | text | |
| status | status_camp | |
| publico | boolean | default false — visitante só vê se true |
| pontos_vitoria / pontos_empate / pontos_derrota | smallint | 3 / 1 / 0 |
| qtd_periodos | smallint | 2 |
| minutos_periodo | smallint | 25 |
| criterios_desempate | text[] | ordem de [business-rules.md](business-rules.md) |
| created_by | uuid → profiles | |

### campeonato_operadores
`(campeonato_id, user_id)` PK composta.

### times
`id, campeonato_id, nome, sigla char(3), cor_primaria text, escudo_url text, responsavel text, contato text` — unique `(campeonato_id, nome)`.

### jogadores
`id, time_id, nome, apelido, numero smallint, posicao text, foto_url, ativo bool` — unique parcial `(time_id, numero) where ativo`.

### partidas
| coluna | tipo | obs |
|---|---|---|
| id | uuid PK | |
| campeonato_id | uuid FK | |
| rodada | smallint | |
| fase | text | `'pontos_corridos'` no MVP |
| mandante_id / visitante_id | uuid FK times | check `mandante_id <> visitante_id` |
| data_hora | timestamptz | |
| local | text | |
| status | status_partida | |
| gols_mandante / gols_visitante | smallint | **cache** mantido por trigger dos eventos |
| periodo_atual | smallint | |
| cronometro_rodando | boolean | |
| cronometro_inicio | timestamptz | |
| cronometro_acumulado_seg | integer | |
| wo_vencedor_id | uuid FK times | se status = `wo` |
| observacoes | text | súmula |

### eventos_partida
| coluna | tipo | obs |
|---|---|---|
| id | uuid PK | |
| partida_id | uuid FK | |
| tipo | tipo_evento | |
| time_id | uuid FK | time do jogador |
| jogador_id | uuid FK null | |
| jogador_sai_id | uuid FK null | substituição |
| periodo | smallint | |
| minuto | smallint | |
| acrescimo | smallint | minutos além do regulamentar |
| anulado | boolean | default false |
| client_id | uuid unique | idempotência (fila offline) |
| created_by | uuid → profiles | |

### auditoria
`id, tabela, registro_id, acao, dados_antes jsonb, dados_depois jsonb, user_id, created_at` — preenchida por trigger em `partidas` e `eventos_partida`.

## Views (derivadas — nunca digitadas)

- `v_classificacao` — por campeonato/time: pontos, jogos, V, E, D, GP, GC, SG, aproveitamento. Considera só `encerrada`/`wo`, pontos das regras do campeonato. Ordenação por critérios de desempate feita em SQL (critérios simples) + confronto direto no frontend (lib testada com Vitest).
- `v_artilharia` — gols por jogador (exclui `gol_contra` e anulados).
- `v_cartoes` — amarelos/vermelhos por jogador.
- `v_suspensos` — jogadores suspensos para a próxima partida do time (no MVP: só vermelho direto e suspensão manual do admin).

Views criadas com `security_invoker = true` para respeitar o RLS das tabelas base.

## Funções RPC

| função | quem | faz |
|---|---|---|
| `is_admin()` | interna | bool |
| `pode_operar(partida_id)` | interna | bool |
| `server_time()` | todos | `now()` para sincronizar relógio |
| `partida_iniciar_periodo(id)` | operador/admin | status em_andamento, play |
| `partida_pausar(id)` / `partida_retomar(id)` | operador/admin | pausa/retoma cronômetro |
| `partida_encerrar_periodo(id)` | operador/admin | intervalo / próximo período |
| `partida_encerrar(id)` | operador/admin | status encerrada |
| `gerar_tabela_pontos_corridos(camp_id, returno bool)` | admin | cria partidas round-robin |

## RLS

Padrão para cada tabela:

```sql
alter table public.X enable row level security;

-- leitura pública só de campeonato público
create policy "X_select_publico" on public.X for select
  to anon, authenticated
  using ( /* campeonato relacionado */ publico = true );

-- leitura total para usuários logados ativos
create policy "X_select_logado" on public.X for select
  to authenticated using ( public.is_admin() or /* vinculado */ ... );

-- escrita admin
create policy "X_admin_all" on public.X for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
```

Especiais:
- `partidas` update e `eventos_partida` insert/update: `public.pode_operar(partida_id)`.
- `profiles`: usuário lê o próprio; admin lê/edita todos; ninguém altera o próprio `role`.
- `auditoria`: select só admin; insert só via trigger (`security definer`).

## Convenções de migration

- Arquivo: `supabase/migrations/AAAAMMDDHHMMSS_descricao.sql`.
- Uma migration por mudança lógica; nunca editar uma já aplicada.
- Seeds de demonstração em `supabase/seed.sql` (só para o projeto dev).
- Revisar com o advisor de segurança do Supabase (Dashboard → Advisors) após cada migration.
