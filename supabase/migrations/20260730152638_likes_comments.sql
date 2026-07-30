-- Likes y comentarios sobre citas. Idempotente (se puede ejecutar varias veces).

-- ============================ LIKES ============================
create table if not exists "public"."likes" (
  "user_id" uuid not null references "public"."profiles"("id") on delete cascade,
  "quote_id" uuid not null references "public"."quotes"("id") on delete cascade,
  "created_at" timestamptz not null default now(),
  primary key ("user_id", "quote_id")
);

create index if not exists "likes_quote_id_idx" on "public"."likes" ("quote_id");

alter table "public"."likes" enable row level security;

drop policy if exists "likes_select_authenticated" on "public"."likes";
create policy "likes_select_authenticated"
  on "public"."likes" for select to "authenticated" using (true);

drop policy if exists "likes_insert_own" on "public"."likes";
create policy "likes_insert_own"
  on "public"."likes" for insert to "authenticated" with check (auth.uid() = user_id);

drop policy if exists "likes_delete_own" on "public"."likes";
create policy "likes_delete_own"
  on "public"."likes" for delete to "authenticated" using (auth.uid() = user_id);

-- ========================== COMMENTS ==========================
create table if not exists "public"."comments" (
  "id" uuid primary key default gen_random_uuid(),
  "quote_id" uuid not null references "public"."quotes"("id") on delete cascade,
  "user_id" uuid not null references "public"."profiles"("id") on delete cascade,
  "content" text not null check (char_length("content") between 1 and 1000),
  "created_at" timestamptz not null default now()
);

create index if not exists "comments_quote_id_idx" on "public"."comments" ("quote_id", "created_at");

alter table "public"."comments" enable row level security;

drop policy if exists "comments_select_authenticated" on "public"."comments";
create policy "comments_select_authenticated"
  on "public"."comments" for select to "authenticated" using (true);

drop policy if exists "comments_insert_own" on "public"."comments";
create policy "comments_insert_own"
  on "public"."comments" for insert to "authenticated" with check (auth.uid() = user_id);

drop policy if exists "comments_update_own" on "public"."comments";
create policy "comments_update_own"
  on "public"."comments" for update to "authenticated"
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "comments_delete_own" on "public"."comments";
create policy "comments_delete_own"
  on "public"."comments" for delete to "authenticated" using (auth.uid() = user_id);
