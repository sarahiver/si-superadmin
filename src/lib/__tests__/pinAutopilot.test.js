// Tests für die Planungslogik des Pin-Autopiloten
import { planSlots, learnWeights, chooseVariant, chooseLayout, normalizeConfig, PIN_THEMES, addDays } from '../pinAutopilot';
import { buildPinPrompt, parsePinCopy, fallbackPinCopy } from '../pinPrompt';

test('Konfiguration wird begrenzt', () => {
  expect(normalizeConfig({ per_day: 9, lead_days: 1 })).toMatchObject({ per_day: 3, lead_days: 3, enabled: false });
  expect(normalizeConfig(null).per_day).toBe(2);
});

test('freie Plätze: ab morgen, belegte Tage abgezogen, veröffentlichte zählen nicht', () => {
  const rows = [
    { status: 'queued', scheduled_date: '2026-11-06' },
    { status: 'draft', scheduled_date: '2026-11-06' },
    { status: 'draft', scheduled_date: '2026-11-07' },
    { status: 'published', scheduled_date: '2026-11-08' },
    { status: 'queued', scheduled_date: '2026-11-05' }, // heute: zählt nicht
  ];
  const slots = planSlots(rows, { today: '2026-11-05', leadDays: 3, perDay: 2 });
  expect(slots).toEqual(['2026-11-07', '2026-11-08', '2026-11-08']);
});

test('Vorlauf voll → keine Plätze', () => {
  const rows = ['2026-11-06', '2026-11-06', '2026-11-07', '2026-11-07'].map(d => ({ status: 'queued', scheduled_date: d }));
  expect(planSlots(rows, { today: '2026-11-05', leadDays: 2, perDay: 2 })).toEqual([]);
});

test('ohne genug Daten wird rotiert: der am längsten nicht benutzte Wert', () => {
  const w = learnWeights([{ theme: 'classic', total: { impressions: 128, saves: 0, outbound_clicks: 3 } }], 'theme');
  expect(w.ready).toBe(false);
  expect(chooseVariant(['classic', 'editorial', 'luxe'], ['classic', 'editorial'], w)).toBe('luxe');
  expect(chooseVariant(['classic', 'editorial', 'luxe'], ['luxe', 'classic', 'editorial'], w)).toBe('editorial');
});

test('mit genug Daten: gewichtet, zuletzt zweimal benutzte ausgeschlossen', () => {
  const pins = [
    { theme: 'editorial', total: { impressions: 900, saves: 30, outbound_clicks: 20 } },
    { theme: 'classic', total: { impressions: 900, saves: 0, outbound_clicks: 0 } },
  ];
  const w = learnWeights(pins, 'theme');
  expect(w.ready).toBe(true);
  expect(w.scores.editorial).toBeGreaterThan(w.scores.classic);
  // random 0 → erster Kandidat mit Gewicht > 0; editorial ist zuletzt benutzt → ausgeschlossen
  const pick = chooseVariant(['classic', 'editorial', 'luxe'], ['editorial', 'neon'], w, () => 0);
  expect(pick).not.toBe('editorial');
  // häufige Ziehung: editorial (bestes Theme) gewinnt meistens, wenn erlaubt
  let ed = 0;
  for (let i = 0; i < 200; i++) if (chooseVariant(['classic', 'editorial'], [], w, Math.random) === 'editorial') ed++;
  expect(ed).toBeGreaterThan(120);
});

test('Layout: ohne Foto immer Statement, mit Foto Vollbild/Split im Wechsel', () => {
  const w = { ready: false };
  expect(chooseLayout(false, [], w)).toBe('statement');
  expect(chooseLayout(true, ['fullbleed'], w)).toBe('split');
  expect(chooseLayout(true, ['split', 'fullbleed'], w)).toBe('fullbleed');
});

test('Themes stimmen mit den Pin-Themes überein', () => {
  expect(PIN_THEMES).toEqual(expect.arrayContaining(['classic', 'editorial', 'luxe']));
  expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
});

test('Prompt fordert neuen Blickwinkel, wenn es schon Pins gab', () => {
  const p = buildPinPrompt({ title: 'T', description: 'D', url: 'U' }, { previousHeadlines: ['Alte Headline'] });
  expect(p).toMatch('Alte Headline');
  expect(p).toMatch('ANDEREN Blickwinkel');
  expect(buildPinPrompt({ title: 'T', description: 'D', url: 'U' })).not.toMatch('Blickwinkel');
});

test('KI-Antwort wird geprüft: accentWord muss in der Headline stehen', () => {
  const copy = parsePinCopy({ content: [{ type: 'text', text: '```json\n{"headline":"Digitales RSVP für eure Hochzeit","accentWord":"Gäste","pinTitle":"x"}\n```' }] });
  expect(copy.accentWord).toBe('');
  expect(() => parsePinCopy({ content: [{ type: 'text', text: 'kein json' }] })).toThrow();
  expect(fallbackPinCopy({ title: 'A: B', description: 'C. D' }).headline).toBe('A');
});
