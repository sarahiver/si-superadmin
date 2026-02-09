-- Add QR code design fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS qr_style text DEFAULT 'square';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS qr_color text DEFAULT '#000000';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS qr_logo_type text DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS qr_logo_text text DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS qr_logo_image text DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS qr_frame_style text DEFAULT 'none';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS qr_frame_text text DEFAULT '';
