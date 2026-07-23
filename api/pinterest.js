// api/pinterest.js
// Pinterest-Publishing für den SuperAdmin — EINE Function für alles
// (Vercel-Hobby-Limit: max. 12 Functions):
//   - Boards, Publish, Queue (Admin-Auth)
//   - Blog-Artikel-Liste/-Meta als Pin-Rohstoff (Admin-Auth)
//   - Cron-Publishing (Vercel-Cron ruft diesen Pfad direkt auf)
// Tabelle: pinterest_queue — SQL siehe ANLEITUNG-PINTEREST.md.
// Env: PINTEREST_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY,
//      CRON_SECRET, PINTEREST_PINS_PER_DAY
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifySessionToken } from './lib/auth.js';

const PINTEREST_API = 'https://api.pinterest.com/v5';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Pinterest-Helpers (auch vom Cron genutzt) ──
export async function pinterestFetch(path, options = {}) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) throw new Error('PINTEREST_ACCESS_TOKEN nicht gesetzt');
  const res = await fetch(`${PINTEREST_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Pinterest API ${res.status}`);
  }
  return data;
}

export async function createPin({ board_id, title, description, link, image_base64 }) {
  return pinterestFetch('/pins', {
    method: 'POST',
    body: JSON.stringify({
      board_id,
      title: (title || '').slice(0, 100),
      description: (description || '').slice(0, 800),
      link,
      media_source: {
        source_type: 'image_base64',
        content_type: 'image/png',
        data: image_base64,
      },
    }),
  });
}

export async function publishQueueRow(row) {
  try {
    const pin = await createPin({
      board_id: row.board_id,
      title: row.title,
      description: row.description,
      link: row.link,
      image_base64: row.image_data,
    });
    await supabase
      .from('pinterest_queue')
      .update({
        status: 'published',
        pin_id: pin.id || null,
        published_at: new Date().toISOString(),
        image_data: null, // Base64 nach Erfolg löschen — spart DB-Platz
        error: null,
      })
      .eq('id', row.id);
    return { ok: true, pin_id: pin.id };
  } catch (err) {
    await supabase
      .from('pinterest_queue')
      .update({ status: 'failed', error: String(err.message || err) })
      .eq('id', row.id);
    return { ok: false, error: String(err.message || err) };
  }
}

// Duplikat-Schutz: gleicher Titel + Link innerhalb von 14 Tagen → ablehnen.
// (Pinterest wertet exakte Duplikate als Spam-Signal; Varianten mit anderer
// Headline/anderem Layout sind ausdrücklich ok und laufen durch.)
async function isDuplicate({ title, link }) {
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const { data } = await supabase
    .from('pinterest_queue')
    .select('id')
    .eq('title', title)
    .eq('link', link)
    .neq('status', 'failed')
    .gte('created_at', since)
    .limit(1);
  return (data || []).length > 0;
}

// ── Blog-Artikel als Pin-Rohstoff (vorher api/blog-list.js) ──
const SITE = 'https://www.sarahiver.com';
let blogCache = { slugs: null, ts: 0, meta: {} };
const BLOG_CACHE_MS = 60 * 60 * 1000;

async function getBlogSlugs() {
  if (!blogCache.slugs || Date.now() - blogCache.ts > BLOG_CACHE_MS) {
    const xml = await fetch(`${SITE}/sitemap.xml`).then(r => r.text());
    blogCache.slugs = [...xml.matchAll(/\/blog\/([a-z0-9-]+)/g)]
      .map(m => m[1])
      .filter((v, i, arr) => arr.indexOf(v) === i);
    blogCache.ts = Date.now();
  }
  return blogCache.slugs;
}

async function getBlogMeta(slug) {
  if (!blogCache.meta[slug]) {
    const html = await fetch(`${SITE}/blog/${slug}`).then(r => r.text());
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || slug;
    const description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
    blogCache.meta[slug] = {
      slug,
      url: `${SITE}/blog/${slug}`,
      title: title.replace(/\s*\|\s*S&amp;I\..*$/, '').replace(/&amp;/g, '&').trim(),
      description: description.replace(/&amp;/g, '&'),
    };
  }
  return blogCache.meta[slug];
}

