// src/lib/emailService.js
// Brevo E-Mail Service für S&I.

import { supabase } from './supabase';
import { jsPDF } from 'jspdf';
import { PACKAGES, ADDONS, isFeatureIncluded, getAddonPrice, formatPrice } from './constants';

const BREVO_API_KEY = process.env.REACT_APP_BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Theme Farben
const THEME_COLORS = {
  botanical: { primary: '#1B4332', accent: '#40916C', light: '#F0FDF4' },
  editorial: { primary: '#1A1A1A', accent: '#C41E3A', light: '#FAFAFA' },
  contemporary: { primary: '#2C2C2C', accent: '#D4AF37', light: '#FFFEF5' },
  luxe: { primary: '#1C1C1C', accent: '#D4AF37', light: '#FAF8F5' },
  neon: { primary: '#0D0D0D', accent: '#FF006E', light: '#FFF0F7' },
  video: { primary: '#000000', accent: '#E50914', light: '#FFF5F5' },
};

// ============================================
// VERTRAG PDF GENERIEREN (als Base64)
// ============================================
function generateContractPDFBase64(project, pricing) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const m = 20;
  let y = 20;
  const checkPage = (n = 30) => { if (y > 270 - n) { doc.addPage(); y = 20; } };

  // Header
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pw, 40, 'F');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('S&I.', pw / 2, 25, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text('Premium Hochzeits-Websites', pw / 2, 33, { align: 'center' });
  
  y = 55;
  doc.setTextColor(0, 0, 0);

  // Title
  const cNum = `SI-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('VERTRAG', pw / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Vertragsnummer: ${cNum}`, pw / 2, y, { align: 'center' });
  y += 15;
  doc.setTextColor(0);

  // Parties
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(196, 30, 58);
  doc.text('Vertragsparteien', m, y);
  y += 8;
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('S&I. – Iver Arntzen | wedding@sarahiver.de', m, y);
  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  doc.text('(nachfolgend "Auftragnehmer")', m, y);
  y += 10;
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.text(project.client_name || '[KUNDENNAME]', m, y);
  y += 5;
  doc.text(project.client_address || '[ADRESSE]', m, y);
  y += 5;
  doc.text(`E-Mail: ${project.client_email || '[EMAIL]'}`, m, y);
  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  doc.text('(nachfolgend "Auftraggeber")', m, y);
  y += 15;
  doc.setTextColor(0);

  // Subject
  checkPage();
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(196, 30, 58);
  doc.text('Vertragsgegenstand', m, y);
  y += 8;
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const couple = project.couple_names || `${project.partner1_name || ''} & ${project.partner2_name || ''}`;
  const wDate = project.wedding_date ? new Date(project.wedding_date).toLocaleDateString('de-DE') : '[DATUM]';
  const url = project.custom_domain || `siwedding.de/${project.slug || 'website'}`;
  doc.text(`Brautpaar: ${couple}`, m, y); y += 5;
  doc.text(`Hochzeitsdatum: ${wDate}`, m, y); y += 5;
  doc.text(`Website: https://${url}`, m, y); y += 15;

  // Services
  checkPage(80);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(196, 30, 58);
  doc.text('Leistungsumfang', m, y);
  y += 8;
  doc.setTextColor(0);
  
  const pkg = PACKAGES[project.package] || PACKAGES.starter;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Paket: ${pkg.name}`, m, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  pkg.features.forEach(f => { checkPage(6); doc.text(`• ${f}`, m, y); y += 5; });
  
  // Addons
  const addons = project.addons || [];
  if (addons.length > 0) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Zusatzoptionen:', m, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    addons.forEach(addonId => {
      const addon = ADDONS[addonId];
      if (addon && !isFeatureIncluded(project.package, addonId)) {
        const price = getAddonPrice(addonId, project.package);
        doc.text(`• ${addon.name} (+${formatPrice(price)})`, m, y);
        y += 5;
      }
    });
  }
  
  // Extra Komponenten
  if (project.extra_components_count > 0) {
    doc.text(`• ${project.extra_components_count} Extra-Komponenten (+${formatPrice(project.extra_components_count * 50)})`, m, y);
    y += 5;
  }
  y += 10;

  // Pricing
  checkPage(60);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(196, 30, 58);
  doc.text('Vergütung', m, y);
  y += 8;
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const px = pw - m - 10;
  
  if (project.package === 'individual') {
    doc.text('Individual-Paket', m, y);
    doc.text(formatPrice(pricing.total), px, y, { align: 'right' });
    y += 6;
  } else {
    doc.text(`Paket ${pkg.name}`, m, y);
    doc.text(formatPrice(pricing.packagePrice), px, y, { align: 'right' });
    y += 6;
    if (pricing.addonsPrice > 0) {
      doc.text('Zusatzoptionen', m, y);
      doc.text(`+${formatPrice(pricing.addonsPrice)}`, px, y, { align: 'right' });
      y += 6;
    }
    if (pricing.extraComponentsPrice > 0) {
      doc.text('Extra-Komponenten', m, y);
      doc.text(`+${formatPrice(pricing.extraComponentsPrice)}`, px, y, { align: 'right' });
      y += 6;
    }
    if (pricing.discount > 0) {
      doc.setTextColor(16, 185, 129);
      doc.text('Rabatt', m, y);
      doc.text(`-${formatPrice(pricing.discount)}`, px, y, { align: 'right' });
      y += 6;
      doc.setTextColor(0);
    }
  }
  
  doc.line(m, y, pw - m, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('GESAMT (inkl. MwSt.)', m, y);
  doc.setTextColor(196, 30, 58);
  doc.text(formatPrice(pricing.total), px, y, { align: 'right' });
  y += 15;
  doc.setTextColor(0);

  // Payment
  checkPage(35);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(196, 30, 58);
  doc.text('Zahlungsbedingungen', m, y);
  y += 8;
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Zahlung in zwei Raten:', m, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`1. Rate (50%): ${formatPrice(pricing.total / 2)} bei Vertragsabschluss`, m, y);
  y += 5;
  doc.text(`2. Rate (50%): ${formatPrice(pricing.total / 2)} bei Go-Live`, m, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.text('Bankverbindung:', m, y);
  y += 5;
  doc.text('S&I. – Iver Arntzen', m, y);
  y += 5;
  doc.text('IBAN: DE XX XXXX XXXX XXXX XXXX XX', m, y);
  y += 20;

  // Signatures
  checkPage(40);
  doc.setFont('helvetica', 'normal');
  doc.text(`Hamburg, den ${new Date().toLocaleDateString('de-DE')}`, m, y);
  y += 25;
  doc.line(m, y, m + 60, y);
  doc.line(pw - m - 60, y, pw - m, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Auftragnehmer (S&I.)', m, y);
  doc.text('Auftraggeber', pw - m - 60, y);
  
  y += 15;
  doc.setFontSize(9);
  doc.text('Bitte unterschrieben per E-Mail zurücksenden an: wedding@sarahiver.de', m, y);

  // Return as base64
  return doc.output('datauristring').split(',')[1];
}

// ============================================
// BUCHUNGSÜBERSICHT FÜR E-MAIL
// ============================================
function generateBookingHTML(project, pricing, colors) {
  const pkg = PACKAGES[project.package] || PACKAGES.starter;
  const addons = project.addons || [];
  
  let bookingRows = '';
  
  // Paket
  if (project.package === 'individual') {
    bookingRows += `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Individual-Paket</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 500;">${formatPrice(pricing.total)}</td></tr>`;
  } else {
    bookingRows += `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Paket ${pkg.name}</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 500;">${formatPrice(pricing.packagePrice)}</td></tr>`;
    
    // Addons
    addons.forEach(addonId => {
      const addon = ADDONS[addonId];
      if (addon && !isFeatureIncluded(project.package, addonId)) {
        const price = getAddonPrice(addonId, project.package);
        bookingRows += `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">+ ${addon.name}</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">+${formatPrice(price)}</td></tr>`;
      }
    });
    
    // Extra Komponenten
    if (pricing.extraComponentsPrice > 0) {
      bookingRows += `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">+ ${project.extra_components_count || 0} Extra-Komponenten</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">+${formatPrice(pricing.extraComponentsPrice)}</td></tr>`;
    }
    
    // Rabatt
    if (pricing.discount > 0) {
      bookingRows += `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #10B981;">Rabatt</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; color: #10B981;">-${formatPrice(pricing.discount)}</td></tr>`;
    }
  }

  return `
    <div style="background: ${colors.light}; border: 2px solid ${colors.primary}; margin: 25px 0;">
      <div style="background: ${colors.primary}; color: #FFFFFF; padding: 12px 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
        Eure Buchung
      </div>
      <div style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          ${bookingRows}
          <tr>
            <td style="padding: 12px 0; font-weight: 700; font-size: 16px;">Gesamt</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: ${colors.accent};">${formatPrice(pricing.total)}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 13px; color: #666;">
          <p style="margin: 0 0 5px 0;"><strong>Zahlungsplan:</strong></p>
          <p style="margin: 0;">1. Rate (50%): ${formatPrice(pricing.total / 2)} – bei Vertragsabschluss</p>
          <p style="margin: 5px 0 0 0;">2. Rate (50%): ${formatPrice(pricing.total / 2)} – bei Go-Live</p>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// E-MAIL TEMPLATE GENERATOR
// ============================================
function generateEmailHTML(type, variables, theme = 'editorial') {
  const colors = THEME_COLORS[theme] || THEME_COLORS.editorial;
  const { partner1_name, partner2_name, couple_names, wedding_date, package_name, admin_url, admin_password, website_url, new_password, project, pricing } = variables;

  const name1 = partner1_name || couple_names?.split('&')[0]?.trim() || '';
  const name2 = partner2_name || couple_names?.split('&')[1]?.trim() || '';
  const greeting = name1 && name2 ? `Liebe/r ${name1}, liebe/r ${name2}` : (name1 ? `Liebe/r ${name1}` : 'Hallo');

  const header = `
    <div style="background: #0A0A0A; padding: 40px 30px; text-align: center;">
      <div style="font-family: 'Roboto', 'Arial Black', sans-serif; font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: -2px;">S&I.</div>
    </div>
  `;

  const footer = `
    <div style="background: #0A0A0A; padding: 30px; text-align: center; color: rgba(255,255,255,0.7); font-size: 12px;">
      <p style="margin: 0; font-family: 'Roboto', Arial, sans-serif;">S&I. | Premium Hochzeits-Websites</p>
      <p style="margin: 8px 0 0 0;"><a href="mailto:wedding@sarahiver.de" style="color: #FFFFFF;">wedding@sarahiver.de</a></p>
    </div>
  `;

  const button = (url, text) => `
    <p style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="display: inline-block; background: ${colors.accent}; color: #FFFFFF; padding: 16px 32px; text-decoration: none; font-family: 'Roboto', Arial, sans-serif; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        ${text}
      </a>
    </p>
  `;

  const formattedDate = wedding_date ? new Date(wedding_date).toLocaleDateString('de-DE') : 'TBD';
  const bookingHTML = project && pricing ? generateBookingHTML(project, pricing, colors) : '';

  const templates = {
    welcome: {
      subject: `Willkommen bei S&I. – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 0; background: #F5F5F5;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;">
            ${header}
            <div style="padding: 40px 30px; color: #333333; line-height: 1.7;">
              <h1 style="font-size: 24px; color: ${colors.primary}; margin: 0 0 20px 0; font-weight: 700;">Herzlich Willkommen!</h1>
              <p>${greeting},</p>
              <p>vielen Dank für euer Vertrauen! Wir freuen uns sehr, euch bei der Erstellung eurer persönlichen Hochzeits-Website begleiten zu dürfen.</p>
              
              ${bookingHTML}

              <div style="background: #FFF9E6; border-left: 4px solid #F59E0B; padding: 15px 20px; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>📎 Im Anhang:</strong> Euer Vertrag – bitte unterschrieben per E-Mail zurücksenden.</p>
              </div>

              <p>Bitte überweist die erste Rate (50%) innerhalb von 7 Tagen auf das im Vertrag angegebene Konto.</p>
              <p>In einer separaten E-Mail erhaltet ihr eure Zugangsdaten zum Admin-Dashboard.</p>

              <p style="margin-top: 30px;">Herzliche Grüße,<br><strong>Euer S&I. Team</strong></p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    },

    credentials: {
      subject: `Eure Zugangsdaten – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 0; background: #F5F5F5;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;">
            ${header}
            <div style="padding: 40px 30px; color: #333333; line-height: 1.7;">
              <h1 style="font-size: 24px; color: ${colors.primary}; margin: 0 0 20px 0; font-weight: 700;">Eure Zugangsdaten</h1>
              <p>${greeting},</p>
              <p>hier sind eure Zugangsdaten für das Admin-Dashboard:</p>
              
              <div style="background: ${colors.primary}; color: #FFFFFF; padding: 25px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7;">Login-URL</p>
                <p style="margin: 8px 0 20px 0; font-size: 14px; font-family: monospace; word-break: break-all;">${admin_url}</p>
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7;">Passwort</p>
                <p style="margin: 8px 0 0 0; font-size: 22px; font-family: monospace; font-weight: 700; letter-spacing: 2px;">${admin_password}</p>
              </div>

              <p><strong>Wichtig:</strong> Bitte bewahrt diese Daten sicher auf.</p>

              ${button(admin_url, 'Zum Dashboard →')}

              <p style="margin-top: 30px;">Herzliche Grüße,<br><strong>Euer S&I. Team</strong></p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    },

    golive: {
      subject: `🎉 Eure Hochzeits-Website ist online! – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 0; background: #F5F5F5;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;">
            ${header}
            <div style="padding: 40px 30px; color: #333333; line-height: 1.7;">
              <h1 style="font-size: 24px; color: ${colors.primary}; margin: 0 0 20px 0; font-weight: 700;">🎉 Eure Website ist live!</h1>
              <p>${greeting},</p>
              <p>großartige Neuigkeiten – eure Hochzeits-Website ist ab sofort online!</p>
              
              <div style="background: ${colors.light}; border-left: 4px solid ${colors.accent}; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; font-size: 18px; font-family: monospace; font-weight: 700; color: ${colors.primary};">${website_url}</p>
              </div>

              ${button('https://' + website_url, 'Website ansehen →')}

              <p>Ihr könnt den Link jetzt an eure Gäste weitergeben!</p>
              <p>Vergesst nicht, die zweite Rate (50%) zu überweisen.</p>

              <p style="margin-top: 30px;">Wir wünschen euch eine wunderschöne Hochzeit!<br><strong>Euer S&I. Team</strong></p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    },

    reminder: {
      subject: `Erinnerung: Inhalte für eure Website – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 0; background: #F5F5F5;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;">
            ${header}
            <div style="padding: 40px 30px; color: #333333; line-height: 1.7;">
              <h1 style="font-size: 24px; color: ${colors.primary}; margin: 0 0 20px 0; font-weight: 700;">Freundliche Erinnerung</h1>
              <p>${greeting},</p>
              <p>wir möchten euch freundlich daran erinnern, dass wir noch auf einige Inhalte für eure Hochzeits-Website warten.</p>
              
              ${button(admin_url, 'Zum Dashboard →')}

              <p>Je früher wir alle Inhalte haben, desto schneller können wir eure Website fertigstellen!</p>

              <p style="margin-top: 30px;">Herzliche Grüße,<br><strong>Euer S&I. Team</strong></p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    },

    password_reset: {
      subject: `Neues Passwort – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 0; background: #F5F5F5;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;">
            ${header}
            <div style="padding: 40px 30px; color: #333333; line-height: 1.7;">
              <h1 style="font-size: 24px; color: ${colors.primary}; margin: 0 0 20px 0; font-weight: 700;">Neues Passwort</h1>
              <p>${greeting},</p>
              <p>hier ist euer neues Passwort für das Admin-Dashboard:</p>
              
              <div style="background: ${colors.primary}; color: #FFFFFF; padding: 30px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; font-size: 28px; font-family: monospace; font-weight: 700; letter-spacing: 3px;">${new_password}</p>
              </div>

              ${button(admin_url, 'Jetzt einloggen →')}

              <p style="margin-top: 30px;">Herzliche Grüße,<br><strong>Euer S&I. Team</strong></p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    }
  };

  return templates[type] || templates.welcome;
}

