-- Add customer workflow tracking fields to projects table
-- Run this in Supabase SQL Editor

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

-- Notizen zur Kundenabwicklung
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS workflow_notes TEXT;

-- Comments
COMMENT ON COLUMN projects.contract_number IS 'Vertragsnummer (V-YYYY-XXXXX)';
COMMENT ON COLUMN projects.contract_sent IS 'Vertrag wurde an Kunde gesendet';
COMMENT ON COLUMN projects.contract_signed IS 'Vertrag wurde unterschrieben zurückgeschickt';
COMMENT ON COLUMN projects.deposit_paid IS 'Anzahlung (50%) wurde bezahlt';
COMMENT ON COLUMN projects.final_paid IS 'Restzahlung (50%) wurde bezahlt';
COMMENT ON COLUMN projects.workflow_notes IS 'Interne Notizen zur Kundenabwicklung';
