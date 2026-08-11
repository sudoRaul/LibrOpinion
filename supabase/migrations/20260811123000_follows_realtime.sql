-- ════════════════════════════════════════════════════════════════════════════
-- Realtime en follows
-- ────────────────────────────────────────────────────────────────────────────
-- Para reflejar en vivo en el perfil del otro cuando me rechazan una solicitud o
-- me quitan como seguidor (un DELETE en follows). No hace falta REPLICA IDENTITY
-- FULL: follower_id y following_id son la PK, así que el evento DELETE ya los
-- incluye, suficiente para filtrar por destinatario.
-- ════════════════════════════════════════════════════════════════════════════

alter publication supabase_realtime add table public.follows;
