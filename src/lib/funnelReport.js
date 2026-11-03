// src/lib/funnelReport.js
// Gemeinsame Funnel-Berechnung für Dashboard (AnalyticsPage) und PDF-Report.
//
// Regeln (Audit Nov 2026):
//  - Jede Stufe nennt ihre Zähleinheit (Nutzer, Events, Anfragen).
//  - Eine Quote gibt es nur, wenn Stufe und Bezugsstufe dieselbe Einheit
//    haben und die Bezugsgröße > 0 ist. Vorher wurde z. B. die ANZAHL der
//    Demo-Klick-Events durch die NUTZER geteilt ("56 % v. Besucher").
//  - Fehlende Daten (Abfrage fehlgeschlagen) heißen "nicht verfügbar" statt 0.
//  - Kleine Stichproben werden gekennzeichnet.
//  - GA4-Ereignisse und tatsächliche Anfragen (Datenbank) bleiben getrennt.

import { classifyTarget } from './pinMix';

export const SMALL_SAMPLE = 30; // unter 30 Nutzern: Quoten nur als Tendenz

export const NA = 'nicht verfügbar';

const num = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));

// Quote mit Schutz gegen Nenner 0, Einheitenmix und Werte über 100 %
export function rate(value, base, { sameUnit = true } = {}) {
  const v = num(value);
  const b = num(base);
  if (!sameUnit) return null;
  if (v == null || b == null || b <= 0) return null;
  if (v > b) return null; // andere Population/Mehrfachzählung — keine Quote
  return Math.round((v / b) * 1000) / 10;
}

// Veränderung zur Vorperiode; null, wenn keine belastbare Vorperiode existiert
export function delta(cur, prev) {
  const c = num(cur);
  const p = num(prev);
  if (c == null || p == null || p === 0) return null;
  return Math.round(((c - p) / p) * 1000) / 10;
}

/**
 * Baut die Funnel-Zeilen aus der API-Antwort von /api/analytics.
 * @returns {{ rows: Array, smallSample: boolean, notes: string[] }}
 */
export function buildFunnel(data) {
  const d = data || {};
  const users = d.eventUsers || null; // { event_name: totalUsers } oder null
  const events = d.eventCounts || null; // { event_name: eventCount } oder null
  const u = (name) => (users ? users[name] ?? 0 : null);
  const e = (name) => (events ? events[name] ?? 0 : null);
  const demoEv = (name) => {
    if (!d.demoEvents) return { count: null, users: null };
    const row = d.demoEvents.find((x) => x.event === name);
    return { count: row ? row.count : 0, users: row ? row.users : 0 };
  };

  const visitors = num(d.overview?.activeUsers);
  const demoClickUsers = u('demo_click');
  const demoVisits = num(d.demoVisitsFromSite);
  const ctaUsers = demoEv('demo_overlay_cta').users;
  const formStartUsers = u('form_start');
  const leadUsers = u('generate_lead');
  const inquiries = d.inquiries ? num(d.inquiries.current) : null;

  const rows = [
    { key: 'visitors', label: 'Besucher Website', value: visitors, unit: 'Nutzer', rate: null, base: null },
    {
      key: 'demo_click', label: 'Nutzer mit Demo-Klick', value: demoClickUsers, unit: 'Nutzer',
      rate: rate(demoClickUsers, visitors), base: 'Besucher Website',
      extra: e('demo_click') != null ? `${e('demo_click')} Klick-Events` : null,
    },
    {
      key: 'demo_visit', label: 'Demo-Besuche von der Website', value: demoVisits, unit: 'Nutzer',
      rate: rate(demoVisits, demoClickUsers), base: 'Nutzer mit Demo-Klick',
      extra: 'nur Besucher mit Einwilligung auf siwedding.de',
    },
    {
      key: 'demo_cta', label: 'Demo-CTA geklickt (alle Demo-Besucher)', value: ctaUsers, unit: 'Nutzer',
      rate: null, base: null,
      extra: demoEv('demo_overlay_cta').count != null ? `${demoEv('demo_overlay_cta').count} Klick-Events, inkl. Direktbesucher` : null,
    },
    {
      key: 'form_start', label: 'Formular gestartet', value: formStartUsers, unit: 'Nutzer',
      rate: rate(formStartUsers, visitors), base: 'Besucher Website',
    },
    {
      key: 'lead', label: 'Anfrage gesendet (GA4)', value: leadUsers, unit: 'Nutzer',
      rate: rate(leadUsers, formStartUsers), base: 'Formular gestartet',
    },
    {
      key: 'inquiries', label: 'Anfragen laut Datenbank', value: inquiries, unit: 'Anfragen',
      rate: null, base: null,
      extra: 'unabhängig von GA4 und Einwilligung',
    },
  ];

  const notes = [];
  const smallSample = visitors != null && visitors < SMALL_SAMPLE;
  if (smallSample) notes.push(`Kleine Stichprobe (${visitors} Besucher): Quoten nur als Tendenz lesen.`);
  if (inquiries != null && leadUsers != null && inquiries > leadUsers) {
    notes.push('Mehr Anfragen in der Datenbank als in GA4 — Anfragen ohne Analyse-Einwilligung erscheinen nicht in GA4.');
  }
  notes.push('GA4 zählt nur Besucher mit Analyse-Einwilligung.');

  return { rows, smallSample, notes };
}

// Anzeige eines Werts: null → "nicht verfügbar"
export const show = (v) => (v == null ? NA : String(v));
export const de = (n) => (n == null ? NA : Number(n).toLocaleString('de-DE', { maximumFractionDigits: 1 }));
export const showRate = (row) => (row.rate == null ? '–' : `${de(row.rate)} % v. ${row.base}`);

// Inhaltstyp einer URL — nutzt die bestehende Einteilung aus pinMix
const CONTENT_TYPE = {
  website: 'Kaufabsicht',
  bridge: 'Produktnah / Planung',
  reach: 'Informationsorientiert',
  avoid: 'Informationsorientiert',
};
export function contentTypeForPath(path = '') {
  const p = String(path).replace(/^https?:\/\/[^/]+/, '').split(/[?#]/)[0];
  if (p === '' || p === '/') return 'Kaufabsicht'; // Startseite = Angebot
  if (/^\/(impressum|datenschutz|agb|kooperationen)/.test(p)) return 'Sonstiges';
  const slug = p.replace(/^\/blog\//, '').replace(/^\//, '').replace(/\/$/, '');
  if (!slug || slug === 'blog') return 'Sonstiges';
  return CONTENT_TYPE[classifyTarget(slug)] || 'Sonstiges';
}

