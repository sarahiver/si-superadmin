-- pinterest_queue: Entwurfsstufe (status 'draft')
-- Voraussetzung für PinterestDrafts.js und die Actions draft_* in api/pinterest.js.
-- Idempotent: kann mehrfach laufen.

-- ── 1. DIAGNOSE ───────────────────────────────────────────────

select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'pinterest_queue'
order by ordinal_position;

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'pinterest_queue'::regclass and contype = 'c';

-- Welche Status kommen tatsächlich vor? Alles hier muss in die neue Constraint.
select status, count(*) from pinterest_queue group by status;

-- ── 2. MIGRATION ──────────────────────────────────────────────

begin;

-- Metadaten des Generators (Stil, Layout, Artikel, Kategorie)
alter table pinterest_queue add column if not exists meta jsonb;

-- Entwürfe haben noch kein Bild. Ohne das scheitert JEDER Entwurf.
-- (Auch das Leeren nach erfolgreichem Pin in api/pinterest.js braucht es.)
alter table pinterest_queue alter column image_data drop not null;

-- Status-Constraint ersetzen — unabhängig davon, wie die alte heißt
do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'pinterest_queue'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table pinterest_queue drop constraint %I', c.conname);
  end loop;
end $$;

alter table pinterest_queue
  add constraint pinterest_queue_status_check
  check (status in ('draft', 'queued', 'published', 'failed'));

-- Entwurfsliste und Cron lesen nach Status
create index if not exists pinterest_queue_status_idx
  on pinterest_queue (status, created_at);

commit;

-- Falls die Constraint wegen unbekannter Altwerte scheitert:
-- Ergebnis der Status-Abfrage oben prüfen und die Liste ergänzen.
