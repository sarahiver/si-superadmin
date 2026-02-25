// api/db.js
// Zentraler API-Proxy für ALLE Supabase-Operationen im SuperAdmin
// Nutzt SUPABASE_SERVICE_ROLE_KEY serverseitig → RLS wird bypassed
// Erfordert gültigen JWT-Token (Bearer Auth) für jeden Request

import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifySessionToken } from './lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Erlaubte Tabellen — alles andere wird geblockt
const ALLOWED_TABLES = [
  'projects', 'project_content',
  'contact_requests', 'superadmins',
  'rsvp_responses', 'photo_uploads',
  'email_logs', 'email_events',
  'partners', 'customers',
  'partner_codes', 'partner_visits',
  'password_reset_tokens',
  'guestbook_entries', 'music_wishes', 'gift_reservations',
  'guest_list', 'admin_notifications',
  'site_settings', 'waitlist',
];

// Erlaubte RPC-Funktionen
const ALLOWED_RPCS = [
  'set_project_password',
];

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // JWT prüfen
  const auth = verifySessionToken(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.error || 'Unauthorized' });
  }

  const { action, table, data, filters, options } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: 'Missing action' });
  }

  try {
    // ─── RPC ───
    if (action === 'rpc') {
      const { fn, args } = req.body;
      if (!ALLOWED_RPCS.includes(fn)) {
        return res.status(403).json({ error: `RPC "${fn}" not allowed` });
      }
      const { data: result, error } = await supabase.rpc(fn, args || {});
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ data: result });
    }

    // ─── Table operations ───
    if (!table || !ALLOWED_TABLES.includes(table)) {
      return res.status(403).json({ error: `Table "${table}" not allowed` });
    }

    let query;

    switch (action) {
      // ── SELECT ──
      case 'select': {
        query = supabase.from(table).select(options?.select || '*');
        query = applyFilters(query, filters);
        if (options?.order) {
          query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
        }
        if (options?.limit) query = query.limit(options.limit);
        if (options?.single) query = query.single();
        if (options?.maybeSingle) query = query.maybeSingle();
        break;
      }

      // ── INSERT ──
      case 'insert': {
        query = supabase.from(table).insert(Array.isArray(data) ? data : [data]);
        if (options?.select !== false) query = query.select();
        if (options?.single) query = query.single();
        break;
      }

      // ── UPDATE ──
      case 'update': {
        query = supabase.from(table).update(data);
        query = applyFilters(query, filters);
        if (options?.select !== false) query = query.select();
        if (options?.single) query = query.single();
        break;
      }

      // ── UPSERT ──
      case 'upsert': {
        query = supabase.from(table).upsert(data, {
          onConflict: options?.onConflict,
        });
        if (options?.select !== false) query = query.select();
        if (options?.single) query = query.single();
        break;
      }

      // ── DELETE ──
      case 'delete': {
        query = supabase.from(table).delete();
        query = applyFilters(query, filters);
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    const { data: result, error } = await query;

    if (error) {
      console.error(`[db] ${action} ${table} error:`, error.message);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ data: result });

  } catch (err) {
    console.error('[db] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── Filter-Helfer ───
function applyFilters(query, filters) {
  if (!filters || !Array.isArray(filters)) return query;

  for (const f of filters) {
    switch (f.op) {
      case 'eq':    query = query.eq(f.column, f.value); break;
      case 'neq':   query = query.neq(f.column, f.value); break;
      case 'gt':    query = query.gt(f.column, f.value); break;
      case 'gte':   query = query.gte(f.column, f.value); break;
      case 'lt':    query = query.lt(f.column, f.value); break;
      case 'lte':   query = query.lte(f.column, f.value); break;
      case 'like':  query = query.like(f.column, f.value); break;
      case 'ilike': query = query.ilike(f.column, f.value); break;
      case 'is':    query = query.is(f.column, f.value); break;
      case 'in':    query = query.in(f.column, f.value); break;
      case 'not':   query = query.not(f.column, f.op2 || 'is', f.value); break;
      default: break;
    }
  }
  return query;
}
