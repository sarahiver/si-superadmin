-- Pinterest: Protokoll der Cron-Läufe
-- Vercel hält Logs im Hobby-Plan nur kurz vor. Jeder Lauf (auch abgelehnte)
-- wird hier gespeichert und im SuperAdmin unter "Pin-Queue" angezeigt.
-- Idempotent: kann mehrfach laufen.

create table if not exists pinterest_cron_runs (
  id           bigserial    primary key,
  started_at   timestamptz  not null default now(),
  finished_at  timestamptz,
  trigger      text,                 -- 'cron' (Vercel) oder 'manuell' (curl mit Secret)
  ok           boolean      not null default false,
  published    integer      not null default 0,
  blocked      boolean      not null default false,
  metrics      jsonb,                -- { synced, failed, error }
  results      jsonb,                -- [{ id, title, ok, pin_id, error }]
  error        text
);

create index if not exists pinterest_cron_runs_started_idx
  on pinterest_cron_runs (started_at desc);

-- Nur der Server (Service-Key) liest und schreibt
alter table pinterest_cron_runs enable row level security;

-- Aufräumen: Läufe älter als 90 Tage braucht niemand
-- (optional, bei Bedarf manuell ausführen)
-- delete from pinterest_cron_runs where started_at < now() - interval '90 days';
