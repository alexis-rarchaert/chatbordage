-- ChatBordage : code d'activation du mode COMPAGNON (le mode en ligne reste gratuit et sans code).
--
-- Principe : chaque boîte contient un code unique. Le navigateur n'a plus AUCUN accès à la table des codes :
-- il appelle redeem_activation_code(), qui vérifie tout côté serveur. Un code peut activer un nombre limité
-- d'appareils (3 par défaut) : une boîte se partage à une table, mais pas avec le monde entier.
-- L'identité d'un appareil est son compte anonyme Supabase (Authentication > Allow anonymous sign-ins).
--
-- Cette migration est en 3 fichiers de moins de 100 lignes, à exécuter DANS L'ORDRE :
--   20260929020000_companion_activation.sql          (tables, droits)        <- ce fichier
--   20260929020100_companion_activation_redeem.sql   (fonction d'activation)
--   20260929020200_companion_activation_codes.sql    (accès + génération de codes)
-- Avec la CLI (`supabase db push`) ils s'enchaînent tout seuls. Dans le SQL Editor du dashboard, exécutez-les un par
-- un : une requête plus longue que 100 lignes y est tronquée. Ne sélectionnez rien avant de cliquer sur Run (l'éditeur
-- n'exécute que la sélection). Les fichiers sont idempotents : les relancer ne casse rien.
-- Ils évitent exprès « SELECT ... INTO » : l'éditeur le prend pour un CREATE TABLE et ajoute des lignes
-- « ALTER TABLE ... ENABLE ROW LEVEL SECURITY » parasites.
--
-- ⚠ Cette migration retire les droits de lecture publics sur activation_codes : avant, la clé publique du site
--   pouvait interroger la table (et potentiellement lister tous les codes).

create table if not exists public.activation_codes (
  code          text primary key,
  max_devices   integer not null default 3,
  first_used_at timestamptz,
  created_at    timestamptz not null default now()
);
alter table public.activation_codes add column if not exists max_devices   integer not null default 3;
alter table public.activation_codes add column if not exists first_used_at timestamptz;
create unique index if not exists activation_codes_code_key on public.activation_codes (code);

-- Appareils (comptes anonymes) ayant activé un code.
create table if not exists public.code_activations (
  code         text not null,
  user_id      uuid not null,
  activated_at timestamptz not null default now(),
  primary key (code, user_id)
);

-- Tentatives, pour limiter les essais au hasard.
create table if not exists public.code_attempts (
  id      bigserial primary key,
  user_id uuid not null,
  at      timestamptz not null default now(),
  ok      boolean not null
);
create index if not exists code_attempts_user_at_idx on public.code_attempts (user_id, at);

-- Aucun accès direct depuis le navigateur : RLS activé, aucune policy, droits retirés.
alter table public.activation_codes  enable row level security;
alter table public.code_activations  enable row level security;
alter table public.code_attempts     enable row level security;

do $do$
declare pol record;
begin
  for pol in select schemaname, tablename, policyname from pg_policies
             where schemaname = 'public' and tablename in ('activation_codes', 'code_activations', 'code_attempts')
  loop
    execute format('drop policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $do$;

revoke all on public.activation_codes, public.code_activations, public.code_attempts from anon, authenticated;
