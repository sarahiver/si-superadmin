// src/lib/themedContractPDF.js
// Generiert Vertrag-PDF im Theme-Design
import { jsPDF } from 'jspdf';
import { PACKAGES, ADDONS, isFeatureIncluded, getAddonPrice, formatPrice } from './constants';

// Theme Farben (RGB für jsPDF)
const THEME_COLORS = {
  botanical: { primary: [27, 67, 50], accent: [45, 106, 79], light: [248, 253, 249] },
  editorial: { primary: [26, 26, 26], accent: [196, 30, 58], light: [250, 250, 250] },
  contemporary: { primary: [44, 44, 44], accent: [212, 175, 55], light: [255, 255, 255] },
  luxe: { primary: [28, 28, 28], accent: [212, 175, 55], light: [250, 248, 245] },
  neon: { primary: [13, 13, 13], accent: [255, 0, 110], light: [245, 245, 245] },
  video: { primary: [0, 0, 0], accent: [229, 9, 20], light: [255, 255, 255] },
};

export function generateThemedContractPDF(project, pricing) {
  const doc = new jsPDF();
  const theme = project.theme || 'editorial';
  const colors = THEME_COLORS[theme] || THEME_COLORS.editorial;
  const pw = doc.internal.pageSize.getWidth();
  const m = 20;
  let y = 0;

  const setColor = (type) => {
    if (type === 'primary') doc.setTextColor(...colors.primary);
    else if (type === 'accent') doc.setTextColor(...colors.accent);
    else if (type === 'gray') doc.setTextColor(100, 100, 100);
    else doc.setTextColor(0, 0, 0);
  };

  const newPage = (n = 30) => { if (y > 270 - n) { doc.addPage(); y = 20; } };

  // === HEADER mit Theme-Farbe ===
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pw, 45, 'F');
  
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('S&I. WEDDING', pw / 2, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text('Premium Hochzeits-Websites', pw / 2, 35, { align: 'center' });
  
  y = 60;

  // === VERTRAG TITEL ===
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  setColor('primary');
  doc.text('VERTRAG', pw / 2, y, { align: 'center' });
  y += 8;
  
  const contractNum = `SI-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setColor('gray');
  doc.text(`Vertragsnummer: ${contractNum}`, pw / 2, y, { align: 'center' });
  y += 20;

  // === VERTRAGSPARTEIEN ===
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor('accent');
  doc.text('Vertragsparteien', m, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setColor('primary');
  doc.text('Zwischen', m, y); y += 6;
  setColor();
  doc.text('S&I. wedding – Iver Gentz', m, y); y += 5;
  doc.text('E-Mail: wedding@sarahiver.de', m, y); y += 5;
  setColor('gray');
  doc.setFont('helvetica', 'italic');
  doc.text('(nachfolgend "Auftragnehmer")', m, y); y += 10;
  
  doc.setFont('helvetica', 'normal');
  setColor('primary');
  doc.text('und', m, y); y += 6;
  setColor();
  doc.text(project.client_name || '[KUNDENNAME]', m, y); y += 5;
  const contractAddr1 = [project.client_street, project.client_house_number].filter(Boolean).join(' ') || '[STRASSE]';
  const contractAddr2 = [project.client_zip, project.client_city].filter(Boolean).join(' ') || '[ORT]';
  doc.text(contractAddr1, m, y); y += 5;
  doc.text(contractAddr2, m, y); y += 5;
  if (project.client_country && project.client_country !== 'Deutschland') {
    doc.text(project.client_country, m, y); y += 5;
  }
  doc.text(`E-Mail: ${project.client_email || '[EMAIL]'}`, m, y); y += 5;
  if (project.client_phone) { doc.text(`Telefon: ${project.client_phone}`, m, y); y += 5; }
  setColor('gray');
  doc.setFont('helvetica', 'italic');
  doc.text('(nachfolgend "Auftraggeber")', m, y); y += 15;

  // === VERTRAGSGEGENSTAND ===
  newPage();
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor('accent');
  doc.text('Vertragsgegenstand', m, y); y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setColor();
  
  const couple = project.couple_names || `${project.partner1_name} & ${project.partner2_name}`;
  const wDate = project.wedding_date ? new Date(project.wedding_date).toLocaleDateString('de-DE') : '[DATUM]';
  const url = project.custom_domain || `siwedding.de/${project.slug}`;
  
  doc.text(`Brautpaar: ${couple}`, m, y); y += 5;
  doc.text(`Hochzeitsdatum: ${wDate}`, m, y); y += 5;
  doc.text(`Website: https://${url}`, m, y); y += 15;

  // === LEISTUNGSUMFANG ===
  newPage(60);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor('accent');
  doc.text('Leistungsumfang', m, y); y += 8;
  
  const pkg = PACKAGES[project.package] || PACKAGES.starter;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor('primary');
  doc.text(`Gewähltes Paket: ${pkg.name}`, m, y); y += 8;
  
  doc.setFont('helvetica', 'normal');
  setColor();
  pkg.features.forEach(f => {
    newPage(6);
    doc.text(`• ${f}`, m + 5, y);
    y += 5;
  });
  
  // Addons
  if ((project.addons || []).length > 0) {
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Zusatzoptionen:', m, y); y += 6;
    doc.setFont('helvetica', 'normal');
    project.addons.forEach(addonId => {
      const addon = ADDONS[addonId];
      if (addon && !isFeatureIncluded(project.package, addonId)) {
        const price = getAddonPrice(addonId, project.package);
        doc.text(`• ${addon.name} (+${formatPrice(price)})`, m + 5, y);
        y += 5;
      }
    });
  }
  y += 10;

  // === VERGÜTUNG ===
  newPage(50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor('accent');
  doc.text('Vergütung', m, y); y += 10;
  
  // Preis-Box
  doc.setFillColor(...colors.light);
  doc.setDrawColor(...colors.primary);
  doc.rect(m, y, pw - 2*m, 45, 'FD');
  
  const priceX = pw - m - 10;
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setColor();
  
  if (project.package === 'individual') {
    doc.text('Individual-Paket', m + 5, y);
    doc.text(formatPrice(pricing.total), priceX, y, { align: 'right' });
    y += 7;
  } else {
    doc.text(`Paket ${pkg.name}`, m + 5, y);
    doc.text(formatPrice(pricing.packagePrice), priceX, y, { align: 'right' });
    y += 7;
    
    if (pricing.addonsPrice > 0) {
      doc.text('Zusatzoptionen', m + 5, y);
      doc.text(`+${formatPrice(pricing.addonsPrice)}`, priceX, y, { align: 'right' });
      y += 7;
    }
    if (pricing.extraComponentsPrice > 0) {
      doc.text('Extra-Komponenten', m + 5, y);
      doc.text(`+${formatPrice(pricing.extraComponentsPrice)}`, priceX, y, { align: 'right' });
      y += 7;
    }
    if (pricing.discount > 0) {
      setColor('accent');
      doc.text('Rabatt', m + 5, y);
      doc.text(`-${formatPrice(pricing.discount)}`, priceX, y, { align: 'right' });
      y += 7;
      setColor();
    }
  }
  
  // Total
  doc.setLineWidth(0.5);
  doc.line(m + 5, y, pw - m - 5, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('GESAMT (inkl. MwSt.)', m + 5, y);
  setColor('accent');
  doc.text(formatPrice(pricing.total), priceX, y, { align: 'right' });
  
  y += 25;

  // === ZAHLUNGSBEDINGUNGEN ===
  newPage(40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor('accent');
  doc.text('Zahlungsbedingungen', m, y); y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setColor();
  doc.text('Die Zahlung erfolgt in zwei Raten:', m, y); y += 7;
  
  doc.setFont('helvetica', 'bold');
  doc.text(`1. Rate (50%): ${formatPrice(pricing.total / 2)} – fällig bei Vertragsabschluss`, m + 5, y); y += 5;
  doc.text(`2. Rate (50%): ${formatPrice(pricing.total / 2)} – fällig bei Go-Live`, m + 5, y); y += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Bankverbindung:', m, y); y += 5;
  doc.text('Empfänger: Iver Gentz', m, y); y += 5;
  doc.text('IBAN: DE06 1001 8000 0625 2723 20', m, y); y += 5;
  doc.text('BIC: FNOMDEB2 | Bank: Finom Payments', m, y); y += 15;

  // === WEITERE BESTIMMUNGEN ===
  newPage(60);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor('accent');
  doc.text('Weitere Bestimmungen', m, y); y += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setColor();
  
  const terms = [
    'Zeitplan: Fertigstellung innerhalb von 14 Werktagen nach Erhalt aller Inhalte.',
    'Nutzungsrechte: Zeitlich begrenzt für den vereinbarten Hosting-Zeitraum. Das Design verbleibt beim Auftragnehmer.',
    'Stornierung: Bis 60 Tage vor Hochzeitsdatum 30%, bis 30 Tage 50%, danach 100% des Gesamtbetrags.',
    'Es gilt deutsches Recht. Gerichtsstand ist Hamburg.',
  ];
  
  terms.forEach(term => {
    const lines = doc.splitTextToSize(`• ${term}`, pw - 2*m - 10);
    lines.forEach(line => {
      newPage(6);
      doc.text(line, m + 5, y);
      y += 5;
    });
    y += 2;
  });

  // === UNTERSCHRIFTEN ===
  newPage(50);
  y += 20;
  doc.setFontSize(10);
  setColor();
  doc.text(`Hamburg, den ${new Date().toLocaleDateString('de-DE')}`, m, y);
  y += 30;
  
  // Linien für Unterschriften
  doc.setDrawColor(...colors.primary);
  doc.line(m, y, m + 70, y);
  doc.line(pw - m - 70, y, pw - m, y);
  y += 5;
  
  doc.setFontSize(8);
  setColor('gray');
  doc.text('Auftragnehmer (S&I. wedding)', m, y);
  doc.text('Auftraggeber', pw - m - 70, y);

  // === FOOTER auf jeder Seite ===
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`S&I. wedding | Vertrag ${contractNum} | Seite ${i} von ${pageCount}`, pw / 2, 290, { align: 'center' });
  }

  // Speichern
  const filename = `SIwedding-Vertrag-${project.slug || 'projekt'}-${contractNum}.pdf`;
  doc.save(filename);
  return { filename, contractNum };
}

// AGBs PDF generieren
export function generateAGBsPDF(theme = 'editorial') {
  const doc = new jsPDF();
  const colors = THEME_COLORS[theme] || THEME_COLORS.editorial;
  const pw = doc.internal.pageSize.getWidth();
  const m = 20;
  let y = 0;

  // Header
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pw, 40, 'F');
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('S&I. WEDDING', pw / 2, 22, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Allgemeine Geschäftsbedingungen', pw / 2, 32, { align: 'center' });
  
  y = 55;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  
  const agbText = [
    { title: '§1 Geltungsbereich', text: 'Diese AGB gelten für alle Verträge zwischen S&I. wedding und dem Auftraggeber über die Erstellung von Hochzeits-Websites.' },
    { title: '§2 Vertragsschluss', text: 'Der Vertrag kommt durch Unterzeichnung des Vertrags und Zahlung der ersten Rate zustande.' },
    { title: '§3 Leistungsumfang', text: 'Der Auftragnehmer erstellt eine individuelle Hochzeits-Website nach den Vorgaben des gewählten Pakets. Änderungen am Leistungsumfang bedürfen der Schriftform.' },
    { title: '§4 Mitwirkungspflichten', text: 'Der Auftraggeber stellt alle erforderlichen Inhalte (Texte, Bilder, Informationen) rechtzeitig zur Verfügung. Verzögerungen durch fehlende Inhalte gehen nicht zu Lasten des Auftragnehmers.' },
    { title: '§5 Preise und Zahlung', text: 'Es gelten die im Vertrag vereinbarten Preise. Die Zahlung erfolgt in zwei Raten: 50% bei Vertragsschluss, 50% bei Go-Live der Website.' },
    { title: '§6 Nutzungsrechte', text: 'Der Auftraggeber erhält ein einfaches, zeitlich auf den Hosting-Zeitraum begrenztes Nutzungsrecht an der Website. Das Design und der Quellcode verbleiben beim Auftragnehmer.' },
    { title: '§7 Hosting und Laufzeit', text: 'Das Hosting ist im Paketpreis enthalten. Die Laufzeit richtet sich nach dem gewählten Paket. Eine Verlängerung ist gegen Aufpreis möglich.' },
    { title: '§8 Stornierung', text: 'Bei Stornierung durch den Auftraggeber werden folgende Gebühren fällig: Bis 30 Tage vor Hochzeitsdatum 50%, danach 100% der Vertragssumme.' },
    { title: '§9 Haftung', text: 'Der Auftragnehmer haftet nur für Vorsatz und grobe Fahrlässigkeit. Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen.' },
    { title: '§10 Datenschutz', text: 'Der Auftragnehmer verarbeitet personenbezogene Daten gemäß DSGVO. Details regelt die Datenschutzerklärung auf siwedding.de.' },
    { title: '§11 Schlussbestimmungen', text: 'Es gilt deutsches Recht. Gerichtsstand ist Hamburg. Änderungen bedürfen der Schriftform.' },
  ];

  agbText.forEach(section => {
    if (y > 260) { doc.addPage(); y = 20; }
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.accent);
    doc.text(section.title, m, y);
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(section.text, pw - 2*m);
    doc.text(lines, m, y);
    y += lines.length * 4 + 8;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('S&I. wedding | hello@siwedding.de | Stand: ' + new Date().toLocaleDateString('de-DE'), pw / 2, 285, { align: 'center' });

  doc.save('SIwedding-AGB.pdf');
}

export default { generateThemedContractPDF, generateAGBsPDF };
