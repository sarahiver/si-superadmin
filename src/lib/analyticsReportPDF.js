// src/lib/analyticsReportPDF.js
// Marketing-Report als PDF — client-seitig aus den geladenen Dashboard-Daten
// (GA4 + GSC + Anfragen aus der Datenbank), gleiche jsPDF-Basis wie
// invoicePDF/contractPDF.
//
// Audit Nov 2026 — Regeln für den Report:
//  - Zeiträume als konkrete Daten anzeigen (GA4 und GSC haben verschiedene).
//  - Fehlende Daten = "nicht verfügbar", nicht 0.
//  - Quoten nur bei gleicher Zähleinheit und Nenner > 0 (funnelReport.js).
//  - Kleine Stichproben und unvollständige GSC-Tage kennzeichnen.
//  - GA4-Ereignisse und tatsächliche Anfragen getrennt ausweisen.
//  - Nur Zeichen aus WinAnsi (Helvetica): "→" erschien vorher als "!’".
import { jsPDF } from 'jspdf';
import { buildFunnel, delta, show, showRate, NA, contentTypeForPath, de } from './funnelReport';

const M = 18; // Seitenrand
const W = 210 - 2 * M;

const fmtDate = (iso) => (iso ? iso.split('-').reverse().join('.') : '?');
const fmtRange = (r) => (r ? (r.start === r.end ? fmtDate(r.start) : `${fmtDate(r.start)} - ${fmtDate(r.end)}`) : '?');

