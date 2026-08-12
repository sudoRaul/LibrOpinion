-- ════════════════════════════════════════════════════════════════════════════
-- Bloquear usuario (block)  — usuario ↔ usuario
-- ────────────────────────────────────────────────────────────────────────────
-- Si A bloquea a B: dejan de verse mutuamente (citas, likes, comentarios), se
-- rompen los follows entre ambos y no pueden volver a seguirse ni interactuar.
-- Es simétrico para la visibilidad e instantáneo/reversible.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

-- Ambas partes pueden leer el bloqueo (la app necesita saber el estado para la UI).
drop policy if exists "blocks_select_involved" on public.blocks;
create policy "blocks_select_involved" on public.blocks
  for select to authenticated
  using (auth.uid() = blocker_id or auth.uid() = blocked_id);

-- Solo el bloqueador crea/borra su bloqueo.
drop policy if exists "blocks_insert_own" on public.blocks;
create policy "blocks_insert_own" on public.blocks
  for insert to authenticated with check (auth.uid() = blocker_id);

drop policy if exists "blocks_delete_own" on public.blocks;
create policy "blocks_delete_own" on public.blocks
  for delete to authenticated using (auth.uid() = blocker_id);

-- ¿Hay bloqueo entre a y b, en cualquier sentido?
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- Visibilidad de contenido: ahora también cae si hay bloqueo (en cualquier sentido).
create or replace function public.can_view_author(author uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    author = auth.uid()
    or (
      not public.is_blocked_between(auth.uid(), author)
      and (
        exists (select 1 from public.profiles p where p.id = author and p.is_private = false)
        or exists (
          select 1 from public.follows f
          where f.following_id = author and f.follower_id = auth.uid() and f.status = 'accepted'
        )
      )
    );
$$;

-- Al bloquear, rompo los follows entre ambos (en los dos sentidos). Esto dispara
-- también la limpieza de notificaciones y el realtime de follows (revierte estados).
create or replace function public.remove_follows_on_block()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);
  return new;
end; $$;

drop trigger if exists on_block_created on public.blocks;
create trigger on_block_created
  after insert on public.blocks
  for each row execute function public.remove_follows_on_block();

-- Impido crear un follow si existe bloqueo entre las partes (reforzado en BD).
create or replace function public.set_follow_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  priv boolean;
begin
  if public.is_blocked_between(new.follower_id, new.following_id) then
    raise exception 'No se puede seguir: existe un bloqueo entre los usuarios.';
  end if;
  select is_private into priv from public.profiles where id = new.following_id;
  new.status := case when coalesce(priv, false) then 'pending' else 'accepted' end;
  return new;
end; $$;

-- Refuerzo: no se puede dar like / comentar contenido que no puedes ver (incluye
-- el caso de bloqueo). Antes solo se comprobaba la propiedad de la fila.
drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own" on public.likes
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.can_view_author((select q.user_id from public.quotes q where q.id = quote_id))
  );

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.can_view_author((select q.user_id from public.quotes q where q.id = quote_id))
  );
