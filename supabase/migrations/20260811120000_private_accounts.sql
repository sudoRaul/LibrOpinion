-- ════════════════════════════════════════════════════════════════════════════
-- Cuentas públicas / privadas  (Fase 1: datos + RLS + solicitudes)
-- ────────────────────────────────────────────────────────────────────────────
-- Una cuenta privada: sus CITAS (y likes/comentarios asociados) solo las ven su
-- autor y sus seguidores ACEPTADOS. Seguir a una privada crea una SOLICITUD
-- (follow con status 'pending') que el dueño acepta/rechaza.
--
-- Compatibilidad: is_private default false y status default 'accepted', así que
-- al aplicar esta migración TODO sigue funcionando igual (todos públicos) hasta
-- que la UI permita activar la privacidad.
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Privacidad en perfiles ---------------------------------------------------
alter table public.profiles
  add column if not exists is_private boolean not null default false;

-- 2) Estado de la relación de seguimiento -------------------------------------
alter table public.follows
  add column if not exists status text not null default 'accepted'
  check (status in ('accepted', 'pending'));

create index if not exists follows_following_status_idx
  on public.follows (following_id, status);

-- Trigger BEFORE INSERT: el status lo decide la BD según la privacidad del
-- destino (sobrescribe lo que mande el cliente → nadie puede auto-aceptarse).
create or replace function public.set_follow_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  priv boolean;
begin
  select is_private into priv from public.profiles where id = new.following_id;
  new.status := case when coalesce(priv, false) then 'pending' else 'accepted' end;
  return new;
end; $$;

drop trigger if exists set_follow_status_trg on public.follows;
create trigger set_follow_status_trg
  before insert on public.follows
  for each row execute function public.set_follow_status();

-- Al pasar de privada -> pública, auto-acepto las solicitudes pendientes.
create or replace function public.accept_pending_on_public()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.is_private = true and new.is_private = false then
    update public.follows set status = 'accepted'
    where following_id = new.id and status = 'pending';
  end if;
  return new;
end; $$;

drop trigger if exists accept_pending_on_public_trg on public.profiles;
create trigger accept_pending_on_public_trg
  after update of is_private on public.profiles
  for each row execute function public.accept_pending_on_public();

-- 3) Función de visibilidad (reutilizable en varias RLS) ----------------------
-- ¿El usuario en sesión puede ver el contenido del autor indicado?
create or replace function public.can_view_author(author uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    author = auth.uid()
    or exists (select 1 from public.profiles p where p.id = author and p.is_private = false)
    or exists (
      select 1 from public.follows f
      where f.following_id = author and f.follower_id = auth.uid() and f.status = 'accepted'
    );
$$;

-- 4) RLS de citas -------------------------------------------------------------
drop policy if exists "quotes_select_authenticated" on public.quotes;
create policy "quotes_select_visible" on public.quotes
  for select to authenticated
  using (public.can_view_author(user_id));

-- 5) RLS de likes y comentarios (reflejan la visibilidad de su cita) ----------
drop policy if exists "likes_select_authenticated" on public.likes;
create policy "likes_select_visible" on public.likes
  for select to authenticated
  using (
    exists (select 1 from public.quotes q where q.id = likes.quote_id and public.can_view_author(q.user_id))
  );

drop policy if exists "comments_select_authenticated" on public.comments;
create policy "comments_select_visible" on public.comments
  for select to authenticated
  using (
    exists (select 1 from public.quotes q where q.id = comments.quote_id and public.can_view_author(q.user_id))
  );

-- 6) RLS de follows: el destinatario puede aceptar (update) y rechazar/quitar
--    (delete). El follower conserva su delete (dejar de seguir / cancelar). El
--    select sigue abierto (los contadores son públicos; las LISTAS se ocultan
--    en la app para cuentas privadas).
drop policy if exists "follows_update_target" on public.follows;
create policy "follows_update_target" on public.follows
  for update to authenticated
  using (auth.uid() = following_id) with check (auth.uid() = following_id);

drop policy if exists "follows_delete_target" on public.follows;
create policy "follows_delete_target" on public.follows
  for delete to authenticated
  using (auth.uid() = following_id);

-- 7) Notificaciones: nuevos tipos y triggers de solicitud ---------------------
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('follow', 'like', 'comment', 'follow_request', 'follow_accepted'));

-- Alta de follow: si es aceptado → "te siguió"; si es pendiente → "quiere seguirte".
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.follower_id = new.following_id then
    return new;
  end if;
  insert into public.notifications (recipient_id, actor_id, type)
  values (
    new.following_id,
    new.follower_id,
    case when new.status = 'accepted' then 'follow' else 'follow_request' end
  );
  return new;
end; $$;

-- Aceptación de solicitud (pending -> accepted): aviso al solicitante y limpio
-- la notificación de solicitud del destinatario.
create or replace function public.notify_on_follow_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'pending' and new.status = 'accepted' then
    delete from public.notifications
    where recipient_id = new.following_id and actor_id = new.follower_id and type = 'follow_request';

    if new.follower_id <> new.following_id then
      insert into public.notifications (recipient_id, actor_id, type)
      values (new.follower_id, new.following_id, 'follow_accepted');
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists on_follow_updated on public.follows;
create trigger on_follow_updated
  after update on public.follows
  for each row execute function public.notify_on_follow_update();

-- Baja de follow / cancelación / rechazo: retiro follow y follow_request.
create or replace function public.unnotify_on_unfollow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
  where recipient_id = old.following_id
    and actor_id = old.follower_id
    and type in ('follow', 'follow_request');
  return old;
end; $$;
