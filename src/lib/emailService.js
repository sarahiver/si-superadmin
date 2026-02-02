// src/lib/emailService.js
// Brevo E-Mail Service für S&I. wedding SuperAdmin

import { supabase } from './supabase';

const BREVO_API_KEY = process.env.REACT_APP_BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// ============================================
// THEME FARBEN
// ============================================
const THEME_COLORS = {
  botanical: { primary: '#1B4332', secondary: '#2D6A4F', accent: '#40916C', bg: '#F8FDF9' },
  editorial: { primary: '#1A1A1A', secondary: '#333333', accent: '#C41E3A', bg: '#FAFAFA' },
  contemporary: { primary: '#2C2C2C', secondary: '#4A4A4A', accent: '#D4AF37', bg: '#FFFFFF' },
  luxe: { primary: '#1C1C1C', secondary: '#8B7355', accent: '#D4AF37', bg: '#FAF8F5' },
  neon: { primary: '#0D0D0D', secondary: '#1A1A2E', accent: '#FF006E', bg: '#F5F5F5' },
  video: { primary: '#000000', secondary: '#1A1A1A', accent: '#E50914', bg: '#FFFFFF' },
};

// ============================================
// E-MAIL TEMPLATES
// ============================================
function getEmailTemplate(type, variables, theme = 'editorial') {
  const colors = THEME_COLORS[theme] || THEME_COLORS.editorial;
  const { couple_names, wedding_date, package_name, admin_url, admin_password, website_url, new_password, custom_message } = variables;

  const baseStyle = `
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: ${colors.bg}; }
      .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
      .header { background: ${colors.primary}; padding: 40px 30px; text-align: center; }
      .logo { font-family: 'Georgia', serif; font-size: 28px; color: #FFFFFF; letter-spacing: 2px; }
      .logo span { color: ${colors.accent}; font-style: italic; }
      .content { padding: 40px 30px; color: #333333; line-height: 1.7; }
      .content h1 { font-size: 24px; color: ${colors.primary}; margin: 0 0 20px 0; }
      .content p { margin: 0 0 15px 0; }
      .highlight-box { background: ${colors.bg}; border-left: 4px solid ${colors.accent}; padding: 20px; margin: 25px 0; }
      .credentials { background: ${colors.primary}; color: #FFFFFF; padding: 25px; margin: 25px 0; }
      .credentials p { margin: 5px 0; color: #FFFFFF; }
      .credentials .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
      .credentials .value { font-size: 18px; font-weight: bold; font-family: monospace; }
      .button { display: inline-block; background: ${colors.accent}; color: #FFFFFF; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0; }
      .footer { background: ${colors.primary}; padding: 30px; text-align: center; color: rgba(255,255,255,0.7); font-size: 12px; }
      .footer a { color: #FFFFFF; }
    </style>
  `;

  const header = `
    <div class="header">
      <div class="logo">S<span>&</span>I. wedding</div>
    </div>
  `;

  const footer = `
    <div class="footer">
      <p>S&I. wedding | Premium Hochzeits-Websites</p>
      <p>Bei Fragen: <a href="mailto:hello@siwedding.de">hello@siwedding.de</a></p>
    </div>
  `;

  const templates = {
    // ========== WILLKOMMEN ==========
    welcome: {
      subject: `Willkommen bei S&I. wedding – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            ${header}
            <div class="content">
              <h1>Herzlich Willkommen!</h1>
              <p>Liebe/r ${couple_names?.split('&')[0]?.trim() || 'Kunde'},</p>
              <p>vielen Dank für Ihr Vertrauen in S&I. wedding! Wir freuen uns sehr, Sie bei der Erstellung Ihrer persönlichen Hochzeits-Website begleiten zu dürfen.</p>
              
              <div class="highlight-box">
                <p><strong>Ihre Buchung:</strong></p>
                <p>Paket: ${package_name || 'Standard'}</p>
                <p>Hochzeitsdatum: ${wedding_date ? new Date(wedding_date).toLocaleDateString('de-DE') : 'Noch nicht festgelegt'}</p>
              </div>

              <p>Im Anhang finden Sie:</p>
              <ul>
                <li>Ihren persönlichen Vertrag</li>
                <li>Unsere Allgemeinen Geschäftsbedingungen</li>
              </ul>

              <p>Bitte überweisen Sie die erste Rate (50%) innerhalb von 7 Tagen, damit wir mit der Erstellung beginnen können.</p>

              <p>In einer separaten E-Mail erhalten Sie Ihre Zugangsdaten zum Admin-Bereich.</p>

              <p>Mit herzlichen Grüßen,<br>Ihr S&I. wedding Team</p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    },

    // ========== ZUGANGSDATEN ==========
    credentials: {
      subject: `Ihre Zugangsdaten – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            ${header}
            <div class="content">
              <h1>Ihre Zugangsdaten</h1>
              <p>Liebe/r ${couple_names?.split('&')[0]?.trim() || 'Kunde'},</p>
              <p>hier sind Ihre persönlichen Zugangsdaten für das Admin-Dashboard Ihrer Hochzeits-Website:</p>
              
              <div class="credentials">
                <p class="label">Login-URL</p>
                <p class="value">${admin_url || 'siwedding.de/ihre-seite/admin'}</p>
                <br>
                <p class="label">Passwort</p>
                <p class="value">${admin_password || '********'}</p>
              </div>

              <p><strong>Wichtig:</strong> Bitte bewahren Sie diese Daten sicher auf und teilen Sie sie nicht mit Dritten.</p>

              <a href="${admin_url}" class="button">Zum Dashboard →</a>

              <p>Im Dashboard können Sie:</p>
              <ul>
                <li>Ihre Hochzeitsinformationen eintragen</li>
                <li>Fotos hochladen</li>
                <li>RSVPs verwalten</li>
                <li>und vieles mehr...</li>
              </ul>

              <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung!</p>

              <p>Mit herzlichen Grüßen,<br>Ihr S&I. wedding Team</p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    },

    // ========== GO LIVE ==========
    golive: {
      subject: `🎉 Ihre Hochzeits-Website ist online! – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            ${header}
            <div class="content">
              <h1>🎉 Ihre Website ist live!</h1>
              <p>Liebe/r ${couple_names?.split('&')[0]?.trim() || 'Kunde'},</p>
              <p>großartige Neuigkeiten – Ihre persönliche Hochzeits-Website ist ab sofort online!</p>
              
              <div class="highlight-box">
                <p><strong>Ihre Website:</strong></p>
                <p style="font-size: 20px; font-family: monospace;">${website_url}</p>
              </div>

              <a href="https://${website_url}" class="button">Website ansehen →</a>

              <p>Sie können den Link jetzt an Ihre Gäste weitergeben. Die RSVP-Funktion ist aktiviert und Sie werden über neue Anmeldungen informiert.</p>

              <p>Vergessen Sie nicht, die zweite Rate (50%) zu überweisen.</p>

              <p>Wir wünschen Ihnen eine wunderschöne Hochzeit!</p>

              <p>Mit herzlichen Grüßen,<br>Ihr S&I. wedding Team</p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    },

    // ========== ERINNERUNG ==========
    reminder: {
      subject: `Erinnerung: Inhalte für Ihre Hochzeits-Website – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            ${header}
            <div class="content">
              <h1>Freundliche Erinnerung</h1>
              <p>Liebe/r ${couple_names?.split('&')[0]?.trim() || 'Kunde'},</p>
              <p>wir möchten Sie freundlich daran erinnern, dass wir noch auf einige Inhalte für Ihre Hochzeits-Website warten.</p>
              
              <p>Bitte loggen Sie sich in Ihr Dashboard ein und vervollständigen Sie Ihre Informationen:</p>

              <a href="${admin_url}" class="button">Zum Dashboard →</a>

              <p>Je früher wir alle Inhalte haben, desto schneller können wir Ihre Website fertigstellen!</p>

              <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>

              <p>Mit herzlichen Grüßen,<br>Ihr S&I. wedding Team</p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    },

    // ========== PASSWORT RESET ==========
    password_reset: {
      subject: `Neues Passwort für Ihr Dashboard – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            ${header}
            <div class="content">
              <h1>Neues Passwort</h1>
              <p>Liebe/r ${couple_names?.split('&')[0]?.trim() || 'Kunde'},</p>
              <p>Sie haben ein neues Passwort für Ihr Admin-Dashboard angefordert.</p>
              
              <div class="credentials">
                <p class="label">Ihr neues Passwort</p>
                <p class="value">${new_password || '********'}</p>
              </div>

              <a href="${admin_url}" class="button">Jetzt einloggen →</a>

              <p><strong>Wichtig:</strong> Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. Ihr altes Passwort bleibt dann gültig.</p>

              <p>Mit herzlichen Grüßen,<br>Ihr S&I. wedding Team</p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    },

    // ========== CUSTOM ==========
    custom: {
      subject: variables.custom_subject || `Nachricht von S&I. wedding – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            ${header}
            <div class="content">
              <h1>${variables.custom_title || 'Nachricht'}</h1>
              <p>Liebe/r ${couple_names?.split('&')[0]?.trim() || 'Kunde'},</p>
              
              ${custom_message || '<p>Keine Nachricht angegeben.</p>'}

              ${admin_url ? `<a href="${admin_url}" class="button">Zum Dashboard →</a>` : ''}

              <p>Mit herzlichen Grüßen,<br>Ihr S&I. wedding Team</p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    }
  };

  return templates[type] || templates.custom;
}

