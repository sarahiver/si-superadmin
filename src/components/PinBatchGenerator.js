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
import styled from 'styled-components';
import { adminFetch } from '../lib/apiClient';
import { withUtm } from './PinterestPublish';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', green: '#2E7D32', amber: '#B45309' };

const W = 1080;
const H = 1620; // 2:3

// ── Brand-Preset (fix — bewusst KEINE Auswahl im UI) ──
const BRAND = {
  bgLight: '#FAFAFA',
  bgDark: '#0A0A0A',
  text: '#0A0A0A',
  textDark: '#FAFAFA',
  accent: '#C41E3A',
  headlineFont: "'Oswald', sans-serif",
  serifFont: "'Source Serif 4', Georgia, serif",
  uiFont: "'Inter', sans-serif",
  logoText: 'S&I.',
  footerText: 'sarahiver.com',
};

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
// PIN-RENDERER (Brand-Preset, 1080×1620)
// ============================================
const escapeHtml = (str) =>
  String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Headline mit rot markiertem accentWord
const headlineHtml = (headline, accentWord, color) => {
  const safe = escapeHtml(headline);
  if (!accentWord) return safe;
  const safeAccent = escapeHtml(accentWord);
  return safe.replace(safeAccent, `<span style="color:${BRAND.accent}">${safeAccent}</span>`) || safe;
};

function buildPinNode({ layout, eyebrow, headline, accentWord, body, imageUrl }) {
  const node = document.createElement('div');
  node.style.cssText = `position:fixed;left:-99999px;top:0;width:${W}px;height:${H}px;overflow:hidden;`;

  const dark = layout === 'fullbleed';
  const text = dark ? BRAND.textDark : BRAND.text;

  const bgLayer = dark
    ? `<img src="${escapeHtml(imageUrl)}" crossorigin="anonymous" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
       <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,10,0.25) 0%,rgba(10,10,10,0.35) 45%,rgba(10,10,10,0.88) 100%);"></div>`
    : '';

  const rule = `<div style="width:120px;height:6px;background:${BRAND.accent};margin:36px 0;"></div>`;

  node.innerHTML = `
    <div style="position:relative;width:100%;height:100%;background:${dark ? BRAND.bgDark : BRAND.bgLight};font-family:${BRAND.uiFont};">
      ${bgLayer}
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:88px 84px;">
        <div style="font-family:${BRAND.uiFont};font-size:26px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${dark ? 'rgba(250,250,250,0.85)' : BRAND.accent};margin-bottom:28px;">${escapeHtml(eyebrow)}</div>
        <div style="font-family:${BRAND.headlineFont};font-weight:700;text-transform:uppercase;font-size:104px;line-height:1.06;color:${text};">${headlineHtml(headline, accentWord, text)}</div>
        ${rule}
        <div style="font-family:${BRAND.serifFont};font-style:italic;font-size:38px;line-height:1.45;color:${dark ? 'rgba(250,250,250,0.85)' : '#444444'};max-width:820px;">${escapeHtml(body)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:72px;">
          <div style="background:${dark ? BRAND.accent : BRAND.bgDark};color:#fff;font-family:${BRAND.uiFont};font-weight:700;font-size:34px;padding:12px 26px;">${BRAND.logoText}</div>
          <div style="font-family:${BRAND.uiFont};font-size:26px;letter-spacing:0.22em;text-transform:uppercase;color:${dark ? 'rgba(250,250,250,0.7)' : colors.gray};">${BRAND.footerText}</div>
        </div>
      </div>
    </div>`;
  return node;
}

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

