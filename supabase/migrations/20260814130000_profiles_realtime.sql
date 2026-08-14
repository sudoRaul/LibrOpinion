-- Realtime en profiles: para que un usuario baneado en vivo vea "Cuenta suspendida"
-- al instante (su sesión ya abierta refresca el perfil sin recargar).
-- La RLS de select sigue aplicando: cada cliente solo recibe cambios de perfiles
-- que puede leer, y en la app filtramos por el propio id.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
