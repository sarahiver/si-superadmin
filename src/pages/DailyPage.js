// src/pages/DailyPage.js
// "Heute" — einmal morgens ein Klick: Trend-Analyse läuft, entscheidet Reel vs. Post,
// erstellt das komplette Posting + holt ein passendes Live-Stock-Asset (Pexels).
//   - Post  -> "In Generator übernehmen" (Bild + Text -> PNG-Export)
//   - Reel  -> "Fertiges Reel erstellen": KI-Slides + Pexels-Video -> MP4 (clientseitig,
//              stumm; Trending-Audio beim Posten in der IG-App). Kein Editor.
import React, { useState } from 'react';
import styled from 'styled-components';
import { THEMES, loadThemeFontsForCanvas } from '../lib/reelThemes';
import { adminFetch } from '../lib/apiClient';
import { exportReelMP4 } from '../lib/reelExporter';
import InstagramPage from './InstagramPage';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };
const LAYOUT_IDS = ['statement', 'split', 'list', 'dark', 'fullbleed'];

// Gemeinsame Stimme/Textregeln für ALLE generierten Texte (Post + Reel-Slides).
const COPY_RULES = `STIMME & TEXTREGELN (strikt einhalten):
- EMOTIONAL, nicht faktenbasiert. Es geht um das Gefühl: Vorfreude, Liebe, Verbundenheit, der eine besondere Tag, Stolz auf den eigenen Stil. NICHT um Features, Statistiken, Prozente oder Jahreszahlen.
- VERBOTEN sind Clickbait- und Listicle-Muster: "dieser eine Trick", "X Dinge die…", "Premium Paare wissen…", "das machen alle falsch", "bevor es zu spät ist", "die Wahrheit über…", "die niemand dir sagt", "darum versagen …". Das ist billig und unter dem Niveau der Marke.
- VERBOTEN sind Zahlen/Jahreszahlen in eyebrow und headline (kein "2026", keine Prozente, keine "3 Tipps"). Nur erlaubt, wenn emotional zwingend.
- VERBOTEN ist das Nennen interner Design-Theme-Namen im sichtbaren Text (Classic, Editorial, Botanical, Contemporary, Luxe, Neon, Video). Das Theme bestimmt nur das Aussehen, niemals die Worte. Statt "Editorial statt kitschig" lieber das Gefühl beschreiben.
- Durchgehend DEUTSCH, auch der eyebrow. KEINE englischen Wörter im Text (kein "beats", "vs", "Aesthetic", "Trick"). "Instagram" als Eigenname ist ok.
- IMMER "ihr / eure / euch" — NIEMALS "du / dein / dir / deine".
- KEINE Sonderzeichen-Spielereien (%, ≠, →, &-Tricks) und KEINE Emojis.
- headline = ein Gefühl oder ein Bild, kein Verkaufsversprechen.

SO NICHT (schlecht):
- eyebrow "WEDDING WEBSITES 2026" · headline "Premium Paare wissen diesen Website-Trick" · body "Editorial statt kitschig."
- headline "3 Dinge die eure Gäste lieben werden"
- headline "Diese Wahrheit über Hochzeitswebsites" · body "…die niemand dir sagt"
- headline "Funktionalität beats Instagram-Ästhetik" (englisch!) · headline "Darum versagen 90% aller Websites" (Zahl + Clickbait!)

SO JA (nur das Register, NICHT wörtlich übernehmen):
- eyebrow "Euer Tag" · headline "Alles, was ihr fühlt — an einem Ort" · body "Eure Geschichte, eure Worte. Ein Zuhause im Netz für euren Tag."
- eyebrow "Noch vor dem Ja" · headline "Die schönste Vorfreude beginnt hier"`;

async function urlToDataUrl(url) {
  const r = await fetch(url, { mode: 'cors' });
  const blob = await r.blob();
  return await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });
}

// ---- Reel-Helfer (clientseitig, kein Editor) --------------------------------

let _elId = 1000;
function nextElId() { return _elId++; }

