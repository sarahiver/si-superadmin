// src/lib/autoTranslate.js
// Automatische Übersetzung der Inhalte eines mehrsprachigen Projekts (Cassis).
//
// Speicherform (wie im Kundendashboard): Die Felder eines Bereichs sind die Hauptsprache,
// Übersetzungen liegen unter `i18n.<sprache>` und folgen bei Listen der Reihenfolge der Hauptsprache.
//
// Regeln:
// - Ausgangstext ist der deutsche Text, sofern ihn ein Mensch eingetragen hat. Sonst gilt der Text
//   der Hauptsprache; dessen Sprache wird erkannt. Steht dort Deutsch (oder eine andere Projektsprache),
//   wandert der Text in diese Sprache und die Hauptsprache bekommt die englische Fassung.
// - Von Hand eingetragene oder korrigierte Übersetzungen werden nie überschrieben.
// - Eigene automatische Übersetzungen werden erneuert, wenn sich der Ausgangstext geändert hat.
//   Dafür merkt sich `i18n._auto` Prüfsummen der selbst geschriebenen Texte.
// - Übersetzt werden nur die hier genannten Textfelder. Namen, Adressen, Uhrzeiten, Links,
//   Telefonnummern, Codes und alle Schalter bleiben unberührt.

export const TEXT_FIELDS = {
  timeline: ['title', 'events[].title', 'events[].description'],
  directions: ['title', 'description', 'note', 'items[].title', 'items[].description', 'options[].title', 'options[].description'],
  rsvp: ['title', 'description', 'custom_question'],
  accommodations: ['title', 'description', 'hotels[].distance', 'hotels[].price_range'],
  dresscode: ['title', 'code', 'description', 'colors[].name', 'dos[]', 'donts[]'],
  witnesses: ['title', 'persons[].role'],
  faq: ['title', 'questions[].question', 'questions[].answer'],
  footer: ['tagline'],
};
export const SECTION_NAMES = {
  timeline: 'Ablauf', directions: 'Anfahrt', rsvp: 'RSVP', accommodations: 'Übernachtungen', dresscode: 'Dresscode',
  witnesses: 'Trauzeug:innen', faq: 'FAQ', footer: 'Fußzeile',
};
export const LANG_NAMES = { en: 'Englisch', de: 'Deutsch', tr: 'Türkisch', fr: 'Französisch' };
const LANG_PROMPT = { en: 'English', de: 'German', tr: 'Turkish', fr: 'French' };
export const SOURCE_LANGUAGE = 'de';

const LIST_NAMES = { events: 'Programmpunkt', items: 'Anreiseoption', options: 'Anreiseoption', hotels: 'Hotel', colors: 'Farbe', dos: 'Empfohlen', donts: 'Bitte nicht', persons: 'Person', questions: 'Frage' };
const KEY_NAMES = { title: 'Titel', description: 'Beschreibung', note: 'Hinweis', custom_question: 'Eigene Frage', distance: 'Entfernung', price_range: 'Preis', code: 'Dresscode', name: 'Name', role: 'Rolle', question: 'Frage', answer: 'Antwort', tagline: 'Tagline' };
const nameOf = (list, i, key) => `${LIST_NAMES[list] || list} ${i + 1}${key ? ` · ${KEY_NAMES[key] || key}` : ''}`;

const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = (v) => (typeof v === 'string' && v.trim() !== '' ? v : '');
const clone = (v) => JSON.parse(JSON.stringify(v));

/** Kurze, stabile Prüfsumme eines Textes. */
export function hash(s) {
  let h1 = 5381, h2 = 52711;
  const str = String(s);
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = ((h1 * 33) ^ c) >>> 0; h2 = ((h2 * 33) ^ c) >>> 0; }
  return (h1.toString(36) + h2.toString(36)).slice(0, 12);
}
const kOut = (lang, t) => hash(`o|${lang}|${t}`);          // diesen Text haben wir geschrieben
const kPair = (lang, s, t) => hash(`p|${lang}|${s}|${t}`); // … und zwar aus diesem Ausgangstext
const kSame = (lang, s) => hash(`s|${lang}|${s}`);         // Übersetzung wäre gleich dem Ausgangstext
const kMaster = (s) => hash(`m|${s}`);                     // Text steht in der Hauptsprache am richtigen Platz

function getIn(root, path) {
  let n = root;
  for (const k of path) { if (n === null || n === undefined) return undefined; n = n[k]; }
  return n;
}

