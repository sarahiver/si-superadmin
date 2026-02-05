-- Create site_settings table for marketing site configuration
-- Run this in Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone (marketing site needs to read promo banner)
CREATE POLICY "Allow public read access" ON site_settings
  FOR SELECT USING (true);

-- Allow all operations for authenticated users (SuperAdmin)
CREATE POLICY "Allow authenticated full access" ON site_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default promo banner
INSERT INTO site_settings (key, value)
VALUES (
  'promo_banner',
  '{
    "active": true,
    "title": "Frühbucher-Rabatt",
    "text": "Bucht jetzt und spart 10% auf alle Pakete!",
    "badge": "-10%"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Grant permissions
GRANT SELECT ON site_settings TO anon;
GRANT ALL ON site_settings TO authenticated;
