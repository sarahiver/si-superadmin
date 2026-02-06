// src/lib/invoicePDF.js
// Generiert professionelle Rechnung im S&I. Editorial Stil
import { jsPDF } from 'jspdf';
import { PACKAGES, formatPrice } from './constants';

// S&I. Farben
const COLORS = {
  black: [10, 10, 10],
  red: [196, 30, 58],
  gray: [102, 102, 102],
  lightGray: [229, 229, 229],
  white: [255, 255, 255],
};

// Firmendaten
const COMPANY = {
  name: 'S&I.',
  fullName: 'Iver Gentz',
  street: 'Große Freiheit 82',
  city: '22767 Hamburg',
  country: 'Deutschland',
  email: 'wedding@sarahiver.de',
  website: 'sarahiver.com',
  // Bankverbindung
  bank: 'N26',
  iban: 'DE XX XXXX XXXX XXXX XXXX XX', // TODO: Echte IBAN eintragen
  bic: 'NTSBDEB1XXX',
  // Steuernummer (wenn vorhanden)
  taxId: '', // TODO: USt-ID eintragen wenn vorhanden
};

/**
 * Generiert eine Rechnungsnummer
 */
function generateInvoiceNumber(project) {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = String(Date.now()).slice(-4);
  return `SI-${year}${month}-${random}`;
}

/**
 * Formatiert Datum auf Deutsch
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Generiert Rechnung-PDF
 * @param {Object} project - Projektdaten
 * @param {Object} pricing - Preisberechnung
 * @param {Object} options - { invoiceNumber, invoiceDate, dueDate, isDeposit, depositAmount }
 */
