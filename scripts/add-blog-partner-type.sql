-- ============================================
-- S&I SuperAdmin: Blog-Kooperationspartner
-- In Supabase SQL Editor ausführen
-- ============================================

-- Info: Die partners-Tabelle hat keinen CHECK-Constraint auf 'type',
-- daher ist kein Schema-Update nötig. Der neue Typ 'blog' wird
-- direkt vom Frontend unterstützt.

-- Optional: Kommentar aktualisieren
COMMENT ON COLUMN partners.type IS 'Partner-Typ: fotograf, planer, traurednerin, location, blog';

-- Brevo-Kontaktliste für Blogs anlegen (manuell in Brevo):
-- Name: "Kooperationspartner – Blogs"
-- Wird automatisch über den SuperAdmin sync befüllt.

-- Falls ihr die 30 Hochzeitsblogs aus der XLSX importiert,
-- könnt ihr das direkt über den XLSX-Import im SuperAdmin tun.
-- Format: Vorname | Nachname | E-Mail | Firma | blog | Telefon | Stadt | Website | Instagram | Notizen
