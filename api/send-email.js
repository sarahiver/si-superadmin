// api/send-email.js
// Vercel Serverless Function für E-Mail-Versand via Brevo
// API Key ist hier sicher (nur Server-seitig)

import { setCorsHeaders, verifySessionToken } from './lib/auth.js';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export default async function handler(req, res) {
  // CORS Headers setzen
  setCorsHeaders(req, res);

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Nur POST erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Token-Auth
  const auth = verifySessionToken(req);
  if (!auth.valid) return res.status(401).json({ error: auth.error });

  // API Key prüfen
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const { to, toName, subject, htmlContent, attachments } = req.body;

    console.log(`[send-email] To: ${to}, Subject: ${subject?.substring(0, 50)}, Attachments: ${attachments?.length || 0}`);

    // Validierung
    if (!to || !subject || !htmlContent) {
      console.log('[send-email] Missing fields:', { to: !!to, subject: !!subject, htmlContent: !!htmlContent });
      return res.status(400).json({ error: 'Missing required fields: to, subject, htmlContent' });
    }

    // E-Mail Payload für Brevo
    const emailData = {
      sender: { name: 'S&I.', email: 'wedding@sarahiver.de' },
      to: [{ email: to, name: toName || to }],
      subject: subject,
      htmlContent: htmlContent,
    };

    // Attachments hinzufügen (Base64 encoded)
    if (attachments && attachments.length > 0) {
      emailData.attachment = attachments.map(att => ({
        name: att.name,
        content: att.content, // Base64
      }));
      console.log(`[send-email] Attachments: ${attachments.map(a => `${a.name} (${a.content?.length || 0} chars)`).join(', ')}`);
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

    if (!response.ok) {
      console.error('[send-email] Brevo error:', JSON.stringify(result));
      return res.status(response.status).json({
        error: 'Email sending failed',
        details: result.message || JSON.stringify(result)
      });
    }

    console.log(`[send-email] Success: messageId=${result.messageId}`);

    return res.status(200).json({
      success: true,
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Email API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
