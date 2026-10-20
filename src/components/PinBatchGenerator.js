// src/components/PinBatchGenerator.js
// Batch-Autopilot für Pinterest: Artikel/Tools auswählen → pro Ziel automatisch
// KI-Copy + markenkonformes Pin-Bild (Brand-Preset, kein manueller Upload) →
// gestaffelt in die Queue. Rendering client-seitig (html2canvas, wie InstagramPage) —
// keine neue Vercel-Function nötig.
//
// Brand-Preset "Editorial" (aus reelThemes): Oswald-Headline, Source-Serif-Kursive,
// Rot-Akzent #C41E3A, S&I.-Logo + sarahiver.com-Footer fix. Zwei Layout-Varianten
// (Fullbleed mit Artikelbild / Statement ohne Foto) rotieren automatisch.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import PostCanvas from '../lib/postCanvas';
import styled from 'styled-components';
import { adminFetch } from '../lib/apiClient';
import { withUtm } from './PinterestPublish';
import {
  CATEGORIES, CATEGORY_ORDER, LOCK_DAYS,
  classifyTarget, normUrl, buildRecentMap, isLocked, daysSince, pickMix, interleave,
} from '../lib/pinMix';

const SITE = 'https://www.sarahiver.com';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', green: '#2E7D32', amber: '#B45309' };

const W = 1080;
const H = 1620; // 2:3

// ── Brand-Preset (fix — bewusst KEINE Auswahl im UI) ──
// Themes für Pins: Jede Designwelt bringt eigene Farben und Schriften mit,
// damit ein Pin zum beworbenen Theme passt. Fehlt eine Angabe, gilt classic.
// Die Pin-Themes kommen aus derselben Quelle wie die Instagram-Posts:
// lib/reelThemes.js. Eine eigene Palette hier zu pflegen hat sich als Fehler
// erwiesen — die Werte liefen sofort auseinander und die Pins sahen anders
// aus als die Posts, obwohl beide dasselbe Theme meinten.
export { THEMES as PIN_THEMES } from '../lib/reelThemes';



// ============================================
// STYLED COMPONENTS (Panel-UI)
// ============================================
const Panel = styled.div`
  background: #fff;
  border: 1px solid ${colors.lightGray};
  border-radius: 8px;
  padding: 1.25rem;
  margin-top: 1rem;
`;

const PanelTitle = styled.h3`
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${colors.black};
  margin-bottom: 0.35rem;
`;

const PanelSub = styled.p`
  font-size: 0.75rem;
  color: ${colors.gray};
  margin-bottom: 1rem;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.9rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: ${colors.gray};
  }

  input, select {
    border: 1px solid ${colors.lightGray};
    border-radius: 6px;
    padding: 0.55rem 0.7rem;
    font-size: 0.85rem;
    font-family: inherit;
    background: #fff;
  }
`;

const ListWrap = styled.div`
  border: 1px solid ${colors.lightGray};
  border-radius: 6px;
  max-height: 260px;
  overflow-y: auto;
  margin-bottom: 0.9rem;
`;

const GroupHead = styled.div`
  position: sticky;
  top: 0;
  background: ${colors.white};
  border-bottom: 1px solid ${colors.lightGray};
  padding: 0.4rem 0.7rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${colors.gray};
`;

const Item = styled.label`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.7rem;
  font-size: 0.82rem;
  cursor: pointer;
  border-bottom: 1px solid #F3F3F3;

  &:hover { background: #FCFCFC; }
  input { accent-color: ${colors.red}; }
`;

const Chip = styled.span`
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${p => p.$color};
  border: 1px solid ${p => p.$color};
  border-radius: 4px;
  padding: 0.05rem 0.35rem;
  margin-left: auto;
  white-space: nowrap;
`;

const LockNote = styled.span`
  font-size: 0.68rem;
  color: ${colors.amber};
  white-space: nowrap;
`;

const MixBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
  color: ${colors.gray};

  input {
    width: 4rem;
    border: 1px solid ${colors.lightGray};
    border-radius: 6px;
    padding: 0.35rem 0.5rem;
    font-family: inherit;
  }
