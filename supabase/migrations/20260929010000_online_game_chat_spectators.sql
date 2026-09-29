-- ChatBordage : chat libre du salon et spectateurs (s'ajoute à 20260929000000_online_game.sql)
alter table public.game_rooms
  add column if not exists spectators jsonb not null default '[]'::jsonb,
  add column if not exists chat       jsonb not null default '[]'::jsonb;
