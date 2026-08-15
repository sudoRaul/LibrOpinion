-- Motivo del baneo: se escribe desde el panel admin, se guarda en el perfil,
-- se muestra en la pantalla "Cuenta suspendida" y se envía por correo al usuario
-- (vía Database Webhook en profiles UPDATE → Edge Function ban-notification).

alter table public.profiles add column if not exists ban_reason text;
alter table public.profiles add column if not exists banned_at timestamptz;

-- admin_set_ban ahora acepta el motivo. Sustituimos la versión de 2 argumentos
-- por una de 3 (con p_reason opcional, así el "quitar baneo" sigue valiendo).
drop function if exists public.admin_set_ban(uuid, boolean);

create or replace function public.admin_set_ban(
  p_target uuid,
  p_banned boolean,
  p_reason text default null
)
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
         ban_reason = case when p_banned then p_reason else null end,
         banned_at = case when p_banned then now() else null end,
         updated_at = now()
   where id = p_target;
end;
$$;

grant execute on function public.admin_set_ban(uuid, boolean, text) to authenticated;
