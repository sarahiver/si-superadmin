import { collectEntries, planProject, translateJobs, resolveJob, applyToContent, parseAnswer, chunkJobs, hash, classifyApiError } from '../autoTranslate';

const CTX = { master: 'en', languages: ['en', 'tr', 'de', 'fr'] };
// Falsches „Sprachmodell": erkennt Deutsch an einer Marke und hängt die Zielsprache an den Text
const fake = (opts = {}) => async (prompt) => {
  const items = JSON.parse(prompt.slice(prompt.indexOf('Items:') + 6));
  if (opts.fail && opts.fail(items)) return { text: 'Entschuldigung, das kann ich nicht.', truncated: false };
  const out = {};
  for (const it of items) {
    const from = it.from === 'auto' ? (/^DE:/.test(it.text) ? 'de' : 'en') : it.from;
    const core = it.text.replace(/^(DE|EN):/, '');
    const o = { from };
    for (const l of it.to) o[l] = opts.same && opts.same.test(core) ? it.text : (l === from ? it.text : `${l.toUpperCase()}:${core}`);
    out[it.id] = o;
  }
  return { text: '```json\n' + JSON.stringify(out) + '\n```', truncated: false };
};
async function run(rows, opts) {
  const jobs = planProject(rows, CTX);
  const { results, failed } = await translateJobs(jobs, { ...CTX, ask: fake(opts) });
  const next = rows.map((row) => {
    const applied = jobs.filter((j) => j.rowId === row.id && results[j.id]).map((j) => ({ path: j.entry.path, ...resolveJob(j, results[j.id], CTX) }));
    return applied.length ? { ...row, content: applyToContent(row.content, applied, CTX) } : row;
  });
  return { jobs, failed, rows: next };
}
const row = (component, content) => ({ id: `r-${component}`, component, content });

describe('Textstellen sammeln', () => {
  test('nur freigegebene Textfelder, keine Namen, Adressen, Links oder Codes', () => {
    const c = { title: '', description: 'Close by', hotels: [{ name: 'Maison Exemple', address: '2 Rue', distance: '5 min', price_range: '€€', booking_code: 'X1', booking_url: 'https://e.test' }] };
    expect(collectEntries('accommodations', c, CTX.languages).map((e) => e.path.join('.'))).toEqual(['description', 'hotels.0.distance', 'hotels.0.price_range']);
  });
  test('vorgegebene Verkehrsmittel behalten ihren Titel, eigene werden übersetzt', () => {
    const c = { items: [{ type: 'car', title: 'Auto', description: 'Parken am Haus' }, { type: 'custom', title: 'Shuttle', description: 'Ab Marseille' }] };
    expect(collectEntries('directions', c, CTX.languages).map((e) => e.path.join('.'))).toEqual(['items.1.title', 'items.0.description', 'items.1.description']);
  });
  test('Listen aus Texten und aus Objekten; unbekannte Bereiche bleiben außen vor', () => {
    expect(collectEntries('dresscode', { dos: ['Lang', { text: 'Dunkel' }], colors: [{ hex: '#fff', name: 'Weiß' }] }, CTX.languages).map((e) => e.path.join('.'))).toEqual(['colors.0.name', 'dos.0', 'dos.1.text']);
    expect(collectEntries('hero', { tagline: 'x' }, CTX.languages)).toEqual([]);
  });
});

describe('Deutsch als Ausgangssprache, Englisch bleibt Hauptsprache', () => {
  test('deutscher Text in der Hauptsprache zieht nach Deutsch um, Englisch rückt nach', async () => {
    const { rows } = await run([row('faq', { title: '', questions: [{ question: 'DE:Gibt es Parkplätze?', answer: 'DE:Ja, 40.' }] })]);
    const c = rows[0].content;
    expect(c.questions[0]).toEqual({ question: 'EN:Gibt es Parkplätze?', answer: 'EN:Ja, 40.' });
    expect(c.i18n.de.questions[0]).toEqual({ question: 'DE:Gibt es Parkplätze?', answer: 'DE:Ja, 40.' });
    expect(c.i18n.tr.questions[0].question).toBe('TR:Gibt es Parkplätze?');
    expect(c.i18n.fr.questions[0].answer).toBe('FR:Ja, 40.');
  });
  test('deutscher Text im Deutsch-Reiter: Englisch bleibt, Türkisch und Französisch kommen aus dem Deutschen', async () => {
    const { rows } = await run([row('rsvp', { description: 'Please reply', i18n: { de: { description: 'Bitte antwortet' } } })]);
    const c = rows[0].content;
    expect(c.description).toBe('Please reply');
    expect(c.i18n.de.description).toBe('Bitte antwortet');
    expect(c.i18n.tr.description).toBe('TR:Bitte antwortet');
    expect(c.i18n.fr.description).toBe('FR:Bitte antwortet');
  });
  test('englischer Text ohne deutsche Fassung: alle drei Sprachen werden ergänzt, Englisch bleibt', async () => {
    const { rows } = await run([row('rsvp', { description: 'EN:Please reply' })]);
    const c = rows[0].content;
    expect(c.description).toBe('EN:Please reply');
    expect(c.i18n.de.description).toBe('DE:Please reply');
    expect(c.i18n.tr.description).toBe('TR:Please reply');
  });
  test('Hauptsprache leer, nur Deutsch gefüllt: Englisch wird ergänzt', async () => {
    const { rows } = await run([row('rsvp', { description: '', i18n: { de: { description: 'Bitte antwortet' } } })]);
    expect(rows[0].content.description).toBe('EN:Bitte antwortet');
  });
});

