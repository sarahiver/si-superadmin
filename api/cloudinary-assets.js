// api/cloudinary-assets.js
// Sucht in der Cloudinary-Mediathek das passende Bild/Video zu KI-Vorschlägen.
// Server-seitig (API-Secret), Token-geschützt — gleiches Muster wie ai-suggest.js.
//
// POST { keywords: string[], theme?: string, format?: 'post'|'reel', max?: number }
// -> { assets: [{ public_id, resource_type, format, secure_url, width, height, duration, tags }] }
//
// ENV:
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
//   CLOUDINARY_FOLDER   (optional — Mediathek-Ordner, z.B. "content")

import { setCorsHeaders, verifySessionToken } from './lib/auth.js';

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = process.env.CLOUDINARY_FOLDER || '';

function sanitizeTokens(keywords) {
  const out = [];
  (keywords || []).forEach((k) => {
    String(k)
      .toLowerCase()
      .split(/[^a-z0-9äöüß]+/i)
      .forEach((tok) => {
        const t = tok.trim();
        if (t.length >= 2 && !out.includes(t)) out.push(t);
      });
  });
  return out.slice(0, 10);
}

async function cloudinarySearch(expression, maxResults) {
  const auth = Buffer.from(`${KEY}:${SECRET}`).toString('base64');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/resources/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({
      expression,
      max_results: maxResults,
      with_field: ['tags', 'context'],
      sort_by: [{ created_at: 'desc' }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Cloudinary ${res.status}: ${txt.slice(0, 300)}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authCheck = verifySessionToken(req);
  if (!authCheck.valid) return res.status(401).json({ error: authCheck.error });

  if (!CLOUD || !KEY || !SECRET) {
    return res.status(500).json({ error: 'Cloudinary env vars not set (CLOUD_NAME / API_KEY / API_SECRET)' });
  }

  try {
    const { keywords = [], theme, format = 'post', max = 6 } = req.body || {};
    const maxResults = Math.min(Math.max(parseInt(max) || 6, 1), 12);
    const resourceType = format === 'reel' ? 'video' : 'image';

    const tokens = sanitizeTokens([...(keywords || []), theme].filter(Boolean));
    const folderClause = FOLDER ? ` AND folder:${FOLDER}/*` : '';
    const tagClause = tokens.length ? ` AND (${tokens.map((t) => `tags:${t}*`).join(' OR ')})` : '';

    // 1) Gezielte Suche nach passenden Tags
    let data = await cloudinarySearch(`resource_type:${resourceType}${folderClause}${tagClause}`, maxResults);

    // 2) Fallback: nichts gematcht -> wenigstens die Mediathek (nach Tags egal)
    if ((!data.resources || data.resources.length === 0) && tagClause) {
      data = await cloudinarySearch(`resource_type:${resourceType}${folderClause}`, maxResults);
    }

    // Relevanz-Ranking: Tag-Überschneidung mit den gewünschten Tokens
    const want = new Set(tokens);
    const assets = (data.resources || [])
      .map((r) => {
        const tags = r.tags || [];
        const overlap = tags.reduce((n, tag) => (want.has(String(tag).toLowerCase()) ? n + 1 : n), 0);
        return {
          public_id: r.public_id,
          resource_type: r.resource_type,
          format: r.format,
          secure_url: r.secure_url,
          width: r.width,
          height: r.height,
          duration: r.duration || null,
          tags,
          _score: overlap,
        };
      })
      .sort((a, b) => b._score - a._score);

    return res.status(200).json({ assets, query: tokens });
  } catch (error) {
    console.error('cloudinary-assets error:', error);
    return res.status(500).json({ error: error.message });
  }
}
