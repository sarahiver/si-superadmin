// src/components/TranslatePanel.js
// Automatische Übersetzung der Inhalte eines mehrsprachigen Projekts.
// Ablauf: vorbereiten (lesen, übersetzen, nichts speichern) → Vorschau prüfen → speichern.
// Die Regeln stehen in lib/autoTranslate.js.
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { adminFetch } from '../lib/apiClient';
import { getContentRows, updateContentRow } from '../lib/supabase';
import { planProject, translateJobs, resolveJob, applyToContent, classifyApiError, SECTION_NAMES, LANG_NAMES, SOURCE_LANGUAGE } from '../lib/autoTranslate';

const S = {
  box: { border: '1px solid #E5E5E5', padding: '1.25rem', marginBottom: '1.25rem', background: '#fff' },
  h: { fontFamily: "'Oswald', sans-serif", fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.9rem' },
  hint: { fontSize: '0.8rem', color: '#666', margin: '0 0 0.9rem', lineHeight: 1.5 },
  warn: { fontSize: '0.85rem', background: '#FFF4E5', border: '1px solid #F0C36D', padding: '0.75rem 1rem', margin: '0 0 1rem', lineHeight: 1.5 },
  row: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', alignItems: 'center', marginBottom: '0.9rem' },
  btn: { fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.8rem', padding: '0.6rem 1.1rem', border: '2px solid #0A0A0A', background: '#0A0A0A', color: '#fff', cursor: 'pointer' },
  btn2: { fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.8rem', padding: '0.6rem 1.1rem', border: '2px solid #0A0A0A', background: '#fff', color: '#0A0A0A', cursor: 'pointer' },
  item: { borderTop: '1px solid #E5E5E5', padding: '0.75rem 0', display: 'grid', gridTemplateColumns: '1.5rem minmax(0, 1fr)', gap: '0.5rem' },
  where: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666' },
  src: { fontSize: '0.85rem', margin: '0.2rem 0 0.5rem', whiteSpace: 'pre-line', overflowWrap: 'anywhere' },
  write: { fontSize: '0.85rem', margin: '0.15rem 0', whiteSpace: 'pre-line', overflowWrap: 'anywhere', lineHeight: 1.45 },
  tag: { display: 'inline-block', minWidth: '5.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#666' },
  old: { color: '#999', textDecoration: 'line-through' },
};
const KIND = { neu: 'neu', aktualisiert: 'ersetzt eigene Übersetzung', verschoben: 'umgezogen' };

/** Eine Frage an das Sprachmodell über die vorhandene Schnittstelle (ohne Websuche). */
async function ask(prompt) {
  const res = await adminFetch('/api/ai-suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, webSearch: false }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const c = classifyApiError(res.status, data); const err = new Error(c.message); err.fatal = c.fatal; throw err; }
  const text = (data.content || []).filter((i) => i.type === 'text').map((i) => i.text || '').join('\n');
  return { text, truncated: data.stop_reason === 'max_tokens' };
}

export default function TranslatePanel({ project, askModel = ask }) {
  const i18n = project?.features?.i18n;
  const languages = useMemo(() => (Array.isArray(i18n?.languages) ? i18n.languages : []), [i18n]);
  const master = languages.includes(i18n?.default) ? i18n.default : (languages.includes('en') ? 'en' : languages[0]);
  const [phase, setPhase] = useState('idle'); // idle | working | preview | saving
  const [progress, setProgress] = useState([0, 0]);
  const [snapshot, setSnapshot] = useState([]);
  const [items, setItems] = useState([]);   // { job, writes, marks, on }
  const [failed, setFailed] = useState([]);
  const [note, setNote] = useState('');

  if (!project || languages.length < 2) return null;
  const ctx = { master, languages };
  const where = (job) => `${SECTION_NAMES[job.entry.component] || job.entry.component} · ${job.entry.label}`;

  const prepare = async () => {
    setPhase('working'); setNote(''); setItems([]); setFailed([]); setProgress([0, 0]);
    try {
      const { data, error } = await getContentRows(project.id);
      if (error) throw new Error(error.message);
      const rows = Array.isArray(data) ? data : [];
      const jobs = planProject(rows, ctx);
      setSnapshot(rows);
      if (!jobs.length) { setPhase('idle'); setNote('Alles übersetzt – es gibt nichts zu tun.'); return; }
      setProgress([0, jobs.length]);
      const { results, failed: bad } = await translateJobs(jobs, { ...ctx, ask: askModel, onProgress: (a, b) => setProgress([a, b]) });
      const list = [];
      for (const job of jobs) {
        if (!results[job.id]) continue;
        const r = resolveJob(job, results[job.id], ctx);
        if (r.writes.length || r.marks.length) list.push({ job, ...r, on: true });
      }
      setItems(list);
      setFailed(jobs.filter((j) => bad.includes(j.id)));
      setPhase('preview');
    } catch (e) {
      setPhase('idle'); setNote(`Übersetzen abgebrochen. ${e.message} Es wurde nichts gespeichert.`);
    }
  };

  const shown = items.filter((x) => x.writes.length);
  const chosen = shown.filter((x) => x.on);
  const toggle = (id) => setItems((prev) => prev.map((x) => (x.job.id === id ? { ...x, on: !x.on } : x)));

  const save = async () => {
    const count = chosen.reduce((n, x) => n + x.writes.length, 0);
    if (!window.confirm(`${count} Texte in ${chosen.length} Feldern in die Inhalte von „${project.slug || project.couple_names || 'diesem Projekt'}" schreiben? Die Seite zeigt sie sofort.`)) return;
    setPhase('saving');
    try {
      // Vor dem Schreiben erneut lesen: Hat das Paar inzwischen etwas geändert, bleibt dieser Bereich unberührt
      const { data, error } = await getContentRows(project.id);
      if (error) throw new Error(error.message);
      const fresh = new Map((data || []).map((r) => [r.id, r]));
      let saved = 0, skipped = 0, errors = 0;
      for (const row of snapshot) {
        // Merker ohne sichtbare Änderung (z. B. „bleibt in allen Sprachen gleich") gehen mit, sobald der Bereich gespeichert wird
        const mine = items.filter((x) => x.job.rowId === row.id && (x.writes.length ? x.on : true));
        if (!mine.some((x) => x.writes.length && x.on)) continue;
        const now = fresh.get(row.id);
        if (!now || JSON.stringify(now.content) !== JSON.stringify(row.content)) { skipped++; continue; }
        const next = applyToContent(row.content, mine.map((x) => ({ path: x.job.entry.path, writes: x.writes, marks: x.marks })), ctx);
        const r = await updateContentRow(project.id, row.id, next);
        if (r.error) errors++; else saved++;
      }
      setItems([]); setFailed([]); setPhase('idle');
      const parts = [`${saved} Bereiche gespeichert`];
      if (skipped) parts.push(`${skipped} übersprungen, weil sie inzwischen geändert wurden – bitte erneut vorbereiten`);
      if (errors) parts.push(`${errors} konnten nicht gespeichert werden`);
      setNote(`${parts.join('; ')}.`);
      if (errors || skipped) toast.error('Nicht alles wurde gespeichert'); else toast.success('Übersetzungen gespeichert');
    } catch (e) {
      setPhase('preview'); setNote(`Speichern fehlgeschlagen: ${e.message}.`);
    }
  };

  const busy = phase === 'working' || phase === 'saving';
  return (
    <div style={S.box} data-testid="translate-panel">
      <h3 style={S.h}>Automatisch übersetzen</h3>
      <p style={S.hint}>
        Ausgangssprache ist {LANG_NAMES[SOURCE_LANGUAGE]}, Hauptsprache der Seite bleibt {LANG_NAMES[master] || master}. Fehlende Texte werden in {languages.map((l) => LANG_NAMES[l] || l).join(', ')} ergänzt.
        Steht deutscher Text in der Hauptsprache, zieht er in den Deutsch-Reiter um und die Hauptsprache bekommt die englische Fassung.
        Von Hand eingetragene oder korrigierte Übersetzungen bleiben unberührt. Namen, Adressen, Uhrzeiten, Links und Codes werden nicht übersetzt.
      </p>
      {!languages.includes(SOURCE_LANGUAGE) && <p style={S.warn}>Deutsch ist für dieses Projekt nicht als Sprache aktiviert. Übersetzt wird dann aus der Hauptsprache.</p>}
      <div style={S.row}>
        <button type="button" style={S.btn2} onClick={prepare} disabled={busy} data-testid="translate-prepare">
          {phase === 'working' ? `Übersetzt … ${progress[0]} von ${progress[1]}` : 'Übersetzungen vorbereiten'}
        </button>
        {phase === 'preview' && shown.length > 0 && (
          <button type="button" style={S.btn} onClick={save} disabled={!chosen.length} data-testid="translate-save">{chosen.length} von {shown.length} Feldern speichern</button>
        )}
        {phase === 'saving' && <span style={S.hint}>Speichert …</span>}
      </div>
      {note && <p style={S.hint} data-testid="translate-note">{note}</p>}
      {phase === 'preview' && (
        <div data-testid="translate-preview">
          <p style={S.hint}>Noch ist nichts gespeichert. Abgewählte Felder bleiben, wie sie sind.</p>
          {failed.length > 0 && (
            <p style={S.warn} data-testid="translate-failed">
              {failed.length} {failed.length === 1 ? 'Feld konnte' : 'Felder konnten'} nicht übersetzt werden und {failed.length === 1 ? 'bleibt' : 'bleiben'} unverändert: {failed.map(where).join('; ')}
            </p>
          )}
          {shown.length === 0 && <p style={S.hint}>Keine Änderungen.</p>}
          {shown.map((x) => (
            <div key={x.job.id} style={S.item} data-testid="translate-item">
              <input type="checkbox" checked={x.on} onChange={() => toggle(x.job.id)} aria-label={`Übernehmen: ${where(x.job)}`} />
              <div>
                <div style={S.where}>{where(x.job)}</div>
                <p style={S.src}>{x.job.source}</p>
                {x.writes.map((w) => (
                  <p key={w.lang} style={S.write}>
                    <span style={S.tag}>{LANG_NAMES[w.lang] || w.lang}{w.lang === master ? ' (Haupt)' : ''}</span>
                    {w.value}
                    {w.before && w.before !== w.value && <> <span style={S.old}>{w.before}</span></>}
                    <span style={{ ...S.tag, marginLeft: '0.6rem', minWidth: 0 }}>{KIND[w.kind]}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
