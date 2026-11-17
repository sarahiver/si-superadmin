// src/lib/componentOrder.js
// Welche Bereiche ein Projekt anbietet – und in welcher Reihenfolge.
import { ALL_COMPONENTS, DEFAULT_COMPONENT_ORDER } from './constants';

// Themes mit eigener, fester Auswahl an Bereichen (alle übrigen Themes bieten ALL_COMPONENTS an).
// Reihenfolge der Seite (Cassis): Anfahrt und Antwortkarte sowie Trauzeug:innen und Fragen stehen je
// direkt hintereinander – nur dann teilen sie sich im Theme eine Fläche. Hotels und Dresscode
// erscheinen nur, wenn im Dashboard Inhalte dafür eingetragen sind.
export const THEME_COMPONENTS = {
  cassis: ['hero', 'countdown', 'timeline', 'directions', 'rsvp', 'accommodations', 'dresscode', 'witnesses', 'faq'],
};

/**
 * Gespeicherte Reihenfolge eines Projekts, ergänzt um Bereiche, die es beim Speichern noch nicht gab.
 * Ohne diese Ergänzung tauchen neue Bereiche in der Liste gar nicht auf und lassen sich nicht einschalten.
 * Die gespeicherte Reihenfolge bleibt erhalten; Neues wird hinter seinem Vorgänger eingefügt
 * (bei Themes mit fester Auswahl) oder angehängt. Eingeschaltet wird dadurch nichts.
 */
export function withMissingComponents(saved, theme) {
  const base = Array.isArray(saved) && saved.length ? [...saved] : [...(THEME_COMPONENTS[theme] || DEFAULT_COMPONENT_ORDER)];
  const own = THEME_COMPONENTS[theme];
  const candidates = own || ALL_COMPONENTS.map((c) => c.id);
  for (const id of candidates) {
    if (base.includes(id)) continue;
    if (own) {
      const before = own.slice(0, own.indexOf(id)).reverse().find((x) => base.includes(x));
      if (before) { base.splice(base.indexOf(before) + 1, 0, id); continue; }
    }
    base.push(id);
  }
  return base;
}
