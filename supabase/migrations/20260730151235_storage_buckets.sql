-- Storage: buckets públicos para avatares y portadas de libros, con sus políticas RLS.
-- Idempotente (se puede ejecutar varias veces sin error).

-- 1) Buckets públicos (lectura por URL pública; escritura controlada por policies).
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('covers', 'covers', true)
on conflict (id) do nothing;

-- 2) Políticas sobre storage.objects.

-- Lectura pública de ambos buckets.
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "covers_public_read" on storage.objects;
create policy "covers_public_read"
  on storage.objects for select
  using (bucket_id = 'covers');

-- Avatares: cada usuario solo puede escribir en su propia carpeta (<uid>/...).
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Portadas: catálogo colaborativo → cualquier autenticado puede subir.
drop policy if exists "covers_insert_authenticated" on storage.objects;
create policy "covers_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'covers');