/** Alle übersetzbaren Textstellen eines Bereichs. */
export function collectEntries(component, content, languages) {
  const fields = TEXT_FIELDS[component];
  if (!fields || !isPlain(content)) return [];
  const i18n = isPlain(content.i18n) ? content.i18n : {};
  const paths = [];
  for (const f of fields) {
    const m = f.match(/^(\w+)\[\](?:\.(\w+))?$/);
    if (!m) { paths.push([[f], KEY_NAMES[f] || f]); continue; }
    const [, list, key] = m;
    const arr = content[list];
    if (!Array.isArray(arr)) continue;
    arr.forEach((item, i) => {
      if (key) {
        if (!isPlain(item)) return;
        // Vorgegebene Verkehrsmittel benennt das Theme selbst in jeder Sprache
        if ((list === 'items' || list === 'options') && key === 'title' && item.type && item.type !== 'custom') return;
        paths.push([[list, i, key], nameOf(list, i, key)]);
      } else if (typeof item === 'string') paths.push([[list, i], nameOf(list, i)]);
      else if (isPlain(item)) { const k = 'text' in item ? 'text' : 'title'; paths.push([[list, i, k], nameOf(list, i)]); }
    });
  }
  const out = [];
  for (const [path, label] of paths) {
    const own = {};
    for (const l of languages) own[l] = text(getIn(i18n[l], path));
    const master = text(getIn(content, path));
    if (!master && !Object.values(own).some(Boolean)) continue;
    out.push({ component, path, label, master, own });
  }
  return out;
}

/**
 * Was ist für eine Textstelle zu tun? Zurück: { source, from, needs } oder null.
 * from = Sprache des Ausgangstextes, 'auto' = wird erkannt.
 */
export function planEntry(entry, { master, languages, auto }) {
  const has = (k) => auto.has(k);
  const src = SOURCE_LANGUAGE;
  const german = languages.includes(src) && src !== master ? entry.own[src] : '';
  // Deutscher Text zählt nur als Ausgangstext, wenn er nicht selbst eine automatische Übersetzung ist
  const germanIsHuman = german && !has(kOut(src, german));
  let source, from, targets;
  if (germanIsHuman) { source = german; from = src; targets = languages.filter((l) => l !== src); }
  else {
    source = entry.master;
    if (!source) return null;
    from = has(kMaster(source)) || has(kOut(master, source)) ? master : 'auto';
    targets = languages.filter((l) => l !== master);
  }
  const needs = targets.filter((l) => {
    const t = l === master ? entry.master : entry.own[l];
    if (!t) return !has(kSame(l, source));
    return has(kOut(l, t)) && !has(kPair(l, source, t)); // eigene Übersetzung, Ausgangstext hat sich geändert
  });
  if (!needs.length) return null;
  return { source, from, needs };
}

/** Bereich für Bereich: was ist offen? */
export function planProject(rows, { master, languages }) {
  const jobs = [];
  for (const row of rows) {
    if (!TEXT_FIELDS[row.component] || !isPlain(row.content)) continue;
    const auto = new Set(Array.isArray(row.content.i18n && row.content.i18n._auto) ? row.content.i18n._auto : []);
    for (const entry of collectEntries(row.component, row.content, languages)) {
      const plan = planEntry(entry, { master, languages, auto });
      if (plan) jobs.push({ id: `t${jobs.length + 1}`, rowId: row.id, entry, ...plan });
    }
  }
  return jobs;
}

// ---- Anfrage an das Sprachmodell ------------------------------------------------------

export function buildPrompt(items, languages) {
  const names = languages.map((l) => `"${l}" (${LANG_PROMPT[l] || l})`).join(', ');
  return `You translate short texts of a wedding website. Languages: ${names}.

For every item return the text in each language listed in "to".
- "from" is the language of the text. If it is "auto", detect it and return it as "from" (one of ${languages.map((l) => `"${l}"`).join(', ')}, or "other").
- Keep the meaning, the tone and the form of address. German "ihr/euch" addresses the guests as a group: use the plural in Turkish (siz) and French (vous), and plain "you" in English.
- Keep line breaks, numbers, times, dates, prices, currency signs, emojis, links and text in [square brackets] as they are.
- Do not translate proper names of people, hotels, places or venues.
- Do not add, omit or explain anything. Text that is not a real sentence or word (test input) stays unchanged.
- If a text is already in the requested language, return it unchanged.

Answer with JSON only, no markdown, in exactly this shape:
{"<id>": {"from": "<language>", "<language>": "<translation>", ...}, ...}

Items:
${JSON.stringify(items.map((j) => ({ id: j.id, from: j.from, to: j.to, text: j.text })), null, 1)}`;
}

export function parseAnswer(raw) {
  const clean = String(raw || '').replace(/```json|```/g, '').trim();
  const a = clean.indexOf('{'), b = clean.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { const o = JSON.parse(clean.slice(a, b + 1)); return isPlain(o) ? o : null; } catch { return null; }
}

