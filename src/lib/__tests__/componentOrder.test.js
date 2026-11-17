import { withMissingComponents, THEME_COMPONENTS } from '../componentOrder';
import { ALL_COMPONENTS, DEFAULT_COMPONENT_ORDER } from '../constants';

test('Cassis: neue Bereiche erscheinen hinter ihrem Vorgänger, die gespeicherte Reihenfolge bleibt', () => {
  const saved = ['hero', 'countdown', 'timeline', 'directions', 'rsvp', 'witnesses', 'faq'];
  expect(withMissingComponents(saved, 'cassis')).toEqual(THEME_COMPONENTS.cassis);
  // Ältere, eigene Reihenfolge: nichts wird umsortiert
  const old = ['hero', 'timeline', 'countdown', 'rsvp', 'directions', 'faq', 'witnesses'];
  const merged = withMissingComponents(old, 'cassis');
  expect(merged.filter((id) => old.includes(id))).toEqual(old);
  expect(merged).toEqual(['hero', 'timeline', 'countdown', 'rsvp', 'accommodations', 'dresscode', 'directions', 'faq', 'witnesses']);
});
test('Cassis ohne gespeicherte Reihenfolge: die Vorgabe des Themes', () => {
  expect(withMissingComponents(null, 'cassis')).toEqual(THEME_COMPONENTS.cassis);
  expect(withMissingComponents([], 'cassis')).toEqual(THEME_COMPONENTS.cassis);
});
test('Andere Themes: fehlende Bereiche werden angehängt, vollständige Listen bleiben unverändert', () => {
  expect(withMissingComponents(DEFAULT_COMPONENT_ORDER, 'classic')).toEqual(DEFAULT_COMPONENT_ORDER);
  const short = ['hero', 'rsvp'];
  const merged = withMissingComponents(short, 'classic');
  expect(merged.slice(0, 2)).toEqual(short);
  expect([...merged].sort()).toEqual(ALL_COMPONENTS.map((c) => c.id).sort());
  expect(withMissingComponents(undefined, 'classic')).toEqual(DEFAULT_COMPONENT_ORDER);
});
test('Nichts wird doppelt eingetragen, die Eingabe bleibt unverändert', () => {
  const saved = ['hero', 'faq']; const copy = [...saved];
  const merged = withMissingComponents(saved, 'cassis');
  expect(new Set(merged).size).toBe(merged.length); expect(saved).toEqual(copy);
});
