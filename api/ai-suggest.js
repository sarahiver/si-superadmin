// api/ai-suggest.js
// Vercel Serverless Function — Proxy für Anthropic API mit web_search für Hashtags/Trends.
//
// Robust gegen Modell-Abschaltungen:
//  - Modell-Kette statt einem fest verdrahteten Modell
//  - automatischer Fallback auf das nächste Modell, wenn eines abgeschaltet/404 ist
//  - Retry mit Backoff bei transienten Fehlern (429 Rate-Limit, 529 Overloaded, 5xx)
//  - wirft nie ungefangen — gibt im Zweifel eine saubere JSON-Fehlerantwort zurück

import { setCorsHeaders, verifySessionToken } from './lib/auth.js';

// Modell-Kette: das erste erreichbare Modell gewinnt.
// Per ENV überschreibbar (kein Re-Deploy des Codes nötig):
//   ANTHROPIC_MODEL   = einzelnes Modell, höchste Priorität (z. B. "claude-opus-4-8")
//   ANTHROPIC_MODELS  = kommagetrennte Liste, stärkste/neueste zuerst
// Stand Juni 2026 aktive Modelle. Bei neuem Release einfach vorne ergänzen
// bzw. die ENV-Variable in Vercel anpassen.
const DEFAULT_MODEL_CHAIN = [
  'claude-sonnet-4-6',          // primär: gutes Verhältnis Qualität/Kosten, kann web_search
  'claude-opus-4-8',            // Fallback: stärker, teurer
  'claude-haiku-4-5-20251001',  // Fallback: schnell & günstig
];

// Baut die effektive Modell-Kette aus ENV + Defaults (Duplikate raus, Reihenfolge bleibt).
function getModelChain() {
  const single = (process.env.ANTHROPIC_MODEL || '').trim();
  const list = (process.env.ANTHROPIC_MODELS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

  const chain = [];
  if (single) chain.push(single);
  chain.push(...list);
  chain.push(...DEFAULT_MODEL_CHAIN);

  return [...new Set(chain)];
}

// Fehler, bei denen das nächste Modell sinnvoll ist (Modell weg/abgeschaltet/unbekannt).
function isModelUnavailable(status, data) {
  if (status === 404) return true;
  const type = data?.error?.type || '';
  const msg = (data?.error?.message || '').toLowerCase();
  if (type === 'not_found_error') return true;
  // 400 mit Modell-Bezug (ungültiger oder zurückgezogener Modellname)
  if (status === 400 && msg.includes('model')) return true;
  return false;
}

// Transiente Fehler -> kurz warten und erneut versuchen.
function isTransient(status) {
  return status === 429 || status === 529 || status === 500 || status === 503;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callAnthropic(apiKey, model, requestBody) {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ ...requestBody, model }),
  });
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Token-Auth
  const auth = verifySessionToken(req);
  if (!auth.valid) return res.status(401).json({ error: auth.error });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
  }

  try {
    const { prompt, searchHint, webSearch = true } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // Default-Suchhinweis (Backward-Compat für Instagram); per searchHint überschreibbar.
    const defaultHint = '\n\nWichtig: Nutze web_search um aktuelle, trendende Hochzeits-Hashtags auf Instagram zu finden (suche nach "trending wedding hashtags 2025 2026 Instagram deutsch"). Verwende die gefundenen trendenden Hashtags in deinen Vorschlägen.';
    const content = webSearch ? prompt + (searchHint ? '\n\n' + searchHint : defaultHint) : prompt;

    // model wird pro Versuch gesetzt (siehe callAnthropic)
    const requestBody = {
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
    };
    if (webSearch) {
      requestBody.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
    }

    const models = getModelChain();
    const MAX_RETRIES = 2; // pro Modell, nur für transiente Fehler

    let lastStatus = 502;
    let lastData = { error: 'No model available' };

    for (const model of models) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        let apiResponse;
        try {
          apiResponse = await callAnthropic(ANTHROPIC_API_KEY, model, requestBody);
        } catch (netErr) {
          // Netzwerkfehler wie transient behandeln
          if (attempt < MAX_RETRIES) {
            await sleep(700 * 2 ** attempt);
            continue;
          }
          lastStatus = 502;
          lastData = { error: `Network error for ${model}: ${netErr.message}` };
          break; // nächstes Modell
        }

        const data = await apiResponse.json().catch(() => ({}));

        if (apiResponse.ok) {
          return res.status(200).json(data);
        }

        lastStatus = apiResponse.status;
        lastData = data;

        // Modell abgeschaltet/unbekannt -> ohne Retry direkt zum nächsten Modell
        if (isModelUnavailable(apiResponse.status, data)) {
          console.warn(`Model "${model}" unavailable (${apiResponse.status}) — trying next model.`);
          break;
        }

        // Transient -> Backoff & erneut versuchen (gleiches Modell)
        if (isTransient(apiResponse.status) && attempt < MAX_RETRIES) {
          const backoff = 700 * 2 ** attempt; // 700ms, 1400ms
          console.warn(`Transient ${apiResponse.status} from "${model}" — retry in ${backoff}ms.`);
          await sleep(backoff);
          continue;
        }

        // Echter Anwendungsfehler (400 inhaltlich, 401, 403 …) -> weiterprobieren bringt nichts
        console.error('Anthropic error:', apiResponse.status, JSON.stringify(data));
        return res.status(apiResponse.status).json(data);
      }
    }

    // Alle Modelle erschöpft (alle abgeschaltet oder dauerhaft überlastet)
    console.error('All models exhausted:', lastStatus, JSON.stringify(lastData));
    return res.status(lastStatus).json(lastData);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
