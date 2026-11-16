// src/components/ProjectFeaturesPanel.js
// Zusatzfunktionen je Projekt (Sprachen, RSVP-Regeln, Bestätigungsmail) und
// eine schlanke, rein lesende RSVP-Übersicht. Bearbeiten, Filtern und Export
// der Antworten bleiben im Kundendashboard.
//
// Sicherung: Gespeichert wird nur, wenn die geladene Projektzeile die Spalte
// `features` bereits enthält. Fehlt sie (Migration noch nicht gelaufen), ist
// das Formular gesperrt und es wird nichts an die Datenbank geschickt.
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { updateProject, getRsvpsByProject } from '../lib/supabase';

export const LANGUAGES = [
  { id: 'en', name: 'Englisch' }, { id: 'tr', name: 'Türkisch' }, { id: 'de', name: 'Deutsch' }, { id: 'fr', name: 'Französisch' },
];
export const CASSIS_ORDER = ['hero', 'timeline', 'countdown', 'rsvp', 'directions', 'faq', 'witnesses'];
export const CASSIS_FEATURES = {
  i18n: { languages: ['en', 'tr', 'de', 'fr'], default: 'en' },
  rsvp: { max_persons: 8, child_ages: true, confirmation_mail: true },
};

/** Formularzustand aus der gespeicherten Einstellung lesen. */
export function readForm(features) {
  const f = features && typeof features === 'object' ? features : {};
  const langs = Array.isArray(f.i18n?.languages) ? f.i18n.languages.filter((l) => LANGUAGES.some((x) => x.id === l)) : [];
  return {
    languages: langs,
    defaultLang: langs.includes(f.i18n?.default) ? f.i18n.default : (langs[0] || 'en'),
    rules: !!f.rsvp,
    maxPersons: Number.isInteger(f.rsvp?.max_persons) ? f.rsvp.max_persons : 8,
    childAges: !!f.rsvp?.child_ages,
    confirmationMail: !!f.rsvp?.confirmation_mail,
  };
}

/** Einstellung für die Datenbank bauen. Unbekannte Schlüssel bleiben erhalten. */
export function buildFeatures(previous, form) {
  const next = { ...(previous && typeof previous === 'object' ? previous : {}) };
  if (form.languages.length > 0) {
    next.i18n = { languages: form.languages, default: form.languages.includes(form.defaultLang) ? form.defaultLang : form.languages[0] };
  } else delete next.i18n;
  if (form.rules) {
    const max = Math.min(20, Math.max(1, parseInt(form.maxPersons, 10) || 1));
    next.rsvp = { max_persons: max, child_ages: !!form.childAges, confirmation_mail: !!form.confirmationMail };
  } else delete next.rsvp;
  return next;
}

function parseGuests(r) {
  if (Array.isArray(r?.guests)) return r.guests;
  if (typeof r?.guests === 'string') { try { const g = JSON.parse(r.guests); return Array.isArray(g) ? g : []; } catch { return []; } }
  return [];
}

/** Kennzahlen der RSVP-Übersicht. */
export function summarize(rsvps) {
  const out = { answers: 0, yes: 0, no: 0, persons: 0, children: [], byLang: {} };
  (rsvps || []).forEach((r) => {
    out.answers += 1;
    if (r.language) out.byLang[r.language] = (out.byLang[r.language] || 0) + 1;
    if (!r.attending) { out.no += 1; return; }
    out.yes += 1; out.persons += r.persons || 1;
    parseGuests(r).forEach((g) => { if (g && g.is_child) out.children.push(Number.isInteger(g.age) ? g.age : null); });
  });
  out.children.sort((a, b) => (a ?? 99) - (b ?? 99));
  return out;
}

