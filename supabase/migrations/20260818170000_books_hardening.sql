-- ════════════════════════════════════════════════════════════════════════════
-- FIX B-1 (BAJO): catálogo `books` sin moderación.
-- ────────────────────────────────────────────────────────────────────────────
-- Cualquier autenticado podía crear libros con `cover_url` a una URL EXTERNA
-- arbitraria (fuga de IP/referrer al renderizarla como <img>, o imagen ofensiva),
-- con títulos/autores de longitud ilimitada, y sin que nadie pudiera corregir o
-- borrar entradas vandalizadas.
--
-- Arreglo:
--   1) `cover_url` solo puede ser NULL o una URL pública de NUESTRO Storage
--      (bucket covers). Bloquea hosts externos. (NOT VALID: no toca filas viejas.)
--   2) Límites de longitud en title/author.
--   3) El admin puede EDITAR/BORRAR libros (palanca de moderación).
-- ════════════════════════════════════════════════════════════════════════════

-- 1) cover_url restringida a nuestro Storage (o null) --------------------------
alter table public.books
  add constraint books_cover_url_check
  check (
    cover_url is null
    or cover_url ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/covers/'
  ) not valid;

-- 2) Longitudes razonables -----------------------------------------------------
alter table public.books
  add constraint books_title_len_check check (char_length(title) between 1 and 200) not valid;

alter table public.books
  add constraint books_author_len_check check (char_length(author) between 1 and 200) not valid;

-- 3) Moderación por admin: editar/borrar entradas del catálogo ------------------
-- (El borrado puede fallar si el libro tiene citas: la FK quotes.book_id es ON
--  DELETE RESTRICT; en ese caso el admin edita el título/autor en su lugar.)
drop policy if exists "books_update_admin" on public.books;
create policy "books_update_admin" on public.books
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "books_delete_admin" on public.books;
create policy "books_delete_admin" on public.books
  for delete to authenticated
  using (public.is_admin());
