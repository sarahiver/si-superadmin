// api/brevo-webhook.js
// Vercel Serverless Function - empfängt Brevo Transaktions-Events
// Events: delivered, opened, clicked, soft_bounce, hard_bounce, spam, etc.
// Matcht per E-Mail an partners-Tabelle und updatet Status

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Brevo Event → Partner-Status: 1:1 Übernahme
const EVENT_STATUS_MAP = {
  'delivered':     'delivered',
  'opened':        'opened',
  'unique_opened': 'opened',
  'proxy_open':    'opened',
  'clicked':       'clicked',
  'soft_bounce':   'soft_bounce',
  'hard_bounce':   'hard_bounce',
  'blocked':       'blocked',
  'spam':          'spam',
  'unsubscribed':  'unsubscribed',
  'deferred':      'deferred',
  'error':         'error',
};

// Normalize Brevo event names to our schema
function normalizeEvent(brevoEvent) {
  const map = {
    'delivered':     'delivered',
    'request':       'delivered',
    'opened':        'opened',
    'unique_opened': 'unique_opened',
    'click':         'clicked',
    'clicked':       'clicked',
    'soft_bounce':   'soft_bounce',
    'hard_bounce':   'hard_bounce',
    'softBounce':    'soft_bounce',
    'hardBounce':    'hard_bounce',
    'spam':          'spam',
    'complaint':     'spam',
    'unsubscribed':  'unsubscribed',
    'blocked':       'blocked',
    'deferred':      'deferred',
    'error':         'error',
    'proxy_open':    'proxy_open',
    'loadedByProxy': 'proxy_open',
  };
  return map[brevoEvent] || null;
}

const WEBHOOK_SECRET = process.env.BREVO_WEBHOOK_SECRET;

export default async function handler(req, res) {
  // Accept POST only
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Webhook Secret ist mandatory
  if (!WEBHOOK_SECRET) {
    console.error('[brevo-webhook] BREVO_WEBHOOK_SECRET not configured — rejecting all requests');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  // Token auth - try every known method Brevo might use
  const candidates = [
    req.headers['authorization']?.replace('Bearer ', ''),
    req.headers['x-brevo-token'],
    req.headers['x-sib-token'],
    req.headers['token'],
    req.query.token,
  ];
  const matched = candidates.some(t => t === WEBHOOK_SECRET);
  if (!matched) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Brevo sends events as array or single object
    const events = Array.isArray(req.body) ? req.body : [req.body];
    
    let processed = 0;
    let matched = 0;
    let errors = 0;

    for (const evt of events) {
      processed++;
      
      const email = (evt.email || evt['email-id'] || '').toLowerCase().trim();
      if (!email) { errors++; continue; }

      const normalizedEvent = normalizeEvent(evt.event);
      if (!normalizedEvent) { 
        console.log(`[brevo-webhook] Unknown event: ${evt.event} for ${email}`);
        continue; 
      }

      const timestamp = evt.date || evt.ts_event || new Date().toISOString();
      const messageId = evt['message-id'] || evt.messageId || null;
      const subject = evt.subject || null;

      // Find partner by email
      const { data: partner } = await supabase
        .from('partners')
        .select('id, status, email_bounce_count')
        .eq('email', email)
        .maybeSingle();

      // Deduplicate
      const { data: dup } = await supabase.from('email_events')
        .select('id').eq('email', email).eq('event', normalizedEvent)
        .eq('timestamp', timestamp).limit(1);
      if (dup?.length) continue;

      // Insert event
      await supabase.from('email_events').insert([{
        partner_id: partner?.id || null,
        email,
        event: normalizedEvent,
        brevo_message_id: messageId,
        subject,
        timestamp,
        raw_data: evt,
      }]);

      // Update partner status if matched
      if (partner) {
        matched++;
        const newStatus = EVENT_STATUS_MAP[normalizedEvent];
        const updates = {
          last_email_event: normalizedEvent,
          last_email_event_at: timestamp,
        };

        // Set status 1:1 from Brevo, but never overwrite manually set statuses
        const manualStatuses = ['geantwortet', 'aktiv', 'abgelehnt', 'pausiert', 'trash', 'angebot', 'follow_up'];
        if (newStatus && !manualStatuses.includes(partner.status)) {
          updates.status = newStatus;
        }

        // Increment bounce counter for bounces
        if (normalizedEvent === 'soft_bounce' || normalizedEvent === 'hard_bounce') {
          updates.email_bounce_count = (partner.email_bounce_count || 0) + 1;
        }

        await supabase.from('partners').update(updates).eq('id', partner.id);
      }
    }

    console.log(`[brevo-webhook] Processed: ${processed}, Matched: ${matched}, Errors: ${errors}`);

    return res.status(200).json({ 
      success: true, 
      processed, 
      matched,
      errors,
    });

  } catch (error) {
    console.error('[brevo-webhook] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