const S = {
  box: { border: '1px solid #E5E5E5', padding: '1.25rem', marginBottom: '1.25rem', background: '#fff' },
  h: { fontFamily: "'Oswald', sans-serif", fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.9rem' },
  row: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.25rem', alignItems: 'center', marginBottom: '0.9rem' },
  label: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' },
  hint: { fontSize: '0.8rem', color: '#666', margin: '0 0 0.9rem', lineHeight: 1.5 },
  warn: { fontSize: '0.85rem', background: '#FFF4E5', border: '1px solid #F0C36D', padding: '0.75rem 1rem', margin: '0 0 1rem', lineHeight: 1.5 },
  btn: { fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.8rem', padding: '0.6rem 1.1rem', border: '2px solid #0A0A0A', background: '#0A0A0A', color: '#fff', cursor: 'pointer' },
  btn2: { fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.8rem', padding: '0.6rem 1.1rem', border: '2px solid #0A0A0A', background: '#fff', color: '#0A0A0A', cursor: 'pointer' },
  stat: { minWidth: '6.5rem', padding: '0.75rem 1rem', border: '1px solid #E5E5E5' },
  statN: { fontFamily: "'Oswald', sans-serif", fontSize: '1.6rem', lineHeight: 1 },
  statL: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginTop: '0.3rem' },
  th: { textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', padding: '0.4rem 0.6rem', borderBottom: '1px solid #E5E5E5' },
  td: { fontSize: '0.85rem', padding: '0.45rem 0.6rem', borderBottom: '1px solid #F0F0F0', verticalAlign: 'top' },
};
const langName = (id) => LANGUAGES.find((l) => l.id === id)?.name || id || '–';

function Stat({ n, label }) {
  return <div style={S.stat}><div style={S.statN}>{n}</div><div style={S.statL}>{label}</div></div>;
}

export function RsvpOverview({ projectId }) {
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!projectId) return undefined;
    getRsvpsByProject(projectId).then(({ data, error }) => { if (!alive) return; if (error) setFailed(true); else setRows(data || []); });
    return () => { alive = false; };
  }, [projectId]);
  const sum = useMemo(() => summarize(rows), [rows]);

  return (
    <div style={S.box} data-testid="rsvp-overview">
      <h3 style={S.h}>RSVP-Übersicht (nur lesen)</h3>
      {failed && <p style={S.warn}>Die Antworten konnten nicht geladen werden.</p>}
      {!failed && rows === null && <p style={S.hint}>Lädt …</p>}
      {!failed && rows !== null && (
        <>
          <div style={S.row}>
            <Stat n={sum.answers} label="Antworten" />
            <Stat n={sum.yes} label="Zusagen" />
            <Stat n={sum.no} label="Absagen" />
            <Stat n={sum.persons} label="Personen" />
            <Stat n={sum.children.length} label="Kinder" />
          </div>
          {sum.children.length > 0 && (
            <p style={S.hint} data-testid="rsvp-children">Alter der Kinder: {sum.children.map((a) => (a === null ? 'ohne Angabe' : a)).join(', ')}</p>
          )}
          {Object.keys(sum.byLang).length > 0 && (
            <p style={S.hint} data-testid="rsvp-languages">Sprache der Antworten: {Object.entries(sum.byLang).sort((a, b) => b[1] - a[1]).map(([l, n]) => `${langName(l)} ${n}`).join(' · ')}</p>
          )}
          {rows.length === 0 ? <p style={S.hint}>Noch keine Antworten.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={S.th}>Name</th><th style={S.th}>Status</th><th style={S.th}>Personen</th><th style={S.th}>Kinder (Alter)</th><th style={S.th}>Sprache</th></tr></thead>
                <tbody>
                  {rows.map((r) => {
                    const kids = parseGuests(r).filter((g) => g && g.is_child);
                    return (
                      <tr key={r.id}>
                        <td style={S.td}>{r.name}</td>
                        <td style={S.td}>{r.attending ? 'Zusage' : 'Absage'}</td>
                        <td style={S.td}>{r.attending ? (r.persons || 1) : '–'}</td>
                        <td style={S.td}>{kids.length ? kids.map((k) => (Number.isInteger(k.age) ? k.age : '?')).join(', ') : '–'}</td>
                        <td style={S.td}>{r.language ? langName(r.language) : '–'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ ...S.hint, margin: '0.9rem 0 0' }}>Bearbeiten, Filtern und Export stehen dem Paar im Kundendashboard zur Verfügung.</p>
        </>
      )}
    </div>
  );
}

export default function ProjectFeaturesPanel({ project, onSaved }) {
  const columnExists = !!project && Object.prototype.hasOwnProperty.call(project, 'features');
  const [form, setForm] = useState(() => readForm(project?.features));
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(readForm(project?.features)); }, [project?.features]);
  if (!project) return null;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleLang = (id) => {
    const has = form.languages.includes(id);
    // Reihenfolge der Liste beibehalten, damit die Sprachleiste stabil bleibt
    const languages = LANGUAGES.map((l) => l.id).filter((l) => (l === id ? !has : form.languages.includes(l)));
    set({ languages, defaultLang: languages.includes(form.defaultLang) ? form.defaultLang : (languages[0] || 'en') });
  };

  const save = async (updates, message) => {
    if (!columnExists) return; // niemals ohne Spalte schreiben
    setSaving(true);
    const { error } = await updateProject(project.id, updates);
    setSaving(false);
    if (error) { toast.error('Zusatzfunktionen konnten nicht gespeichert werden'); return; }
    toast.success(message);
    if (onSaved) onSaved();
  };
  const saveForm = () => save({ features: buildFeatures(project.features, form) }, 'Zusatzfunktionen gespeichert');
  const applyCassis = () => {
    if (!window.confirm('Vorgaben für das Cassis-Theme übernehmen? Sprachen, RSVP-Regeln sowie Reihenfolge und Auswahl der Komponenten dieses Projekts werden gesetzt.')) return;
    save({ features: { ...(project.features || {}), ...CASSIS_FEATURES }, component_order: CASSIS_ORDER, active_components: CASSIS_ORDER }, 'Cassis-Vorgaben übernommen');
  };

  return (
    <div>
      <div style={S.box} data-testid="features-panel">
        <h3 style={S.h}>Zusatzfunktionen dieses Projekts</h3>
        {!columnExists && (
          <p style={S.warn} data-testid="features-missing">
            Die Datenbank kennt die Spalte <code>projects.features</code> noch nicht. Bitte zuerst das Migrationsskript ausführen – bis dahin wird hier nichts gespeichert.
          </p>
        )}
        <fieldset disabled={!columnExists || saving} style={{ border: 0, padding: 0, margin: 0 }}>
          <p style={S.hint}>Dieser Bereich speichert sofort und lädt das Projekt danach neu – offene Änderungen in anderen Bereichen bitte vorher speichern.</p>
          <p style={S.hint}>Sprachen der Gästeseite. Ohne Auswahl bleibt die Seite einsprachig wie bisher.</p>
          <div style={S.row}>
            {LANGUAGES.map((l) => (
              <label key={l.id} style={S.label}><input type="checkbox" checked={form.languages.includes(l.id)} onChange={() => toggleLang(l.id)} /> {l.name}</label>
            ))}
          </div>
          {form.languages.length > 1 && (
            <div style={S.row}>
              <label style={S.label}>Hauptsprache (Rückfall)
                <select value={form.defaultLang} onChange={(e) => set({ defaultLang: e.target.value })} style={{ padding: '0.35rem' }}>
                  {form.languages.map((l) => <option key={l} value={l}>{langName(l)}</option>)}
                </select>
              </label>
            </div>
          )}
          <div style={S.row}>
            <label style={S.label}><input type="checkbox" checked={form.rules} onChange={(e) => set({ rules: e.target.checked })} /> RSVP-Regeln mit Prüfung auf dem Server</label>
          </div>
          {form.rules && (
            <div style={S.row}>
              <label style={S.label}>Höchstens
                <input type="number" min="1" max="20" value={form.maxPersons} onChange={(e) => set({ maxPersons: e.target.value })} style={{ width: '4rem', padding: '0.35rem' }} />
                Personen pro Anmeldung
              </label>
              <label style={S.label}><input type="checkbox" checked={form.childAges} onChange={(e) => set({ childAges: e.target.checked })} /> Alter der Kinder abfragen</label>
              <label style={S.label}><input type="checkbox" checked={form.confirmationMail} onChange={(e) => set({ confirmationMail: e.target.checked })} /> Bestätigungsmail an Gäste</label>
            </div>
          )}
          <div style={S.row}>
            <button type="button" style={S.btn} onClick={saveForm}>{saving ? 'Speichert …' : 'Zusatzfunktionen speichern'}</button>
            {project.theme === 'cassis' && <button type="button" style={S.btn2} onClick={applyCassis}>Cassis-Vorgaben übernehmen</button>}
          </div>
        </fieldset>
      </div>
      <RsvpOverview projectId={project.id} />
    </div>
  );
}