// ============================================
// E-MAIL SENDEN VIA BREVO
// ============================================
export async function sendEmail({ 
  to, 
  toName, 
  templateType, 
  variables, 
  theme = 'editorial',
  attachments = [],
  projectId 
}) {
  try {
    const template = getEmailTemplate(templateType, variables, theme);
    
    const emailData = {
      sender: { name: 'S&I. wedding', email: 'hello@siwedding.de' },
      to: [{ email: to, name: toName || to }],
      subject: template.subject,
      htmlContent: template.html,
    };

    // Attachments hinzufügen falls vorhanden
    if (attachments.length > 0) {
      emailData.attachment = attachments.map(att => ({
        name: att.name,
        content: att.content, // Base64 encoded
      }));
    }

    // An Brevo senden
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

    // Log in Supabase speichern
    const logEntry = {
      project_id: projectId,
      recipient_email: to,
      recipient_name: toName,
      subject: template.subject,
      template_type: templateType,
      theme: theme,
      html_content: template.html,
      attachments: attachments.map(a => a.name),
      variables: variables,
      status: response.ok ? 'sent' : 'failed',
      error_message: response.ok ? null : JSON.stringify(result),
      brevo_message_id: result.messageId || null,
      sent_at: response.ok ? new Date().toISOString() : null,
    };

    await supabase.from('email_logs').insert([logEntry]);

    // Projekt aktualisieren
    if (projectId) {
      await supabase
        .from('projects')
        .update({ last_email_sent_at: new Date().toISOString() })
        .eq('id', projectId);
    }

    return { 
      success: response.ok, 
      messageId: result.messageId,
      error: response.ok ? null : result.message 
    };

  } catch (error) {
    console.error('Email send error:', error);
    
    // Fehler loggen
    await supabase.from('email_logs').insert([{
      project_id: projectId,
      recipient_email: to,
      subject: 'Fehler beim Senden',
      template_type: templateType,
      status: 'failed',
      error_message: error.message,
    }]);

    return { success: false, error: error.message };
  }
}