export function generateInvoicePDF(project, pricing, options = {}) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 20; // Margin
  let y = 0;

  const invoiceNumber = options.invoiceNumber || generateInvoiceNumber(project);
  const invoiceDate = options.invoiceDate || new Date();
  const dueDate = options.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // +14 Tage
  const isDeposit = options.isDeposit || false;
  const isFinal = options.isFinal || false;

  // ============================================
  // HEADER
  // ============================================

  // Logo-Box oben links
  doc.setFillColor(...COLORS.black);
  doc.rect(m, 15, 35, 14, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('S&I.', m + 17.5, 24, { align: 'center' });

  // Firmenadresse oben rechts
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  const headerRight = pw - m;
  doc.text(COMPANY.fullName, headerRight, 18, { align: 'right' });
  doc.text(COMPANY.street, headerRight, 23, { align: 'right' });
  doc.text(COMPANY.city, headerRight, 28, { align: 'right' });
  doc.text(COMPANY.email, headerRight, 33, { align: 'right' });

  y = 50;

  // ============================================
  // KUNDENADRESSE
  // ============================================

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text(`${COMPANY.fullName} · ${COMPANY.street} · ${COMPANY.city}`, m, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.black);
  doc.text(project.client_name || '[Kundenname]', m, y); y += 5;

  const street = [project.client_street, project.client_house_number].filter(Boolean).join(' ');
  if (street) { doc.text(street, m, y); y += 5; }

  const cityLine = [project.client_zip, project.client_city].filter(Boolean).join(' ');
  if (cityLine) { doc.text(cityLine, m, y); y += 5; }

  if (project.client_country && project.client_country !== 'Deutschland') {
    doc.text(project.client_country, m, y); y += 5;
  }

  // ============================================
  // RECHNUNGSDETAILS (rechte Spalte)
  // ============================================

  const detailsX = 130;
  let detailsY = 58;

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text('Rechnungsnummer:', detailsX, detailsY);
  doc.setTextColor(...COLORS.black);
  doc.setFont('helvetica', 'bold');
  doc.text(invoiceNumber, detailsX + 35, detailsY);
  detailsY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text('Rechnungsdatum:', detailsX, detailsY);
  doc.setTextColor(...COLORS.black);
  doc.text(formatDate(invoiceDate), detailsX + 35, detailsY);
  detailsY += 6;

  doc.setTextColor(...COLORS.gray);
  doc.text('Zahlungsziel:', detailsX, detailsY);
  doc.setTextColor(...COLORS.black);
  doc.text(formatDate(dueDate), detailsX + 35, detailsY);
  detailsY += 6;

  doc.setTextColor(...COLORS.gray);
  doc.text('Kundennummer:', detailsX, detailsY);
  doc.setTextColor(...COLORS.black);
  doc.text(`K-${project.id?.slice(0, 8) || '00000000'}`, detailsX + 35, detailsY);

  y = Math.max(y, detailsY) + 15;

  // ============================================
  // TITEL
  // ============================================

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.black);

  let title = 'RECHNUNG';
  if (isDeposit) title = 'ANZAHLUNGSRECHNUNG';
  if (isFinal) title = 'SCHLUSSRECHNUNG';

  doc.text(title, m, y);
  y += 12;

  // Projektinfo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  const couple = project.couple_names || `${project.partner1_name} & ${project.partner2_name}`;
  const wDate = project.wedding_date ? formatDate(project.wedding_date) : '';
  doc.text(`Projekt: Hochzeits-Website für ${couple}${wDate ? ` (${wDate})` : ''}`, m, y);
  y += 15;

  // ============================================
  // POSITIONEN TABELLE
  // ============================================

  // Tabellenkopf
  doc.setFillColor(...COLORS.black);
  doc.rect(m, y, pw - 2*m, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Pos.', m + 3, y + 5.5);
  doc.text('Beschreibung', m + 15, y + 5.5);
  doc.text('Menge', pw - m - 55, y + 5.5);
  doc.text('Einzelpreis', pw - m - 35, y + 5.5);
  doc.text('Gesamt', pw - m - 3, y + 5.5, { align: 'right' });
  y += 12;

  const pkg = PACKAGES[project.package] || PACKAGES.starter;
  let pos = 1;
  const positions = [];

  // Hauptpaket
  if (project.package === 'individual') {
    positions.push({
      pos: pos++,
      desc: 'Individual-Paket – Hochzeits-Website',
      qty: 1,
      unit: formatPrice(pricing.total),
      total: formatPrice(pricing.total),
    });
  } else {
    positions.push({
      pos: pos++,
      desc: `${pkg.name}-Paket – Hochzeits-Website\nInkl. ${pkg.hosting} Hosting, ${pkg.features.length} Features`,
      qty: 1,
      unit: formatPrice(pricing.packagePrice),
      total: formatPrice(pricing.packagePrice),
    });

    // Addons
    if (pricing.addonsPrice > 0 && project.addons) {
      project.addons.forEach(addonId => {
        const addonNames = {
          save_the_date: 'Save the Date Seite',
          archive: 'Archiv-Seite',
          qr_code: 'QR-Code Erstellung',
          invitation_design: 'Einladungs-Design',
        };
        if (addonNames[addonId]) {
          const price = pricing.addonsPrice / project.addons.length; // Vereinfacht
          positions.push({
            pos: pos++,
            desc: addonNames[addonId],
            qty: 1,
            unit: formatPrice(price),
            total: formatPrice(price),
          });
        }
      });
    }

    // Extra-Komponenten
    if (pricing.extraComponentsPrice > 0) {
      const count = project.extra_components_count || 0;
      positions.push({
        pos: pos++,
        desc: 'Zusätzliche Komponenten',
        qty: count,
        unit: formatPrice(50),
        total: formatPrice(pricing.extraComponentsPrice),
      });
    }

    // Custom Extras
    if (project.custom_extras && project.custom_extras.length > 0) {
      project.custom_extras.forEach(extra => {
        if (extra.amount > 0) {
          positions.push({
            pos: pos++,
            desc: extra.title || 'Zusatzleistung',
            qty: 1,
            unit: formatPrice(extra.amount),
            total: formatPrice(extra.amount),
          });
        }
      });
    }
  }

  // Positionen zeichnen
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.black);

  positions.forEach((item, idx) => {
    const isLast = idx === positions.length - 1;
    const rowHeight = item.desc.includes('\n') ? 12 : 8;

    // Zebrastreifen
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(m, y - 2, pw - 2*m, rowHeight, 'F');
    }

    doc.setFontSize(9);
    doc.text(String(item.pos), m + 3, y + 3);

    // Mehrzeilige Beschreibung
    const descLines = item.desc.split('\n');
    descLines.forEach((line, lineIdx) => {
      if (lineIdx === 0) {
        doc.setFont('helvetica', 'normal');
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.gray);
      }
      doc.text(line, m + 15, y + 3 + (lineIdx * 4));
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.black);
    doc.text(String(item.qty), pw - m - 55, y + 3);
    doc.text(item.unit, pw - m - 35, y + 3);
    doc.text(item.total, pw - m - 3, y + 3, { align: 'right' });

    y += rowHeight;

    // Trennlinie
    doc.setDrawColor(...COLORS.lightGray);
    doc.line(m, y, pw - m, y);
    y += 2;
  });

  y += 5;

  // ============================================
  // SUMMEN
  // ============================================

  const sumX = pw - m - 60;

  // Zwischensumme
  const nettoTotal = pricing.total / 1.19; // 19% MwSt rausrechnen
  const mwst = pricing.total - nettoTotal;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text('Zwischensumme (netto):', sumX, y);
  doc.setTextColor(...COLORS.black);
  doc.text(formatPrice(nettoTotal), pw - m - 3, y, { align: 'right' });
  y += 6;

  // MwSt
  doc.setTextColor(...COLORS.gray);
  doc.text('MwSt. 19%:', sumX, y);
  doc.setTextColor(...COLORS.black);
  doc.text(formatPrice(mwst), pw - m - 3, y, { align: 'right' });
  y += 8;

  // Rabatt
  if (pricing.discount > 0) {
    doc.setTextColor(...COLORS.red);
    doc.text('Rabatt:', sumX, y);
    doc.text(`-${formatPrice(pricing.discount)}`, pw - m - 3, y, { align: 'right' });
    y += 8;
  }

  // Gesamt
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.5);
  doc.line(sumX - 5, y - 2, pw - m, y - 2);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.black);
  doc.text('Gesamtbetrag:', sumX, y + 3);
  doc.setTextColor(...COLORS.red);

  let finalAmount = pricing.total;
  if (isDeposit) finalAmount = pricing.total * 0.5;
  if (isFinal && options.depositPaid) finalAmount = pricing.total * 0.5;

  doc.text(formatPrice(finalAmount), pw - m - 3, y + 3, { align: 'right' });

  y += 20;

  // Bei Anzahlung: Hinweis
  if (isDeposit) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.gray);
    doc.text('Dies ist eine Anzahlungsrechnung über 50% des Gesamtbetrags.', m, y);
    doc.text('Die Schlussrechnung erfolgt bei Fertigstellung der Website.', m, y + 5);
    y += 15;
  }

  if (isFinal && options.depositPaid) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.gray);
    doc.text(`Bereits gezahlte Anzahlung: ${formatPrice(pricing.total * 0.5)}`, m, y);
    y += 10;
  }

  // ============================================
  // ZAHLUNGSINFORMATIONEN
  // ============================================

  y += 10;
  doc.setFillColor(250, 250, 250);
  doc.rect(m, y, pw - 2*m, 30, 'F');
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.black);
  doc.text('Bankverbindung', m + 5, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Kontoinhaber: ${COMPANY.fullName}`, m + 5, y); y += 4;
  doc.text(`IBAN: ${COMPANY.iban}`, m + 5, y); y += 4;
  doc.text(`BIC: ${COMPANY.bic}`, m + 5, y); y += 4;
  doc.text(`Verwendungszweck: ${invoiceNumber}`, m + 5, y);

  // ============================================
  // FOOTER
  // ============================================

  // Zahlungshinweis
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  const footerY = ph - 35;
  doc.text(`Bitte überweisen Sie den Betrag bis zum ${formatDate(dueDate)} unter Angabe der Rechnungsnummer.`, m, footerY);
  doc.text('Vielen Dank für Ihr Vertrauen!', m, footerY + 5);

  // Fußzeile
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  const footerLine = `${COMPANY.fullName} · ${COMPANY.street} · ${COMPANY.city} · ${COMPANY.email}`;
  doc.text(footerLine, pw / 2, ph - 15, { align: 'center' });

  if (COMPANY.taxId) {
    doc.text(`USt-IdNr.: ${COMPANY.taxId}`, pw / 2, ph - 10, { align: 'center' });
  }

  // Seitenzahl
  doc.text(`Seite 1 von 1`, pw - m, ph - 10, { align: 'right' });

  // ============================================
  // SPEICHERN
  // ============================================

  const typeLabel = isDeposit ? 'Anzahlung' : isFinal ? 'Schluss' : '';
  const filename = `SIwedding-Rechnung${typeLabel}-${project.slug || 'projekt'}-${invoiceNumber}.pdf`;
  doc.save(filename);

  return { filename, invoiceNumber, invoiceDate: formatDate(invoiceDate), dueDate: formatDate(dueDate) };
}

export default { generateInvoicePDF };