`;

const MixBtn = styled.button`
  border: 1px solid ${colors.black};
  background: #fff;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  opacity: ${p => (p.disabled ? 0.5 : 1)};
`;

const SmallBtns = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;

  button {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.72rem;
    color: ${colors.gray};
    text-decoration: underline;
    cursor: pointer;
  }
`;

const Btn = styled.button`
  border: none;
  border-radius: 6px;
  padding: 0.65rem 1.1rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  background: ${p => (p.$primary ? colors.red : colors.black)};
  color: #fff;
  opacity: ${p => (p.disabled ? 0.5 : 1)};
`;

const Progress = styled.div`
  margin-top: 1rem;
  font-size: 0.8rem;

  ul { list-style: none; padding: 0; margin: 0.5rem 0 0; }
  li { padding: 0.3rem 0; border-bottom: 1px solid #F3F3F3; display: flex; justify-content: space-between; gap: 0.75rem; }
  li span:last-child { white-space: nowrap; }
  .ok { color: ${colors.green}; }
  .err { color: ${colors.red}; }
  .skip { color: ${colors.amber}; }
  .run { color: ${colors.gray}; }
`;

// ============================================
// PIN-RENDERER (1080×1620, gemeinsame Komponente)

// html2canvas wird bei Bedarf nachgeladen — es ist groß und wird nur beim
// Rendern gebraucht.
async function loadHtml2Canvas() {
  if (window.html2canvas) return window.html2canvas;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return window.html2canvas;
}

// ============================================

// Headline mit rot markiertem accentWord

