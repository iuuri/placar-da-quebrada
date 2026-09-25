-- Etapa 2.4: a Edge Function admin-users usa a chave de serviço (papel service_role) via Data API.
-- Como tabelas novas não recebem grants automáticos, liberamos explicitamente o necessário.
-- service_role ignora RLS; só é usado dentro das Edge Functions.

grant select, update on table public.profiles to service_role;
grant select on table public.campeonatos, public.times, public.jogadores to service_role;
