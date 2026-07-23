// api/pinterest-cron.js
// Vercel Cron: veröffentlicht täglich die fälligen Pins aus der Queue.
// Fällig = status 'queued' UND (scheduled_date leer ODER <= heute).
// Anzahl pro Lauf: PINTEREST_PINS_PER_DAY (Default 1) — Pinterest belohnt
// Konstanz, nicht Schübe.
// Auth: Vercel-Cron-Header oder Bearer CRON_SECRET.
import { createClient } from '@supabase/supabase-js';
import { publishQueueRow } from './pinterest.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const isVercelCron = !!req.headers['x-vercel-cron'];
  const bearer = (req.headers['authorization'] || '').replace('Bearer ', '');
  const secretOk = process.env.CRON_SECRET && bearer === process.env.CRON_SECRET;
  if (!isVercelCron && !secretOk) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const perDay = Math.max(1, parseInt(process.env.PINTEREST_PINS_PER_DAY || '1', 10));
  const today = new Date().toISOString().slice(0, 10);

  try {
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

    return res.status(200).json({ published: results.length, results });
  } catch (err) {
    console.error('Pinterest cron error:', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
}
