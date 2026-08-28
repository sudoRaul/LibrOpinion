-- ════════════════════════════════════════════════════════════════════════════
-- Citas públicas / privadas
-- ────────────────────────────────────────────────────────────────────────────
-- Cada cita tiene ahora su propia visibilidad, independiente de la de la cuenta:
--   · is_private = false (por defecto) → PÚBLICA: la ven según la privacidad del
--     autor (todos si su cuenta es pública; solo seguidores aceptados si es privada).
--   · is_private = true                → PRIVADA: solo la ve su autor (un "guardado"
--     personal que no se publica en el feed).
--
-- Compatibilidad total: la columna nace con default false, así que TODAS las citas
-- existentes quedan públicas y el comportamiento social actual no cambia.
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Columna de visibilidad de la cita ---------------------------------------
alter table public.quotes
  add column if not exists is_private boolean not null default false;

-- Índice para el filtro del perfil (citas de un autor por visibilidad y fecha).
create index if not exists quotes_user_private_created_idx
  on public.quotes (user_id, is_private, created_at desc);

-- 2) Visibilidad de UNA cita concreta ----------------------------------------
-- Combina la privacidad de la CITA con la de la CUENTA (can_view_author):
--   · la mía siempre (aunque sea privada),
--   · pública Y puedo ver al autor (público, o privado y seguidor aceptado; nunca
--     baneado). Con anónimo (auth.uid() null) solo cuela la rama pública.
create or replace function public.can_view_quote(q_author uuid, q_private boolean)
returns boolean language sql stable security definer set search_path = public as $$
  select
    q_author = auth.uid()
    or (q_private = false and public.can_view_author(q_author));
$$;

-- 3) RLS de SELECT de citas (authenticated + anon) ---------------------------
-- Conservamos `not is_current_user_banned()` del lockdown de baneo (20260815140000):
-- un lector baneado no ve contenido. can_view_quote ya excluye autores baneados,
-- cuentas privadas no seguidas, bloqueos y las citas privadas ajenas.
drop policy if exists "quotes_select_visible" on public.quotes;
create policy "quotes_select_visible" on public.quotes
  for select to authenticated
  using (public.can_view_quote(user_id, is_private) and not public.is_current_user_banned());

-- Permalink público / lectura anónima: las privadas quedan siempre ocultas.
drop policy if exists "quotes_select_public_anon" on public.quotes;
create policy "quotes_select_public_anon" on public.quotes
  for select to anon
  using (public.can_view_quote(user_id, is_private));

-- 4) Likes y comentarios: reflejan la visibilidad de SU cita -----------------
-- SELECT: solo si puedo ver la cita (privacidad de la cita incluida) y no estoy
-- baneado. Así los recuentos/listas de una cita privada no se filtran.
drop policy if exists "likes_select_visible" on public.likes;
create policy "likes_select_visible" on public.likes
  for select to authenticated
  using (
    not public.is_current_user_banned()
    and exists (
      select 1 from public.quotes q
      where q.id = likes.quote_id and public.can_view_quote(q.user_id, q.is_private)
    )
  );

drop policy if exists "comments_select_visible" on public.comments;
create policy "comments_select_visible" on public.comments
  for select to authenticated
  using (
    not public.is_current_user_banned()
    and exists (
      select 1 from public.quotes q
      where q.id = comments.quote_id and public.can_view_quote(q.user_id, q.is_private)
    )
  );

-- INSERT: no puedes dar like ni comentar en una cita que no puedes ver (p. ej. una
-- cita privada ajena aunque su autor sea público). Se mantiene el veto a baneados.
drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own" on public.likes
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and not public.is_current_user_banned()
    and exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.can_view_quote(q.user_id, q.is_private)
    )
  );

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and not public.is_current_user_banned()
    and exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.can_view_quote(q.user_id, q.is_private)
    )
  );