describe('Nichts von Hand Eingetragenes überschreiben', () => {
  test('vorhandene Übersetzungen bleiben, Listen behalten ihre Plätze', async () => {
    const c0 = { hotels: [{ name: 'A', distance: 'DE:5 Minuten' }, { name: 'B', distance: 'DE:10 Minuten' }], i18n: { tr: { hotels: [null, { distance: 'elle yazıldı' }] } } };
    const { rows } = await run([row('accommodations', c0)]);
    const c = rows[0].content;
    expect(c.i18n.tr.hotels).toEqual([{ distance: 'TR:5 Minuten' }, { distance: 'elle yazıldı' }]);
    expect(c.hotels.map((h) => h.name)).toEqual(['A', 'B']);
    expect(c.i18n.de.hotels[1].distance).toBe('DE:10 Minuten');
  });
  test('zweiter Lauf ohne Änderungen: nichts zu tun', async () => {
    const first = await run([row('faq', { questions: [{ question: 'DE:Wann?', answer: 'DE:Um drei.' }] }), row('rsvp', { description: 'EN:Hello' })]);
    expect(planProject(first.rows, CTX)).toEqual([]);
  });
  test('deutscher Text geändert: eigene Übersetzungen werden erneuert, korrigierte bleiben', async () => {
    const first = await run([row('rsvp', { description: 'DE:Bitte antwortet' })]);
    const c = JSON.parse(JSON.stringify(first.rows[0].content));
    c.i18n.fr.description = 'Merci de répondre (corrigé)'; // von Hand korrigiert
    c.i18n.de.description = 'DE:Bitte antwortet bis März';   // deutscher Text geändert
    const second = await run([row('rsvp', c)]);
    const n = second.rows[0].content;
    expect(n.description).toBe('EN:Bitte antwortet bis März');
    expect(n.i18n.tr.description).toBe('TR:Bitte antwortet bis März');
    expect(n.i18n.fr.description).toBe('Merci de répondre (corrigé)');
    expect(planProject(second.rows, CTX)).toEqual([]);
  });
  test('von Hand geändertes Englisch bleibt, auch wenn sich das Deutsche ändert', async () => {
    const first = await run([row('rsvp', { description: 'DE:Bitte antwortet' })]);
    const c = JSON.parse(JSON.stringify(first.rows[0].content));
    c.description = 'Kindly reply'; c.i18n.de.description = 'DE:Neu';
    const n = (await run([row('rsvp', c)])).rows[0].content;
    expect(n.description).toBe('Kindly reply');
    expect(n.i18n.tr.description).toBe('TR:Neu');
  });
  test('automatisch erzeugtes Deutsch gilt nicht als Ausgangstext', async () => {
    const first = await run([row('rsvp', { description: 'EN:Please reply' })]);
    const c = JSON.parse(JSON.stringify(first.rows[0].content));
    c.description = 'EN:Please reply by March';
    const n = (await run([row('rsvp', c)])).rows[0].content;
    expect(n.description).toBe('EN:Please reply by March');
    expect(n.i18n.de.description).toBe('DE:Please reply by March');
    expect(n.i18n.fr.description).toBe('FR:Please reply by March');
  });
  test('Text, der in allen Sprachen gleich bleibt, erzeugt keine Einträge und keine Dauerschleife', async () => {
    const first = await run([row('dresscode', { code: 'Black Tie' })], { same: /Black Tie/ });
    expect(first.rows[0].content.code).toBe('Black Tie');
    expect(Object.keys(first.rows[0].content.i18n)).toEqual(['_auto']);
    expect(planProject(first.rows, CTX)).toEqual([]);
  });
  test('der übergebene Inhalt wird nicht verändert; andere Felder bleiben erhalten', async () => {
    const c0 = { title: '', ask_dietary: true, deadline: '2027-03-01', description: 'DE:Hallo' }; const copy = JSON.stringify(c0);
    const { rows } = await run([row('rsvp', c0)]);
    expect(JSON.stringify(c0)).toBe(copy);
    expect(rows[0].content.ask_dietary).toBe(true); expect(rows[0].content.deadline).toBe('2027-03-01');
  });
});

