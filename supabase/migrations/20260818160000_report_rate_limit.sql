-- ════════════════════════════════════════════════════════════════════════════
-- FIX M-4 (MEDIO): sin rate-limiting en `reports`.
-- ────────────────────────────────────────────────────────────────────────────
-- Cada INSERT en `reports` dispara un correo al admin (Database Webhook). Un
-- usuario podía insertar reportes ilimitados → flood de correos / coste / DoS.
--
-- Trigger BEFORE INSERT que:
--   1) impide reportar DOS VECES el mismo objetivo (mismo reportante+reportado+
--      tipo+target), y
--   2) limita a 10 reportes por hora y usuario.
-- Los mensajes son tokens ASCII estables; el cliente los traduce.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.enforce_report_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count int;
begin
  -- 1) Sin duplicados del mismo objetivo por el mismo usuario.
  if exists (
    select 1 from public.reports
    where reporter_id = new.reporter_id
      and reported_id = new.reported_id
      and target_type = new.target_type
      and target_id is not distinct from new.target_id
  ) then
    raise exception 'report_duplicate' using errcode = 'P0001';
  end if;

  -- 2) Máximo 10 reportes por hora y usuario.
  select count(*) into recent_count
  from public.reports
  where reporter_id = new.reporter_id
    and created_at > now() - interval '1 hour';

  if recent_count >= 10 then
    raise exception 'report_rate_limit' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_report_limits_trg on public.reports;
create trigger enforce_report_limits_trg
  before insert on public.reports
  for each row execute function public.enforce_report_limits();
