-- ════════════════════════════════════════════════════════════════════════════
-- FIX C-1 (CRÍTICO): escalada de privilegios / evasión de baneo vía auto-UPDATE
-- ────────────────────────────────────────────────────────────────────────────
-- La política `profiles_update_own` permite a un usuario editar SU fila, pero RLS
-- es a nivel de FILA, no de COLUMNA, y el grant es GRANT ALL. Por tanto cualquier
-- autenticado podía hacer:
--     update profiles set is_admin = true  where id = auth.uid();   -- se hace admin
--     update profiles set is_banned = false where id = auth.uid();  -- evade el baneo
-- saltándose el whitelisting del cliente (llamando a la API directamente).
--
-- Solución: trigger BEFORE UPDATE que, para quien NO sea admin, repone las
-- columnas privilegiadas a su valor anterior. La edición normal (nombre, bio,
-- avatar, username, is_private, locale, updated_at) sigue funcionando igual, y
-- `admin_set_ban` (que corre con un admin en sesión) también, porque is_admin()
-- devuelve true y el trigger deja pasar los cambios.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.protect_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- El admin (o cualquier ruta que corra con un admin en sesión, p. ej.
  -- admin_set_ban) puede tocar cualquier columna.
  if public.is_admin() then
    return new;
  end if;

  -- Cualquier otro: las columnas privilegiadas NO se pueden cambiar desde el
  -- propio UPDATE; se reponen a su valor anterior de forma silenciosa.
  new.is_admin   := old.is_admin;
  new.is_banned  := old.is_banned;
  new.ban_reason := old.ban_reason;
  new.banned_at  := old.banned_at;

  return new;
end;
$$;

drop trigger if exists protect_privileged_profile_columns_trg on public.profiles;
create trigger protect_privileged_profile_columns_trg
  before update on public.profiles
  for each row execute function public.protect_privileged_profile_columns();
