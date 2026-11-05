// src/lib/pinAutopilot.js
// Planungslogik des Pin-Autopiloten (reine Funktionen, getestet).
// Ausgeführt im täglichen Cron (api/pinterest.js) und per „Jetzt auffüllen".
//
// Ablauf je Lauf:
//  1. Welche Tage der nächsten N Tage haben noch freie Plätze (Entwürfe +
//     geplante Queue-Einträge zählen)?            → planSlots
//  2. Welche Ziele sind dran? Themenmix 60/30/10, ohne Ziele der letzten
//     21 Tage (pinMix.pickMix).
//  3. Theme und Layout: rotieren — bis genug Daten da sind, dann gewichtet
//     nach Leistung (Saves + Klicks je Impression).  → learnWeights / choose*
//  4. Entwürfe anlegen. Freigabe bleibt beim Menschen („Alle in Queue").

export const PIN_THEMES = ['classic', 'editorial', 'botanical', 'contemporary', 'luxe', 'modern', 'neon', 'video'];
export const PHOTO_LAYOUTS = ['fullbleed', 'split'];
export const SETTINGS_KEY = 'pinterest_autopilot';

export const DEFAULT_CONFIG = {
  enabled: false,
  board_id: null,
  board_name: null,
  per_day: 2, // gilt auch für das Veröffentlichen im Cron
  lead_days: 7, // so viele Tage im Voraus werden Entwürfe angelegt
};

// Ab so vielen Impressionen (über alle veröffentlichten Pins) wird nach
// Leistung gewichtet. Darunter wäre es Zufall — dann wird nur rotiert.
export const LEARN_MIN_IMPRESSIONS = 1000;

export function normalizeConfig(raw) {
  const c = { ...DEFAULT_CONFIG, ...(raw || {}) };
  c.enabled = !!c.enabled;
  c.per_day = Math.min(3, Math.max(1, parseInt(c.per_day, 10) || DEFAULT_CONFIG.per_day));
  c.lead_days = Math.min(14, Math.max(3, parseInt(c.lead_days, 10) || DEFAULT_CONFIG.lead_days));
  return c;
}

export const addDays = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

export const berlinToday = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(now);

/**
 * Freie Plätze: für jeden Tag ab morgen bis lead_days so viele, wie per_day
 * minus bereits belegter (Entwurf oder geplant). Heute bleibt außen vor —
 * der Cron hat für heute schon veröffentlicht.
 * @returns string[] — ein Datum je freiem Platz, aufsteigend
 */
export function planSlots(rows, { today, leadDays, perDay }) {
  const used = {};
  (rows || []).forEach((r) => {
    if (r.status !== 'draft' && r.status !== 'queued') return;
    if (!r.scheduled_date) return;
    const d = String(r.scheduled_date).slice(0, 10);
    used[d] = (used[d] || 0) + 1;
  });
  const slots = [];
  for (let i = 1; i <= leadDays; i++) {
    const d = addDays(today, i);
    const free = Math.max(0, perDay - (used[d] || 0));
    for (let k = 0; k < free; k++) slots.push(d);
  }
  return slots;
}

/**
 * Leistung je Ausprägung (z. B. theme oder layout) aus Pin-Statistiken.
 * Score = (Saves + 2×Ausgehende Klicks + 1) / (Impressionen + 200) —
 * geglättet, damit 1 Klick bei 3 Impressionen nicht alles dominiert.
 * @param pins [{ theme, layout, total: { impressions, saves, outbound_clicks } }]
 */
export function learnWeights(pins, key) {
  const agg = {};
  let total = 0;
  (pins || []).forEach((p) => {
    const k = p[key];
    if (!k) return;
    const t = p.total || {};
    const a = (agg[k] = agg[k] || { impressions: 0, saves: 0, clicks: 0, pins: 0 });
    a.impressions += t.impressions || 0;
    a.saves += t.saves || 0;
    a.clicks += t.outbound_clicks || 0;
    a.pins += 1;
    total += t.impressions || 0;
  });
  const scores = {};
  Object.entries(agg).forEach(([k, a]) => {
    scores[k] = (a.saves + 2 * a.clicks + 1) / (a.impressions + 200);
  });
  return { ready: total >= LEARN_MIN_IMPRESSIONS, totalImpressions: total, scores, agg };
}

/**
 * Wählt eine Ausprägung: ohne Lernstand die am längsten nicht benutzte
 * (Rotation), mit Lernstand gewichtet nach Score — die zuletzt zweimal
 * benutzte ist dabei ausgeschlossen, damit der Feed abwechslungsreich bleibt.
 * @param options   mögliche Werte
 * @param recent    zuletzt benutzte Werte, neueste zuerst
 */
export function chooseVariant(options, recent, weights, random = Math.random) {
  if (!options.length) return null;
  const last2 = new Set((recent || []).slice(0, 2));
  if (!weights || !weights.ready) {
    // Rotation: Wert, der am längsten nicht vorkam (nie benutzt zuerst)
    const pos = (o) => {
      const i = (recent || []).indexOf(o);
      return i === -1 ? Infinity : i;
    };
    return [...options].sort((a, b) => pos(b) - pos(a))[0];
  }
  const pool = options.filter((o) => !last2.has(o));
  const cand = pool.length ? pool : options;
  // Unbekannte Ausprägungen bekommen den Durchschnitt (Chance zum Testen)
  const known = Object.values(weights.scores);
  const avg = known.length ? known.reduce((s, v) => s + v, 0) / known.length : 1;
  const w = cand.map((o) => weights.scores[o] ?? avg);
  const sum = w.reduce((s, v) => s + v, 0);
  let r = random() * sum;
  for (let i = 0; i < cand.length; i++) {
    r -= w[i];
    if (r <= 0) return cand[i];
  }
  return cand[cand.length - 1];
}

// Layout: mit Foto Vollbild/Split (rotierend bzw. gelernt), ohne Foto Statement
export function chooseLayout(hasImage, recentLayouts, weights, random) {
  if (!hasImage) return 'statement';
  return chooseVariant(PHOTO_LAYOUTS, recentLayouts, weights, random);
}
