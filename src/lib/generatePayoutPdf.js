// src/lib/generatePayoutPdf.js
// Erzeugt eine Provisionsabrechnung / Gutschrift als PDF
// S&I. Branding: schwarz/weiß, Roboto, clean & minimal

import jsPDF from 'jspdf';

/**
 * Generates a commission payout PDF (Gutschrift/Provisionsabrechnung)
 * @param {Object} payout - The payout record from partner_payouts
 * @param {Object} options - { download: true, filename: 'SI-PROV-...' }
 * @returns {jsPDF} - The PDF document (for preview or download)
 */
export function generatePayoutPdf(payout, options = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; // A4 width
  const margin = 25;
  const contentWidth = W - 2 * margin;
  let y = 25;

  // ── Colors ──
  const black = '#0A0A0A';
  const gray = '#666666';
  const lightGray = '#E5E5E5';
  const green = '#059669';

  // ── Helper ──
  const fmt = (n) => Number(n).toFixed(2).replace('.', ',') + ' €';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–';

  // ============================================
  // HEADER - S&I. Logo
  // ============================================
  doc.setFillColor(black);
  doc.rect(0, 0, W, 45, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor('#FFFFFF');
  doc.text('S & I .', margin, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#CCCCCC');
  doc.text('Premium Wedding Websites', margin + 55, 27);
  doc.text('siwedding.de', margin + 55, 33);

  y = 55;

  // ============================================
  // DOCUMENT TITLE
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(black);
  doc.text('Provisionsabrechnung', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(gray);
  doc.text('Gutschrift gemäß §14 UStG', margin, y);
  y += 12;

  // ============================================
  // META INFO (Rechnungsnummer, Datum)
  // ============================================
  const metaStartY = y;
  const col2X = margin + contentWidth / 2 + 10;

  // Left column: Abrechnung
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('ABRECHNUNGSNUMMER', margin, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(black);
  doc.text(payout.invoice_number || '–', margin, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('DATUM', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(black);
  doc.text(fmtDate(payout.created_at), margin, y);
  y += 8;

  if (payout.status === 'ausgezahlt' && payout.paid_at) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(gray);
    doc.text('AUSGEZAHLT AM', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(green);
    doc.text(fmtDate(payout.paid_at), margin, y);
    y += 8;
  }

  // Right column: Partner
  let ry = metaStartY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('PROVISIONSEMPFÄNGER', col2X, ry);
  ry += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(black);
  doc.text(payout.partner_name || '–', col2X, ry);
  ry += 6;

  if (payout.partner_company) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(gray);
    doc.text(payout.partner_company, col2X, ry);
    ry += 5;
  }

  if (payout.partner_email) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(gray);
    doc.text(payout.partner_email, col2X, ry);
    ry += 5;
  }

  if (payout.partner_tax_id) {
    ry += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(gray);
    doc.text('STEUER-NR / UST-ID', col2X, ry);
    ry += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(black);
    doc.text(payout.partner_tax_id, col2X, ry);
    ry += 5;
  }

  y = Math.max(y, ry) + 10;

  // ============================================
  // DIVIDER
  // ============================================
  doc.setDrawColor(lightGray);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 10;

  // ============================================
  // PROJECT DETAILS
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('PROJEKT', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(black);
  doc.text(payout.couple_names || '–', margin, y);
  if (payout.project_package) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(gray);
    doc.text(`Paket: ${payout.project_package}`, margin + 80, y);
  }
  y += 12;

  // ============================================
  // CALCULATION TABLE
  // ============================================
  const tableStartY = y;
  const colAmount = W - margin;

  // Table header
  doc.setFillColor('#F5F5F5');
  doc.rect(margin, y - 4, contentWidth, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('POSITION', margin + 4, y + 2);
  doc.text('BETRAG', colAmount - 4, y + 2, { align: 'right' });
  y += 12;

  // Row: Projektgesamtpreis
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(black);
  doc.text('Projektgesamtpreis', margin + 4, y);
  doc.text(fmt(payout.project_total), colAmount - 4, y, { align: 'right' });
  y += 8;

  // Row: Provision %
  doc.setTextColor(gray);
  doc.setFontSize(9);
  doc.text(`Provision ${payout.commission_percent}%`, margin + 4, y);
  doc.text(fmt(payout.commission_calculated), colAmount - 4, y, { align: 'right' });
  y += 8;

  // Row: Gutscheinwert (if applicable)
  if (payout.discount_amount > 0 && payout.discount_amount > payout.commission_calculated) {
    doc.text(`Mindest-Gutscheinwert`, margin + 4, y);
    doc.text(fmt(payout.discount_amount), colAmount - 4, y, { align: 'right' });
    y += 8;
  }

  // Divider
  doc.setDrawColor(lightGray);
  doc.line(margin, y, W - margin, y);
  y += 8;

  // TOTAL
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(black);
  doc.text('Auszahlungsbetrag', margin + 4, y);
  doc.text(fmt(payout.payout_amount), colAmount - 4, y, { align: 'right' });
  y += 6;

  // Netto-Hinweis
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('Gemäß §19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).', margin + 4, y);
  y += 15;

  // ============================================
  // BANK DETAILS
  // ============================================
  if (payout.partner_iban) {
    doc.setDrawColor(lightGray);
    doc.line(margin, y, W - margin, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(gray);
    doc.text('BANKVERBINDUNG PROVISIONSEMPFÄNGER', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(black);
    doc.text(`IBAN: ${payout.partner_iban}`, margin, y);
    y += 6;

    if (payout.partner_bic) {
      doc.text(`BIC: ${payout.partner_bic}`, margin, y);
      y += 6;
    }

    doc.text(`Empfänger: ${payout.partner_name}${payout.partner_company ? ' / ' + payout.partner_company : ''}`, margin, y);
    y += 15;
  }

  // ============================================
  // STATUS BADGE
  // ============================================
  if (payout.status === 'ausgezahlt') {
    doc.setFillColor('#D1FAE5');
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor('#065F46');
    doc.text(`✓  Ausgezahlt am ${fmtDate(payout.paid_at)}${payout.paid_via ? ' via ' + payout.paid_via : ''}`, margin + 6, y + 10);
    y += 25;
  } else if (payout.status === 'offen') {
    doc.setFillColor('#FEF3C7');
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor('#92400E');
    doc.text('⏳  Auszahlung ausstehend', margin + 6, y + 8);
    y += 20;
  }

  // ============================================
  // FOOTER
  // ============================================
  const footerY = 275;
  doc.setDrawColor(lightGray);
  doc.line(margin, footerY - 5, W - margin, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(gray);
  doc.text('S&I. Wedding  |  Iver Gentz  |  siwedding.de', margin, footerY);
  doc.text('IBAN: DE06 1001 8000 0625 2723 20  |  BIC: FNOMDEB2  |  Bank: Finom Payments', margin, footerY + 4);
  doc.text(`Dokument erstellt am ${fmtDate(new Date())}`, W - margin, footerY, { align: 'right' });

  // ── Download or return ──
  if (options.download !== false) {
    const filename = options.filename || `${payout.invoice_number || 'Provisionsabrechnung'}.pdf`;
    doc.save(filename);
  }

  return doc;
}