// ── Cron: fällige Pins veröffentlichen (vorher api/pinterest-cron.js) ──
async function runCron() {
  const perDay = Math.max(1, parseInt(process.env.PINTEREST_PINS_PER_DAY || '1', 10));
  const today = new Date().toISOString().slice(0, 10);
  const { data: due, error } = await supabase
    .from('pinterest_queue')
    .select('*')
    .eq('status', 'queued')
    .or(`scheduled_date.is.null,scheduled_date.lte.${today}`)
    .order('scheduled_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(perDay);
  if (error) throw error;
  const results = [];
  for (const row of due || []) {
    // sequenziell, um Rate-Limits zu schonen
    // eslint-disable-next-line no-await-in-loop
    const r = await publishQueueRow(row);
    results.push({ id: row.id, title: row.title, ...r });
  }
  return { published: results.length, results };
}

export default async function handler(req, res) {
  // ── Cron-Aufruf: Vercel-Cron-Header oder Bearer CRON_SECRET (keine Admin-Session) ──
  const bearer = (req.headers['authorization'] || '').replace('Bearer ', '');
  const isCronCall =
    !!req.headers['x-vercel-cron'] ||
    (process.env.CRON_SECRET && bearer === process.env.CRON_SECRET);
  if (isCronCall) {
    try {
      const result = await runCron();
      return res.status(200).json(result);
    } catch (err) {
      console.error('Pinterest cron error:', err);
      return res.status(500).json({ error: String(err.message || err) });
    }
  }

  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = verifySessionToken(req);
  if (!auth.valid) return res.status(401).json({ error: auth.error });

  const action = req.method === 'GET' ? req.query.action : req.body?.action;

  try {
    // ── Boards laden ──
    if (action === 'boards') {
      const data = await pinterestFetch('/boards?page_size=100');
      return res.status(200).json({
        boards: (data.items || []).map(b => ({ id: b.id, name: b.name })),
      });
    }

    // ── Direkt veröffentlichen ──
    if (action === 'publish') {
      const { board_id, board_name, title, description, link, image_base64 } = req.body;
      if (!board_id || !title || !link || !image_base64) {
        return res.status(400).json({ error: 'board_id, title, link und image_base64 sind Pflicht' });
      }
      if (await isDuplicate({ title, link })) {
        return res.status(409).json({ error: 'Duplikat: gleicher Titel + Link wurde in den letzten 14 Tagen bereits gepinnt. Headline, Layout oder Bild variieren.' });
      }
      const pin = await createPin({ board_id, title, description, link, image_base64 });
      // Historie: auch Direkt-Pins landen in der Tabelle (für Übersicht + Dedupe)
      await supabase.from('pinterest_queue').insert({
        board_id,
        board_name: board_name || null,
        title,
        description: description || null,
        link,
        status: 'published',
        pin_id: pin.id || null,
        published_at: new Date().toISOString(),
      });
      return res.status(200).json({ ok: true, pin_id: pin.id });
    }

    // ── In Queue legen ──
    if (action === 'queue_add') {
      const { board_id, board_name, title, description, link, image_base64, scheduled_date } = req.body;
      if (!board_id || !title || !link || !image_base64) {
        return res.status(400).json({ error: 'board_id, title, link und image_base64 sind Pflicht' });
      }
      if (await isDuplicate({ title, link })) {
        return res.status(409).json({ error: 'Duplikat: gleicher Titel + Link ist bereits in Queue oder wurde kürzlich gepinnt. Headline, Layout oder Bild variieren.' });
      }
      const { data, error } = await supabase
        .from('pinterest_queue')
        .insert({
          board_id,
          board_name: board_name || null,
          title,
          description: description || null,
          link,
          image_data: image_base64,
          scheduled_date: scheduled_date || null,
          status: 'queued',
        })
        .select('id')
        .single();
      if (error) throw error;
      return res.status(200).json({ ok: true, id: data.id });
    }

    // ── Queue anzeigen ──
    if (action === 'queue_list') {
      const { data, error } = await supabase
        .from('pinterest_queue')
        .select('id, created_at, scheduled_date, status, title, link, board_name, pin_id, error, published_at')
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return res.status(200).json({ items: data });
    }

    // ── Queue-Eintrag löschen ──
    if (action === 'queue_delete') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id fehlt' });
      const { error } = await supabase.from('pinterest_queue').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    // ── Queue-Eintrag sofort veröffentlichen ──
    if (action === 'queue_publish_now') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id fehlt' });
      const { data: row, error } = await supabase
        .from('pinterest_queue')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !row) return res.status(404).json({ error: 'Eintrag nicht gefunden' });
      if (row.status === 'published') return res.status(400).json({ error: 'Bereits veröffentlicht' });
      if (!row.image_data) return res.status(400).json({ error: 'Bilddaten fehlen (Eintrag neu anlegen)' });
      const result = await publishQueueRow(row);
      return res.status(result.ok ? 200 : 500).json(result);
    }

    // ── Blog-Rohstoff ──
    if (action === 'blog_list') {
      const slugs = await getBlogSlugs();
      return res.status(200).json({ slugs });
    }
    if (action === 'blog_meta') {
      const { slug } = req.query;
      if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Ungültiger slug' });
      }
      return res.status(200).json(await getBlogMeta(slug));
    }

    return res.status(400).json({ error: `Unbekannte action: ${action}` });
  } catch (err) {
    console.error('Pinterest API error:', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
}
