// api/ai-suggest.js
// Vercel Serverless Function — Proxy für Anthropic API (CORS-Lösung)

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY missing from environment');
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in Vercel environment' });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt in request body' });
    }

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Anthropic API error:', apiResponse.status, JSON.stringify(data));
      return res.status(apiResponse.status).json({
        error: data.error?.message || `Anthropic API returned ${apiResponse.status}`,
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
