-- Permalink público: lectura ANÓNIMA de citas de cuentas PÚBLICAS (no baneadas).
-- Reutilizamos can_view_author(): con anon, auth.uid() es null, así que solo
-- devuelve true por la rama "autor público y no baneado". Las cuentas privadas
-- (y las baneadas) siguen ocultas a los anónimos.

-- Citas: anon ve las de autores públicos no baneados.
drop policy if exists "quotes_select_public_anon" on public.quotes;
create policy "quotes_select_public_anon" on public.quotes
  for select to anon
  using (public.can_view_author(user_id));

-- Libros: catálogo público, lectura anónima (necesario para el libro de la cita).
drop policy if exists "books_select_anon" on public.books;
create policy "books_select_anon" on public.books
  for select to anon
  using (true);

-- Perfiles: anon solo ve perfiles públicos y no baneados (autor de la cita).
drop policy if exists "profiles_select_public_anon" on public.profiles;
create policy "profiles_select_public_anon" on public.profiles
  for select to anon
  using (is_private = false and is_banned = false);
