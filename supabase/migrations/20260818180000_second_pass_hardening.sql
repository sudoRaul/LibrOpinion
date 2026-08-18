-- ════════════════════════════════════════════════════════════════════════════
-- Segunda pasada de seguridad: aprieta dos flecos de M-3 y B-1.
-- ────────────────────────────────────────────────────────────────────────────
-- N-1: `image/*` permitía SVG (image/svg+xml), que puede contener JavaScript y
--      ejecutarse al abrir su URL directa en el bucket público. Restringimos a
--      formatos raster (sin SVG).
-- N-2: el regex de `books.cover_url` aceptaba cualquier *.supabase.co (incluido
--      el proyecto de otro atacante). Lo fijamos a NUESTRO project-ref.
-- ════════════════════════════════════════════════════════════════════════════

-- N-1: solo imágenes raster (fuera SVG) ---------------------------------------
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
 where id in ('avatars', 'covers');

-- N-2: cover_url solo desde NUESTRO Storage (project-ref exacto) ----------------
alter table public.books drop constraint if exists books_cover_url_check;
alter table public.books
  add constraint books_cover_url_check
  check (
    cover_url is null
    or cover_url ~ '^https://xxtwqhtfqhsrsdiqeols\.supabase\.co/storage/v1/object/public/covers/'
  ) not valid;
