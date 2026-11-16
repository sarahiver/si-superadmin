import { hostingSentence, revisionSentence, scopeLines, missingDocumentData } from '../documentText';

test('Laufzeit: ganzer Satz statt „beträgt Online bis …"', () => {
  expect(hostingSentence('Online bis 3 Monate nach der Hochzeit')).toBe('Die Website bleibt bis 3 Monate nach der Hochzeit online.');
  expect(hostingSentence('12 Monate')).toBe('Die Hosting-Laufzeit beträgt 12 Monate ab Freischaltung der Website.');
  expect(hostingSentence('')).toMatch(/gesondert vereinbart/);
});
test('Revisionen: keine leere Klammer', () => {
  const s = revisionSentence('Individual');
  expect(s).toBe('Im Paket „Individual" sind 2 Revisionen enthalten.');
  expect(s).not.toMatch(/\(|Go-Live/);
});
test('Leistungsumfang: eigene Positionen ersetzen beim Individual-Paket den Platzhalter', () => {
  const pkg = { deliverables: ['Individuell vereinbarter Leistungsumfang', 'Alle verfügbaren Website-Komponenten', 'QR-Code'] };
  expect(scopeLines({ package: 'individual', custom_extras: [] }, pkg)).toEqual(pkg.deliverables);
  expect(scopeLines({ package: 'individual', custom_extras: [{ title: ' Eigenes Design ', amount: 0 }, { title: '' }, { title: 'Vier Sprachen', amount: 0 }] }, pkg))
    .toEqual(['Eigenes Design', 'Vier Sprachen', 'Alle verfügbaren Website-Komponenten', 'QR-Code']);
  expect(scopeLines({ package: 'website', custom_extras: [{ title: 'Extra' }] }, pkg)).toEqual(pkg.deliverables);
});
test('Fehlende Pflichtangaben werden benannt', () => {
  expect(missingDocumentData({ client_name: 'A B', client_street: 'Weg 1', client_zip: '20000', client_city: 'Hamburg' })).toEqual([]);
  expect(missingDocumentData({ client_name: 'A B' })).toEqual(['Straße und Hausnummer des Kunden', 'PLZ und Ort des Kunden']);
  expect(missingDocumentData({ client_name: 'A B', client_street: 'Weg 1', client_zip: '20000', client_city: 'Hamburg' }, { invoice: true, taxId: '' })).toEqual(['eigene Steuernummer (noch nicht hinterlegt)']);
  expect(missingDocumentData({ client_name: 'A B', client_street: 'Weg 1', client_zip: '20000', client_city: 'Hamburg' }, { invoice: true, taxId: '12/345/67890' })).toEqual([]);
});