// ============================================
// PRICING BERECHNEN
// ============================================
function calculatePricing(project) {
  const pkg = PACKAGES[project.package] || PACKAGES.starter;
  
  if (project.package === 'individual') {
    return { packagePrice: 0, addonsPrice: 0, extraComponentsPrice: 0, discount: 0, total: project.custom_price || 0 };
  }
  
  const addons = project.addons || [];
  let addonsPrice = 0;
  addons.forEach(addonId => {
    if (!isFeatureIncluded(project.package, addonId)) {
      addonsPrice += getAddonPrice(addonId, project.package);
    }
  });
  
  const extraCount = project.extra_components_count || 0;
  const extraOverLimit = Math.max(0, extraCount - (pkg.extraComponentsIncluded || 0));
  const extraComponentsPrice = extraOverLimit * 50;
  
  const discount = project.discount || 0;
  const total = Math.max(0, pkg.price + addonsPrice + extraComponentsPrice - discount);
  
  return { packagePrice: pkg.price, addonsPrice, extraComponentsPrice, discount, total };
}

// ============================================
// E-MAIL SENDEN VIA BREVO
// ============================================
export async function sendEmail({ to, toName, templateType, variables, theme, projectId, attachments = [] }) {
  try {
    const template = generateEmailHTML(templateType, variables, theme);
    
    const emailData = {
      sender: { name: 'S&I.', email: 'wedding@sarahiver.de' },
      to: [{ email: to, name: toName || to }],
      subject: template.subject,
      htmlContent: template.html,
    };
    
    // Attachments hinzufügen
    if (attachments.length > 0) {
      emailData.attachment = attachments;
    }
    
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    // Log speichern
    await supabase.from('email_logs').insert([{
      project_id: projectId,
      recipient_email: to,
      recipient_name: toName,
      subject: template.subject,
      template_type: templateType,
      theme: theme,
      html_content: template.html,
      variables: variables,
      status: response.ok ? 'sent' : 'failed',
      error_message: response.ok ? null : JSON.stringify(result),
      brevo_message_id: result.messageId || null,
      sent_at: response.ok ? new Date().toISOString() : null,
    }]);

    return { success: response.ok, messageId: result.messageId, error: result.message };
  } catch (error) {
    console.error('Email error:', error);
    
    await supabase.from('email_logs').insert([{
      project_id: projectId,
      recipient_email: to,
      subject: `${templateType} - Fehler`,
      template_type: templateType,
      status: 'failed',
      error_message: error.message,
    }]);

    return { success: false, error: error.message };
  }
}

