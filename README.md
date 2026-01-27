# S&I Wedding - SuperAdmin Dashboard

Separates Admin-Dashboard zur Verwaltung aller Hochzeitsprojekte.

## Features

- 🔐 Sichere Authentifizierung (Credentials in Supabase)
- 📊 Dashboard mit Statistiken
- 💒 Alle Projekte verwalten
- ➕ Neue Projekte anlegen
- 🌐 Custom Domains zuweisen
- 🧩 Komponenten aktivieren/deaktivieren
- 📨 Kontaktanfragen verwalten

## Setup

### 1. Projekt klonen & Abhängigkeiten installieren

```bash
git clone https://github.com/YOUR_USERNAME/si-wedding-superadmin.git
cd si-wedding-superadmin
npm install
```

### 2. Supabase Admin-User anlegen

Führe folgendes SQL in Supabase aus:

```sql
-- Tabelle erstellen
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin-User anlegen (admin / admin123)
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', '240be518fabd2724ddb6f04eeb9d5b075cd116b1f3e2ea5df48c45a6db2d7e18')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
```

### 3. Environment Variables

Erstelle `.env` Datei:

```
REACT_APP_SUPABASE_URL=https://wikxhpvikelfgzdgndlf.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-key
```

### 4. Lokal starten

```bash
npm start
```

## Deployment (Vercel)

### Option A: Als Subdomain (empfohlen)

1. Neues Vercel Projekt erstellen
2. GitHub Repo verbinden
3. Environment Variables setzen
4. Custom Domain: `superadmin.siweddings.de`

### Option B: Als Pfad unter siweddings.de

Nicht empfohlen - besser als separates Projekt.

## Login

- **URL:** `superadmin.siweddings.de`
- **User:** `admin`
- **Passwort:** `admin123`

## Passwort ändern

1. Hash generieren (Browser-Konsole):
```javascript
const encoder = new TextEncoder();
const data = encoder.encode('DEIN_NEUES_PASSWORT');
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
console.log(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
```

2. In Supabase aktualisieren:
```sql
UPDATE admin_users SET password_hash = 'NEUER_HASH' WHERE username = 'admin';
```

## Tech Stack

- React 18
- React Router v6
- Styled Components
- Supabase
- React Hot Toast
