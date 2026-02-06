-- ============================================
-- S&I. SuperAdmin - Komplette Migration
-- Führe dieses Script einmal in Supabase SQL Editor aus
-- ============================================

-- ============================================
-- 1. HOSTING-FELDER
-- ============================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS hosting_start_date DATE,
ADD COLUMN IF NOT EXISTS hosting_end_date DATE,
ADD COLUMN IF NOT EXISTS has_std BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_archive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS std_end_date DATE,
ADD COLUMN IF NOT EXISTS archive_end_date DATE;

COMMENT ON COLUMN projects.hosting_start_date IS 'Datum wann Projekt live ging';
COMMENT ON COLUMN projects.hosting_end_date IS 'Datum wann Hosting abläuft';
COMMENT ON COLUMN projects.has_std IS 'Save the Date aktiviert';
COMMENT ON COLUMN projects.has_archive IS 'Archiv aktiviert';

-- ============================================
-- 2. KUNDENABWICKLUNG-FELDER
-- ============================================

-- Vertragsstatus
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS contract_number TEXT,
ADD COLUMN IF NOT EXISTS contract_date DATE,
ADD COLUMN IF NOT EXISTS contract_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contract_sent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contract_signed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contract_signed_date TIMESTAMPTZ;

-- Zahlungsstatus
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deposit_invoice_number TEXT,
ADD COLUMN IF NOT EXISTS deposit_invoice_date DATE,
ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_paid_date DATE,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS final_invoice_number TEXT,
ADD COLUMN IF NOT EXISTS final_invoice_date DATE,
ADD COLUMN IF NOT EXISTS final_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS final_paid_date DATE,
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10,2);

-- Notizen
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS workflow_notes TEXT;

COMMENT ON COLUMN projects.contract_number IS 'Vertragsnummer (V-YYYY-XXXXX)';
COMMENT ON COLUMN projects.contract_sent IS 'Vertrag an Kunde gesendet';
COMMENT ON COLUMN projects.contract_signed IS 'Vertrag unterschrieben';
COMMENT ON COLUMN projects.deposit_paid IS 'Anzahlung (50%) bezahlt';
COMMENT ON COLUMN projects.final_paid IS 'Restzahlung (50%) bezahlt';
COMMENT ON COLUMN projects.workflow_notes IS 'Interne Notizen';

-- ============================================
-- FERTIG!
-- ============================================
-- Alle neuen Felder wurden hinzugefügt.
-- Das Dashboard und die Projektseite nutzen diese automatisch.