// Pin-Rendering über dieselbe Komponente wie die Instagram-Posts.
// Der frühere HTML-String-Renderer kannte nur Farben und Schriften — die
// gestalterischen Merkmale der Themes (Glasrahmen, Brutal-Kasten, Glow,
// Gradient, Split-Spalte) fehlten, und deshalb sahen Pins anders aus als
// Posts. Jetzt gibt es genau einen Renderer.
export async function renderPinBase64({ layout, eyebrow, headline, accentWord, body, imageUrl, theme, imageTone }) {
  const html2canvas = await loadHtml2Canvas();

  // Wichtig: in der VORSCHAUGRÖSSE montieren (360×540) und erst html2canvas
  // mit scale 3 auf 1080×1620 hochrechnen — genau wie die Instagram-Seite.
  // Direkt in Zielgröße zu rendern geht schief, weil die Komponente ihre
  // Schriftgrößen in rem angibt: Die bleiben absolut gleich und wirken auf
  // einer dreifach größeren Fläche winzig.
  const PW = W / 3, PH = H / 3;
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-99999px;top:0;width:${PW}px;height:${PH}px;`;
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    await new Promise(resolve => {
      root.render(
        <PostCanvas
          theme={theme || 'classic'}
          layout={layout || 'statement'}
          W={PW}
          H={PH}
          eyebrow={eyebrow}
          headline={headline}
          accentWord={accentWord}
          bodyText={body}
          image={imageUrl || null}
          imageTone={imageTone || 'muted'}
          pin
        />
      );
      // Ein Frame warten, damit React fertig gemountet hat
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    // Bilder vorladen — html2canvas wartet nicht darauf
    const urls = [
      ...[...host.querySelectorAll('img')].map(i => i.src),
      ...[...host.querySelectorAll('[style*="background-image"]')]
        .map(el => (el.style.backgroundImage.match(/url\(['"]?([^'")]+)/) || [])[1])
        .filter(Boolean),
    ];
    await Promise.all(urls.map(src => new Promise(res => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = res;
      img.onerror = res;
      img.src = src;
      setTimeout(res, 6000);
    })));

    const canvas = await html2canvas(host.firstElementChild, {
      width: PW, height: PH, scale: 3, useCORS: true,
      backgroundColor: null, logging: false,
    });
    return canvas.toDataURL('image/png').split(',')[1];
  } finally {
    root.unmount();
    host.remove();
  }
}

// ============================================
// KI-COPY (kompakter Pinterest-Prompt pro Ziel)
// ============================================
async function aiPinCopy({ title, description, url }) {
  const prompt = `Du textest Pinterest-Pins für S&I. — Premium-Hochzeitswebsites aus Hamburg (sarahiver.com).
Zielgruppe: verlobte Paare (DACH). Ton: warm, konkret, immer "ihr/eure". Kein Clickbait, keine Jahreszahlen in der Headline, kein Englisch mitten im Text.

Pin-Ziel (Artikel/Tool):
Titel: ${title}
Beschreibung: ${description}
URL: ${url}

Pinterest ist eine SUCHMASCHINE: Headline & Beschreibung brauchen die Suchbegriffe, nach denen Paare wirklich suchen (aus Titel/Beschreibung ableiten). Optimiere auf Saves und Klicks.

Antworte NUR mit validem JSON, kein Markdown:
{"eyebrow":"2-4 Worte Kategorie-Zeile","headline":"keyword-reiches Versprechen, max 9 Worte","accentWord":"ein Wort das WORTWÖRTLICH in headline vorkommt","body":"1 Satz Nutzwert, max 18 Worte","pinTitle":"SEO-Pin-Titel, max 95 Zeichen, wichtigstes Keyword vorn","pinDescription":"SEO-Beschreibung 2-3 Sätze mit Keywords + sanftem CTA, max 480 Zeichen"}`;

  const response = await adminFetch('/api/ai-suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, webSearch: false }),
  });
  const data = await response.json();
  const text = (data.content || []).filter(i => i.type === 'text').map(i => i.text || '').join('\n');
  const clean = text.replace(/```json|```/g, '').trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('KI-Antwort ohne JSON');
  return JSON.parse(jsonMatch[0]);
}

// Fallback ohne KI: Metadaten direkt verwenden — Batch bleibt nie stecken
const fallbackCopy = (meta) => ({
  eyebrow: 'Hochzeitsplanung',
  headline: meta.title.split(':')[0].slice(0, 60),
  accentWord: '',
  body: (meta.description || '').split('. ')[0].slice(0, 110),
  pinTitle: meta.title.slice(0, 95),
  pinDescription: (meta.description || meta.title).slice(0, 480),
});

/**
 * Datum für den i-ten Pin eines Laufs. Bei mehreren Pins pro Tag teilen
 * sich jeweils perDay Pins ein Datum — passend zu PINTEREST_PINS_PER_DAY,
 * sonst veröffentlicht der Cron trotz höherem Wert nur einen Pin pro Tag.
 * Rechnet in UTC, damit die Sommerzeit-Umstellung keinen Tag verschluckt.
 */
export function scheduleDate(startDate, index, perDay = 1) {
  const per = Math.max(1, parseInt(perDay, 10) || 1);
  const [y, m, d] = String(startDate).split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d + Math.floor(index / per)));
  return day.toISOString().slice(0, 10);
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function PinBatchGenerator() {
  const [boards, setBoards] = useState([]);
  const [boardId, setBoardId] = useState('');
  // Alle Ziele (Kaufseiten, Tools, Blog) mit Kategorie und letztem Pin-Datum
  const [targets, setTargets] = useState([]);
  const [recent, setRecent] = useState(null); // { normUrl: 'YYYY-MM-DD' }
  const [mixCount, setMixCount] = useState(7);
  const [selected, setSelected] = useState(new Set());
  const touchedRef = useRef(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  });
  // Vorgabe aus PINTEREST_PINS_PER_DAY (über action=status), änderbar
  const [perDay, setPerDay] = useState(1);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const cancelRef = useRef(false);

  // api/pinterest liefert { boards: [...] } — das frühere d.items war immer
  // undefined, deshalb blieb die Board-Auswahl dauerhaft leer.
  const loadBoards = useCallback(() => {
    adminFetch('/api/pinterest?action=boards')
      .then(r => r.json())
      .then(d => {
        const items = d.boards || d.items || [];
        setBoards(items);
        if (items[0]) setBoardId(prev => prev || items[0].id);
      })
      .catch(() => {});
  }, []);

  // Nach dem OAuth-Fenster ist die Verbindung neu — Boards dann nachladen,
  // ohne dass die Seite neu geladen werden muss.
  useEffect(() => {
    const onConnected = () => loadBoards();
    window.addEventListener('pinterestConnected', onConnected);
    return () => window.removeEventListener('pinterestConnected', onConnected);
  }, [loadBoards]);

  useEffect(() => {
    adminFetch('/api/pinterest?action=status')
      .then(r => r.json())
      .then(d => { if (d && d.pins_per_day) setPerDay(d.pins_per_day); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadBoards();
    adminFetch('/api/pinterest?action=blog_list')
      .then(r => r.json())
      .then(d => {
        const prettify = (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const commercial = (d.commercial || []).map(c => ({
          slug: c.slug, title: c.title,
          url: c.slug.startsWith('demo-') ? `https://siwedding.de/${c.slug}`
            : c.slug === 'start' ? `${SITE}/` : `${SITE}/blog/hochzeitswebsite-vergleich-2026`,
        }));
        const tools = (d.tools || []).map(t => ({ slug: t.slug, title: t.title, url: `${SITE}/${t.slug}` }));
        const posts = (d.slugs || []).map(sl => ({ slug: sl, title: prettify(sl), url: `${SITE}/blog/${sl}` }));
        // Gleiche Zielseite nur einmal (Vergleich ist Kaufseite UND Blog-Artikel)
        const seen = new Set();
        const all = [...commercial, ...tools, ...posts].filter(t => {
          const k = normUrl(t.url);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        setTargets(all.map(t => ({ ...t, category: classifyTarget(t.slug) })));
      })
      .catch(() => {});
  }, [loadBoards]);

  // Was wurde wann gepinnt/geplant? Queue (inkl. veröffentlicht) + Entwürfe
  const loadRecent = useCallback(() => {
    Promise.all([
      adminFetch('/api/pinterest?action=queue_list').then(r => r.json()).catch(() => ({})),
      adminFetch('/api/pinterest?action=draft_list').then(r => r.json()).catch(() => ({})),
    ]).then(([q, dr]) => {
      setRecent(buildRecentMap([...(q.items || []), ...(dr.drafts || [])]));
    });
  }, []);

  useEffect(() => {
    loadRecent();
    window.addEventListener('pinDraftsChanged', loadRecent);
    window.addEventListener('pinQueueChanged', loadRecent);
    return () => {
      window.removeEventListener('pinDraftsChanged', loadRecent);
      window.removeEventListener('pinQueueChanged', loadRecent);
    };
  }, [loadRecent]);

  // Ziele mit letztem Pin-Datum
  const withLast = targets.map(t => ({ ...t, last: recent ? recent[normUrl(t.url)] || null : null }));
  const bySlug = Object.fromEntries(withLast.map(t => [t.slug, t]));

  const applyMix = useCallback((n) => {
    const picked = pickMix(withLast, n);
    setSelected(new Set(picked.map(t => t.slug)));
  }, [withLast]);

  // Beim ersten Laden direkt einen Mix vorschlagen (solange nichts angeklickt wurde)
  useEffect(() => {
    if (touchedRef.current || !targets.length || !recent) return;
    touchedRef.current = true;
    applyMix(mixCount);
  }, [targets, recent, applyMix, mixCount]);

  const toggle = (slug) => {
    touchedRef.current = true;
    setSelected(cur => {
      const next = new Set(cur);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  };

  const selectNone = () => { touchedRef.current = true; setSelected(new Set()); };
  const fmt = (iso) => (iso ? iso.split('-').reverse().slice(0, 2).join('.') + '.' : '');
  const lockedSelected = [...selected].filter(s => bySlug[s] && isLocked(bySlug[s].last));
  const mixInfo = CATEGORY_ORDER.slice(0, 3).map(c => {
    const k = [...selected].filter(s => bySlug[s]?.category === c).length;
    return `${CATEGORIES[c].label} ${k}`;
  }).join(' · ');

  const prettify = (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const run = useCallback(async () => {
    // Kategorien abwechselnd einplanen, nicht drei Website-Pins am Stück
    const slugs = interleave([...selected].map(s => bySlug[s] || { slug: s, category: 'bridge' }))
      .map(t => t.slug)
      .slice(0, 20); // Cap: max 20 pro Lauf
    if (!boardId || slugs.length === 0) return;
    setBusy(true);
    cancelRef.current = false;
    const board = boards.find(b => b.id === boardId);
    setResults(slugs.map(s => ({ slug: s, status: 'wartet' })));

    for (let i = 0; i < slugs.length; i++) {
      if (cancelRef.current) break;
      const slug = slugs[i];
      const setStatus = (status, cls) =>
        setResults(cur => cur.map(r => (r.slug === slug ? { ...r, status, cls } : r)));
      setStatus('Meta laden …', 'run');

      try {
        const meta = await adminFetch(`/api/pinterest?action=blog_meta&slug=${slug}`).then(r => r.json());

        setStatus('KI textet …', 'run');
        let copy;
        try {
          copy = await aiPinCopy(meta);
        } catch {
          copy = fallbackCopy(meta);
        }

        // Kein Rendern an dieser Stelle mehr: Entwürfe kommen ohne Bild aus,
        // das entsteht erst beim Übernehmen in die Queue. Damit ist die
        // Massenerzeugung deutlich schneller, und ein Rendering-Fehler bei
        // einem einzelnen Pin bricht nicht den ganzen Lauf ab.
        const layout = meta.image ? (i % 3 === 2 ? 'statement' : 'fullbleed') : 'statement';

        setStatus('Entwurf anlegen …', 'run');
        const scheduled = scheduleDate(startDate, i, perDay);
        const res = await adminFetch('/api/pinterest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'draft_add',
            drafts: [{
              board_id: boardId,
              board_name: board?.name || null,
              title: copy.pinTitle || copy.headline,
              description: copy.pinDescription || meta.description,
              link: withUtm(meta.url),
              scheduled_date: scheduled,
              // Alles, was zum Rendern des Bildes gebraucht wird — so lässt
              // sich der Entwurf später ohne erneuten KI-Aufruf aufbauen.
              meta: {
                layout,
                eyebrow: copy.eyebrow,
                headline: copy.headline,
                accentWord: copy.accentWord,
                body: copy.body,
                imageUrl: meta.image || null,
                sourceSlug: meta.slug || null,
              },
            }],
          }),
        });
        if (res.status === 409) {
          setStatus('übersprungen (Duplikat < 14 Tage)', 'skip');
        } else if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        } else {
          setStatus(`Entwurf angelegt für ${scheduled} (${layout})`, 'ok');
          // Queue-Anzeige unten aktualisieren — ohne dieses Event blieb sie
          // auf "0 geplant" stehen, obwohl die Einträge gespeichert waren.
          window.dispatchEvent(new CustomEvent('pinDraftsChanged'));
        }
      } catch (err) {
        setStatus(`Fehler: ${String(err.message || err)}`, 'err');
      }
    }
    setBusy(false);
    window.dispatchEvent(new CustomEvent('pinDraftsChanged'));
  }, [selected, boardId, boards, startDate, perDay, bySlug]);

  return (
    <Panel>
      <PanelTitle>⚡ Batch-Autopilot</PanelTitle>
      <PanelSub>
        Ziele auswählen → pro Ziel entsteht automatisch ein Entwurf mit KI-Copy, datiert nach
        „Pins pro Tag". Entwürfe prüfen und „In Queue" — erst dann veröffentlicht der tägliche Cron.
      </PanelSub>

      <MixBar>
        <MixBtn onClick={() => { touchedRef.current = true; applyMix(mixCount); }} disabled={busy || !targets.length}>
          ✨ Mix vorschlagen
        </MixBtn>
        <span>Anzahl</span>
        <input
          type="number" min="1" max="20" value={mixCount} disabled={busy}
          onChange={e => setMixCount(Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 1)))}
        />
        <span>
          60 % Brückenthemen · 30 % Hochzeitswebsite · 10 % Reichweite — ohne Ziele,
          die in den letzten {LOCK_DAYS} Tagen gepinnt oder schon geplant sind
        </span>
      </MixBar>

      <SmallBtns>
        <button onClick={selectNone} disabled={busy}>Auswahl leeren</button>
        <span style={{ fontSize: '0.72rem', color: colors.gray }}>
          {selected.size} ausgewählt (max. 20/Lauf){selected.size > 0 && ` — ${mixInfo}`}
        </span>
      </SmallBtns>

      <ListWrap>
        {CATEGORY_ORDER.map(cat => {
          const list = withLast.filter(t => t.category === cat);
          if (!list.length) return null;
          return (
            <React.Fragment key={cat}>
              <GroupHead>{CATEGORIES[cat].label} — {CATEGORIES[cat].hint}</GroupHead>
              {list.map(t => {
                const locked = isLocked(t.last);
                return (
                  <Item key={t.slug} style={cat === 'avoid' ? { opacity: 0.6 } : undefined}>
                    <input type="checkbox" checked={selected.has(t.slug)} onChange={() => toggle(t.slug)} disabled={busy} />
                    <span>{t.title}</span>
                    {t.last && (
                      <LockNote style={locked ? undefined : { color: colors.gray }}>
                        {locked ? '⏸ ' : ''}{daysSince(t.last) < 0 ? 'geplant' : 'zuletzt'} {fmt(t.last)}
                      </LockNote>
                    )}
                    <Chip $color={CATEGORIES[cat].color}>{cat === 'website' ? 'Website' : cat === 'bridge' ? 'Brücke' : cat === 'reach' ? 'Reichweite' : 'Meiden'}</Chip>
                  </Item>
                );
              })}
            </React.Fragment>
          );
        })}
      </ListWrap>

      {lockedSelected.length > 0 && (
        <p style={{ fontSize: '0.74rem', color: colors.amber, margin: '-0.4rem 0 0.9rem' }}>
          ⚠ {lockedSelected.length} ausgewählte{lockedSelected.length === 1 ? 's Ziel wurde' : ' Ziele wurden'} in den
          letzten {LOCK_DAYS} Tagen schon gepinnt oder ist bereits geplant — mehrere Pins auf dieselbe
          Seite nehmen sich gegenseitig die Reichweite.
        </p>
      )}

      <Row>
        <Field>
          <label>Board</label>
          <select value={boardId} onChange={e => setBoardId(e.target.value)} disabled={busy}>
            {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <Field>
          <label>Erster Pin am</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={busy} />
        </Field>
        <Field>
          <label>Pins pro Tag</label>
          <input
            type="number" min="1" max="10" value={perDay} disabled={busy}
            onChange={e => setPerDay(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)))}
            style={{ width: '5rem' }}
            title="Sollte zu PINTEREST_PINS_PER_DAY in Vercel passen"
          />
        </Field>
        <Field style={{ justifyContent: 'flex-end' }}>
          <label>&nbsp;</label>
          {busy ? (
            <Btn onClick={() => { cancelRef.current = true; }}>■ Stoppen</Btn>
          ) : (
            <Btn $primary onClick={run} disabled={!boardId || selected.size === 0}>
              🚀 {Math.min(selected.size, 20)} Pins generieren &amp; einplanen
            </Btn>
          )}
        </Field>
      </Row>

      {results.length > 0 && (
        <Progress>
          <strong>Fortschritt:</strong>
          <ul>
            {results.map(r => (
              <li key={r.slug}>
                <span>{prettify(r.slug)}</span>
                <span className={r.cls || 'run'}>{r.status}</span>
              </li>
            ))}
          </ul>
        </Progress>
      )}
    </Panel>
  );
}