// AI-Items -> Slides (gleiche Element-Struktur wie der Reels-Editor)
function buildSlidesFromItems(items) {
  return items.map((item, i) => {
    const elements = [
      { id: nextElId(), type: 'logo', text: 'S&I.', animation: 'fadeIn', delay: 0.2, animDuration: 0.5, xPercent: 0.067, yPercent: 0.04 },
    ];
    if (item.eyebrow) {
      elements.push({ id: nextElId(), type: 'eyebrow', text: item.eyebrow, animation: 'fadeUp', delay: 0.4, animDuration: 0.5, xPercent: 0.067, yPercent: 0.35 });
    }
    elements.push({ id: nextElId(), type: 'divider', text: '', animation: 'fadeUp', delay: 0.6, animDuration: 0.4, xPercent: 0.067, yPercent: 0.39 });
    elements.push({ id: nextElId(), type: 'headline', text: item.headline || 'Headline', animation: 'fadeUp', delay: 0.7, animDuration: 0.6, xPercent: 0.067, yPercent: 0.42, fontSize: 80 });
    if (item.body) {
      elements.push({ id: nextElId(), type: 'body', text: item.body, animation: 'fadeUp', delay: 1.2, animDuration: 0.5, xPercent: 0.067, yPercent: 0.60 });
    }
    elements.push({ id: nextElId(), type: 'footer', text: '', animation: 'fadeIn', delay: 1.5, animDuration: 0.5, xPercent: 0.067, yPercent: 0.96 });
    return {
      id: nextElId(),
      duration: 4,
      transitionIn: i === 0 ? 'none' : 'crossfade',
      transitionDuration: 0.5,
      backgroundType: 'solid',
      backgroundImage: null,
      backgroundDarken: 0.4,
      elements,
    };
  });
}

// Pexels-Video CORS-sauber laden: fetch -> Blob -> objectURL (sonst "taintet"
// der Canvas und der VideoFrame-Export schlägt fehl).
async function loadVideoEl(url) {
  let resp;
  try {
    resp = await fetch(url, { mode: 'cors' });
  } catch {
    throw new Error('Dieser Clip ist nicht direkt verarbeitbar (CORS). Bitte oben einen anderen Clip wählen.');
  }
  if (!resp.ok) throw new Error('Video-Download fehlgeschlagen (' + resp.status + ').');
  const blob = await resp.blob();
  const objUrl = URL.createObjectURL(blob);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = objUrl;
  await new Promise((res, rej) => {
    const ok = () => { cleanup(); res(); };
    const fail = () => { cleanup(); rej(new Error('Video konnte nicht dekodiert werden.')); };
    const cleanup = () => { video.removeEventListener('loadeddata', ok); video.removeEventListener('error', fail); };
    video.addEventListener('loadeddata', ok, { once: true });
    video.addEventListener('error', fail, { once: true });
  });
  if (!video.duration || isNaN(video.duration) || !isFinite(video.duration)) {
    await new Promise((res) => { video.addEventListener('loadedmetadata', res, { once: true }); setTimeout(res, 600); });
  }
  return { video, objUrl };
}