// ============================================
// WILLKOMMENS-E-MAILS SENDEN (MIT VERTRAG)
// ============================================
export async function sendWelcomeEmails(project) {
  // Pricing berechnen
  const pricing = calculatePricing(project);
  
  // Vertrag als PDF generieren
  const contractBase64 = generateContractPDFBase64(project, pricing);
  const contractFilename = `SI-Vertrag-${project.slug || 'projekt'}.pdf`;
  
  const variables = {
    partner1_name: project.partner1_name,
    partner2_name: project.partner2_name,
    couple_names: project.couple_names,
    wedding_date: project.wedding_date,
    package_name: project.package,
    admin_url: `https://siwedding.de/${project.slug}/admin`,
    admin_password: project.admin_password,
    website_url: project.custom_domain || `siwedding.de/${project.slug}`,
    project: project,
    pricing: pricing,
  };

  // E-Mail 1: Willkommen + Vertrag
  const welcome = await sendEmail({
    to: project.client_email,
    toName: project.client_name,
    templateType: 'welcome',
    variables,
    theme: project.theme,
    projectId: project.id,
    attachments: [{ name: contractFilename, content: contractBase64 }],
  });

  // E-Mail 2: Zugangsdaten
  const credentials = await sendEmail({
    to: project.client_email,
    toName: project.client_name,
    templateType: 'credentials',
    variables,
    theme: project.theme,
    projectId: project.id,
  });

  return { welcome, credentials };
}

