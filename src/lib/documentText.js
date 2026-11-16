// src/lib/documentText.js
// Textbausteine und Vollständigkeitsprüfung für Vertrag und Rechnung.
// Getrennt von der PDF-Erzeugung, damit sie sich einzeln testen lassen.

/** § 6: Satz zur Laufzeit. Aus „Online bis 3 Monate nach der Hochzeit" wird ein ganzer Satz. */
export function hostingSentence(hosting) {
  const h = String(hosting || '').trim().replace(/\.$/, '');
  if (!h) return 'Die Laufzeit des Hostings wird gesondert vereinbart.';
  const m = /^online\s+(.+)$/i.exec(h);
  if (m) return `Die Website bleibt ${m[1]} online.`;
  return `Die Hosting-Laufzeit beträgt ${h} ab Freischaltung der Website.`;
}

/** § 7: Satz zu den enthaltenen Revisionen – ohne leere Klammer. */
export function revisionSentence(pkgName, count = 2) {
  return `Im Paket „${pkgName}" sind ${count} Revisionen enthalten.`;
}

/**
 * § 2: Leistungsumfang. Beim Individual-Paket ersetzen die im Projekt eingetragenen
 * „Weiteren Positionen" den Platzhalter „Individuell vereinbarter Leistungsumfang" –
 * auch Positionen ohne Betrag (0 €), die nur den Umfang beschreiben.
 */
export function scopeLines(project, pkg) {
  const base = Array.isArray(pkg && pkg.deliverables) ? pkg.deliverables : [];
  if (!project || project.package !== 'individual') return base;
  const own = (Array.isArray(project.custom_extras) ? project.custom_extras : [])
    .map((e) => String((e && e.title) || '').trim()).filter(Boolean);
  if (!own.length) return base;
  return [...own, ...base.filter((line) => !/^individuell vereinbart/i.test(line))];
}

/** Welche Pflichtangaben fehlen noch? Leere Liste = vollständig. */
export function missingDocumentData(project, { invoice = false, taxId = '' } = {}) {
  const p = project || {};
  const missing = [];
  if (!String(p.client_name || '').trim()) missing.push('Name des Kunden');
  if (!String(p.client_street || '').trim()) missing.push('Straße und Hausnummer des Kunden');
  if (!String(p.client_zip || '').trim() || !String(p.client_city || '').trim()) missing.push('PLZ und Ort des Kunden');
  if (invoice && !String(taxId || '').trim()) missing.push('eigene Steuernummer (noch nicht hinterlegt)');
  return missing;
}
