// api/auth/verify.js
// Login-Endpoint: Prüft Credentials gegen Supabase, gibt signierten Token zurück

import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, createSessionToken } from '../lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, passwordHash } = req.body || {};

    if (!email || !passwordHash) {
      return res.status(400).json({ error: 'Missing email or passwordHash' });
    }

    // Gegen superadmins-Tabelle prüfen
    const { data, error: dbError } = await supabase
      .from('superadmins')
      .select('email')
      .eq('email', email)
      .eq('password', passwordHash)
      .single();

    if (dbError || !data) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Token erstellen
    const token = createSessionToken({ email: data.email });

    return res.status(200).json({
      token,
      user: { email: data.email },
    });
  } catch (error) {
    console.error('[auth/verify] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
