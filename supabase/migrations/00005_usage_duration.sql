-- Track research run duration for analytics
alter table public.usage_logs
  add column if not exists duration_ms integer
    check (duration_ms is null or duration_ms >= 0);

create index if not exists usage_logs_user_id_created_at_idx
  on public.usage_logs (user_id, created_at desc);
