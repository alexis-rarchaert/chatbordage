-- ChatBordage : parties en ligne (un téléphone par joueur)
--
-- Modèle de sécurité :
--   * game_rooms contient l'état COMPLET de la partie (rôles cachés, mains, pioche).
--     RLS activé SANS aucune policy : seul le service role (Edge Function `game`) y accède.
--   * game_views contient, pour chaque joueur, sa vue filtrée. Un joueur ne peut lire que sa ligne,
--     et s'y abonne en temps réel (Supabase Realtime).
--
-- Prérequis dashboard : Authentication > Sign In / Providers > activer « Allow anonymous sign-ins ».

create table if not exists public.game_rooms (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  host_id     uuid not null,
  status      text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  seats       jsonb not null default '[]'::jsonb,
  settings    jsonb not null default '{}'::jsonb,
  state       jsonb,
  version     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.game_rooms enable row level security;

create table if not exists public.game_views (
  room_id     uuid not null references public.game_rooms(id) on delete cascade,
  user_id     uuid not null,
  view        jsonb not null,
  version     integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.game_views enable row level security;

drop policy if exists "players read their own view" on public.game_views;
create policy "players read their own view"
  on public.game_views for select
  to authenticated
  using (user_id = auth.uid());

-- Realtime : uniquement les vues (jamais l'état complet).
alter table public.game_views replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_views'
  ) then
    alter publication supabase_realtime add table public.game_views;
  end if;
end $$;

create index if not exists game_rooms_updated_at_idx on public.game_rooms (updated_at);

-- Nettoyage des salons abandonnés. À planifier avec pg_cron, par exemple :
--   select cron.schedule('purge-game-rooms', '0 4 * * *', $$ select public.purge_old_game_rooms() $$);
create or replace function public.purge_old_game_rooms() returns integer
language sql security definer set search_path = public as $$
  with gone as (
    delete from public.game_rooms
    where updated_at < now() - interval '24 hours'
    returning 1
  )
  select count(*)::integer from gone;
$$;
revoke all on function public.purge_old_game_rooms() from public, anon, authenticated;