describe('Antworten des Sprachmodells', () => {
  test('unbrauchbare Antwort: Päckchen wird geteilt, der Rest gelingt, Fehlschläge werden gemeldet', async () => {
    const rows = [row('faq', { questions: [{ question: 'DE:Eins', answer: 'DE:KAPUTT' }, { question: 'DE:Zwei', answer: 'DE:Drei' }] })];
    const { failed, rows: next, jobs } = await run(rows, { fail: (items) => items.some((i) => /KAPUTT/.test(i.text)) });
    expect(failed).toHaveLength(1);
    expect(jobs.find((j) => j.id === failed[0]).source).toBe('DE:KAPUTT');
    expect(next[0].content.questions[0]).toEqual({ question: 'EN:Eins', answer: 'DE:KAPUTT' });
    expect(next[0].content.questions[1].answer).toBe('EN:Drei');
  });
  test('leere oder aufgeblähte Übersetzungen werden verworfen', () => {
    const job = { source: 'Hallo', from: 'de', needs: ['tr', 'fr'], entry: { master: 'Hello', own: { tr: '', fr: '', de: 'Hallo' }, path: ['description'] } };
    const { writes } = resolveJob(job, { tr: '   ', fr: 'x'.repeat(500) }, CTX);
    expect(writes).toEqual([]);
  });
  test('JSON wird auch aus Text mit Drumherum gelesen; Unsinn ergibt null', () => {
    expect(parseAnswer('Hier:\n```json\n{"t1":{"en":"a"}}\n```')).toEqual({ t1: { en: 'a' } });
    expect(parseAnswer('nichts')).toBeNull(); expect(parseAnswer('{kaputt}')).toBeNull();
  });
  test('Päckchen bleiben klein', () => {
    const jobs = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, source: 'x'.repeat(200), needs: ['en', 'tr', 'fr'], from: 'de' }));
    const chunks = chunkJobs(jobs);
    expect(chunks.length).toBeGreaterThan(3); expect(chunks.flat()).toHaveLength(10);
  });
  test('Prüfsumme ist stabil und unterscheidet Texte', () => { expect(hash('a')).toBe(hash('a')); expect(hash('a')).not.toBe(hash('b')); });
});

describe('Fehler des Dienstes', () => {
  const rows = [{ id: 'r', component: 'faq', content: { questions: Array.from({ length: 12 }, (_, i) => ({ question: `DE:Frage ${i} ${'x'.repeat(120)}`, answer: `DE:Antwort ${i} ${'y'.repeat(120)}` })) } }];
  test('grundsätzliche Ablehnung bricht den Lauf nach der ersten Anfrage ab', async () => {
    let calls = 0; const jobs = planProject(rows, CTX);
    const ask = async () => { calls++; const e = new Error('kein Guthaben'); e.fatal = true; throw e; };
    await expect(translateJobs(jobs, { ...CTX, ask })).rejects.toThrow('kein Guthaben');
    expect(calls).toBe(1);
  });
  test('vorübergehende Störung: Lauf geht weiter, betroffene Texte werden gemeldet', async () => {
    const jobs = planProject(rows, CTX); let calls = 0;
    const ask = async () => { calls++; throw new Error('überlastet'); };
    const { failed, results } = await translateJobs(jobs, { ...CTX, ask });
    expect(failed).toHaveLength(jobs.length); expect(Object.keys(results)).toHaveLength(0); expect(calls).toBeGreaterThan(jobs.length);
  });
  test('Einordnung der Meldungen', () => {
    const credit = classifyApiError(400, { type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.' } });
    expect(credit.fatal).toBe(true); expect(credit.message).toMatch(/Guthaben/); expect(credit.message).toMatch(/credit balance is too low/);
    expect(classifyApiError(401, { error: { type: 'authentication_error', message: 'invalid x-api-key' } }).message).toMatch(/ANTHROPIC_API_KEY in Vercel prüfen/);
    expect(classifyApiError(401, { error: 'Token abgelaufen' }).message).toMatch(/neu anmelden/);
    expect(classifyApiError(500, { error: 'ANTHROPIC_API_KEY not set' })).toMatchObject({ fatal: true });
    expect(classifyApiError(404, { error: { message: 'model: claude-x not found' } }).message).toMatch(/ANTHROPIC_MODEL/);
    expect(classifyApiError(529, { error: { message: 'Overloaded' } }).fatal).toBe(false);
    expect(classifyApiError(429, {}).fatal).toBe(false);
    expect(classifyApiError(400, {}).message).toBe('Fehler 400');
  });
});
