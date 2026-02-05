-- Create site_settings table for marketing site configuration
-- Run this in Supabase SQL Editor

-- Drop existing policies if table exists
DROP POLICY IF EXISTS "Allow public read access" ON site_settings;
DROP POLICY IF EXISTS "Allow authenticated full access" ON site_settings;

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

-- Allow EVERYONE to read (marketing site needs this)
CREATE POLICY "public_read" ON site_settings
  FOR SELECT
  TO public
  USING (true);

-- Allow EVERYONE to insert/update/delete (SuperAdmin doesn't use Supabase Auth)
CREATE POLICY "public_write" ON site_settings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

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
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Grant permissions
GRANT ALL ON site_settings TO anon;
GRANT ALL ON site_settings TO authenticated;
GRANT ALL ON site_settings TO service_role;
