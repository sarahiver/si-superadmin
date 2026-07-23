// api/pinterest.js
// Pinterest-Publishing für den SuperAdmin: Boards laden, Pins direkt
// veröffentlichen, Queue verwalten (Tabelle: pinterest_queue, siehe
// ANLEITUNG-PINTEREST.md für SQL + Setup).
// Env: PINTEREST_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY
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

export default async function handler(req, res) {
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
      const { board_id, title, description, link, image_base64 } = req.body;
      if (!board_id || !title || !link || !image_base64) {
        return res.status(400).json({ error: 'board_id, title, link und image_base64 sind Pflicht' });
      }
      const pin = await createPin({ board_id, title, description, link, image_base64 });
      return res.status(200).json({ ok: true, pin_id: pin.id });
    }

    // ── In Queue legen ──
    if (action === 'queue_add') {
      const { board_id, board_name, title, description, link, image_base64, scheduled_date } = req.body;
      if (!board_id || !title || !link || !image_base64) {
        return res.status(400).json({ error: 'board_id, title, link und image_base64 sind Pflicht' });
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

    return res.status(400).json({ error: `Unbekannte action: ${action}` });
  } catch (err) {
    console.error('Pinterest API error:', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
}
