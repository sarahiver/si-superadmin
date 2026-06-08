// api/stock-search.js
// Live-Stock von Pexels für den "Heute"-Workflow (Foto für Post, Video für Reel).
// Token-geschützt, gleiches Muster wie ai-suggest.js.
//
// POST { keywords: string[], format?: 'post'|'reel', max?: number, orientation?: string }
// -> { assets: [{ resource_type, secure_url, download_url, thumb, width, height, duration,
//                 photographer, photographer_url, pexels_url }] }
//
// ENV: PEXELS_API_KEY  (kostenlos: https://www.pexels.com/api/)

import { setCorsHeaders, verifySessionToken } from './lib/auth.js';

const PEXELS_KEY = process.env.PEXELS_API_KEY;

function buildQuery(keywords) {
  const kw = (keywords || []).map((k) => String(k).trim()).filter(Boolean).slice(0, 5).join(' ');
  return (`wedding ${kw}`).trim();
}

function pickVideoFile(files) {
  if (!files || !files.length) return null;
  // Bevorzuge Hochformat; Zielauflösung ~1080x1920 (Canvas-Größe).
  // Keine 4K-Dateien — die machen den Client-Render unnötig langsam/groß.
  const portrait = files.filter((f) => (f.height || 0) >= (f.width || 0));
  const pool = portrait.length ? portrait : files;
  return [...pool].sort(
    (a, b) => Math.abs((a.height || 0) - 1920) - Math.abs((b.height || 0) - 1920)
  )[0];
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authCheck = verifySessionToken(req);
  if (!authCheck.valid) return res.status(401).json({ error: authCheck.error });

  if (!PEXELS_KEY) return res.status(500).json({ error: 'PEXELS_API_KEY not set' });

  try {
    const { keywords = [], format = 'post', max = 6, orientation = 'portrait' } = req.body || {};
    const perPage = Math.min(Math.max(parseInt(max) || 6, 1), 15);
    const query = buildQuery(keywords);
    const isReel = format === 'reel';

    const base = isReel ? 'https://api.pexels.com/videos/search' : 'https://api.pexels.com/v1/search';
    const url = `${base}?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=${perPage}`;

    const r = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: `Pexels ${r.status}: ${txt.slice(0, 200)}` });
    }
    const data = await r.json();

    let assets = [];
    if (isReel) {
      assets = (data.videos || []).map((v) => {
        const file = pickVideoFile(v.video_files);
        return {
          resource_type: 'video',
          secure_url: file?.link || null,
          download_url: file?.link || null,
          thumb: v.image,
          width: file?.width || v.width,
          height: file?.height || v.height,
          duration: v.duration || null,
          photographer: v.user?.name || 'Pexels',
          photographer_url: v.user?.url || 'https://www.pexels.com',
          pexels_url: v.url,
        };
      }).filter((a) => a.secure_url);
    } else {
      assets = (data.photos || []).map((p) => ({
        resource_type: 'image',
        secure_url: p.src?.portrait || p.src?.large || p.src?.original,
        download_url: p.src?.original || p.src?.large2x || p.src?.large,
        thumb: p.src?.tiny || p.src?.small,
        width: p.width,
        height: p.height,
        duration: null,
        photographer: p.photographer,
        photographer_url: p.photographer_url,
        pexels_url: p.url,
      }));
    }

    return res.status(200).json({ assets, query, source: 'pexels' });
  } catch (error) {
    console.error('stock-search error:', error);
    return res.status(500).json({ error: error.message });
  }
}