// ============================================
// WEITERE E-MAIL FUNKTIONEN
// ============================================
export async function sendGoLiveEmail(project) {
  return sendEmail({
    to: project.client_email,
    toName: project.client_name,
    templateType: 'golive',
    variables: {
      partner1_name: project.partner1_name,
      partner2_name: project.partner2_name,
      couple_names: project.couple_names,
      website_url: project.custom_domain || `siwedding.de/${project.slug}`,
    },
    theme: project.theme,
    projectId: project.id,
  });
}

export async function sendReminderEmail(project) {
  return sendEmail({
    to: project.client_email,
    toName: project.client_name,
    templateType: 'reminder',
    variables: {
      partner1_name: project.partner1_name,
      partner2_name: project.partner2_name,
      couple_names: project.couple_names,
      admin_url: `https://siwedding.de/${project.slug}/admin`,
    },
    theme: project.theme,
    projectId: project.id,
  });
}

export async function sendPasswordResetEmail(project, newPassword) {
  return sendEmail({
    to: project.client_email,
    toName: project.client_name,
    templateType: 'password_reset',
    variables: {
      partner1_name: project.partner1_name,
      partner2_name: project.partner2_name,
      couple_names: project.couple_names,
      new_password: newPassword,
      admin_url: `https://siwedding.de/${project.slug}/admin`,
    },
    theme: project.theme,
    projectId: project.id,
  });
}

