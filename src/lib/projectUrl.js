// src/lib/projectUrl.js
// Eine Stelle, an der aus einem Projekt die URLs entstehen.
//
// Hintergrund: custom_domain wird von Hand eingetragen und kam in mehreren
// Schreibweisen vor — mit und ohne https://, mit und ohne Schrägstrich am
// Ende, teils mit Leerzeichen. Der Code hat vorher überall `https://${domain}`
// zusammengesetzt. Daraus wurde:
//
//   "hannahleon-hochzeit.de/"      → https://hannahleon-hochzeit.de//admin
//   "https://hannahleon-hochzeit.de" → https://https://hannahleon-hochzeit.de
//
// Beides stand im QR-Code und in den Kunden-E-Mails.

// Entfernt Schema, Leerzeichen und Schrägstriche am Ende.
export function normalizeDomain(raw) {
  if (!raw) return '';
  return String(raw)
    .trim()
    .replace(/^https?:\/\//i, '')   // Schema abschneiden
    .replace(/\/+$/, '')            // Schrägstriche am Ende
    .replace(/\s+/g, '');           // versehentliche Leerzeichen
}

// Host plus optionalem Pfad, ohne Schema — für die Anzeige.
export function projectHost(project = {}) {
  const custom = normalizeDomain(project.custom_domain);
  if (custom) return custom;
  return project.slug ? `siwedding.de/${project.slug}` : '';
}

// Vollständige URLs. Ohne Domain und ohne Slug gibt es keine URL — dann null,
// damit der Aufrufer nicht versehentlich "https://" allein rendert.
export function projectUrls(project = {}) {
  const host = projectHost(project);
  if (!host) return { host: '', website: null, admin: null };
  return {
    host,
    website: `https://${host}`,
    admin: `https://${host}/admin`,
  };
}
