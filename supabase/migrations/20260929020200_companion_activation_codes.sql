-- Partie 3/3 : contrôle d'accès et génération des codes (voir 20260929020000_companion_activation.sql).

-- L'appareil courant a-t-il activé un code ?
create or replace function public.has_companion_access() returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from code_activations where user_id = auth.uid());
$fn$;

revoke all on function public.has_companion_access() from public, anon;
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
