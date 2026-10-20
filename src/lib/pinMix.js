// src/lib/pinMix.js
// Themenmix und Wiederholungssperre für den Pinterest-Batch-Generator.
//
// Hintergrund (Okt 2026): Auf Pinterest sucht kaum jemand direkt nach
// "Hochzeitswebsite". Reine Website-Pins treffen die Richtigen, werden aber
// kaum ausgespielt; reine Reichweiten-Themen (Sprüche, Deko) bringen Klicks
// ohne Kaufinteresse. Der Mix setzt deshalb auf Brückenthemen — gesucht UND
// nah am Produkt (RSVP, QR-Fotos, Save the Date, Gästeinfos, Planung).
//
// Außerdem bekam derselbe Artikel innerhalb weniger Tage mehrere Pins
// ("7 Gründe" 3× in 11 Tagen). Pinterest wertet das als dünnen Inhalt; die
// Pins nehmen sich gegenseitig die Reichweite. Daher die Sperre pro Ziel-URL.

export const LOCK_DAYS = 21;

export const CATEGORIES = {
  bridge: { label: 'Brückenthemen', hint: 'gesucht & nah am Produkt', weight: 0.6, color: '#2E7D32' },
  website: { label: 'Hochzeitswebsite direkt', hint: 'Kaufabsicht', weight: 0.3, color: '#C41E3A' },
  reach: { label: 'Reichweite', hint: 'Spiele & Quiz, sparsam', weight: 0.1, color: '#B45309' },
  avoid: { label: 'Nicht empfohlen', hint: 'Traffic ohne Kaufinteresse', weight: 0, color: '#999999' },
};
export const CATEGORY_ORDER = ['bridge', 'website', 'reach', 'avoid'];

// Reihenfolge der Prüfung ist wichtig: Viele Artikel heißen
// "hochzeitswebsite-<funktion>" — die Funktion (RSVP, Hotels …) ist dann ein
// Brückenthema, nur explizite Kauf-/Vergleichsthemen zählen als "website".
const RULES = [
  ['avoid', /spr(ue|ü)che|deko|gl(ue|ü)ckw(ue|ü)nsch|f(ue|ü)rbitten|hochzeitsrede|reden-/],
  // website vor reach: "design-beispiele" enthält sonst "spiel"
  ['website', /^start$|^demo-|vergleich|kosten-was-kostet|erstellen-lassen|design-beispiele|^warum-hochzeitswebsite|kostenlose|haken|app-vs|ki-baukasten|premium-funktionen|^wann-hochzeitswebsite|faq|admin-dashboard|customer-journey|inhalt-checkliste|eigene-domain/],
  ['reach', /quiz|spiel|uebereinstimmung|übereinstimmung|trends|farben|countdown/],
  ['bridge', /rsvp|gaeste|gäste|gast|qr|foto|save-the-date|einladung|hotel|uebernachtung|anfahrt|location|checkliste|planen|datum|budget|gaestebuch|wunschliste|geschenk|musik|playlist|abc|micro|unter-der-woche|danksagung/],
];

export function classifyTarget(slug = '') {
  const s = String(slug).toLowerCase();
  for (const [cat, re] of RULES) if (re.test(s)) return cat;
  // Unbekannt: Der Blog ist durchweg Hochzeitsplanung → wie Brückenthema
  return 'bridge';
}

// Vergleichsform für Links: ohne utm-Parameter, ohne www., ohne Slash am Ende
export function normUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    [...u.searchParams.keys()].filter(k => k.startsWith('utm_')).forEach(k => u.searchParams.delete(k));
    const qs = u.searchParams.toString();
    return `${u.hostname.replace(/^www\./, '').toLowerCase()}${u.pathname.replace(/\/+$/, '')}${qs ? `?${qs}` : ''}`;
  } catch {
    return String(url).replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
  }
}

// Letztes Datum je Ziel-URL aus Queue (veröffentlicht/geplant) und Entwürfen
export function buildRecentMap(rows = []) {
  const map = {};
  rows.forEach(r => {
    const key = normUrl(r.link);
    if (!key) return;
    const d = r.published_at || r.scheduled_date || r.created_at;
    if (!d) return;
    const iso = String(d).slice(0, 10);
    if (!map[key] || iso > map[key]) map[key] = iso;
  });
  return map;
}

// Tage seit dem letzten Pin (negativ = in der Zukunft geplant)
export function daysSince(isoDate, today = new Date()) {
  if (!isoDate) return Infinity;
  const [y, m, d] = isoDate.split('-').map(Number);
  const then = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((now - then) / 86400000);
}

// Gesperrt, wenn innerhalb der letzten LOCK_DAYS gepinnt oder bereits geplant
export function isLocked(lastIso, today = new Date(), lockDays = LOCK_DAYS) {
  if (!lastIso) return false;
  return daysSince(lastIso, today) < lockDays;
}

/**
 * Wählt `count` Ziele nach Gewichtung. Gesperrte und "avoid" fallen raus;
 * innerhalb einer Kategorie zuerst nie Gepinntes, dann am längsten nicht
 * Gepinntes. Reicht eine Kategorie nicht, füllen die anderen auf.
 * @param targets [{ slug, url, category, last }]
 */
export function pickMix(targets, count, { today = new Date(), random = Math.random } = {}) {
  const n = Math.max(0, Math.min(20, count | 0));
  const pool = {};
  CATEGORY_ORDER.forEach(c => { pool[c] = []; });
  targets.forEach(t => {
    if (t.category === 'avoid' || isLocked(t.last, today)) return;
    pool[t.category].push({ ...t, _r: random() });
  });
  Object.values(pool).forEach(list => list.sort((a, b) => {
    const da = a.last ? daysSince(a.last, today) : 99999;
    const db = b.last ? daysSince(b.last, today) : 99999;
    return db - da || a._r - b._r;
  }));

  // Sollmengen nach Gewicht (Rest an die größte Kategorie)
  const want = {
    bridge: Math.round(n * CATEGORIES.bridge.weight),
    website: Math.round(n * CATEGORIES.website.weight),
    reach: Math.round(n * CATEGORIES.reach.weight),
  };
  let diff = n - (want.bridge + want.website + want.reach);
  want.bridge += diff;

  const picked = [];
  ['bridge', 'website', 'reach'].forEach(c => {
    picked.push(...pool[c].splice(0, Math.max(0, want[c])));
  });
  // Auffüllen, falls eine Kategorie zu wenig hatte
  for (const c of ['bridge', 'website', 'reach']) {
    while (picked.length < n && pool[c].length) picked.push(pool[c].shift());
  }
  return picked.map(({ _r, ...t }) => t);
}

// Kategorien abwechseln, damit nicht drei Website-Pins am Stück erscheinen
export function interleave(items) {
  const byCat = {};
  items.forEach(t => { (byCat[t.category] = byCat[t.category] || []).push(t); });
  const pattern = ['bridge', 'website', 'bridge', 'reach', 'bridge', 'website'];
  const out = [];
  let guard = 0;
  while (out.length < items.length && guard < 1000) {
    const c = pattern[guard % pattern.length];
    if (byCat[c] && byCat[c].length) out.push(byCat[c].shift());
    else {
      const rest = Object.keys(byCat).find(k => byCat[k].length);
      if (rest) out.push(byCat[rest].shift());
    }
    guard++;
  }
  return out;
}
