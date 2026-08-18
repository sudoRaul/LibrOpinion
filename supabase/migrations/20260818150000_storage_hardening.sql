-- ════════════════════════════════════════════════════════════════════════════
-- FIX M-3 (MEDIO): endurecimiento de Storage.
-- ────────────────────────────────────────────────────────────────────────────
-- Problemas:
--   - `covers_insert_authenticated` permitía subir CUALQUIER archivo (sin límite
--     de tipo, tamaño ni ruta) a un bucket PÚBLICO. Abuso posible: hosting de
--     archivos, agotar almacenamiento, o servir HTML/ejecutables desde tu dominio
--     (XSS/phishing). La validación de imagen/2 MB vivía SOLO en el cliente.
--   - `avatars` tampoco tenía límite de tamaño/tipo en servidor.
--
-- Arreglo:
--   1) Límite de tamaño (2 MB) y tipo (solo imágenes) a nivel de bucket → lo
--      aplica el servidor de Storage, no se puede saltar desde la API.
--   2) `covers`: subida restringida a la carpeta propia (<uid>/…), igual que
--      `avatars`, para que los archivos sean atribuibles y gestionables.
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Límites a nivel de bucket -------------------------------------------------
update storage.buckets
   set file_size_limit = 2097152,               -- 2 MB (igual que el cliente)
       allowed_mime_types = array['image/*']    -- solo imágenes; bloquea HTML/PDF/etc.
 where id in ('avatars', 'covers');

-- 2) covers: subir/gestionar solo en la carpeta propia (<uid>/…) ---------------
drop policy if exists "covers_insert_authenticated" on storage.objects;
create policy "covers_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "covers_update_own" on storage.objects;
create policy "covers_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "covers_delete_own" on storage.objects;
create policy "covers_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