// ============================================
// ADMIN-BENACHRICHTIGUNG: KUNDE HAT DATEN EINGEGEBEN
// ============================================
export async function sendDataReadyNotification(project) {
  const adminEmail = 'wedding@sarahiver.de';
  const timestamp = new Date().toLocaleString('de-DE', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
    </head>
    <body style="font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 0; background: #F5F5F5;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;">
        <div style="background: #0A0A0A; padding: 30px; text-align: center;">
          <h1 style="font-family: 'Oswald', sans-serif; font-size: 24px; color: #FFFFFF; margin: 0;">
            S&I. <span style="color: #F97316;">Admin</span>
          </h1>
        </div>
        <div style="padding: 40px 30px; color: #333333; line-height: 1.7;">
          <div style="background: #FFF7ED; border-left: 4px solid #F97316; padding: 20px; margin-bottom: 25px;">
            <h2 style="font-size: 20px; color: #C2410C; margin: 0 0 10px 0;">
              🔔 Neue Daten bereit zur Prüfung
            </h2>
            <p style="margin: 0; color: #9A3412;">
              Ein Kunde hat seine Daten eingegeben und wartet auf Finalisierung.
            </p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; font-weight: 700; width: 140px;">Projekt:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5;">${project.couple_names || project.slug}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; font-weight: 700;">Kunde:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5;">${project.client_name || '–'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; font-weight: 700;">E-Mail:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5;">${project.client_email || '–'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; font-weight: 700;">Hochzeitsdatum:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5;">${project.wedding_date ? new Date(project.wedding_date).toLocaleDateString('de-DE') : '–'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: 700;">Zeitstempel:</td>
              <td style="padding: 10px 0;">${timestamp}</td>
            </tr>
          </table>
          
          <a href="https://superadmin.siwedding.de/projects/${project.id}" 
             style="display: block; background: #F97316; color: #FFFFFF; padding: 15px 30px; 
                    text-align: center; text-decoration: none; font-weight: 700; margin: 20px 0;">
            Zum Projekt im SuperAdmin →
          </a>
          
          <p style="font-size: 0.85rem; color: #666666; margin-top: 30px;">
            Der Status wurde automatisch auf "Bereit zur Prüfung" gesetzt.
          </p>
        </div>
        <div style="background: #0A0A0A; padding: 20px; text-align: center;">
          <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5); margin: 0;">
            S&I. SuperAdmin Notification
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'S&I. System', email: 'wedding@sarahiver.de' },
        to: [{ email: adminEmail, name: 'Iver' }],
        subject: `🔔 Daten bereit: ${project.couple_names || project.slug}`,
        htmlContent: htmlContent,
      }),
    });

    const result = await response.json();

    // Log speichern
    await supabase.from('email_logs').insert([{
      project_id: project.id,
      recipient_email: adminEmail,
      recipient_name: 'Admin',
      subject: `Daten bereit: ${project.couple_names || project.slug}`,
      template_type: 'admin_data_ready',
      theme: project.theme,
      html_content: htmlContent,
      variables: { project_id: project.id, couple_names: project.couple_names, timestamp },
      status: response.ok ? 'sent' : 'failed',
      error_message: response.ok ? null : JSON.stringify(result),
      brevo_message_id: result.messageId || null,
      sent_at: response.ok ? new Date().toISOString() : null,
    }]);

    return { success: response.ok, messageId: result.messageId, error: result.message };
  } catch (error) {
    console.error('Admin notification error:', error);
    
    await supabase.from('email_logs').insert([{
      project_id: project.id,
      recipient_email: adminEmail,
      subject: `Daten bereit: ${project.couple_names || project.slug}`,
      template_type: 'admin_data_ready',
      status: 'failed',
      error_message: error.message,
    }]);

    return { success: false, error: error.message };
  }
}

export default { sendEmail, sendWelcomeEmails, sendGoLiveEmail, sendReminderEmail, sendPasswordResetEmail, sendDataReadyNotification };
