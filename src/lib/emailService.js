// src/lib/emailService.js
// Brevo E-Mail Service für S&I. wedding

import { supabase } from './supabase';

const BREVO_API_KEY = process.env.REACT_APP_BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Theme Farben
const THEME_COLORS = {
  botanical: { primary: '#1B4332', accent: '#40916C' },
  editorial: { primary: '#1A1A1A', accent: '#C41E3A' },
  contemporary: { primary: '#2C2C2C', accent: '#D4AF37' },
  luxe: { primary: '#1C1C1C', accent: '#D4AF37' },
  neon: { primary: '#0D0D0D', accent: '#FF006E' },
  video: { primary: '#000000', accent: '#E50914' },
};

// E-Mail Template Generator
function generateEmailHTML(type, variables, theme = 'editorial') {
  const colors = THEME_COLORS[theme] || THEME_COLORS.editorial;
  const { couple_names, wedding_date, package_name, admin_url, admin_password, website_url, new_password } = variables;

  const header = `
    <div style="background: ${colors.primary}; padding: 40px 30px; text-align: center;">
      <div style="font-family: Georgia, serif; font-size: 28px; color: #FFFFFF; letter-spacing: 2px;">
        S<span style="color: ${colors.accent}; font-style: italic;">&</span>I. wedding
      </div>
    </div>
  `;

  const footer = `
    <div style="background: ${colors.primary}; padding: 30px; text-align: center; color: rgba(255,255,255,0.7); font-size: 12px;">
      <p style="margin: 0;">S&I. wedding | Premium Hochzeits-Websites</p>
      <p style="margin: 5px 0 0 0;">Bei Fragen: <a href="mailto:wedding@sarahiver.de" style="color: #FFFFFF;">wedding@sarahiver.de</a></p>
    </div>
  `;

  const button = (url, text) => `
    <a href="${url}" style="display: inline-block; background: ${colors.accent}; color: #FFFFFF; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0;">
      ${text}
    </a>
  `;

  const templates = {
    welcome: {
      subject: `Willkommen bei S&I. wedding – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #F5F5F5;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;">
            ${header}
            <div style="padding: 40px 30px; color: #333333; line-height: 1.7;">
              <h1 style="font-size: 24px; color: ${colors.primary}; margin: 0 0 20px 0;">Herzlich Willkommen!</h1>
              <p>Liebe/r ${couple_names?.split('&')[0]?.trim() || 'Kunde'},</p>
              <p>vielen Dank für Ihr Vertrauen in S&I. wedding! Wir freuen uns sehr, Sie bei der Erstellung Ihrer persönlichen Hochzeits-Website begleiten zu dürfen.</p>
              
              <div style="background: #F8F8F8; border-left: 4px solid ${colors.accent}; padding: 20px; margin: 25px 0;">
                <p style="margin: 0;"><strong>Ihre Buchung:</strong></p>
                <p style="margin: 5px 0 0 0;">Paket: ${package_name || 'Standard'}</p>
                <p style="margin: 5px 0 0 0;">Hochzeitsdatum: ${wedding_date ? new Date(wedding_date).toLocaleDateString('de-DE') : 'Noch nicht festgelegt'}</p>
              </div>

              <p>Bitte überweisen Sie die erste Rate (50%) innerhalb von 7 Tagen.</p>
              <p>In einer separaten E-Mail erhalten Sie Ihre Zugangsdaten.</p>

              <p>Mit herzlichen Grüßen,<br>Ihr S&I. wedding Team</p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    },

    credentials: {
      subject: `Ihre Zugangsdaten – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #F5F5F5;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;">
            ${header}
            <div style="padding: 40px 30px; color: #333333; line-height: 1.7;">
              <h1 style="font-size: 24px; color: ${colors.primary}; margin: 0 0 20px 0;">Ihre Zugangsdaten</h1>
              <p>Liebe/r ${couple_names?.split('&')[0]?.trim() || 'Kunde'},</p>
              <p>hier sind Ihre Zugangsdaten für das Admin-Dashboard:</p>
              
              <div style="background: ${colors.primary}; color: #FFFFFF; padding: 25px; margin: 25px 0;">
                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;">Login-URL</p>
                <p style="margin: 5px 0 15px 0; font-size: 16px; font-family: monospace;">${admin_url}</p>
                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;">Passwort</p>
                <p style="margin: 5px 0 0 0; font-size: 18px; font-family: monospace; font-weight: bold;">${admin_password}</p>
              </div>

              <p><strong>Wichtig:</strong> Bitte bewahren Sie diese Daten sicher auf.</p>

              ${button(admin_url, 'Zum Dashboard →')}

              <p>Mit herzlichen Grüßen,<br>Ihr S&I. wedding Team</p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    },

    golive: {
      subject: `🎉 Ihre Hochzeits-Website ist online! – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #F5F5F5;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;">
            ${header}
            <div style="padding: 40px 30px; color: #333333; line-height: 1.7;">
              <h1 style="font-size: 24px; color: ${colors.primary}; margin: 0 0 20px 0;">🎉 Ihre Website ist live!</h1>
              <p>Liebe/r ${couple_names?.split('&')[0]?.trim() || 'Kunde'},</p>
              <p>großartige Neuigkeiten – Ihre Hochzeits-Website ist ab sofort online!</p>
              
              <div style="background: #F8F8F8; border-left: 4px solid ${colors.accent}; padding: 20px; margin: 25px 0;">
                <p style="margin: 0; font-size: 18px; font-family: monospace;">${website_url}</p>
              </div>

              ${button('https://' + website_url, 'Website ansehen →')}

              <p>Sie können den Link jetzt an Ihre Gäste weitergeben!</p>
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

    reminder: {
      subject: `Erinnerung: Inhalte für Ihre Hochzeits-Website – ${couple_names}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #F5F5F5;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;">
            ${header}
            <div style="padding: 40px 30px; color: #333333; line-height: 1.7;">
              <h1 style="font-size: 24px; color: ${colors.primary}; margin: 0 0 20px 0;">Freundliche Erinnerung</h1>
              <p>Liebe/r ${couple_names?.split('&')[0]?.trim() || 'Kunde'},</p>
              <p>wir möchten Sie freundlich daran erinnern, dass wir noch auf einige Inhalte für Ihre Hochzeits-Website warten.</p>
              
              ${button(admin_url, 'Zum Dashboard →')}

              <p>Je früher wir alle Inhalte haben, desto schneller können wir Ihre Website fertigstellen!</p>

              <p>Mit herzlichen Grüßen,<br>Ihr S&I. wedding Team</p>
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
        <body style="font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #F5F5F5;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;">
            ${header}
            <div style="padding: 40px 30px; color: #333333; line-height: 1.7;">
              <h1 style="font-size: 24px; color: ${colors.primary}; margin: 0 0 20px 0;">Neues Passwort</h1>
              <p>Liebe/r ${couple_names?.split('&')[0]?.trim() || 'Kunde'},</p>
              <p>hier ist Ihr neues Passwort für das Admin-Dashboard:</p>
              
              <div style="background: ${colors.primary}; color: #FFFFFF; padding: 25px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; font-size: 24px; font-family: monospace; font-weight: bold;">${new_password}</p>
              </div>

              ${button(admin_url, 'Jetzt einloggen →')}

              <p>Mit herzlichen Grüßen,<br>Ihr S&I. wedding Team</p>
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

// E-Mail senden via Brevo
export async function sendEmail({ to, toName, templateType, variables, theme, projectId }) {
  try {
    const template = generateEmailHTML(templateType, variables, theme);
    
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'S&I. wedding', email: 'wedding@sarahiver.de' },
        to: [{ email: to, name: toName || to }],
        subject: template.subject,
        htmlContent: template.html,
      }),
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

// Willkommens-E-Mails senden
export async function sendWelcomeEmails(project) {
  const variables = {
    couple_names: project.couple_names,
    wedding_date: project.wedding_date,
    package_name: project.package,
    admin_url: `https://siwedding.de/${project.slug}/admin`,
    admin_password: project.admin_password,
    website_url: project.custom_domain || `siwedding.de/${project.slug}`,
  };

  const welcome = await sendEmail({
    to: project.client_email,
    toName: project.client_name,
    templateType: 'welcome',
    variables,
    theme: project.theme,
    projectId: project.id,
  });

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

// Go-Live E-Mail senden
export async function sendGoLiveEmail(project) {
  return sendEmail({
    to: project.client_email,
    toName: project.client_name,
    templateType: 'golive',
    variables: {
      couple_names: project.couple_names,
      website_url: project.custom_domain || `siwedding.de/${project.slug}`,
    },
    theme: project.theme,
    projectId: project.id,
  });
}

// Erinnerungs-E-Mail senden
export async function sendReminderEmail(project) {
  return sendEmail({
    to: project.client_email,
    toName: project.client_name,
    templateType: 'reminder',
    variables: {
      couple_names: project.couple_names,
      admin_url: `https://siwedding.de/${project.slug}/admin`,
    },
    theme: project.theme,
    projectId: project.id,
  });
}

// Passwort-Reset E-Mail senden
export async function sendPasswordResetEmail(project, newPassword) {
  return sendEmail({
    to: project.client_email,
    toName: project.client_name,
    templateType: 'password_reset',
    variables: {
      couple_names: project.couple_names,
      new_password: newPassword,
      admin_url: `https://siwedding.de/${project.slug}/admin`,
    },
    theme: project.theme,
    projectId: project.id,
  });
}

export default { sendEmail, sendWelcomeEmails, sendGoLiveEmail, sendReminderEmail, sendPasswordResetEmail };
