-- Habilita Realtime añadiendo las tablas a la publicación supabase_realtime.
-- Idempotente: solo añade las que aún no estén.
do $$
declare
  t text;
begin
  foreach t in array array['quotes', 'likes', 'comments'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
