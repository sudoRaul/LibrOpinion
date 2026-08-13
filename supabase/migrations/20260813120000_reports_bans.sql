-- ════════════════════════════════════════════════════════════════════════════
-- Moderación (Fase 2a): reportes + baneo
-- ────────────────────────────────────────────────────────────────────────────
-- Reportes: un usuario denuncia a otro (o una cita/comentario) con un motivo.
-- Baneo: tú marcas `is_banned` en el perfil (SQL / Table Editor). Entonces su
-- contenido desaparece para todos (RLS) y no puede publicar/interactuar; en la
-- app verá una pantalla "Cuenta suspendida".
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Reportes -----------------------------------------------------------------
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  reported_id  uuid not null references public.profiles(id) on delete cascade,
  target_type  text not null check (target_type in ('user', 'quote', 'comment')),
  target_id    uuid,                       -- id de la cita/comentario (null si es el usuario)
  reason       text not null,
  detail       text,
  status       text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at   timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create index if not exists reports_status_created_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

-- El usuario crea sus reportes y puede ver los suyos (tú, admin, lees por dashboard).
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert to authenticated with check (auth.uid() = reporter_id);

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select to authenticated using (auth.uid() = reporter_id);

-- 2) Baneo --------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_banned boolean not null default false;

-- ¿El usuario en sesión está baneado? (para bloquear sus escrituras por RLS).
create or replace function public.is_current_user_banned()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_banned = true);
$$;

-- Visibilidad: el contenido de un baneado se oculta para TODOS (incluido él).
create or replace function public.can_view_author(author uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    not exists (select 1 from public.profiles p where p.id = author and p.is_banned = true)
    and (
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
      )
    );
$$;

-- 3) Un usuario baneado no puede publicar ni interactuar (RLS de inserción) ----
drop policy if exists "quotes_insert_own" on public.quotes;
create policy "quotes_insert_own" on public.quotes
  for insert to authenticated
  with check (auth.uid() = user_id and not public.is_current_user_banned());

drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own" on public.likes
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and not public.is_current_user_banned()
    and public.can_view_author((select q.user_id from public.quotes q where q.id = quote_id))
  );

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and not public.is_current_user_banned()
    and public.can_view_author((select q.user_id from public.quotes q where q.id = quote_id))
  );

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own" on public.follows
  for insert to authenticated
  with check (auth.uid() = follower_id and not public.is_current_user_banned());
