// api/pinterest.js
// Pinterest-Publishing für den SuperAdmin — EINE Function für alles
// (Vercel-Hobby-Limit: max. 12 Functions):
//   - Boards, Publish, Queue (Admin-Auth)
//   - Blog-Artikel-Liste/-Meta als Pin-Rohstoff (Admin-Auth)
//   - Cron-Publishing (Vercel-Cron ruft diesen Pfad direkt auf)
//   - OAuth-Anbindung (Start + Callback) — bewusst in DIESER Function, damit
//     das Vercel-Hobby-Limit von 12 Functions nicht gesprengt wird
// Tabellen: pinterest_queue, pinterest_tokens — SQL siehe ANLEITUNG-PINTEREST.md.
// Env: PINTEREST_APP_ID, PINTEREST_APP_SECRET, PINTEREST_REDIRECT_URI,
//      PINTEREST_SCOPES (optional), SUPABASE_URL, SUPABASE_SERVICE_KEY,
//      ADMIN_JWT_SECRET, CRON_SECRET, PINTEREST_PINS_PER_DAY
//      PINTEREST_ACCESS_TOKEN nur noch als Notfall-Fallback.
import { createHmac, timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifySessionToken } from './lib/auth.js';

const PINTEREST_API = 'https://api.pinterest.com/v5';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH / TOKEN-VERWALTUNG
// ─────────────────────────────────────────────────────────────────────────────
// Warum: Die im Entwickler-Portal per Button erzeugten Tokens laufen nach
// 24 Stunden ab und haben nur Lese-Scopes — für den Cron also unbrauchbar.
// Der Authorization-Code-Flow liefert stattdessen einen Refresh Token, mit dem
// sich das Access Token selbst erneuert.
//
// Redirect-URI im Pinterest-Portal eintragen (exakt, ohne Query-Parameter):
//   https://admin.sarahiver.de/api/pinterest
// Pinterest hängt ?code=... an — daran erkennen wir den Callback.
const PINTEREST_OAUTH = 'https://www.pinterest.com/oauth/';
const TOKEN_ROW_ID = 'default';

// Schreiben (pins:write, boards:write) im Trial erzeugt Pins, die NUR für den
// Ersteller sichtbar sind. Öffentlich sichtbar wird es erst mit Standard-Zugriff.
const DEFAULT_SCOPES = 'user_accounts:read,pins:read,boards:read,pins:write,boards:write';

const redirectUri = () =>
  process.env.PINTEREST_REDIRECT_URI || 'https://admin.sarahiver.de/api/pinterest';

// ── Signierter state: schützt den Flow vor CSRF, ohne zusätzliche Tabelle ──
const STATE_TTL_MS = 10 * 60 * 1000;

function signState(ts) {
  return createHmac('sha256', process.env.ADMIN_JWT_SECRET || '').update(String(ts)).digest('hex');
}

function createState() {
  const ts = Date.now();
  return `${ts}.${signState(ts)}`;
}

