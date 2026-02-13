// api/brevo-sync.js
// Vercel Serverless Function - holt Brevo Transaktions-Events per API
// Wird vom "🔄 Sync"-Button im SuperAdmin aufgerufen

const BREVO_API_KEY = process.env.BREVO_API_KEY;

const ALLOWED_ORIGINS = [
  'https://admin.sarahiver.de',
  'https://si-superadmin.vercel.app',
  'https://superadmin.siwedding.de',
  'http://localhost:3000',
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || (origin && origin.endsWith('.vercel.app'));
  if (isAllowed) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!BREVO_API_KEY) {
    return res.status(500).json({ error: 'BREVO_API_KEY not configured' });
  }

  try {
    const { email, days = 7, limit = 50 } = req.query;
    
    // Brevo Transactional Events API
    // Docs: https://developers.brevo.com/reference/gettransacemailevents
    const params = new URLSearchParams({
      limit: String(Math.min(parseInt(limit) || 50, 100)),
      sort: 'desc',
    });

    if (email) {
      params.set('email', email);
    }

    // Date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    params.set('startDate', startDate.toISOString().split('T')[0]);
    params.set('endDate', new Date().toISOString().split('T')[0]);

    const url = `https://api.brevo.com/v3/smtp/statistics/events?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[brevo-sync] API error:', response.status, errData);
      return res.status(response.status).json({ 
        error: 'Brevo API error', 
        details: errData.message || response.statusText 
      });
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      events: data.events || [],
      count: (data.events || []).length,
    });

  } catch (error) {
    console.error('[brevo-sync] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