// Aus dem Tages-Vorschlag ein 3–5-Slide-Reel-Skript machen.
async function generateReelItems(suggestion) {
  const prompt = `Du bist Content Creator für S&I. Wedding (sarahiver.com) — Premium-Hochzeitswebsites aus Hamburg.
Mache aus folgendem Vorschlag ein Instagram-Reel-Skript (9:16, 3–5 Slides, je ca. 4 Sek):
- Thema/Gefühl: "${suggestion.headline || ''}"
- Kontext: "${suggestion.body || ''}"
- Emotionaler Winkel: "${suggestion.trigger || suggestion.reason || ''}"

Aufbau:
- Slide 1 = emotionaler Einstieg, sofort spürbar (kein Clickbait, keine Frage-Falle).
- Mittelteil = 1–3 Slides, die das Gefühl vertiefen oder eine kleine Idee/Geschichte erzählen — KEIN Feature-Listing, KEINE Aufzählung mit Zahlen.
- Letzter Slide = ruhiger CTA (z.B. "Link in Bio", "sarahiver.com").
- Texte SEHR kurz: headline max 8 Wörter, body max 18 Wörter (oder "").

${COPY_RULES}

Antworte NUR mit validem JSON-Array, kein Markdown:
[{"eyebrow":"...","headline":"...","body":"..."}, ...]`;

  try {
    const res = await adminFetch('/api/ai-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    const text = (data.content || []).filter((i) => i.type === 'text').map((i) => i.text || '').join('\n');
    const clean = text.replace(/```json|```/g, '').trim();
    const m = clean.match(/\[[\s\S]*\]/);
    if (m) {
      const parsed = JSON.parse(m[0]);
      if (Array.isArray(parsed) && parsed.length) return parsed.slice(0, 5);
    }
  } catch {
    /* fällt unten auf den Vorschlag zurück */
  }
  // Fallback: aus dem Tages-Vorschlag selbst zwei Slides bauen
  return [
    { eyebrow: suggestion.eyebrow || '', headline: suggestion.headline || 'S&I. Wedding', body: suggestion.body || '' },
    { eyebrow: '', headline: 'Link in Bio', body: 'sarahiver.com' },
  ];
}

// ----------------------------------------------------------------------------

export default function DailyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [assets, setAssets] = useState([]);
  const [selected, setSelected] = useState(0);
  const [seed, setSeed] = useState(null);
  const [seedKey, setSeedKey] = useState(0);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [takingOver, setTakingOver] = useState(false);

  // Reel-Render-State
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [renderDone, setRenderDone] = useState(false);

  const themeIds = Object.keys(THEMES);

  const fullCaption = suggestion
    ? `${suggestion.caption || ''}${suggestion.hashtags ? '\n\n' + suggestion.hashtags : ''}`
    : '';

  const buildPrompt = () => `Du bist Social-Media-Stratege für S&I. Wedding (sarahiver.com) — Premium-Hochzeitswebsites aus Hamburg, DACH-Raum. Tonalität: warm, selbstbewusst, leicht editorial, nie kitschig.

Aufgabe: Erstelle EINEN kompletten Posting-Vorschlag für HEUTE auf Instagram.

1) Analysiere via Web-Suche, welche Themen, Gefühle und Fragen rund um Hochzeit & Hochzeitswebsites Paare gerade bewegen. Nutze das NUR, um ein relevantes, emotional aufgeladenes Thema zu finden — KEIN Trend-Report, KEINE Statistik. Deutschsprachiger Content ist Whitespace.
2) Entscheide selbst das Format: "post" (Foto/Carousel) oder "reel" (Kurzvideo).
3) Wähle EINEN emotionalen Winkel: Vorfreude, Verbundenheit, Romantik/Sehnsucht, Stolz auf den eigenen Stil, oder das Besondere des einen Tages. KEINE Angst-, Druck- oder Ego-Hooks.
4) Wähle ein Theme (nur fürs Aussehen, NICHT im Text nennen): ${themeIds.join(', ')}.
5) Wähle ein Layout: ${LAYOUT_IDS.join(', ')}. Bei "post" bevorzuge "fullbleed" oder "split".
6) Liefere "visualKeywords": 4–6 englische Substantive zum Finden des Bildes/Videos (z.B. "bride", "table setting", "wedding rings", "couple", "stationery").

${COPY_RULES}

accentWord MUSS wortwörtlich in headline vorkommen und sollte ein emotionales Wort sein.

Antworte NUR mit EINEM validen JSON-Objekt, kein Markdown:
{"format":"post|reel","platform":"instagram","theme":"<id>","layout":"<id>","trigger":"<emotionaler Winkel>","eyebrow":"deutsch, ohne Zahlen","headline":"ein Gefühl oder Bild, kein Verkaufsversprechen","accentWord":"emotionales Wort aus headline","body":"1–2 warme Sätze, kein Feature-Listing","caption":"3–5 Sätze, warm mit Sog, endet mit einer echten Frage + dezentem CTA","hashtags":"#tag1 #tag2 #tag3 #tag4 #tag5","visualKeywords":["...","..."],"reason":"1 Satz: warum dieser emotionale Winkel heute"}`;

  const run = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setAssets([]);
    setSeed(null);
    setSelected(0);
    setRenderError(null);
    setRenderStatus('');
    setRenderDone(false);
    setRenderProgress(0);
    try {
      // 1) Analyse + komplettes Posting
      const aiRes = await adminFetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: buildPrompt(),
          webSearch: true,
          searchHint: 'Nutze web_search für aktuelle Wedding-Website-Trends & -Hashtags der letzten 30 Tage (TikTok, Reels, Pinterest, Reddit).',
        }),
      });
      const aiData = await aiRes.json();
      const text = (aiData.content || []).filter((i) => i.type === 'text').map((i) => i.text || '').join('\n');
      const match = text.replace(/```json|```/g, '').match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Konnte keinen Vorschlag aus der KI-Antwort lesen.');
      const sug = JSON.parse(match[0]);
      if (!themeIds.includes(sug.theme)) sug.theme = 'classic';
      if (!LAYOUT_IDS.includes(sug.layout)) sug.layout = sug.format === 'reel' ? 'fullbleed' : 'split';
      setSuggestion(sug);

      // 2) Passendes Live-Stock-Asset (Pexels)
      const assetRes = await adminFetch('/api/stock-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: sug.visualKeywords || [],
          format: sug.format,
          max: 6,
        }),
      });
      const assetData = await assetRes.json();
      if (assetData.error) {
        setError(`Stock: ${assetData.error}`);
      } else {
        setAssets(assetData.assets || []);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(fullCaption).then(() => {
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    });
  };

  const takeIntoGenerator = async () => {
    if (!suggestion) return;
    setTakingOver(true);
    let image = null;
    const a = assets[selected];
    if (a && a.resource_type === 'image') {
      try {
        image = await urlToDataUrl(a.download_url || a.secure_url);
      } catch {
        image = a.download_url || a.secure_url; // Fallback (ggf. CORS-Hinweis beim Export)
      }
    }
    setSeed({
      theme: suggestion.theme,
      layout: suggestion.layout,
      eyebrow: suggestion.eyebrow,
      headline: suggestion.headline,
      accentWord: suggestion.accentWord,
      body: suggestion.body,
      caption: fullCaption,
      image,
    });
    setSeedKey((k) => k + 1);
    setTakingOver(false);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  // Reel komplett automatisch rendern (kein Editor): KI-Slides -> Pexels-Video -> MP4.
  const renderReel = async () => {
    if (!suggestion) return;
    const vid = assets[selected];
    if (!vid || vid.resource_type !== 'video') {
      setRenderError('Kein Video ausgewählt.');
      return;
    }
    setRendering(true);
    setRenderError(null);
    setRenderDone(false);
    setRenderProgress(0);
    setRenderStatus('KI erstellt Slide-Texte…');
    let objUrl = null;
    try {
      // 1) Slide-Texte
      const items = await generateReelItems(suggestion);
      const slides = buildSlidesFromItems(items);

      // 2) Fonts fürs Canvas + Video CORS-sauber laden
      setRenderStatus('Schriften & Video werden geladen…');
      await loadThemeFontsForCanvas(suggestion.theme).catch(() => {});
      const loaded = await loadVideoEl(vid.secure_url);
      objUrl = loaded.objUrl;

      // 3) Reel rendern + als MP4 herunterladen
      setRenderStatus('Reel wird gerendert…');
      const reelData = {
        themeId: suggestion.theme,
        slides,
        globalBgElement: loaded.video,
        globalBgDarken: 0.45,
      };
      await exportReelMP4(reelData, {
        onProgress: (p) => setRenderProgress(p),
        onStatus: (s) => setRenderStatus(s),
      });
      setRenderDone(true);
      setRenderStatus('✓ MP4 heruntergeladen.');
    } catch (e) {
      setRenderError(e.message || 'Render fehlgeschlagen.');
      setRenderStatus('');
    } finally {
      if (objUrl) URL.revokeObjectURL(objUrl);
      setRendering(false);
    }
  };

  const asset = assets[selected];
  const isReel = suggestion?.format === 'reel';
  const canRenderReel = !!asset && asset.resource_type === 'video';

  return (
    <Wrap>
      <Intro>
        <GenerateButton onClick={run} disabled={loading}>
          {loading ? <><Spinner /> Analyse läuft…</> : '✨ Heutigen Vorschlag erstellen'}
        </GenerateButton>
        <p>Trend-Analyse → Format-Entscheidung → komplettes Posting + passendes Live-Stock-Asset (Pexels).</p>
      </Intro>

      {error && <Banner $error>{error}</Banner>}

      {suggestion && (
        <Card>
          <CardTop>
            <Badge $reel={isReel}>{isReel ? '🎬 Reel' : '📸 Post'}</Badge>
            <MetaTags>
              <span>{suggestion.theme}</span>
              <span>· {suggestion.layout}</span>
              {suggestion.trigger && <span>· {suggestion.trigger}</span>}
            </MetaTags>
          </CardTop>
          {suggestion.reason && <Reason>{suggestion.reason}</Reason>}

          <Split>
            {/* MEDIA */}
            <MediaCol>
              <SectionLabel>Passendes Asset {assets.length ? `(${assets.length})` : ''} · Pexels</SectionLabel>
              {asset ? (
                <>
                  <MediaBox>
                    {asset.resource_type === 'video' ? (
                      <video src={asset.secure_url} poster={asset.thumb} controls style={{ width: '100%', display: 'block' }} />
                    ) : (
                      <img src={asset.secure_url} alt="" style={{ width: '100%', display: 'block' }} />
                    )}
                  </MediaBox>
                  <Credit>
                    {asset.resource_type === 'video' ? 'Video' : 'Foto'}:{' '}
                    <a href={asset.pexels_url} target="_blank" rel="noreferrer">{asset.photographer}</a>
                    {' · '}
                    <a href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a>
                  </Credit>
                  {assets.length > 1 && (
                    <Thumbs>
                      {assets.map((a, i) => (
                        <Thumb key={i} $active={i === selected} onClick={() => { setSelected(i); setRenderError(null); setRenderDone(false); setRenderStatus(''); }}>
                          <img src={a.thumb} alt="" />
                        </Thumb>
                      ))}
                    </Thumbs>
                  )}
                  <a href={asset.download_url || asset.secure_url} download target="_blank" rel="noreferrer">
                    <DownloadBtn>⬇ {asset.resource_type === 'video' ? 'Original-Video' : 'Bild'} herunterladen</DownloadBtn>
                  </a>
                  <Attribution>Fotos &amp; Videos von <a href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a>. Für den fertigen Post ist keine Angabe nötig.</Attribution>
                </>
              ) : (
                <Empty>Kein Stock-Asset gefunden — Vorschlag neu generieren oder Keywords der KI variieren.</Empty>
              )}
            </MediaCol>

            {/* TEXT */}
            <TextCol>
              <SectionLabel>Text</SectionLabel>
              <Eyebrow>{suggestion.eyebrow}</Eyebrow>
              <Headline>{suggestion.headline}</Headline>
              <Body>{suggestion.body}</Body>

              <SectionLabel style={{ marginTop: '1rem' }}>Caption + Hashtags</SectionLabel>
              <CaptionBox>{fullCaption}</CaptionBox>
              <CopyButton onClick={copyCaption}>{captionCopied ? '✓ Kopiert!' : '📋 Caption kopieren'}</CopyButton>
            </TextCol>
          </Split>

          <ActionRow>
            {!isReel && (
              <PrimaryBtn onClick={takeIntoGenerator} disabled={takingOver}>
                {takingOver ? 'Übernehme…' : '🎨 In Generator übernehmen (Bild + Text)'}
              </PrimaryBtn>
            )}

            {isReel && (
              <ReelActions>
                <PrimaryBtn onClick={renderReel} disabled={rendering || !canRenderReel}>
                  {rendering ? 'Rendere…' : '🎬 Fertiges Reel erstellen & herunterladen'}
                </PrimaryBtn>

                {(rendering || renderStatus) && (
                  <RenderStatusWrap>
                    <RenderBar><div style={{ width: `${Math.round(renderProgress * 100)}%` }} /></RenderBar>
                    <RenderStatusText $done={renderDone}>{renderStatus}</RenderStatusText>
                  </RenderStatusWrap>
                )}

                {renderError && (
                  <Banner $error style={{ marginTop: '0.5rem' }}>
                    {renderError} Tipp: oben einen anderen Clip wählen und erneut rendern.
                  </Banner>
                )}

                {renderDone && (
                  <SuccessNote>
                    ✓ MP4 liegt in deinem Download-Ordner. Caption oben kopieren → Video auf Google&nbsp;Drive →
                    am Handy in der IG-App posten und Trending-Audio drüberlegen.
                  </SuccessNote>
                )}

                <Note style={{ marginTop: '0.4rem' }}>
                  Wird <strong>stumm</strong> gerendert (Text über Video, 1080×1920). Musik fügst du beim Posten in der App hinzu.
                </Note>
              </ReelActions>
            )}
          </ActionRow>
        </Card>
      )}

      {seed && (
        <GeneratorWrap>
          <SectionLabel>Im Generator — anpassen & herunterladen</SectionLabel>
          <InstagramPage key={seedKey} platform="instagram" seed={seed} />
        </GeneratorWrap>
      )}
    </Wrap>
  );
}