export function generateAnalyticsReport(data, periodLabel) {
  const doc = new jsPDF();
  let y = 22;

  const checkPage = (needed = 12) => {
    if (y + needed > 282) {
      doc.addPage();
      y = 22;
    }
  };

  const heading = (text) => {
    checkPage(18);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(text, M, y);
    y += 2.5;
    doc.setDrawColor(200);
    doc.line(M, y, M + W, y);
    y += 6;
  };

  const note = (text) => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    const lines = doc.splitTextToSize(text, W);
    checkPage(lines.length * 3.6 + 2);
    doc.text(lines, M, y);
    y += lines.length * 3.6 + 1.5;
    doc.setFont('helvetica', 'normal');
  };

  const kpiRow = (pairs) => {
    checkPage(18);
    const colW = W / pairs.length;
    pairs.forEach(([label, value, sub], i) => {
      const x = M + i * colW;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 20);
      doc.text(String(value), x, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120);
      doc.text(label.toUpperCase(), x, y + 4.5);
      if (sub) doc.text(sub, x, y + 8.5);
    });
    y += 15;
  };

  const table = (headers, rows, widths) => {
    checkPage(10 + Math.min(rows.length, 6) * 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    let x = M;
    headers.forEach((h, i) => {
      doc.text(h.toUpperCase(), x, y);
      x += widths[i];
    });
    y += 2;
    doc.setDrawColor(220);
    doc.line(M, y, M + W, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40);
    if (!rows.length) {
      doc.text(NA, M, y);
      y += 5.5;
    }
    rows.forEach((row) => {
      checkPage(6);
      x = M;
      row.forEach((cell, i) => {
        const maxChars = Math.floor(widths[i] / 1.75);
        let text = String(cell ?? '');
        if (text.length > maxChars) text = text.slice(0, maxChars - 1) + '…';
        doc.text(text, x, y);
        x += widths[i];
      });
      y += 5.5;
    });
    y += 2;
  };

  const r = data.ranges || null;

  // ── Kopf ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(10, 10, 10);
  doc.text('S&I. Marketing-Report', M, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Zeitraum: ${periodLabel}${r ? ` (${fmtRange(r.current)})` : ''}  ·  Erstellt: ${new Date().toLocaleDateString('de-DE')}  ·  sarahiver.com`,
    M, y
  );
  y += 4.5;
  if (r) {
    doc.setFontSize(7.5);
    doc.text(
      `Vergleich: ${fmtRange(r.previous)}  ·  Search Console: ${fmtRange(r.gsc)} (endet 3 Tage vor heute, Datenverzögerung)`,
      M, y
    );
    y += 4;
  }

  // ── Website (GA4) — mit Delta zur gleich langen Vorperiode ──
  const o = data.overview || {};
  const op = data.overviewPrev || {};
  const hasPrev = data.overviewPrev && Object.keys(data.overviewPrev).length > 0;
  const dl = (cur, prev) => {
    if (!hasPrev) return 'Vorperiode: nicht verfügbar';
    const d = delta(cur, prev);
    return d == null ? `Vorperiode: ${prev ?? 0}` : `${d >= 0 ? '+' : ''}${de(d)} % vs. Vorperiode (${prev})`;
  };
  heading('Website (sarahiver.com) — GA4');
  kpiRow([
    ['Besucher', show(o.activeUsers), dl(o.activeUsers, op.activeUsers)],
    ['Sitzungen', show(o.sessions), dl(o.sessions, op.sessions)],
    ['Seitenaufrufe', show(o.screenPageViews), dl(o.screenPageViews, op.screenPageViews)],
    ['Bounce Rate', o.bounceRate != null ? `${Math.round(o.bounceRate * 100)} %` : NA, ''],
  ]);
  note('GA4 enthält nur Besucher mit Analyse-Einwilligung. Bounce Rate = Anteil nicht engagierter Sitzungen (unter 10 s, 1 Seitenaufruf, kein Schlüsselereignis).');

  // ── Funnel ──
  const funnel = buildFunnel(data);
  heading('Conversion-Funnel');
  table(
    ['Schritt', 'Wert', 'Einheit', 'Quote'],
    funnel.rows.map((row) => [row.label, show(row.value), row.unit, showRate(row)]),
    [70, 16, 22, 66]
  );
  const extras = funnel.rows.filter((row) => row.extra).map((row) => `${row.label}: ${row.extra}`);
  if (extras.length) note(extras.join('  ·  '));
  funnel.notes.forEach(note);
  if (data.inquiriesError) note(`Anfragen laut Datenbank: ${NA} (${data.inquiriesError}).`);
  if (data.inquiries && data.inquiries.previous != null) {
    note(`Anfragen laut Datenbank in der Vorperiode: ${data.inquiries.previous}.`);
  }

  // ── Demos je Design ──
  const designOf = (p) => (p || '').replace(/^\//, '').replace(/^demo-/, '').split(/[/?#]/)[0] || '(unbekannt)';
  const designMap = new Map();
  (data.demoVisitsByDesign || []).forEach((row) => {
    const k = designOf(row.page);
    const cur = designMap.get(k) || { visits: 0, cta: 0 };
    cur.visits += row.users || 0;
    designMap.set(k, cur);
  });
  (data.demoCtaByDesign || []).forEach((row) => {
    const k = designOf(row.page);
    const cur = designMap.get(k) || { visits: 0, cta: 0 };
    cur.cta += row.count || 0;
    designMap.set(k, cur);
  });
  if (data.demoVisitsByDesign || data.demoCtaByDesign) {
    heading('Demos je Design');
    table(
      ['Design', 'Besuche v. Website (Nutzer)', 'CTA-Klicks (Events, alle)'],
      [...designMap.entries()].sort((a, b) => b[1].visits - a[1].visits).map(([k, v]) => [k, v.visits, v.cta]),
      [60, 57, 57]
    );
  }

  // ── Demo-Klicks nach Einstieg (CTA-Position auf sarahiver.com) ──
  if (data.demoSources) {
    heading('Demo-Klicks nach Einstieg (Events)');
    table(
      ['Einstieg', 'Klicks'],
      data.demoSources.filter(d => d.source && d.source !== '(not set)').map(d => [d.source, d.clicks]),
      [120, 54]
    );
  }

  // ── Traffic-Quellen & Landingpages ──
  if (data.referrers) {
    heading('Traffic-Quellen (Sitzungen)');
    table(
      ['Quelle / Medium', 'Sitzungen'],
      data.referrers.slice(0, 10).map(x => [`${x.source} / ${x.medium}`, x.sessions]),
      [120, 54]
    );
    note('google / cpc = Google-Ads-Klicks MIT Analyse-Einwilligung. Ads meldet alle Klicks — die Zahlen sind deshalb nicht 1:1 vergleichbar.');
  }
  if (data.landingPages) {
    heading('Landingpages (Sitzungen)');
    table(
      ['Landingpage', 'Sitzungen'],
      data.landingPages.slice(0, 10).map(x => [x.page, x.sessions]),
      [120, 54]
    );
  }

  // ── GSC ──
  heading('Google Suche (Search Console)');
  if (data.gsc) {
    const g = data.gsc;
    note(`Zeitraum ${fmtRange(g.range)} — die letzten 3 Tage fehlen bewusst (Google liefert sie unvollständig). Property: ${g.siteUrl}.`);
    const gp = g.totalsPrev;
    const gd = (c, p) => {
      if (!gp) return 'Vorperiode: nicht verfügbar';
      const d = delta(c, p);
      return d == null ? `Vorperiode: ${p}` : `${d >= 0 ? '+' : ''}${de(d)} % (${p})`;
    };
    kpiRow([
      ['Klicks', g.totals.clicks, gd(g.totals.clicks, gp?.clicks)],
      ['Impressionen', g.totals.impressions, gd(g.totals.impressions, gp?.impressions)],
      ['CTR', `${de(g.totals.ctr)} %`, gp ? `Vorperiode: ${de(gp.ctr)} %` : ''],
      ['Ø Position', de(g.totals.position), gp ? `Vorperiode: ${de(gp.position)}` : ''],
    ]);

    // Nach Inhaltstyp (aus den Seiten-Zeilen; Summen können wegen
    // Google-Anonymisierung leicht unter den Gesamtwerten liegen)
    const byType = new Map();
    (g.pages || []).forEach((pg) => {
      const t = contentTypeForPath(pg.page);
      const cur = byType.get(t) || { clicks: 0, impressions: 0 };
      cur.clicks += pg.clicks;
      cur.impressions += pg.impressions;
      byType.set(t, cur);
    });
    table(
      ['Inhaltstyp', 'Klicks', 'Impr.'],
      [...byType.entries()].sort((a, b) => b[1].impressions - a[1].impressions).map(([t, v]) => [t, v.clicks, v.impressions]),
      [100, 37, 37]
    );
    table(
      ['Suchanfrage', 'Klicks', 'Impr.', 'CTR', 'Pos.'],
      g.queries.map(q => [q.query, q.clicks, q.impressions, `${q.ctr} %`, q.position]),
      [92, 20, 22, 20, 20]
    );
    y += 2;
    table(
      ['Seite', 'Klicks', 'Impr.', 'CTR', 'Pos.'],
      g.pages.slice(0, 15).map(pg => [pg.page.replace(/^https?:\/\/[^/]+/, '') || '/', pg.clicks, pg.impressions, `${pg.ctr} %`, pg.position]),
      [92, 20, 22, 20, 20]
    );
  } else {
    note(`Search Console: ${NA}${data.gscError ? ` (${data.gscError})` : ''}.`);
  }

  // ── Top Seiten ──
  if (data.pages) {
    heading('Top Seiten (Aufrufe)');
    table(
      ['Seite', 'Aufrufe', 'Besucher'],
      data.pages.slice(0, 12).map(p => [p.pagePath, p.pageViews, p.users]),
      [110, 32, 32]
    );
  }

  // ── Fußzeile auf jeder Seite ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(`S&I. Marketing-Report · Quellen: GA4, Search Console, Supabase (Anfragen) · Seite ${i}/${pageCount}`, M, 292);
  }

  doc.save(`si-marketing-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  return doc;
}

export default { generateAnalyticsReport };
