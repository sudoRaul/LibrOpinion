-- Blindaje de lectura para usuarios baneados.
-- Hasta ahora un baneado tenía bloqueadas las ESCRITURAS y su contenido oculto a
-- los demás, pero aún podía LEER el feed por API (las políticas de select miran
-- al AUTOR, no al lector). Añadimos `not is_current_user_banned()` al select.
--
-- EXCEPCIÓN IMPORTANTE: en `profiles` el baneado debe poder leer SU PROPIA fila,
-- porque la app detecta el baneo leyendo su perfil (pantalla "Cuenta suspendida").

-- Perfiles: el baneado solo ve su propia fila; el resto, nada.
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated
  using (id = auth.uid() or not public.is_current_user_banned());

-- Citas (el feed): un baneado no lee ninguna.
drop policy if exists "quotes_select_visible" on public.quotes;
create policy "quotes_select_visible" on public.quotes
  for select to authenticated
  using (public.can_view_author(user_id) and not public.is_current_user_banned());

-- Likes.
drop policy if exists "likes_select_visible" on public.likes;
create policy "likes_select_visible" on public.likes
  for select to authenticated
  using (
    not public.is_current_user_banned()
    and exists (
      select 1 from public.quotes q
      where q.id = likes.quote_id and public.can_view_author(q.user_id)
    )
  );

-- Comentarios.
drop policy if exists "comments_select_visible" on public.comments;
create policy "comments_select_visible" on public.comments
  for select to authenticated
  using (
    not public.is_current_user_banned()
    and exists (
      select 1 from public.quotes q
      where q.id = comments.quote_id and public.can_view_author(q.user_id)
    )
  );

-- Follows (contadores/relaciones).
drop policy if exists "follows_select_authenticated" on public.follows;
create policy "follows_select_authenticated" on public.follows
  for select to authenticated
  using (not public.is_current_user_banned());

-- Notificaciones: un baneado no lee las suyas.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated
  using (recipient_id = auth.uid() and not public.is_current_user_banned());