// ============================================
// STYLED
// ============================================
const Wrap = styled.div`display: flex; flex-direction: column; gap: 1.5rem;`;

const Intro = styled.div`
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
  p { font-family: 'Source Serif 4', serif; font-style: italic; color: ${colors.gray}; font-size: 0.9rem; margin: 0; }
`;

const GenerateButton = styled.button`
  font-family: 'Oswald', sans-serif; font-size: 0.9rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 1rem 2.25rem; cursor: pointer; border: none; color: #fff;
  background: ${p => p.disabled ? colors.gray : colors.red};
  pointer-events: ${p => p.disabled ? 'none' : 'auto'};
  display: inline-flex; align-items: center; gap: 0.5rem;
  &:hover { background: #a01830; }
`;

const Card = styled.div`background: #fff; border: 1px solid ${colors.lightGray}; padding: 1.75rem;`;
const CardTop = styled.div`display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;`;
const Badge = styled.span`
  font-family: 'Oswald', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em;
  padding: 0.35rem 0.85rem; color: #fff; background: ${p => p.$reel ? '#7C3AED' : colors.red};
`;
const MetaTags = styled.div`font-family: 'Inter', sans-serif; font-size: 0.7rem; color: ${colors.gray}; text-transform: uppercase; letter-spacing: 0.06em; display: flex; gap: 0.3rem;`;
const Reason = styled.p`font-family: 'Source Serif 4', serif; font-style: italic; color: ${colors.gray}; font-size: 0.9rem; margin: 0 0 1.25rem;`;