/** Aufträge in Päckchen teilen, damit jede Antwort sicher in die Antwortlänge passt. */
export function chunkJobs(jobs, budget = 900) {
  const chunks = []; let cur = []; let size = 0;
  for (const j of jobs) {
    const cost = (j.source.length + 40) * (j.needs.length + (j.from === 'auto' ? 1 : 0));
    if (cur.length && size + cost > budget) { chunks.push(cur); cur = []; size = 0; }
    cur.push(j); size += cost;
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

const toItem = (j, languages, master) => ({
  id: j.id, from: j.from, text: j.source,
  // Bei unbekannter Sprache brauchen wir zusätzlich die Hauptsprache (falls der Text umziehen muss)
  to: j.from === 'auto' ? languages.slice() : [...new Set(j.needs)],
});

/**
 * Übersetzt alle Aufträge. `ask(prompt)` liefert { text, truncated }.
 * Zurück: { results: { id: {...} }, failed: [id, ...] }. Ein Päckchen, das nicht verwertbar
 * beantwortet wird, wird halbiert und erneut gefragt; einzelne Texte danach Sprache für Sprache.
 * Wirft `ask` einen Fehler mit `fatal: true` (Dienst lehnt die Anfrage grundsätzlich ab, z. B. kein Guthaben,
 * falscher Schlüssel), bricht der ganze Lauf sofort ab – weiteres Probieren würde nur dieselbe Ablehnung erzeugen.
 */
export async function translateJobs(jobs, { languages, master, ask, onProgress }) {
  const results = {}; const failed = [];
  let done = 0;
  const run = async (list) => {
    const items = list.map((j) => toItem(j, languages, master));
    let answer = null;
    try { const r = await ask(buildPrompt(items, languages)); answer = r && !r.truncated ? parseAnswer(r.text) : null; } catch (e) { if (e && e.fatal) throw e; answer = null; }
    const missing = list.filter((j) => !answer || !isPlain(answer[j.id]));
    for (const j of list) if (answer && isPlain(answer[j.id])) { results[j.id] = answer[j.id]; done++; if (onProgress) onProgress(done, jobs.length); }
    if (!missing.length) return;
    if (missing.length > 1) { const half = Math.ceil(missing.length / 2); await run(missing.slice(0, half)); await run(missing.slice(half)); return; }
    // Ein einzelner langer Text: jede Sprache für sich
    const j = missing[0]; const item = toItem(j, languages, master);
    if (item.to.length > 1) {
      const merged = {};
      for (const l of item.to) {
        try { const r = await ask(buildPrompt([{ ...item, to: [l] }], languages)); const a = r && !r.truncated ? parseAnswer(r.text) : null; if (a && isPlain(a[j.id])) Object.assign(merged, a[j.id]); } catch (e) { if (e && e.fatal) throw e; /* sonst bleibt der Text offen */ }
      }
      if (Object.keys(merged).length) { results[j.id] = merged; done++; if (onProgress) onProgress(done, jobs.length); return; }
    }
    failed.push(j.id); done++; if (onProgress) onProgress(done, jobs.length);
  };
  for (const chunk of chunkJobs(jobs)) await run(chunk);
  return { results, failed };
}

// ---- Ergebnis in Änderungen übersetzen ------------------------------------------------

const usable = (t, source) => typeof t === 'string' && t.trim() !== '' && t.length <= source.length * 4 + 200;

/**
 * Aus Auftrag und Antwort werden Schreibvorgänge: [{ lang, value, before, kind }].
 * kind: 'neu' | 'aktualisiert' | 'verschoben'. Dazu die Prüfsummen, die wir uns merken.
 */
export function resolveJob(job, result, { master, languages }) {
  const writes = []; const marks = [];
  if (!isPlain(result)) return { writes, marks };
  const S = job.source; const e = job.entry;
  let from = job.from;
  if (from === 'auto') from = languages.includes(result.from) ? result.from : master;
  const tr = (l) => (usable(result[l], S) ? result[l].trim() : '');

  if (job.from === 'auto' && from !== master) {
    // Der Text der Hauptsprache ist in Wahrheit Deutsch (oder Türkisch/Französisch): Er zieht in seine Sprache um
    const en = tr(master);
    if (!en || en === S) { marks.push(kMaster(S)); return { writes, marks }; } // z. B. Eigennamen: bleibt stehen
    if (!e.own[from]) writes.push({ lang: from, value: S, before: '', kind: 'verschoben' });
    writes.push({ lang: master, value: en, before: S, kind: 'verschoben' });
    marks.push(kOut(master, en), kPair(master, S, en));
    for (const l of job.needs) {
      if (l === from) continue;
      const t = tr(l); if (!t) continue;
      if (t === en) { marks.push(kSame(l, S)); continue; }
      writes.push({ lang: l, value: t, before: e.own[l], kind: e.own[l] ? 'aktualisiert' : 'neu' });
      marks.push(kOut(l, t), kPair(l, S, t));
    }
    return { writes, marks };
  }

  if (job.from === 'auto') marks.push(kMaster(S));
  for (const l of job.needs) {
    const t = tr(l); if (!t) continue;
    const before = l === master ? e.master : e.own[l];
    // Gleich dem Text der Hauptsprache: kein eigener Eintrag nötig (es gilt ohnehin die Hauptsprache)
    if (l !== master && t === e.master) { marks.push(kSame(l, S)); continue; }
    if (t === before) { marks.push(kPair(l, S, t)); continue; }
    writes.push({ lang: l, value: t, before, kind: before ? 'aktualisiert' : 'neu' });
    marks.push(kOut(l, t), kPair(l, S, t));
  }
  return { writes, marks };
}

function setTranslation(root, base, path, value) {
  let node = root; let ref = base;
  for (let i = 0; i < path.length; i++) {
    const k = path[i]; const last = i === path.length - 1;
    const refNext = ref === null || ref === undefined ? undefined : ref[k];
    if (last) { node[k] = value; return; }
    const wantArray = typeof path[i + 1] === 'number';
    if (wantArray) {
      const len = Array.isArray(refNext) ? refNext.length : path[i + 1] + 1;
      if (!Array.isArray(node[k])) node[k] = [];
      while (node[k].length < len) node[k].push(null);
    } else if (!isPlain(node[k])) node[k] = {};
    node = node[k]; ref = refNext;
  }
}

/**
 * Schreibt die gewählten Änderungen in den Inhalt eines Bereichs. Der übergebene Inhalt bleibt unverändert.
 * applied: [{ path, writes, marks }]
 */
export function applyToContent(content, applied, { master }) {
  const next = clone(content);
  const marks = new Set(Array.isArray(next.i18n && next.i18n._auto) ? next.i18n._auto : []);
  for (const a of applied) {
    for (const w of a.writes) {
      if (w.lang === master) { setTranslation(next, content, a.path, w.value); continue; }
      if (!isPlain(next.i18n)) next.i18n = {};
      if (!isPlain(next.i18n[w.lang])) next.i18n[w.lang] = {};
      setTranslation(next.i18n[w.lang], content, a.path, w.value);
    }
    for (const m of a.marks) marks.add(m);
  }
  if (marks.size) { if (!isPlain(next.i18n)) next.i18n = {}; next.i18n._auto = [...marks].slice(-3000); }
  return next;
}

/**
 * Fehlerantwort der Schnittstelle einordnen. Zurück: { message, fatal }.
 * Vorübergehende Störungen (Überlastung, Zeitüberschreitung) sind nicht fatal; alles andere beendet den Lauf.
 */
export function classifyApiError(status, data) {
  const raw = (data && data.error && (data.error.message || (typeof data.error === 'string' ? data.error : ''))) || (data && data.message) || '';
  const text = String(raw);
  const fatal = ![408, 429, 502, 503, 504, 529].includes(status);
  let hint = '';
  if (/usage limits?/i.test(text)) hint = 'Das selbst gesetzte Ausgabenlimit des Anthropic-Kontos ist erreicht. In der Anthropic Console unter „Limits" anheben oder bis zum genannten Datum warten.';
  else if (/credit balance/i.test(text)) hint = 'Das Guthaben des Anthropic-Kontos ist aufgebraucht. Bitte in der Anthropic Console unter „Plans & Billing" aufladen.';
  else if (status === 401 || /api[- ]?key|authentication/i.test(text)) hint = status === 401 && !/api[- ]?key|x-api-key|authentication/i.test(text) ? 'Die Anmeldung im SuperAdmin ist abgelaufen. Bitte neu anmelden.' : 'Der Anthropic-Schlüssel wird nicht angenommen. Bitte ANTHROPIC_API_KEY in Vercel prüfen.';
  else if (/ANTHROPIC_API_KEY not set/i.test(text)) hint = 'In Vercel ist für den SuperAdmin kein ANTHROPIC_API_KEY hinterlegt.';
  else if (/model/i.test(text) && (status === 400 || status === 404)) hint = 'Keines der eingestellten Modelle ist verfügbar. Bitte ANTHROPIC_MODEL in Vercel auf ein aktuelles Modell setzen.';
  else if (status === 429) hint = 'Zu viele Anfragen in kurzer Zeit.';
  const message = [hint, text ? `Meldung des Dienstes (${status}): ${text.slice(0, 300)}` : `Fehler ${status}`].filter(Boolean).join(' ');
  return { message, fatal };
}
