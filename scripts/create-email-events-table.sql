-- ============================================
-- S&I SuperAdmin: Email Events (Brevo Tracking)
-- In Supabase SQL Editor ausführen
-- ============================================

-- 1. Email Events Tabelle - speichert alle Brevo-Events
CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN (
    'delivered', 'opened', 'clicked', 'soft_bounce', 'hard_bounce',
    'spam', 'unsubscribed', 'blocked', 'deferred', 'error', 'proxy_open', 'unique_opened'
  )),
  brevo_message_id TEXT,
  subject TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_email_events_partner ON email_events(partner_id);
CREATE INDEX IF NOT EXISTS idx_email_events_email ON email_events(email);
CREATE INDEX IF NOT EXISTS idx_email_events_event ON email_events(event);
CREATE INDEX IF NOT EXISTS idx_email_events_timestamp ON email_events(timestamp DESC);

-- RLS
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON email_events
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Partner-Tabelle erweitern: neues Feld für letzten Brevo-Event
ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_email_event TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_email_event_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS email_bounce_count INT DEFAULT 0;

-- 3. Status-Constraint erweitern um 'bounce'
ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_status_check;
ALTER TABLE partners ADD CONSTRAINT partners_status_check CHECK (
  status IN ('neu', 'kontaktiert', 'email_geoeffnet', 'follow_up', 'angebot', 'aktiv', 'geantwortet', 'abgelehnt', 'pausiert', 'trash', 'bounce')
);
