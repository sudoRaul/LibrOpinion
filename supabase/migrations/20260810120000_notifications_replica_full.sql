-- ════════════════════════════════════════════════════════════════════════════
-- Borrado en vivo de notificaciones
-- ────────────────────────────────────────────────────────────────────────────
-- Por defecto, los eventos DELETE de Realtime solo incluyen la clave primaria
-- (id). Eso impide filtrar por `recipient_id` y que RLS autorice la entrega del
-- evento al destinatario. Con REPLICA IDENTITY FULL, el DELETE incluye toda la
-- fila anterior (recipient_id, read, …), de modo que el cliente recibe en vivo
-- el borrado de SUS notificaciones (al hacer unfollow / quitar like).
-- ════════════════════════════════════════════════════════════════════════════

alter table public.notifications replica identity full;
