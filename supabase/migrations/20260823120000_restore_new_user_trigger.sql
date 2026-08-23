-- Restaura el trigger que crea la fila en public.profiles al registrarse un
-- usuario. Síntoma detectado: en producción los usuarios se creaban en
-- auth.users pero NO se creaba su perfil, por lo que el onboarding no podía
-- hacer UPDATE (0 filas) y el guard rebotaba al onboarding. Causa: el trigger
-- `on_auth_user_created` estaba ausente/deshabilitado en la BD.

-- 1) (Re)definimos la función por si acaso (misma lógica: copia full_name y
--    avatar_url de los metadatos del proveedor; username queda NULL → onboarding).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing; -- por si el perfil ya existiera, no fallar
  return new;
end;
$$;

-- 2) Recreamos el trigger en auth.users (idempotente).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Backfill: crea el perfil que falte a los usuarios ya registrados
--    (los que se quedaron huérfanos mientras el trigger no funcionaba).
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  u.raw_user_meta_data ->> 'full_name',
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
