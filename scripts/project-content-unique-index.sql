-- project_content: Unique-Index auf (project_id, component)
-- Der Upsert in api/db.js (on_conflict=project_id,component) braucht ihn.
-- Ohne Index scheitert jedes Speichern mit Fehler 42P10.
-- api/db.js fängt das inzwischen per Fallback ab — der Index bleibt trotzdem
-- der richtige Zustand (atomar, keine Dubletten bei Doppelklick).

-- ── 1. DIAGNOSE (erst nur lesen) ──────────────────────────────

-- Existiert der Index?
select indexname, indexdef
from pg_indexes
where tablename = 'project_content';

-- Heißt die Spalte wirklich "component"? (README nennt "component_name")
select column_name, data_type
from information_schema.columns
where table_name = 'project_content'
order by ordinal_position;

-- Gibt es Dubletten, die den Index verhindern würden?
select project_id, component, count(*)
from project_content
group by project_id, component
having count(*) > 1;

-- Wie viele Projekte haben überhaupt Inhalte?
select p.slug, p.status, count(c.id) as rows
from projects p
left join project_content c on c.project_id = p.id
group by p.slug, p.status
order by rows asc, p.slug;

-- ── 2. FIX ────────────────────────────────────────────────────

begin;

-- Dubletten entfernen: pro (project_id, component) die zuletzt
-- geänderte Zeile behalten
delete from project_content a
using project_content b
where a.project_id = b.project_id
  and a.component = b.component
  and (
    coalesce(a.updated_at, 'epoch') < coalesce(b.updated_at, 'epoch')
    or (coalesce(a.updated_at, 'epoch') = coalesce(b.updated_at, 'epoch') and a.id::text < b.id::text)
  );

create unique index if not exists project_content_project_component_key
  on project_content (project_id, component);

commit;

-- updated_at bei jedem Update setzen (falls noch kein Trigger existiert)
create or replace function project_content_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists project_content_touch on project_content;
create trigger project_content_touch
  before update on project_content
  for each row execute function project_content_touch();
