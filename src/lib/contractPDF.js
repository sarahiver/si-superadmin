// src/lib/contractPDF.js
// Ausführlicher Vertrag für Online-Dienstleistungen im S&I. Editorial Stil
import { jsPDF } from 'jspdf';
import { PACKAGES, ADDONS, isFeatureIncluded, getAddonPrice, formatPrice } from './constants';

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
  website: 'siwedding.de',
};

/**
 * Generiert Vertragsnummer
 */
function generateContractNumber() {
  const year = new Date().getFullYear();
  const random = String(Date.now()).slice(-5);
  return `V-${year}-${random}`;
}

/**
 * Formatiert Datum auf Deutsch
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Generiert ausführlichen Vertrag-PDF
 */
export function generateContractPDF(project, pricing, options = {}) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 20;
  let y = 0;

  const contractNumber = options.contractNumber || generateContractNumber();
  const contractDate = options.contractDate || new Date();
  const pkg = PACKAGES[project.package] || PACKAGES.starter;

  // Hilfsfunktionen
  const setColor = (type) => {
    if (type === 'black') doc.setTextColor(...COLORS.black);
    else if (type === 'red') doc.setTextColor(...COLORS.red);
    else if (type === 'gray') doc.setTextColor(...COLORS.gray);
    else doc.setTextColor(...COLORS.black);
  };

  const newPage = (needed = 30) => {
    if (y > ph - needed - 20) {
      addFooter();
      doc.addPage();
      y = 25;
    }
  };

  const addFooter = () => {
    const pageNum = doc.internal.getNumberOfPages();
    doc.setFontSize(7);
    setColor('gray');
    doc.text(`${COMPANY.name} · ${COMPANY.fullName} · ${COMPANY.street} · ${COMPANY.city}`, pw / 2, ph - 12, { align: 'center' });
    doc.text(`Vertrag ${contractNumber} · Seite ${pageNum}`, pw / 2, ph - 8, { align: 'center' });
  };

  const addSection = (number, title) => {
    newPage(40);
    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor('red');
    doc.text(`§${number} ${title}`, m, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor('black');
  };

  const addParagraph = (text, indent = 0) => {
    const lines = doc.splitTextToSize(text, pw - 2*m - indent);
    lines.forEach(line => {
      newPage(6);
      doc.text(line, m + indent, y);
      y += 4.5;
    });
    y += 2;
  };

  const addBullet = (text) => {
    const lines = doc.splitTextToSize(text, pw - 2*m - 10);
    lines.forEach((line, idx) => {
      newPage(6);
      if (idx === 0) {
        doc.text('•', m + 3, y);
      }
      doc.text(line, m + 8, y);
      y += 4.5;
    });
  };

  // ============================================
  // SEITE 1: DECKBLATT
  // ============================================

  // Header-Box
  doc.setFillColor(...COLORS.black);
  doc.rect(0, 0, pw, 55, 'F');

  // Logo
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('S&I.', pw / 2, 28, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text('PREMIUM HOCHZEITS-WEBSITES', pw / 2, 40, { align: 'center' });

  y = 75;

  // Titel
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  setColor('black');
  doc.text('DIENSTLEISTUNGSVERTRAG', pw / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  setColor('gray');
  doc.text('für die Erstellung einer individuellen Hochzeits-Website', pw / 2, y, { align: 'center' });
  y += 25;

  // Vertragsnummer und Datum Box
  doc.setFillColor(250, 250, 250);
  doc.rect(m, y, pw - 2*m, 25, 'F');
  doc.setDrawColor(...COLORS.lightGray);
  doc.rect(m, y, pw - 2*m, 25, 'S');

  doc.setFontSize(9);
  setColor('gray');
  doc.text('Vertragsnummer:', m + 10, y + 10);
  doc.text('Datum:', m + 10, y + 18);
  doc.setFont('helvetica', 'bold');
  setColor('black');
  doc.text(contractNumber, m + 45, y + 10);
  doc.text(formatDate(contractDate), m + 45, y + 18);

  y += 40;

  // Vertragsparteien
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor('red');
  doc.text('ZWISCHEN', m, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  setColor('black');
  doc.text(COMPANY.name, m, y); y += 5;
  doc.text(COMPANY.fullName, m, y); y += 5;
  doc.text(COMPANY.street, m, y); y += 5;
  doc.text(COMPANY.city, m, y); y += 5;
  setColor('gray');
  doc.setFont('helvetica', 'italic');
  doc.text('– nachfolgend „Auftragnehmer" –', m, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  setColor('red');
  doc.text('UND', m, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  setColor('black');
  doc.text(project.client_name || '[Kundenname]', m, y); y += 5;
  const street = [project.client_street, project.client_house_number].filter(Boolean).join(' ');
  if (street) { doc.text(street, m, y); y += 5; }
  const cityLine = [project.client_zip, project.client_city].filter(Boolean).join(' ');
  if (cityLine) { doc.text(cityLine, m, y); y += 5; }
  if (project.client_email) { doc.text(project.client_email, m, y); y += 5; }
  setColor('gray');
  doc.setFont('helvetica', 'italic');
  doc.text('– nachfolgend „Auftraggeber" –', m, y);
  y += 15;

  // Projektinfo Box
  doc.setFillColor(...COLORS.black);
  doc.rect(m, y, pw - 2*m, 30, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  const couple = project.couple_names || `${project.partner1_name} & ${project.partner2_name}`;
  const wDate = project.wedding_date ? formatDate(project.wedding_date) : '[Datum folgt]';
  const url = project.custom_domain || `siwedding.de/${project.slug || '[url]'}`;

  doc.text('PROJEKT', m + 10, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Hochzeits-Website für ${couple}`, m + 10, y + 18);
  doc.text(`Hochzeitsdatum: ${wDate}  |  URL: ${url}`, m + 10, y + 25);

  addFooter();
  doc.addPage();
  y = 25;

  // ============================================
  // VERTRAGSINHALT
  // ============================================

  addSection('1', 'Vertragsgegenstand');
  addParagraph('Der Auftragnehmer erstellt für den Auftraggeber eine individuelle Hochzeits-Website gemäß den nachfolgenden Spezifikationen. Die Website dient der Information der Hochzeitsgäste und der Verwaltung von Zu- und Absagen (RSVP).');

  addSection('2', 'Leistungsumfang');
  addParagraph(`Gewähltes Paket: ${pkg.name}`);
  addParagraph('Der Leistungsumfang umfasst:');
  pkg.features.forEach(feature => {
    addBullet(feature);
  });

  if ((project.addons || []).length > 0) {
    y += 3;
    addParagraph('Zusätzlich gebuchte Leistungen:');
    project.addons.forEach(addonId => {
      const addon = ADDONS[addonId];
      if (addon) {
        addBullet(`${addon.name}: ${addon.description}`);
      }
    });
  }

  addSection('3', 'Vergütung und Zahlungsbedingungen');

  // Preisbox
  newPage(50);
  doc.setFillColor(250, 250, 250);
  doc.rect(m, y, pw - 2*m, 40, 'F');
  y += 8;

  doc.setFontSize(9);
  if (project.package !== 'individual') {
    doc.text(`Paket ${pkg.name}`, m + 5, y);
    doc.text(formatPrice(pricing.packagePrice), pw - m - 5, y, { align: 'right' });
    y += 6;

    if (pricing.addonsPrice > 0) {
      doc.text('Zusatzoptionen', m + 5, y);
      doc.text(`+ ${formatPrice(pricing.addonsPrice)}`, pw - m - 5, y, { align: 'right' });
      y += 6;
    }
    if (pricing.extraComponentsPrice > 0) {
      doc.text('Extra-Komponenten', m + 5, y);
      doc.text(`+ ${formatPrice(pricing.extraComponentsPrice)}`, pw - m - 5, y, { align: 'right' });
      y += 6;
    }
    if (pricing.discount > 0) {
      setColor('red');
      doc.text('Rabatt', m + 5, y);
      doc.text(`- ${formatPrice(pricing.discount)}`, pw - m - 5, y, { align: 'right' });
      y += 6;
      setColor('black');
    }
  }

  doc.setLineWidth(0.3);
  doc.line(m + 5, y, pw - m - 5, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Gesamtbetrag (inkl. 19% MwSt.)', m + 5, y);
  setColor('red');
  doc.text(formatPrice(pricing.total), pw - m - 5, y, { align: 'right' });
  setColor('black');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 15;

  addParagraph('Die Zahlung erfolgt in zwei Raten:');
  addBullet(`1. Rate (50%): ${formatPrice(pricing.total / 2)} – fällig bei Vertragsunterzeichnung`);
  addBullet(`2. Rate (50%): ${formatPrice(pricing.total / 2)} – fällig bei Freigabe der Website (Go-Live)`);
  y += 3;
  addParagraph('Die Rechnungsstellung erfolgt separat per E-Mail. Das Zahlungsziel beträgt 14 Tage.');
  y += 3;
  addParagraph('Bankverbindung:');
  addBullet('Empfänger: Iver Gentz');
  addBullet('IBAN: DE06 1001 8000 0625 2723 20');
  addBullet('BIC: FNOMDEB2 | Bank: Finom Payments');

  addSection('4', 'Zeitplan und Mitwirkungspflichten');
  addParagraph('Der Auftragnehmer verpflichtet sich, die Website innerhalb von 14 Werktagen nach Erhalt aller erforderlichen Inhalte fertigzustellen.');
  addParagraph('Der Auftraggeber verpflichtet sich:');
  addBullet('Alle erforderlichen Texte, Bilder und Informationen rechtzeitig bereitzustellen');
  addBullet('Feedback und Freigaben innerhalb von 5 Werktagen zu erteilen');
  addBullet('Die finale Version der Website vor Go-Live schriftlich freizugeben');
  addParagraph('Verzögerungen durch verspätete Zulieferung des Auftraggebers verlängern die Fertigstellungsfrist entsprechend.');

  addSection('5', 'Nutzungsrechte');
  addParagraph('Der Auftraggeber erhält ein einfaches, nicht übertragbares Nutzungsrecht an der Website für den vereinbarten Hosting-Zeitraum.');
  addParagraph('Das Design, der Quellcode und alle technischen Implementierungen verbleiben im Eigentum des Auftragnehmers. Eine Weitergabe oder Vervielfältigung ist nicht gestattet.');
  addParagraph('Vom Auftraggeber bereitgestellte Inhalte (Fotos, Texte) verbleiben in dessen Eigentum.');

  addSection('6', 'Hosting und Laufzeit');
  addParagraph(`Die Hosting-Laufzeit beträgt ${pkg.hosting} ab Freischaltung der Website. Das Hosting ist im Paketpreis enthalten.`);
  addParagraph('Nach Ablauf der Laufzeit kann das Hosting gegen eine Gebühr verlängert werden. Der Auftraggeber wird rechtzeitig über das Ende der Laufzeit informiert.');
  addParagraph('Nach Ende der Hosting-Laufzeit wird die Website deaktiviert und nach weiteren 30 Tagen gelöscht, sofern keine Verlängerung vereinbart wurde.');

  addSection('7', 'Änderungen und Revisionen');
  addParagraph(`Im ${pkg.name}-Paket sind ${pkg.name === 'Premium' ? 'unbegrenzte' : pkg.name === 'Standard' ? '4' : '2'} Revisionen enthalten (${pkg.name === 'Starter' ? '1 vor und 1 nach' : pkg.name === 'Standard' ? '2 vor und 2 nach' : ''} Go-Live).`);
  addParagraph('Eine Revision umfasst kleinere Anpassungen an Texten, Bildern oder Layout. Grundlegende Änderungen am Design oder Funktionsumfang gelten als Zusatzleistung und werden separat berechnet.');

  addSection('8', 'Stornierung');
  addParagraph('Der Auftraggeber kann den Vertrag schriftlich kündigen. Folgende Stornierungsgebühren fallen an:');
  addBullet('Bis 60 Tage vor Hochzeitsdatum: 30% des Gesamtbetrags');
  addBullet('Bis 30 Tage vor Hochzeitsdatum: 50% des Gesamtbetrags');
  addBullet('Weniger als 30 Tage vor Hochzeitsdatum: 100% des Gesamtbetrags');
  addParagraph('Bereits erbrachte Leistungen werden in jedem Fall berechnet.');

  addSection('9', 'Haftung');
  addParagraph('Der Auftragnehmer haftet nur bei Vorsatz und grober Fahrlässigkeit. Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit keine wesentlichen Vertragspflichten verletzt werden.');
  addParagraph('Der Auftragnehmer haftet nicht für Ausfälle oder Störungen, die durch Dritte (Hosting-Provider, Internetanbieter) verursacht werden.');
  addParagraph('Die Haftung ist in jedem Fall auf die Höhe der vereinbarten Vergütung begrenzt.');

  addSection('10', 'Datenschutz');
  addParagraph('Der Auftragnehmer verarbeitet personenbezogene Daten des Auftraggebers und der Hochzeitsgäste ausschließlich zur Vertragserfüllung gemäß DSGVO.');
  addParagraph('Die Datenschutzerklärung unter siwedding.de/datenschutz ist Bestandteil dieses Vertrags.');
  addParagraph('Für die Inhalte der Website (insbesondere Gästedaten aus dem RSVP-Formular) ist der Auftraggeber verantwortlich.');

  addSection('11', 'Schlussbestimmungen');
  addParagraph('Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform. Dies gilt auch für die Aufhebung dieses Schriftformerfordernisses.');
  addParagraph('Sollten einzelne Bestimmungen dieses Vertrags unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.');
  addParagraph('Es gilt deutsches Recht. Gerichtsstand ist Hamburg.');

  // ============================================
  // UNTERSCHRIFTEN
  // ============================================

  newPage(60);
  y += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor('black');
  doc.text('UNTERSCHRIFTEN', m, y);
  y += 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor('gray');
  doc.text('Hamburg, den _______________', m, y);
  doc.text('_______________, den _______________', pw / 2 + 10, y);
  y += 25;

  // Unterschriftslinien
  doc.setDrawColor(...COLORS.black);
  doc.line(m, y, m + 65, y);
  doc.line(pw / 2 + 10, y, pw - m, y);
  y += 5;

  doc.setFontSize(8);
  doc.text('Auftragnehmer (S&I.)', m, y);
  doc.text('Auftraggeber', pw / 2 + 10, y);

  addFooter();

  // ============================================
  // SPEICHERN ODER BASE64 ZURÜCKGEBEN
  // ============================================

  const filename = `SIwedding-Vertrag-${project.slug || 'projekt'}-${contractNumber}.pdf`;

  // Wenn returnBase64 in options gesetzt ist, nicht speichern sondern Base64 zurückgeben
  if (options?.returnBase64) {
    const base64 = doc.output('datauristring').split(',')[1];
    return { filename, contractNumber, contractDate: formatDate(contractDate), base64 };
  }

  doc.save(filename);
  return { filename, contractNumber, contractDate: formatDate(contractDate) };
}

export default { generateContractPDF };
