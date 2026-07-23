// api/blog-list.js
// Liefert die Blog-Artikel von sarahiver.com als Pin-Rohstoff:
// GET ?action=list          → alle /blog/-Slugs aus der Sitemap
// GET ?action=meta&slug=X   → Title + Description aus dem prerenderten HTML
// Server-seitig (kein CORS-Problem), 1h-Cache im Function-Scope.
import { setCorsHeaders, verifySessionToken } from './lib/auth.js';

const SITE = 'https://www.sarahiver.com';
let cache = { slugs: null, ts: 0, meta: {} };
const CACHE_MS = 60 * 60 * 1000;

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = verifySessionToken(req);
  if (!auth.valid) return res.status(401).json({ error: auth.error });

  const { action, slug } = req.query;

  try {
    if (action === 'list') {
      if (!cache.slugs || Date.now() - cache.ts > CACHE_MS) {
        const xml = await fetch(`${SITE}/sitemap.xml`).then(r => r.text());
        const slugs = [...xml.matchAll(/\/blog\/([a-z0-9-]+)/g)]
          .map(m => m[1])
          .filter((s, i, arr) => arr.indexOf(s) === i);
        cache.slugs = slugs;
        cache.ts = Date.now();
      }
      return res.status(200).json({ slugs: cache.slugs });
    }

    if (action === 'meta') {
      if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Ungültiger slug' });
      }
      if (!cache.meta[slug]) {
        const html = await fetch(`${SITE}/blog/${slug}`).then(r => r.text());
        const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || slug;
        const description =
          (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
        cache.meta[slug] = {
          slug,
          url: `${SITE}/blog/${slug}`,
          title: title.replace(/\s*\|\s*S&amp;I\..*$/, '').replace(/&amp;/g, '&').trim(),
          description: description.replace(/&amp;/g, '&'),
        };
      }
      return res.status(200).json(cache.meta[slug]);
    }

    return res.status(400).json({ error: 'action=list oder action=meta&slug=... erwartet' });
  } catch (err) {
    console.error('blog-list error:', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
}
