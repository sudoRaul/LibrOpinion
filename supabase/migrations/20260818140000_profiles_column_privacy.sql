-- ════════════════════════════════════════════════════════════════════════════
-- FIX M-2 (MEDIO): columnas sensibles de `profiles` expuestas.
-- ────────────────────────────────────────────────────────────────────────────
-- RLS es a nivel de FILA, no de COLUMNA, y los embeds de autor necesitan que la
-- tabla `profiles` siga siendo legible. Por eso el contenido de columnas se
-- protege con PRIVILEGIOS A NIVEL DE COLUMNA: se revoca el SELECT global y se
-- concede solo sobre las columnas públicas.
--
-- Se ocultan a todos (incluido el propio dueño, vía tabla):
--   - is_admin   → permitía descubrir quién es admin (incluso anónimos).
--   - ban_reason → nota interna de moderación.
--   - banned_at  → metadato de moderación.
-- (is_banned se mantiene legible: baja sensibilidad y lo usa el panel admin.)
--
-- El propio usuario obtiene su fila COMPLETA (con is_admin/ban_reason/…) mediante
-- el RPC `current_profile()` (security definer), que la app usa para el guard de
-- admin y la pantalla "Cuenta suspendida".
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Cierra el SELECT global y concede solo las columnas públicas ---------------
revoke select on public.profiles from anon, authenticated;

grant select (
  id, username, display_name, bio, avatar_url,
  created_at, updated_at, is_private, is_banned, locale
) on public.profiles to authenticated;

grant select (
  id, username, display_name, bio, avatar_url,
  created_at, updated_at, is_private
) on public.profiles to anon;

-- 2) El usuario lee su propia fila completa (bypass controlado de las columnas) --
create or replace function public.current_profile()
returns setof public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.profiles where id = auth.uid();
$$;

grant execute on function public.current_profile() to authenticated;