const Split = styled.div`display: grid; grid-template-columns: 320px 1fr; gap: 1.5rem; @media (max-width: 768px) { grid-template-columns: 1fr; }`;
const MediaCol = styled.div``;
const TextCol = styled.div``;
const SectionLabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.gray}; margin-bottom: 0.6rem;`;

const MediaBox = styled.div`border: 1px solid ${colors.lightGray}; background: ${colors.background}; overflow: hidden;`;
const Thumbs = styled.div`display: flex; gap: 0.4rem; margin-top: 0.5rem; flex-wrap: wrap;`;
const Thumb = styled.button`
  width: 52px; height: 52px; padding: 0; cursor: pointer; overflow: hidden;
  border: 2px solid ${p => p.$active ? colors.red : colors.lightGray}; background: ${colors.background};
  img, video { width: 100%; height: 100%; object-fit: cover; }
`;
const DownloadBtn = styled.span`
  display: inline-block; margin-top: 0.6rem; font-family: 'Oswald', sans-serif; font-size: 0.72rem; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase; padding: 0.6rem 1.2rem; border: 2px solid ${colors.black}; color: ${colors.black};
  &:hover { background: ${colors.black}; color: #fff; }
`;
const Credit = styled.div`
  font-family: 'Inter', sans-serif; font-size: 0.68rem; color: ${colors.gray}; margin-top: 0.4rem;
  a { color: ${colors.gray}; text-decoration: underline; }
`;
const Attribution = styled.div`
  font-family: 'Inter', sans-serif; font-size: 0.62rem; color: ${colors.gray}; opacity: 0.75; margin-top: 0.5rem; line-height: 1.4;
  a { color: ${colors.gray}; }
`;

const Eyebrow = styled.div`font-family: 'Inter', sans-serif; font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.red}; margin-bottom: 0.35rem;`;
const Headline = styled.div`font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 400; color: ${colors.black}; line-height: 1.2; margin-bottom: 0.5rem;`;
const Body = styled.div`font-family: 'Inter', sans-serif; font-size: 0.85rem; color: ${colors.gray}; line-height: 1.6;`;
const CaptionBox = styled.div`background: #F9F9F7; border: 1px solid ${colors.lightGray}; padding: 1rem; font-family: 'Inter', sans-serif; font-size: 0.82rem; line-height: 1.6; white-space: pre-wrap; color: ${colors.black};`;
const CopyButton = styled.button`
  font-family: 'Oswald', sans-serif; font-size: 0.7rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 0.55rem 1.2rem; margin-top: 0.5rem; cursor: pointer; border: 2px solid ${colors.red}; background: transparent; color: ${colors.red};
  &:hover { background: ${colors.red}; color: #fff; }
`;