async function renderPinBase64(pinProps) {
  const html2canvas = await loadHtml2Canvas();
  const node = buildPinNode(pinProps);
  document.body.appendChild(node);
  try {
    // Bild(er) laden lassen, bevor gerendert wird
    const imgs = [...node.querySelectorAll('img')];
    await Promise.all(imgs.map(img => img.complete
      ? Promise.resolve()
      : new Promise(res => { img.onload = res; img.onerror = res; })));
    const canvas = await html2canvas(node.firstElementChild, {
      width: W, height: H, scale: 1, useCORS: true, backgroundColor: null, logging: false,
    });
    return canvas.toDataURL('image/png').split(',')[1];
  } finally {
    node.remove();
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

// ============================================
// MAIN COMPONENT
// ============================================
export default function PinBatchGenerator() {
  const [boards, setBoards] = useState([]);
  const [boardId, setBoardId] = useState('');
  const [articles, setArticles] = useState([]);
  const [tools, setTools] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  });
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
    loadBoards();
    adminFetch('/api/pinterest?action=blog_list')
      .then(r => r.json())
      .then(d => {
        setArticles(d.slugs || []);
        setTools(d.tools || []);
        // Tools vorselektieren — die stärksten Pin-Ziele
        setSelected(new Set((d.tools || []).map(t => t.slug)));
      })
      .catch(() => {});
  }, [loadBoards]);

  const toggle = (slug) =>
    setSelected(cur => {
      const next = new Set(cur);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });

  const selectAll = () => setSelected(new Set([...tools.map(t => t.slug), ...articles]));
  const selectNone = () => setSelected(new Set());

  const prettify = (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const run = useCallback(async () => {
    const slugs = [...selected].slice(0, 20); // Cap: max 20 pro Lauf
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

        setStatus('Pin rendern …', 'run');
        const layout = meta.image ? (i % 3 === 2 ? 'statement' : 'fullbleed') : 'statement';
        const image_base64 = await renderPinBase64({
          layout,
          eyebrow: copy.eyebrow,
          headline: copy.headline,
          accentWord: copy.accentWord,
          body: copy.body,
          imageUrl: meta.image,
        });

        setStatus('In Queue …', 'run');
        const scheduled = new Date(new Date(startDate).getTime() + i * 24 * 3600 * 1000)
          .toISOString().slice(0, 10);
        const res = await adminFetch('/api/pinterest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'queue_add',
            board_id: boardId,
            board_name: board?.name || null,
            title: copy.pinTitle || copy.headline,
            description: copy.pinDescription || meta.description,
            link: withUtm(meta.url),
            image_base64,
            scheduled_date: scheduled,
          }),
        });
        if (res.status === 409) {
          setStatus('übersprungen (Duplikat < 14 Tage)', 'skip');
        } else if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        } else {
          setStatus(`geplant für ${scheduled} (${layout})`, 'ok');
        }
      } catch (err) {
        setStatus(`Fehler: ${String(err.message || err)}`, 'err');
      }
    }
    setBusy(false);
  }, [selected, boardId, boards, startDate]);

  return (
    <Panel>
      <PanelTitle>⚡ Batch-Autopilot</PanelTitle>
      <PanelSub>
        Ziele auswählen → pro Ziel entstehen automatisch KI-Copy und ein markenkonformes
        Pin-Bild (Brand-Preset, Artikelbild als Hintergrund) → gestaffelt 1&nbsp;Pin/Tag in die Queue.
        Der tägliche Cron veröffentlicht.
      </PanelSub>

      <SmallBtns>
        <button onClick={selectAll} disabled={busy}>Alle auswählen</button>
        <button onClick={selectNone} disabled={busy}>Auswahl leeren</button>
        <span style={{ fontSize: '0.72rem', color: colors.gray }}>{selected.size} ausgewählt (max. 20/Lauf)</span>
      </SmallBtns>

      <ListWrap>
        <GroupHead>Kostenlose Tools (beste Pin-Ziele)</GroupHead>
        {tools.map(t => (
          <Item key={t.slug}>
            <input type="checkbox" checked={selected.has(t.slug)} onChange={() => toggle(t.slug)} disabled={busy} />
            {t.title}
          </Item>
        ))}
        <GroupHead>Blog-Artikel</GroupHead>
        {articles.map(slug => (
          <Item key={slug}>
            <input type="checkbox" checked={selected.has(slug)} onChange={() => toggle(slug)} disabled={busy} />
            {prettify(slug)}
          </Item>
        ))}
      </ListWrap>

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
