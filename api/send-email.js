// api/send-email.js
// Vercel Serverless Function für E-Mail-Versand via Brevo
// API Key ist hier sicher (nur Server-seitig)

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Erlaubte Origins
const ALLOWED_ORIGINS = [
  'https://admin.sarahiver.de',
  'https://si-superadmin.vercel.app',
  'http://localhost:3000', // Development
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

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

  // API Key prüfen
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const { to, toName, subject, htmlContent, attachments } = req.body;

    // Validierung
    if (!to || !subject || !htmlContent) {
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
      console.error('Brevo error:', result);
      return res.status(response.status).json({
        error: 'Email sending failed',
        details: result.message
      });
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Email API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
