-- Partie 2/3 : activation d'un code (voir 20260929020000_companion_activation.sql pour le contexte).

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

revoke all on function public.redeem_activation_code(text) from public, anon;
grant execute on function public.redeem_activation_code(text) to authenticated;
