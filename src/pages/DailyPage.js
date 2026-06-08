// src/pages/DailyPage.js
// "Heute" — einmal morgens ein Klick: Trend-Analyse läuft, entscheidet Reel vs. Post,
// erstellt das komplette Posting und verbindet es mit dem passenden Cloudinary-Asset.
import React, { useState } from 'react';
import styled from 'styled-components';
import { THEMES } from '../lib/reelThemes';
import { adminFetch } from '../lib/apiClient';
import InstagramPage from './InstagramPage';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };
const LAYOUT_IDS = ['statement', 'split', 'list', 'dark', 'fullbleed'];

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

  const themeIds = Object.keys(THEMES);

  const fullCaption = suggestion
    ? `${suggestion.caption || ''}${suggestion.hashtags ? '\n\n' + suggestion.hashtags : ''}`
    : '';

  const buildPrompt = () => `Du bist Social-Media-Stratege für S&I. Wedding (sarahiver.com) — Premium-Hochzeitswebsites aus Hamburg, DACH-Raum. Tonalität: warm, selbstbewusst, editorial, nie kitschig.

Aufgabe: Erstelle EINEN kompletten Posting-Vorschlag für HEUTE auf Instagram.

1) Analysiere via Web-Suche, was im Wedding-Website-Umfeld gerade läuft (Trends, Formate, wiederkehrende Diskussionen). Deutschsprachiger Content ist Whitespace — das ist der Vorteil.
2) Entscheide selbst das Format: "post" (Foto/Carousel) oder "reel" (Kurzvideo) — je nachdem, was heute am stärksten performt.
3) Wähle den stärksten Hook-Trigger (Überraschung, Angst/Scham, Ego, Dringlichkeit, Verlangen). Hook stoppt den Scroll in den ersten 2 Sekunden, Neugierlücke öffnen.
4) Wähle ein Theme aus: ${themeIds.join(', ')}.
5) Wähle ein Layout aus: ${LAYOUT_IDS.join(', ')}. Bei "post" bevorzuge "fullbleed" oder "split", damit das Bild zur Geltung kommt.
6) Liefere "visualKeywords": 4–6 englische Substantive zum Finden des passenden Bildes/Videos (z.B. "bride", "table setting", "wedding rings", "couple", "stationery").

accentWord MUSS wortwörtlich in headline vorkommen.

Antworte NUR mit EINEM validen JSON-Objekt, kein Markdown:
{"format":"post|reel","platform":"instagram","theme":"<id>","layout":"<id>","trigger":"<trigger>","eyebrow":"...","headline":"scroll-stoppender Hook","accentWord":"ein Wort aus headline","body":"1–2 Sätze","caption":"3–5 Sätze, warm mit Sog, endet mit Kommentar-Bait + dezentem CTA","hashtags":"#tag1 #tag2 #tag3 #tag4 #tag5","visualKeywords":["...","..."],"reason":"1 Satz: warum dieser Vorschlag heute"}`;

  const run = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setAssets([]);
    setSeed(null);
    setSelected(0);
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
    const asset = assets[selected];
    if (asset && asset.resource_type === 'image') {
      try {
        image = await urlToDataUrl(asset.download_url || asset.secure_url);
      } catch {
        image = asset.download_url || asset.secure_url; // Fallback (ggf. CORS-Hinweis beim Export)
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

  const asset = assets[selected];
  const isReel = suggestion?.format === 'reel';

  return (
    <Wrap>
      <Intro>
        <GenerateButton onClick={run} disabled={loading}>
          {loading ? <><Spinner /> Analyse läuft…</> : '✨ Heutigen Vorschlag erstellen'}
        </GenerateButton>
        <p>Trend-Analyse → Format-Entscheidung → komplettes Posting + passendes Cloudinary-Asset.</p>
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
                        <Thumb key={i} $active={i === selected} onClick={() => setSelected(i)}>
                          <img src={a.thumb} alt="" />
                        </Thumb>
                      ))}
                    </Thumbs>
                  )}
                  <a href={asset.download_url || asset.secure_url} download target="_blank" rel="noreferrer">
                    <DownloadBtn>⬇ {asset.resource_type === 'video' ? 'Video' : 'Bild'} herunterladen</DownloadBtn>
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
              <Note>🎬 Reel: Video herunterladen, Hook „{suggestion.headline}" als Text-Overlay in CapCut, Caption einfügen — fertig.</Note>
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

const GeneratorWrap = styled.div`border-top: 2px solid ${colors.lightGray}; padding-top: 1.5rem;`;
const Empty = styled.div`font-family: 'Inter', sans-serif; font-size: 0.8rem; color: ${colors.gray}; padding: 1rem; border: 1px dashed ${colors.lightGray};`;
const Banner = styled.div`padding: 0.85rem 1.1rem; font-family: 'Inter', sans-serif; font-size: 0.82rem; background: ${p => p.$error ? '#FDECEC' : colors.background}; border: 1px solid ${p => p.$error ? colors.red : colors.lightGray}; color: ${p => p.$error ? '#a01830' : colors.black};`;
const Spinner = styled.span`display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; @keyframes spin { to { transform: rotate(360deg); } }`;
