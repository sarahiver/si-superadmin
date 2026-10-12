-- Pinterest: Rückkanal für Pin-Statistiken
-- Voraussetzung für die Aktionen metrics_sync / metrics_report in api/pinterest.js.
-- Idempotent: kann mehrfach laufen.

begin;

-- Tageswerte pro Pin. Pinterest liefert nur die letzten 90 Tage —
-- hier bleiben sie dauerhaft erhalten.
create table if not exists pinterest_pin_metrics (
  pin_id           text        not null,
  date             date        not null,
  queue_id         text,        -- pinterest_queue.id (Typ-unabhängig)
  impressions      integer     not null default 0,
  saves            integer     not null default 0,
  pin_clicks       integer     not null default 0,
  outbound_clicks  integer     not null default 0,
  data_status      text,
  fetched_at       timestamptz not null default now(),
  primary key (pin_id, date)
);

create index if not exists pinterest_pin_metrics_queue_idx
  on pinterest_pin_metrics (queue_id);

-- Nur der Server (Service-Key) liest und schreibt
alter table pinterest_pin_metrics enable row level security;

-- Wann zuletzt abgefragt, und ob es dabei einen Fehler gab
alter table pinterest_queue add column if not exists metrics_synced_at timestamptz;
alter table pinterest_queue add column if not exists metrics_error text;

create index if not exists pinterest_queue_metrics_sync_idx
  on pinterest_queue (status, metrics_synced_at);

commit;

-- Kontrolle
select column_name, data_type
from information_schema.columns
where table_name = 'pinterest_pin_metrics'
order by ordinal_position;
