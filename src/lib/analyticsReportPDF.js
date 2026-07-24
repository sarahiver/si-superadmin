// src/lib/analyticsReportPDF.js
// Marketing-Report als PDF — client-seitig aus den geladenen Dashboard-Daten
// (GA4 + GSC), gleiche jsPDF-Basis wie invoicePDF/contractPDF.
import { jsPDF } from 'jspdf';

const M = 18; // Seitenrand
const W = 210 - 2 * M;

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

  const kpiRow = (pairs) => {
    checkPage(16);
    const colW = W / pairs.length;
    pairs.forEach(([label, value], i) => {
      const x = M + i * colW;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 20);
      doc.text(String(value), x, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120);
      doc.text(label.toUpperCase(), x, y + 4.5);
    });
    y += 13;
  };

  const table = (headers, rows, widths) => {
    checkPage(10 + rows.length * 5.5);
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
    `Zeitraum: ${periodLabel}  ·  Erstellt: ${new Date().toLocaleDateString('de-DE')}  ·  sarahiver.com`,
    M, y
  );
  y += 4;

  // ── Website (GA4) ──
  const o = data.overview || {};
  heading('Website (sarahiver.com)');
  kpiRow([
    ['Besucher', o.activeUsers ?? '–'],
    ['Sitzungen', o.sessions ?? '–'],
    ['Seitenaufrufe', o.screenPageViews ?? '–'],
    ['Bounce Rate', o.bounceRate != null ? `${Math.round(o.bounceRate * 100)}%` : '–'],
  ]);

  // ── Funnel ──
  const ev = (name) => data.eventSummary?.[name] ?? 0;
  const demoEv = (name) => (data.demoEvents || []).find(e => e.event === name) || {};
  heading('Conversion-Funnel');
  table(
    ['Schritt', 'Wert'],
    [
      ['Besucher', o.activeUsers ?? 0],
      ['Demo geklickt', ev('demoClicks')],
      ['Demo besucht (siwedding.de)', demoEv('page_view').users || 0],
      ['Demo-CTA geklickt', demoEv('demo_overlay_cta').count || 0],
      ['Formular gestartet', ev('formStart')],
      ['Anfrage gesendet', ev('generateLead')],
    ],
    [120, 54]
  );

  // ── Demo-Klicks nach Einstieg ──
  if ((data.demoSources || []).length) {
    heading('Demo-Klicks nach Einstieg');
    table(
      ['Einstieg', 'Klicks'],
      data.demoSources.filter(d => d.source && d.source !== '(not set)').map(d => [d.source, d.clicks]),
      [120, 54]
    );
  }

  // ── GSC ──
  if (data.gsc) {
    const g = data.gsc;
    heading('Google Suche (Search Console)');
    kpiRow([
      ['Klicks', g.totals.clicks],
      ['Impressionen', g.totals.impressions],
      ['CTR', `${g.totals.ctr}%`],
      ['Ø Position', g.totals.position],
    ]);
    table(
      ['Suchanfrage', 'Klicks', 'Impr.', 'CTR', 'Pos.'],
      g.queries.map(q => [q.query, q.clicks, q.impressions, `${q.ctr}%`, q.position]),
      [92, 20, 22, 20, 20]
    );
    y += 2;
    table(
      ['Seite', 'Klicks', 'Impr.', 'CTR', 'Pos.'],
      g.pages.map(pg => [pg.page.replace(/^https?:\/\/[^/]+/, ''), pg.clicks, pg.impressions, `${pg.ctr}%`, pg.position]),
      [92, 20, 22, 20, 20]
    );
  }

  // ── Traffic-Quellen ──
  if ((data.referrers || []).length) {
    heading('Traffic-Quellen');
    table(
      ['Quelle', 'Sitzungen'],
      data.referrers.slice(0, 10).map(r => [`${r.source} / ${r.medium}`, r.sessions]),
      [120, 54]
    );
  }

  // ── Top Seiten ──
  if ((data.pages || []).length) {
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
    doc.text(`S&I. Marketing-Report · Seite ${i}/${pageCount}`, M, 292);
  }

  doc.save(`si-marketing-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default { generateAnalyticsReport };
