// src/lib/pinPrompt.js
// Gemeinsamer KI-Prompt für Pin-Texte — genutzt vom Batch-Generator im
// Browser UND vom Autopiloten im täglichen Cron (api/pinterest.js).
// Eine Quelle, damit beide Wege dieselben Regeln einhalten.

/**
 * @param {object} target  { title, description, url }
 * @param {object} opts    { previousHeadlines: string[] } — Headlines früherer
 *   Pins auf dasselbe Ziel. Der neue Pin soll einen anderen Blickwinkel
 *   nehmen: Pinterest bewertet wiederholte, fast gleiche Pins als dünn.
 */
export function buildPinPrompt({ title, description, url }, { previousHeadlines = [] } = {}) {
  const prev = previousHeadlines.filter(Boolean).slice(0, 6);
  const angleHint = prev.length
    ? `\n\nFrühere Pins zu diesem Ziel hatten diese Headlines:\n${prev.map(h => `- ${h}`).join('\n')}\nWähle einen ERKENNBAR ANDEREN Blickwinkel (anderer Nutzen, andere Situation, andere Suchbegriffe) — keine Umformulierung derselben Aussage.`
    : '';

  return `Du textest Pinterest-Pins für S&I. — Premium-Hochzeitswebsites aus Hamburg (sarahiver.com).
Zielgruppe: verlobte Paare (DACH). Ton: warm, konkret, immer "ihr/eure". Kein Clickbait, keine Jahreszahlen in der Headline, kein Englisch mitten im Text.

Pin-Ziel (Artikel/Tool):
Titel: ${title}
Beschreibung: ${description}
URL: ${url}

Pinterest ist eine SUCHMASCHINE: Headline & Beschreibung brauchen die Suchbegriffe, nach denen Paare wirklich suchen (aus Titel/Beschreibung ableiten). Optimiere auf Saves und Klicks.${angleHint}

Antworte NUR mit validem JSON, kein Markdown:
{"eyebrow":"2-4 Worte Kategorie-Zeile","headline":"keyword-reiches Versprechen, max 9 Worte","accentWord":"ein Wort das WORTWÖRTLICH in headline vorkommt","body":"1 Satz Nutzwert, max 18 Worte","pinTitle":"SEO-Pin-Titel, max 95 Zeichen, wichtigstes Keyword vorn","pinDescription":"SEO-Beschreibung 2-3 Sätze mit Keywords + sanftem CTA, max 480 Zeichen"}`;
}

// Antwort der Anthropic-API → Copy-Objekt. Wirft bei unbrauchbarer Antwort.
export function parsePinCopy(apiData) {
  const text = (apiData?.content || []).filter(i => i.type === 'text').map(i => i.text || '').join('\n');
  const clean = text.replace(/```json|```/g, '').trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('KI-Antwort ohne JSON');
  const copy = JSON.parse(jsonMatch[0]);
  if (!copy.headline) throw new Error('KI-Antwort ohne Headline');
  // accentWord muss wörtlich in der Headline stehen, sonst weglassen
  if (copy.accentWord && !String(copy.headline).includes(copy.accentWord)) copy.accentWord = '';
  return copy;
}

// Fallback ohne KI: Metadaten direkt verwenden — kein Lauf bleibt stecken
export const fallbackPinCopy = (meta) => ({
  eyebrow: 'Hochzeitsplanung',
  headline: String(meta.title || '').split(':')[0].slice(0, 60),
  accentWord: '',
  body: String(meta.description || '').split('. ')[0].slice(0, 110),
  pinTitle: String(meta.title || '').slice(0, 95),
  pinDescription: String(meta.description || meta.title || '').slice(0, 480),
});
