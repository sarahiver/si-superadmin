-- Add hosting tracking fields to projects table
-- Run this in Supabase SQL Editor

-- Add hosting date fields
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS hosting_start_date DATE,
ADD COLUMN IF NOT EXISTS hosting_end_date DATE,
ADD COLUMN IF NOT EXISTS has_std BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_archive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS std_end_date DATE,
ADD COLUMN IF NOT EXISTS archive_end_date DATE;

-- Add comment for clarity
COMMENT ON COLUMN projects.hosting_start_date IS 'Date when project went live';
COMMENT ON COLUMN projects.hosting_end_date IS 'Date when hosting expires';
COMMENT ON COLUMN projects.has_std IS 'Whether Save the Date is enabled';
COMMENT ON COLUMN projects.has_archive IS 'Whether Archive is enabled';
COMMENT ON COLUMN projects.std_end_date IS 'When STD expires (usually 2 months before wedding)';
COMMENT ON COLUMN projects.archive_end_date IS 'When Archive expires (usually 3 months after wedding)';

-- Function to calculate hosting end date based on package
CREATE OR REPLACE FUNCTION calculate_hosting_end_date(start_date DATE, package TEXT)
RETURNS DATE AS $$
BEGIN
  CASE package
    WHEN 'starter' THEN RETURN start_date + INTERVAL '6 months';
    WHEN 'standard' THEN RETURN start_date + INTERVAL '8 months';
    WHEN 'premium' THEN RETURN start_date + INTERVAL '12 months';
    ELSE RETURN start_date + INTERVAL '12 months'; -- individual gets 12 months default
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Update existing live projects with estimated dates (if not set)
UPDATE projects
SET
  hosting_start_date = COALESCE(hosting_start_date, created_at::DATE),
  hosting_end_date = COALESCE(
    hosting_end_date,
    calculate_hosting_end_date(COALESCE(hosting_start_date, created_at::DATE), package)
  )
WHERE status IN ('live', 'archive', 'std')
  AND hosting_start_date IS NULL;

-- Set has_std and has_archive based on package for existing projects
UPDATE projects
SET
  has_std = CASE
    WHEN package = 'premium' THEN true
    WHEN package = 'individual' THEN true
    ELSE false
  END,
  has_archive = CASE
    WHEN package = 'premium' THEN true
    WHEN package = 'individual' THEN true
    ELSE false
  END
WHERE has_std IS NULL OR has_archive IS NULL;