const ActionRow = styled.div`margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid ${colors.lightGray}; display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;`;
const PrimaryBtn = styled.button`
  font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 0.85rem 2rem; cursor: pointer; border: none; color: #fff;
  background: linear-gradient(135deg, #833AB4, #E1306C, #F77737);
  &:hover { opacity: 0.92; } &:disabled { opacity: 0.6; pointer-events: none; }
`;
const Note = styled.div`font-family: 'Inter', sans-serif; font-size: 0.82rem; color: ${colors.black}; line-height: 1.5;`;

const ReelActions = styled.div`display: flex; flex-direction: column; gap: 0.5rem; width: 100%;`;
const RenderStatusWrap = styled.div`display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.4rem;`;
const RenderBar = styled.div`
  height: 4px; background: ${colors.lightGray}; overflow: hidden;
  div { height: 100%; background: ${colors.red}; transition: width 0.1s linear; }
`;
const RenderStatusText = styled.div`
  font-family: 'Inter', sans-serif; font-size: 0.75rem; line-height: 1.4;
  color: ${p => p.$done ? '#0a7d33' : colors.gray};
`;
const SuccessNote = styled.div`
  font-family: 'Inter', sans-serif; font-size: 0.8rem; line-height: 1.5; color: ${colors.black};
  background: #EEF8F0; border: 1px solid #BFE6C9; padding: 0.7rem 0.9rem; margin-top: 0.4rem;
`;

const GeneratorWrap = styled.div`border-top: 2px solid ${colors.lightGray}; padding-top: 1.5rem;`;
const Empty = styled.div`font-family: 'Inter', sans-serif; font-size: 0.8rem; color: ${colors.gray}; padding: 1rem; border: 1px dashed ${colors.lightGray};`;
const Banner = styled.div`padding: 0.85rem 1.1rem; font-family: 'Inter', sans-serif; font-size: 0.82rem; background: ${p => p.$error ? '#FDECEC' : colors.background}; border: 1px solid ${p => p.$error ? colors.red : colors.lightGray}; color: ${p => p.$error ? '#a01830' : colors.black};`;
const Spinner = styled.span`display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; @keyframes spin { to { transform: rotate(360deg); } }`;
