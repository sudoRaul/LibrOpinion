-- ════════════════════════════════════════════════════════════════════════════
-- FIX M-1 (MEDIO): las listas de seguidores/seguidos de cuentas privadas eran
-- legibles por API (la RLS de follows era `using (not is_current_user_banned())`,
-- es decir, todo el grafo social visible). Se ocultaban solo en el cliente.
-- ────────────────────────────────────────────────────────────────────────────
-- Estrategia:
--   1) La política SELECT de `follows` pasa a "solo mis relaciones" (filas donde
--      soy follower o following). Cubre feed, sugerencias, mi estado de follow,
--      mis solicitudes y el realtime, que SIEMPRE me involucran.
--   2) Contadores públicos → RPC `follow_counts` (security definer): cualquiera ve
--      el nº de seguidores/seguidos de un perfil (como Instagram), sin exponer las
--      identidades.
--   3) Listas → RPC `follow_list` (security definer) con la PUERTA `can_view_author`
--      en el servidor: solo devuelve la lista si el que llama puede ver ese perfil
--      (propio / público / seguidor aceptado; nunca si privado-no-seguido, baneado
--      o con bloqueo). Antes esa comprobación vivía solo en la UI.
-- ════════════════════════════════════════════════════════════════════════════

-- 1) SELECT restringido a mis propias relaciones ------------------------------
drop policy if exists "follows_select_authenticated" on public.follows;
drop policy if exists "follows_select_visible" on public.follows;
create policy "follows_select_own_relationships" on public.follows
  for select to authenticated
  using (
    not public.is_current_user_banned()
    and (follower_id = auth.uid() or following_id = auth.uid())
  );

-- 2) Contadores públicos (bypassa RLS de forma controlada; solo devuelve números)
create or replace function public.follow_counts(p_target uuid)
returns table(followers bigint, following bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.follows where following_id = p_target and status = 'accepted'),
    (select count(*) from public.follows where follower_id = p_target and status = 'accepted');
$$;

grant execute on function public.follow_counts(uuid) to authenticated;

-- 3) Listas con la puerta de visibilidad en el servidor -----------------------
create or replace function public.follow_list(p_target uuid, p_mode text)
returns table(id uuid, username text, display_name text, avatar_url text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- Un baneado no lee listas; y solo se devuelve si puedo ver a ese perfil.
  if public.is_current_user_banned() or not public.can_view_author(p_target) then
    return;
  end if;

  if p_mode = 'followers' then
    return query
      select p.id, p.username, p.display_name, p.avatar_url
      from public.follows f
      join public.profiles p on p.id = f.follower_id
      where f.following_id = p_target and f.status = 'accepted'
      order by f.created_at desc;
  elsif p_mode = 'following' then
    return query
      select p.id, p.username, p.display_name, p.avatar_url
      from public.follows f
      join public.profiles p on p.id = f.following_id
      where f.follower_id = p_target and f.status = 'accepted'
      order by f.created_at desc;
  end if;
end;
$$;

grant execute on function public.follow_list(uuid, text) to authenticated;
