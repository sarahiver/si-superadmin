// Tests für die Funnel-/Report-Logik (Audit Nov 2026)
import { buildFunnel, rate, delta, show, NA } from '../funnelReport';
import { contentTypeForPath } from '../funnelReport';

test('Quote: kein Nenner 0, kein Einheitenmix, nichts über 100 %', () => {
  expect(rate(5, 0)).toBeNull();
  expect(rate(5, null)).toBeNull();
  expect(rate(12, 10)).toBeNull();
  expect(rate(3, 10, { sameUnit: false })).toBeNull();
  expect(rate(3, 12)).toBe(25);
});

test('Delta: keine Vorperiode → null statt geschätzter Wert', () => {
  expect(delta(10, 0)).toBeNull();
  expect(delta(10, null)).toBeNull();
  expect(delta(18, 31)).toBe(-41.9);
});

test('Funnel nutzt Nutzer, nicht Event-Anzahl (vorher 10 Events / 18 Nutzer = 56 %)', () => {
  const f = buildFunnel({
    overview: { activeUsers: 18 },
    eventCounts: { demo_click: 10, form_start: 0 },
    eventUsers: { demo_click: 4, form_start: 0 },
    demoVisitsFromSite: 3,
    demoEvents: [{ event: 'demo_overlay_cta', count: 1, users: 1 }],
    inquiries: { current: 0, previous: 1 },
  });
  const byKey = Object.fromEntries(f.rows.map((r) => [r.key, r]));
  expect(byKey.demo_click.value).toBe(4);
  expect(byKey.demo_click.rate).toBe(22.2);
  expect(byKey.demo_click.extra).toMatch('10 Klick-Events');
  expect(byKey.demo_visit.rate).toBe(75);
  expect(byKey.lead.rate).toBeNull(); // Nenner 0
  expect(byKey.demo_cta.rate).toBeNull(); // andere Population
  expect(f.smallSample).toBe(true);
});

test('Fehlende Daten → "nicht verfügbar", nicht 0', () => {
  const f = buildFunnel({ overview: { activeUsers: 50 }, eventCounts: null, eventUsers: null, demoEvents: null, inquiries: null });
  const byKey = Object.fromEntries(f.rows.map((r) => [r.key, r]));
  expect(byKey.form_start.value).toBeNull();
  expect(show(byKey.form_start.value)).toBe(NA);
  expect(show(byKey.inquiries.value)).toBe(NA);
  expect(f.smallSample).toBe(false);
});

test('Hinweis, wenn die Datenbank mehr Anfragen kennt als GA4', () => {
  const f = buildFunnel({ overview: { activeUsers: 40 }, eventUsers: { generate_lead: 0 }, eventCounts: {}, demoEvents: [], inquiries: { current: 2 } });
  expect(f.notes.join(' ')).toMatch('Mehr Anfragen in der Datenbank');
});

test('Inhaltstypen aus der bestehenden pinMix-Einteilung', () => {
  expect(contentTypeForPath('https://sarahiver.com/')).toBe('Kaufabsicht');
  expect(contentTypeForPath('https://www.sarahiver.com/blog/hochzeitswebsite-vergleich-2026')).toBe('Kaufabsicht');
  expect(contentTypeForPath('/blog/uebereinstimmungsspiel-hochzeit-fragen')).toBe('Informationsorientiert');
  expect(contentTypeForPath('/blog/digitales-rsvp-hochzeit')).toBe('Produktnah / Planung');
  expect(contentTypeForPath('/impressum')).toBe('Sonstiges');
});