// ============================================
// HELPER: E-MAIL LOGS ABRUFEN
// ============================================
export async function getEmailLogs(projectId = null) {
  let query = supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function getEmailLogById(id) {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

// ============================================
// HELPER: TEMPLATE VORSCHAU
// ============================================
export function getEmailPreview(templateType, variables, theme = 'editorial') {
  const template = getEmailTemplate(templateType, variables, theme);
  return template;
}

// ============================================
// AUTOMATISCHE E-MAILS
// ============================================
export async function sendWelcomeEmails(project) {
  const variables = {
    couple_names: project.couple_names,
    wedding_date: project.wedding_date,
    package_name: project.package,
    admin_url: `https://siwedding.de/${project.slug}/admin`,
    admin_password: project.admin_password,
    website_url: project.custom_domain || `siwedding.de/${project.slug}`,
  };

  // E-Mail 1: Willkommen + Vertrag
  const welcome = await sendEmail({
    to: project.client_email,
    toName: project.client_name,
    templateType: 'welcome',
    variables,
    theme: project.theme,
    projectId: project.id,
    // attachments: [{ name: 'Vertrag.pdf', content: base64Contract }]
  });

  // E-Mail 2: Zugangsdaten (mit Verzögerung)
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

export async function sendGoLiveEmail(project) {
  const variables = {
    couple_names: project.couple_names,
    website_url: project.custom_domain || `siwedding.de/${project.slug}`,
  };

  return sendEmail({
    to: project.client_email,
    toName: project.client_name,
    templateType: 'golive',
    variables,
    theme: project.theme,
    projectId: project.id,
  });
}

export default { sendEmail, getEmailLogs, getEmailLogById, getEmailPreview, sendWelcomeEmails, sendGoLiveEmail };
