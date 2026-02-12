# S&I SuperAdmin – Kooperationen-Modul

## Was ist dabei?

### Neue Dateien
- `src/pages/PartnersPage.js` – Komplette Kooperationen-Seite mit CRM + E-Mail-Composer
- `src/lib/partnerEmailTemplates.js` – Alle E-Mail-Templates (Fotografen, Planer, Trauredner, Locations)
- `scripts/create-partners-table.sql` – Datenbank-Migration

### Geänderte Dateien
- `src/App.js` – Route `/partners` hinzugefügt
- `src/components/Layout.js` – Nav-Item "Kooperationen" hinzugefügt

---

## Installation

### 1. SQL-Migration in Supabase ausführen
Gehe zu Supabase → SQL Editor → Neue Query → Inhalt von `scripts/create-partners-table.sql` einfügen und ausführen.

### 2. Dateien kopieren
```bash
# Neue Dateien
cp src/pages/PartnersPage.js       <dein-repo>/src/pages/
cp src/lib/partnerEmailTemplates.js <dein-repo>/src/lib/

# Geänderte Dateien (ERSETZEN!)
cp src/App.js                       <dein-repo>/src/
cp src/components/Layout.js         <dein-repo>/src/components/
```

### 3. Deploy
```bash
git add .
git commit -m "feat: Kooperationen-Modul mit CRM + E-Mail-Composer"
git push
```

---

## Features

### Kooperationen-Seite (/partners)
- **KPI-Übersicht**: Gesamt, Aktive Partner, Pipeline, Follow-ups fällig, Neu
- **Filterable Tabelle**: Nach Typ (Fotograf/Planer/Traurednerin/Location) und Status
- **Suche**: Nach Name, Firma, E-Mail, Stadt
- **Bulk-Aktionen**: Mehrere Partner auswählen → Sammelmail senden oder löschen

### Partner hinzufügen
- Name + E-Mail (Pflicht)
- Firma, Telefon, Typ, Stadt, Website, Instagram, Notizen
- Referral-Code wird automatisch generiert

### Partner-Detail
- Alle Felder editierbar
- Status-Änderung direkt
- E-Mail-Verlauf mit Timestamp und Erfolgsstatus
- Direkter Link zum E-Mail-Composer

### E-Mail-Composer
- **4 Mail-Stufen**: Erstansprache → Follow-up → Angebot → Abschluss
- **4 Zielgruppen**: Fotografen, Planer, Trauredner/innen, Locations
- **Komplett editierbar**: Subject + Body können vor dem Senden angepasst werden
- **Platzhalter `{name}`**: Wird automatisch durch den Partner-Namen ersetzt
- **Live-Vorschau**: Rechte Seite zeigt das fertige S&I-gebrandete HTML
- **Automatisches Status-Update**: Nach Versand wird Status + Datum aktualisiert
- **Follow-up-Datum**: Wird automatisch gesetzt (Erstansprache → +5 Tage, Follow-up → +7 Tage, etc.)
- **Bulk-Versand**: Mehrere Partner auswählen → eine Mail an alle (mit 1s Delay)

### Flow
```
Partner in Tabelle eintragen (Name, Email, Typ)
       ↓
✉️ Klick → E-Mail-Composer öffnet sich
       ↓
Template wird automatisch geladen (passend zum Typ + Stufe)
       ↓
{name} wird durch Partner-Name ersetzt
       ↓
Text + Betreff sind editierbar
       ↓
"Jetzt senden" → /api/send-email → Brevo
       ↓
Status-Update in partners-Tabelle
Follow-up-Datum wird gesetzt
E-Mail wird in email_logs geloggt
```

---

## E-Mail-Templates (Default-Texte)

Alle Templates sind **vorausgefüllt aber editierbar**. Für jede der 4 Zielgruppen gibt es:

| Stufe | Tag | Neuer Status | Nächster Follow-up |
|-------|-----|--------------|--------------------|
| Erstansprache | 0 | kontaktiert | +5 Tage |
| Follow-up | 5 | follow_up | +7 Tage |
| Angebot | 12 | angebot | +10 Tage |
| Abschluss | 22 | aktiv | – |

### Platzhalter
- `{name}` → Partner-Name (wird automatisch ersetzt)

### Tonalität
- **Fotografen, Planer, Trauredner**: Du-Form, locker-professionell
- **Locations**: Sie-Form, formeller
