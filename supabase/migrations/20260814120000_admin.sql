-- Panel de administración: rol admin + acceso a reportes + banear/desbanear.
-- La seguridad vive aquí (RLS + funciones security definer). El guard del router
-- solo oculta la ruta; aunque alguien la esquive, la BD le niega todo.

-- 1) Rol admin. Se asigna a mano por SQL (no hay UI para concederlo, a propósito).
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- 2) ¿El usuario actual es admin? security definer para saltar RLS y evitar recursión.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- 3) El admin puede LEER todos los reportes (además de la política de "solo los míos").
drop policy if exists "reports_select_admin" on public.reports;
create policy "reports_select_admin" on public.reports
  for select
  using (public.is_admin());

-- 4) Banear / desbanear. No abrimos un UPDATE general sobre is_banned: se hace por RPC
--    controlada, que verifica is_admin() antes de tocar nada.
create or replace function public.admin_set_ban(p_target uuid, p_banned boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  update public.profiles
     set is_banned = p_banned,
         updated_at = now()
   where id = p_target;
end;
$$;

-- 5) Cambiar el estado de un reporte (revisado / descartado / pendiente).
create or replace function public.admin_review_report(p_report_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'reviewed', 'dismissed') then
    raise exception 'Estado inválido: %', p_status;
  end if;
  update public.reports
     set status = p_status
   where id = p_report_id;
end;
$$;

-- 6) Permisos: las funciones se conceden a authenticated pero se auto-protegen con is_admin().
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_set_ban(uuid, boolean) to authenticated;
grant execute on function public.admin_review_report(uuid, text) to authenticated;
