-- ChatBordage : code d'activation du mode COMPAGNON (le mode en ligne reste gratuit et sans code).
--
-- Principe : chaque boîte contient un code unique. Le navigateur n'a plus AUCUN accès à la table des codes :
-- il appelle redeem_activation_code(), qui vérifie tout côté serveur. Un code peut activer un nombre limité
-- d'appareils (3 par défaut) : une boîte se partage à une table, mais pas avec le monde entier.
-- L'identité d'un appareil est son compte anonyme Supabase (Authentication > Allow anonymous sign-ins).
--
-- Dashboard Supabase : collez et exécutez TOUT le fichier d'un coup (sans rien sélectionner : l'éditeur n'exécute
-- que la sélection). Le fichier évite exprès « SELECT ... INTO » : l'éditeur le prend pour un CREATE TABLE et
-- ajoute des lignes « ALTER TABLE ... ENABLE ROW LEVEL SECURITY » parasites qui feraient échouer la migration.
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

-- Active un code pour l'appareil courant. Renvoie {ok, error?, remaining?}.
create or replace function public.redeem_activation_code(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  uid    uuid := auth.uid();
  norm   text := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
  rec    record;
  used   integer;
  recent integer;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  recent := (select count(*) from code_attempts
              where user_id = uid and ok = false and at > now() - interval '15 minutes');
  if recent >= 8 then
    return jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  end if;

  if length(norm) <> 16 then
    insert into code_attempts (user_id, ok) values (uid, false);
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  -- Verrou sur la ligne du code : deux activations simultanées ne peuvent pas dépasser la limite.
  for rec in
    select * from activation_codes
     where regexp_replace(upper(code), '[^A-Z0-9]', '', 'g') = norm
     for update
  loop
    exit;
  end loop;
  if not found then
    insert into code_attempts (user_id, ok) values (uid, false);
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  -- Cet appareil a déjà activé ce code : on ne consomme pas de place de plus.
  if exists (select 1 from code_activations where code = rec.code and user_id = uid) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  used := (select count(*) from code_activations where code = rec.code);
  if used >= rec.max_devices then
    return jsonb_build_object('ok', false, 'error', 'code_used_up');
  end if;

  insert into code_activations (code, user_id) values (rec.code, uid);
  update activation_codes set first_used_at = coalesce(first_used_at, now()) where code = rec.code;
  insert into code_attempts (user_id, ok) values (uid, true);
  return jsonb_build_object('ok', true, 'remaining', rec.max_devices - used - 1);
end $fn$;

-- L'appareil courant a-t-il activé un code ?
create or replace function public.has_companion_access() returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from code_activations where user_id = auth.uid());
$fn$;

revoke all on function public.redeem_activation_code(text) from public, anon;
revoke all on function public.has_companion_access() from public, anon;
grant execute on function public.redeem_activation_code(text) to authenticated;
grant execute on function public.has_companion_access() to authenticated;

-- Génère n codes uniques (16 caractères sans I/O/0/1, ~80 bits) à imprimer dans les boîtes.
-- À lancer depuis le SQL Editor (droits administrateur), jamais depuis le site :
--   select * from public.generate_activation_codes(500);
create or replace function public.generate_activation_codes(n integer) returns setof text
language plpgsql security definer set search_path = public, extensions as $fn$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  raw  text;
  code text;
  b    bytea;
  j    integer;
begin
  for i in 1..n loop
    loop
      b := gen_random_bytes(16);
      raw := '';
      for j in 0..15 loop
        raw := raw || substr(alphabet, (get_byte(b, j) % 32) + 1, 1);
      end loop;
      code := substr(raw, 1, 4) || '-' || substr(raw, 5, 4) || '-' || substr(raw, 9, 4) || '-' || substr(raw, 13, 4);
      begin
        insert into activation_codes (code) values (code);
        exit;
      exception when unique_violation then
        null; -- collision improbable : on retire un autre code
      end;
    end loop;
    return next code;
  end loop;
end $fn$;

revoke all on function public.generate_activation_codes(integer) from public, anon, authenticated;