function verifyState(state) {
  if (!state || !state.includes('.')) return false;
  const [ts, sig] = state.split('.');
  if (!/^\d+$/.test(ts)) return false;
  if (Date.now() - Number(ts) > STATE_TTL_MS) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(signState(ts));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ── Token-Speicher (Supabase, Service Role — nie im Frontend) ──
async function loadTokenRow() {
  const { data } = await supabase
    .from('pinterest_tokens')
    .select('*')
    .eq('id', TOKEN_ROW_ID)
    .maybeSingle();
  return data || null;
}

async function saveTokenRow(tokens, previousRefresh) {
  const row = {
    id: TOKEN_ROW_ID,
    access_token: tokens.access_token,
    // Pinterest schickt beim Refresh nicht immer einen neuen Refresh Token
    refresh_token: tokens.refresh_token || previousRefresh,
    expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    scope: tokens.scope || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('pinterest_tokens').upsert(row);
  if (error) throw error;
  tokenCache = { value: row.access_token, until: new Date(row.expires_at).getTime() };
  return row;
}

async function tokenRequest(body) {
  const id = process.env.PINTEREST_APP_ID;
  const secret = process.env.PINTEREST_APP_SECRET;
  if (!id || !secret) throw new Error('PINTEREST_APP_ID / PINTEREST_APP_SECRET nicht gesetzt');
  const basic = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch(`${PINTEREST_API}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams(body).toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Pinterest OAuth ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

function authorizeUrl() {
  const params = new URLSearchParams({
    client_id: process.env.PINTEREST_APP_ID || '',
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: process.env.PINTEREST_SCOPES || DEFAULT_SCOPES,
    state: createState(),
  });
  return `${PINTEREST_OAUTH}?${params.toString()}`;
}

// In-Memory-Cache, damit nicht jeder API-Call die DB anfasst
let tokenCache = { value: null, until: 0 };

async function getAccessToken() {
  if (tokenCache.value && Date.now() < tokenCache.until - 5 * 60 * 1000) {
    return tokenCache.value;
  }
  const row = await loadTokenRow();
  if (row) {
    const expiresAt = new Date(row.expires_at).getTime();
    if (Date.now() < expiresAt - 5 * 60 * 1000) {
      tokenCache = { value: row.access_token, until: expiresAt };
      return row.access_token;
    }
    const fresh = await saveTokenRow(
      await tokenRequest({
        grant_type: 'refresh_token',
        refresh_token: row.refresh_token,
        refresh_on: 'true',
      }),
      row.refresh_token
    );
    return fresh.access_token;
  }
  // Fallback: manuell gesetztes Token (läuft nach 24h ab — nur zum Testen)
  if (process.env.PINTEREST_ACCESS_TOKEN) return process.env.PINTEREST_ACCESS_TOKEN;
  throw new Error('Pinterest nicht verbunden — im Dashboard auf "Pinterest verbinden" klicken');
}

// Callback-Antwort als schlichte HTML-Seite (Pinterest öffnet sie im Browser)
const oauthPage = (title, body, ok = true) => `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;
margin:12vh auto;padding:0 24px;line-height:1.6;color:#0A0A0A}
.b{display:inline-block;font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;
color:${ok ? '#2E7D32' : '#C41E3A'};margin-bottom:.5rem}
code{background:#f4f4f4;padding:2px 6px;border-radius:3px;font-size:.85em}</style></head>
<body><span class="b">${ok ? 'Verbunden' : 'Fehler'}</span>${body}</body></html>`;

async function handleOAuthCallback(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(oauthPage('Pinterest',
      `<h1>Abgebrochen</h1><p>Pinterest meldet: <code>${String(error).slice(0, 120)}</code></p>`, false));
  }
  if (!verifyState(state)) {
    return res.status(400).send(oauthPage('Pinterest',
      '<h1>Ungültiger state</h1><p>Der Link war älter als 10 Minuten. Bitte im Dashboard erneut auf „Pinterest verbinden“ klicken.</p>', false));
  }

  try {
    const saved = await saveTokenRow(await tokenRequest({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      continuous_refresh: 'true', // Refresh Token verfällt nicht nach einem Jahr
    }), null);

    let username = 'unbekannt';
    try {
      const acc = await pinterestFetch('/user_account');
      username = acc?.username || username;
    } catch { /* Token liegt, Profilabruf ist optional */ }

    return res.status(200).send(oauthPage('Pinterest verbunden',
      `<h1>Pinterest ist verbunden</h1>
       <p>Konto: <code>${username}</code></p>
       <p>Scopes: <code>${(saved.scope || '—').replace(/,/g, ', ')}</code></p>
       <p>Queue und Cron laufen ab sofort. Dieses Fenster kannst du schließen.</p>`));
  } catch (err) {
    return res.status(500).send(oauthPage('Pinterest',
      `<h1>Verbindung fehlgeschlagen</h1><p><code>${String(err.message).slice(0, 300)}</code></p>`, false));
  }
}

// ── Pinterest-Helpers (auch vom Cron genutzt) ──
export async function pinterestFetch(path, options = {}) {
  const token = await getAccessToken();
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

// Kostenlose Tools — die stärksten Pin-Ziele (feste Metadaten)
const TOOLS = [
  {
    slug: 'hochzeitsbudget-rechner',
    url: `${SITE}/hochzeitsbudget-rechner`,
    title: 'Hochzeitsbudget-Rechner: Was kostet eure Hochzeit wirklich?',
    description: 'Gästezahl wählen, 8 kurze Fragen beantworten – realistische Kostenschätzung erhalten. Kostenlos, ohne Anmeldung.',
    image: null,
  },
  {
    slug: 'hochzeitsdatum-finder',
    url: `${SITE}/hochzeitsdatum-finder`,
    title: 'Hochzeitsdatum-Finder: Schnapszahlen, Feiertage & Brückentage',
    description: 'Alle besten Hochzeitstermine 2027 & 2028 – für jedes Bundesland, Österreich und die Schweiz. Kostenlos.',
    image: null,
  },
  {
    slug: 'brautpaar-quiz',
    url: `${SITE}/brautpaar-quiz`,
    title: 'Brautpaar-Quiz-Generator: Fragen für Polterabend, JGA & Hochzeit',
    description: 'Euer persönliches Brautpaar-Quiz in 2 Minuten: 50 Fragen, eigene ergänzen, drucken oder präsentieren. Kostenlos.',
    image: null,
  },
];
const toolMeta = (slug) => TOOLS.find((t) => t.slug === slug) || null;
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
    const ogImage = (html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1] || null;
    blogCache.meta[slug] = {
      slug,
      url: `${SITE}/blog/${slug}`,
      title: title.replace(/\s*\|\s*S&amp;I\..*$/, '').replace(/&amp;/g, '&').trim(),
      description: description.replace(/&amp;/g, '&'),
      image: ogImage && !/si_og_image/.test(ogImage) ? ogImage : null, // Standard-OG-Bild nicht als Pin-Foto verwenden
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
  // ── OAuth-Callback von Pinterest (kein Admin-Token möglich → signierter state) ──
  if (req.method === 'GET' && (req.query.code || req.query.error)) {
    return handleOAuthCallback(req, res);
  }

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
    // ── Verbindungsstatus (für das Panel im Dashboard) ──
    if (action === 'status') {
      const row = await loadTokenRow();
      if (!row) {
        return res.status(200).json({
          connected: false,
          fallback: !!process.env.PINTEREST_ACCESS_TOKEN,
        });
      }
      let username = null;
      try {
        const acc = await pinterestFetch('/user_account');
        username = acc?.username || null;
      } catch { /* Token evtl. widerrufen — connected bleibt true, Fehler zeigt sich beim Pinnen */ }
      return res.status(200).json({
        connected: true,
        username,
        scope: row.scope,
        expires_at: row.expires_at,
        updated_at: row.updated_at,
        can_write: (row.scope || '').includes('pins:write'),
      });
    }

    // ── OAuth starten: URL zurückgeben, Frontend leitet weiter ──
    if (action === 'oauth_url') {
      if (!process.env.PINTEREST_APP_ID || !process.env.PINTEREST_APP_SECRET) {
        return res.status(400).json({ error: 'PINTEREST_APP_ID / PINTEREST_APP_SECRET fehlen in den Vercel-Env-Variablen' });
      }
      return res.status(200).json({ url: authorizeUrl(), redirect_uri: redirectUri() });
    }

    // ── Verbindung trennen ──
    if (action === 'disconnect') {
      await supabase.from('pinterest_tokens').delete().eq('id', TOKEN_ROW_ID);
      tokenCache = { value: null, until: 0 };
      return res.status(200).json({ ok: true });
    }

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
      return res.status(200).json({ slugs, tools: TOOLS.map(({ slug, title }) => ({ slug, title })) });
    }
    if (action === 'blog_meta') {
      const { slug } = req.query;
      if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Ungültiger slug' });
      }
      const tool = toolMeta(slug);
      if (tool) return res.status(200).json(tool);
      return res.status(200).json(await getBlogMeta(slug));
    }

    return res.status(400).json({ error: `Unbekannte action: ${action}` });
  } catch (err) {
    console.error('Pinterest API error:', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
}
