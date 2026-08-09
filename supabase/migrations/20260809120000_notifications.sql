-- ════════════════════════════════════════════════════════════════════════════
-- Notificaciones
-- ────────────────────────────────────────────────────────────────────────────
-- Se generan SIEMPRE en la BD mediante triggers SECURITY DEFINER (igual que el
-- profile en el alta). El cliente NUNCA inserta notificaciones: no hay policy de
-- insert. RLS: cada usuario solo ve / marca / borra las suyas.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade, -- quién la recibe
  actor_id     uuid not null references public.profiles(id) on delete cascade, -- quién la provoca
  type         text not null check (type in ('follow', 'like', 'comment')),
  quote_id     uuid references public.quotes(id) on delete cascade,            -- cita implicada (like/comment)
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

-- Solo veo las mías.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = recipient_id);

-- Solo puedo marcar como leídas (update) las mías.
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- Solo puedo borrar (limpiar) las mías.
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = recipient_id);

-- (Sin policy de insert: las crean los triggers de abajo.)

-- ── Follow ──────────────────────────────────────────────────────────────────
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.follower_id <> new.following_id then
    insert into public.notifications (recipient_id, actor_id, type)
    values (new.following_id, new.follower_id, 'follow');
  end if;
  return new;
end; $$;

drop trigger if exists on_follow_created on public.follows;
create trigger on_follow_created
  after insert on public.follows
  for each row execute function public.notify_on_follow();

-- Al dejar de seguir, retiro la notificación de follow.
create or replace function public.unnotify_on_unfollow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
  where recipient_id = old.following_id
    and actor_id = old.follower_id
    and type = 'follow';
  return old;
end; $$;

drop trigger if exists on_follow_deleted on public.follows;
create trigger on_follow_deleted
  after delete on public.follows
  for each row execute function public.unnotify_on_unfollow();

-- ── Like ────────────────────────────────────────────────────────────────────
create or replace function public.notify_on_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
begin
  select user_id into owner from public.quotes where id = new.quote_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, quote_id)
    values (owner, new.user_id, 'like', new.quote_id);
  end if;
  return new;
end; $$;

drop trigger if exists on_like_created on public.likes;
create trigger on_like_created
  after insert on public.likes
  for each row execute function public.notify_on_like();

-- Al quitar el like, retiro su notificación.
create or replace function public.unnotify_on_unlike()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
  where actor_id = old.user_id
    and quote_id = old.quote_id
    and type = 'like';
  return old;
end; $$;

drop trigger if exists on_like_deleted on public.likes;
create trigger on_like_deleted
  after delete on public.likes
  for each row execute function public.unnotify_on_unlike();

-- ── Comment ─────────────────────────────────────────────────────────────────
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
begin
  select user_id into owner from public.quotes where id = new.quote_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, quote_id)
    values (owner, new.user_id, 'comment', new.quote_id);
  end if;
  return new;
end; $$;

drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- ── Realtime ────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.notifications;
