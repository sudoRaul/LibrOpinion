-- Borrado de comentarios en vivo: para que el evento DELETE de Realtime traiga
-- quote_id y user_id (y no solo la PK `id`), la tabla necesita REPLICA IDENTITY
-- FULL, que hace que el payload `old` incluya toda la fila borrada. Es lo mismo
-- que se hizo con `notifications`. (En `likes` no hace falta porque su PK ya es
-- (user_id, quote_id), así que el DELETE ya trae ambos.)
-- `comments` ya está en la publicación supabase_realtime (los INSERT ya llegan).
alter table public.comments replica identity full;
