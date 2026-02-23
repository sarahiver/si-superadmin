// src/pages/InstagramPage.js
// S&I. Instagram Post Generator — SuperAdmin Integration
// Theme-spezifische Posts mit KI-Textvorschlägen, Bild-Upload, Live Preview
import React, { useState, useRef, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { THEMES } from '../lib/reelThemes';

// ============================================
// DESIGN TOKENS
// ============================================
const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };

const LAYOUTS = {
  statement: { name: 'Statement', desc: 'Große Headline, minimal' },
  split: { name: 'Split', desc: 'Bild links, Text rechts' },
  list: { name: 'Liste', desc: 'Strukturierte Items' },
  dark: { name: 'Dark', desc: 'Invertiert, Akzente' },
  fullbleed: { name: 'Fullbleed', desc: 'Bild-Hintergrund' },
};

const CATEGORIES = [
  { id: 'vorstellung', label: 'Vorstellung', icon: '👋', desc: 'Wer sind wir' },
  { id: 'features', label: 'Features', icon: '⚡', desc: 'Was bieten wir' },
  { id: 'themes', label: 'Themes', icon: '🎨', desc: 'Theme-Vorstellung' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'Admin-Features' },
  { id: 'pricing', label: 'Pricing', icon: '💰', desc: 'Preise & Pakete' },
  { id: 'cta', label: 'Call to Action', icon: '🚀', desc: 'Kontakt & Demo' },
  { id: 'behind', label: 'Behind the Scenes', icon: '📸', desc: 'Einblicke' },
  { id: 'tipps', label: 'Hochzeitstipps', icon: '💡', desc: 'Mehrwert-Content' },
  { id: 'custom', label: 'Eigenes Thema', icon: '✏️', desc: 'Freitext-Eingabe' },
];

// ============================================
// STYLED COMPONENTS (SuperAdmin Editorial Style)
// ============================================
const PageHeader = styled.div`
  margin-bottom: 2rem;
  h1 {
    font-family: 'Oswald', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    text-transform: uppercase;
    color: ${colors.black};
    margin-bottom: 0.25rem;
  }
  p {
    font-family: 'Source Serif 4', serif;
    font-style: italic;
    color: ${colors.gray};
    font-size: 1rem;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  align-items: start;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: #fff;
  border: 1px solid ${colors.lightGray};
  padding: 1.5rem;
`;

const SectionLabel = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${colors.gray};
  margin-bottom: 0.75rem;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 1.25rem;
`;

const Chip = styled.button`
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: ${p => p.$active ? 600 : 400};
  padding: 0.5rem 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid ${p => p.$active ? colors.black : colors.lightGray};
  background: ${p => p.$active ? colors.black : '#fff'};
  color: ${p => p.$active ? '#fff' : colors.black};
  &:hover { border-color: ${colors.black}; }
`;

const TabBar = styled.div`
  display: flex;
  border-bottom: 2px solid ${colors.black};
  margin-bottom: 1.25rem;
`;

const Tab = styled.button`
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: ${p => p.$active ? 600 : 400};
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  border: none;
  background: ${p => p.$active ? colors.black : 'transparent'};
  color: ${p => p.$active ? '#fff' : colors.black};
  transition: all 0.15s;
`;

const Label = styled.label`
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${colors.gray};
  display: block;
  margin-bottom: 0.25rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid ${colors.lightGray};
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  background: #fff;
  outline: none;
  transition: border 0.15s;
  &:focus { border-color: ${colors.red}; }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid ${colors.lightGray};
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  background: #fff;
  resize: vertical;
  outline: none;
  &:focus { border-color: ${colors.red}; }
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const Field = styled.div`margin-bottom: 0.75rem;`;

const PrimaryButton = styled.button`
  font-family: 'Oswald', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.85rem 2rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  background: ${p => p.$loading ? colors.gray : colors.red};
  color: #fff;
  pointer-events: ${p => p.$loading ? 'none' : 'auto'};
  &:hover { background: #a01830; }
`;

const SecondaryButton = styled.button`
  font-family: 'Oswald', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  border: 2px solid ${colors.black};
  background: transparent;
  color: ${colors.black};
  transition: all 0.2s;
  &:hover { background: ${colors.black}; color: #fff; }
`;

const FileLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${colors.lightGray};
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  transition: all 0.15s;
  &:hover { border-color: ${colors.black}; }
  input { display: none; }
`;

const ImagePreview = styled.img`
  width: 36px;
  height: 36px;
  object-fit: cover;
  border: 1px solid ${colors.lightGray};
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${colors.red};
  font-size: 0.8rem;
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.35rem;
  margin-bottom: 1rem;
`;

const CategoryBtn = styled.button`
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  padding: 0.65rem 0.5rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  border: 1px solid ${p => p.$active ? colors.black : colors.lightGray};
  background: ${p => p.$active ? colors.black : '#fff'};
  color: ${p => p.$active ? '#fff' : colors.black};
  &:hover { border-color: ${colors.black}; }
  span.icon { font-size: 1rem; margin-right: 0.25rem; }
  span.desc { display: block; font-size: 0.5rem; opacity: 0.5; margin-top: 2px; }
`;

const SuggestionCard = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: #fff;
  border: 1px solid ${colors.lightGray};
  padding: 1rem;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 0.5rem;
  &:hover { border-color: ${colors.red}; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
`;

const SuggestionEyebrow = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 0.55rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${colors.red};
  margin-bottom: 0.25rem;
`;

const SuggestionHeadline = styled.div`
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.1rem;
  font-weight: 300;
  color: ${colors.black};
  margin-bottom: 0.25rem;
`;

const SuggestionBody = styled.div`
  font-size: 0.7rem;
  color: ${colors.gray};
  line-height: 1.4;
`;

const ApplyLabel = styled.div`
  font-size: 0.55rem;
  color: ${colors.red};
  font-weight: 600;
  margin-top: 0.4rem;
`;

const SuggestionCaption = styled.div`
  font-size: 0.6rem;
  color: ${colors.gray};
  margin-top: 0.35rem;
  padding-top: 0.35rem;
  border-top: 1px solid ${colors.lightGray};
  line-height: 1.4;
`;

const SuggestionHashtags = styled.div`
  font-size: 0.55rem;
  color: #3B82F6;
  margin-top: 0.2rem;
`;

const CaptionBox = styled.div`
  background: #F9F9F7;
  border: 1px solid ${colors.lightGray};
  padding: 1rem;
  margin-top: 0.25rem;
`;

const CopyButton = styled.button`
  font-family: 'Oswald', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.6rem 1.25rem;
  margin-top: 0.5rem;
  cursor: pointer;
  border: 2px solid ${colors.red};
  background: transparent;
  color: ${colors.red};
  transition: all 0.2s;
  &:hover { background: ${colors.red}; color: #fff; }
`;

const ActionBar = styled.div`
  margin-top: 0.75rem;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const InstagramButton = styled.button`
  font-family: 'Oswald', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.85rem 2rem;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, #833AB4, #E1306C, #F77737);
  color: #fff;
  transition: all 0.2s;
  &:hover { opacity: 0.9; transform: translateY(-1px); }
`;

const IgReadyBox = styled.div`
  margin-top: 0.75rem;
  background: #fff;
  border: 2px solid #10B981;
  padding: 1.25rem;
`;

const IgReadySteps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const IgStep = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: ${p => p.$done ? '#10B981' : colors.black};
  font-weight: ${p => p.$done ? 500 : 600};
`;

const IgOpenLink = styled.a`
  display: inline-block;
  font-family: 'Oswald', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #833AB4, #E1306C, #F77737);
  color: #fff;
  text-decoration: none;
  transition: all 0.2s;
  &:hover { opacity: 0.9; }
`;

const PreviewSticky = styled.div`
  position: sticky;
  top: 80px;
  @media (max-width: 1024px) {
    position: static;
    order: -1;
  }
`;

const PreviewLabel = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${colors.gray};
  text-align: center;
  margin-bottom: 0.5rem;
`;

const Spinner = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const Hint = styled.p`
  font-size: 0.65rem;
  color: ${colors.gray};
  margin-top: 0.5rem;
`;

// ============================================
// MAIN COMPONENT
// ============================================
export default function InstagramPage() {
  const [theme, setTheme] = useState('classic');
  const [layout, setLayout] = useState('statement');
  const [eyebrow, setEyebrow] = useState('Premium Hochzeitswebsites');
  const [headline, setHeadline] = useState('Eure Hochzeit verdient mehr als ein Template.');
  const [accentWord, setAccentWord] = useState('Template.');
  const [bodyText, setBodyText] = useState('Handgemacht in Hamburg. Mit Liebe zum Detail.');
  const [image, setImage] = useState(null);
  const [pageNum, setPageNum] = useState('');
  const [tab, setTab] = useState('edit');
  const [aiCategory, setAiCategory] = useState('vorstellung');
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [caption, setCaption] = useState('');
  const [captionCopied, setCaptionCopied] = useState(false);
  const [igReady, setIgReady] = useState(false);
  const postRef = useRef(null);

  const t = THEMES[theme];
  const isDark = layout === 'dark' || layout === 'fullbleed' || t.alwaysDark;
  const bg = isDark ? (t.bgDark || t.bg) : t.bg;
  const textColor = isDark ? (t.textDark || t.text) : t.text;
  const logoSt = isDark ? t.logoDarkStyle : t.logoStyle;

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // ==========================================
  // AI TEXT GENERATION
  // ==========================================
  const generateSuggestions = async () => {
    setAiLoading(true);
    setSuggestions([]);
    const cat = CATEGORIES.find(c => c.id === aiCategory);
    const topicContext = aiCategory === 'custom' ? customPrompt : cat.desc;

    const prompt = `Du bist Social Media Manager und Copywriter für S&I. Wedding (siwedding.com) — ein Premium-Hochzeitswebsite-Service aus Hamburg von Sarah & Iver.

Kontext:
- S&I. bietet handgemachte Hochzeitswebsites mit eigener Domain ab 1.290€
- 7 Design-Themes: Classic, Editorial, Botanical, Contemporary, Luxe, Neon, Video
- Features: RSVP, Gästeliste, Love Story, Countdown, Foto-Upload, Musik-Wünsche, Passwortschutz, Admin-Dashboard
- Pakete: Starter (1.290€/6Mo), Standard (1.490€/8Mo), Premium (1.990€/12Mo)
- Zielgruppe: Verlobte Paare mit Anspruch an Design, 25-40 Jahre, DACH-Raum
- Tonalität: Warm aber selbstbewusst, nie billig oder kitschig, leicht editorial
- Website: siwedding.com

Theme: "${THEMES[theme].name}" — Layout: "${LAYOUTS[layout].name}"
Kategorie: "${cat.label}" — ${topicContext}

Erstelle genau 3 verschiedene Vorschläge. Jeder Vorschlag braucht:
- eyebrow: Kurzer Overline-Text (2-4 Wörter)
- headline: Haupttext (max 10 Wörter, emotional & knapp)
- accentWord: EXAKT ein Wort aus der Headline das hervorgehoben wird (muss wortwörtlich in headline vorkommen)
- body: Beschreibung (1-2 Sätze, max 25 Wörter)
- caption: Instagram-Caption (3-5 Sätze, warm & persönlich, mit Emoji, endet mit CTA wie "Link in Bio" oder "Schreibt uns eine DM")
- hashtags: Genau 5 Hashtags — die mit der höchsten Reichweite für Hochzeitswebsites (z.B. #hochzeit #wedding #hochzeitswebsite #braut2026 #hochzeitsplanung)
${layout === 'list' ? "List-Layout: body = 5-7 Items, eins pro Zeile. Format: 'Titel|Beschreibung'" : ''}

Antworte NUR mit validem JSON Array, kein Markdown:
[{"eyebrow":"...","headline":"...","accentWord":"...","body":"...","caption":"...","hashtags":"#tag1 #tag2 ..."},{"eyebrow":"...","headline":"...","accentWord":"...","body":"...","caption":"...","hashtags":"#tag1 #tag2 ..."},{"eyebrow":"...","headline":"...","accentWord":"...","body":"...","caption":"...","hashtags":"#tag1 #tag2 ..."}]`;

    try {
      const response = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      // Extract text from all content blocks (may include tool_use, tool_result, text)
      const text = (data.content || [])
        .filter(i => i.type === 'text')
        .map(i => i.text || '')
        .join('\n');
      const clean = text.replace(/```json|```/g, '').trim();
      // Find the JSON array in the response
      const jsonMatch = clean.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        setSuggestions(JSON.parse(jsonMatch[0]));
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (err) {
      console.error(err);
      setSuggestions([{ eyebrow: 'Fehler', headline: 'API nicht erreichbar', accentWord: 'erreichbar', body: 'Bitte nochmal versuchen.' }]);
    }
    setAiLoading(false);
  };

  const applySuggestion = (s) => {
    setEyebrow(s.eyebrow);
    setHeadline(s.headline);
    setAccentWord(s.accentWord);
    setBodyText(s.body);
    setCaption(s.caption + '\n\n' + (s.hashtags || ''));
    setTab('edit');
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption).then(() => {
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    });
  };

  const prepareForInstagram = async () => {
    // 1. Download PNG (saves to gallery on mobile)
    await downloadPNG();
    // 2. Copy caption to clipboard
    if (caption) {
      await navigator.clipboard.writeText(caption);
    }
    // 3. Show ready state
    setIgReady(true);
    setTimeout(() => setIgReady(false), 30000);
  };

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const igLink = isMobile ? 'instagram://camera' : 'https://www.instagram.com/';

  // ==========================================
  // DOWNLOAD
  // ==========================================
  const downloadPNG = useCallback(async () => {
    const el = postRef.current;
    if (!el) return;

    // Load html2canvas if needed
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    try {
      // Create a full-size (1080×1350) offscreen clone for sharp rendering
      const clone = el.cloneNode(true);
      clone.style.width = '1080px';
      clone.style.height = '1350px';
      clone.style.transform = 'scale(1)';
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.zIndex = '-1';

      // Scale all inner styles by 3x
      const scaleInner = (node) => {
        if (node.style) {
          const fs = node.style.fontSize;
          if (fs && fs.includes('rem')) {
            const val = parseFloat(fs);
            node.style.fontSize = (val * 3) + 'rem';
          }
          // Scale padding, margin, gap, width, height in px
          ['padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
           'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
           'top', 'left', 'right', 'bottom', 'gap', 'borderRadius',
          ].forEach(prop => {
            const v = node.style[prop];
            if (v && v.includes('px') && !v.includes('calc')) {
              node.style[prop] = (parseFloat(v) * 3) + 'px';
            }
          });
          // Scale fixed dimensions
          ['width', 'height'].forEach(prop => {
            const v = node.style[prop];
            if (v && v.includes('px') && !v.includes('calc') && !v.includes('100')) {
              node.style[prop] = (parseFloat(v) * 3) + 'px';
            }
          });
        }
        Array.from(node.children || []).forEach(scaleInner);
      };
      // Don't scale inner — let html2canvas handle it with scale:3
      
      document.body.appendChild(clone);

      const canvas = await window.html2canvas(clone, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: 360,
        height: 450,
        imageTimeout: 0,
        logging: false,
      });

      document.body.removeChild(clone);

      const a = document.createElement('a');
      a.download = `si-${theme}-${layout}.png`;
      a.href = canvas.toDataURL('image/png', 1.0);
      a.click();
    } catch (err) {
      console.error('Download error:', err);
      alert('Nutze Screenshot als Alternative: Mac ⌘+Shift+4 / Win Win+Shift+S');
    }
  }, [theme, layout]);

  // ==========================================
  // RENDER HEADLINE WITH ACCENT
  // ==========================================
  const renderHeadline = () => {
    if (!accentWord || !headline.includes(accentWord)) return headline;
    const parts = headline.split(accentWord);
    const accentColor = isDark ? (t.accentDark || t.accent) : t.accent;
    return (<>{parts[0]}<span style={{ fontFamily: t.scriptFont || t.headlineFont, fontStyle: t.scriptStyle || 'normal', color: accentColor, fontWeight: t.scriptFont ? 400 : t.headlineWeight, textTransform: 'none', textShadow: t.glow ? `0 0 15px ${t.secondary || t.accent}` : 'none', display: 'inline' }}>{accentWord}</span>{parts.slice(1).join(accentWord)}</>);
  };

  // ==========================================
  // POST RENDERER
  // ==========================================
  const logo = { position: 'absolute', top: 24, left: 24, zIndex: 5, fontFamily: t.uiFont, fontWeight: 600, fontSize: '0.6rem', letterSpacing: '-0.04em', padding: '4px 8px', lineHeight: 1, ...logoSt };
  const ey = { fontFamily: t.uiFont, fontSize: '0.4rem', fontWeight: t.brutal ? 700 : 600, letterSpacing: t.brutal ? '0.1em' : '0.25em', textTransform: 'uppercase', color: isDark ? t.accent : t.muted, marginBottom: 8, textShadow: t.glow ? `0 0 10px ${t.accent}` : 'none' };
  const hl = { fontFamily: t.headlineFont, fontSize: layout === 'split' ? '1.2rem' : '1.8rem', fontWeight: t.headlineWeight, fontStyle: t.headlineStyle || 'normal', textTransform: t.headlineTransform || 'none', lineHeight: 1.15, color: textColor, marginBottom: 10 };
  const bd = { fontFamily: t.bodyFont, fontSize: '0.48rem', fontWeight: t.bodyWeight, fontStyle: t.bodyStyle || 'normal', lineHeight: 1.8, color: t.body };
  const al = { width: 24, height: 1.5, marginBottom: 12, background: t.accent, boxShadow: t.glow ? `0 0 8px ${t.accent}` : 'none' };
  const ft = { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 24px', display: 'flex', justifyContent: 'space-between', zIndex: 5, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` };
  const ftx = { fontFamily: t.uiFont, fontSize: '0.35rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.2)' : t.muted };
  const corner = <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderRight: `1.5px solid ${t.accent}`, borderTop: `1.5px solid ${t.accent}`, opacity: 0.3 }} />;
  const footer = <div style={ft}><span style={{ ...ftx, color: t.accent, opacity: isDark ? 0.5 : 1 }}>siwedding.com</span><span style={ftx}>{pageNum}</span></div>;
  const W = 360, H = 450;

  const renderPost = () => {
    switch (layout) {
      case 'statement':
        return (<div style={{ background: bg, width: W, height: H, position: 'relative', overflow: 'hidden' }}>
          <div style={logo}>S&I.</div>
          {!t.alwaysDark && <div style={{ position: 'absolute', top: 24, right: 24, width: 1, height: 'calc(100% - 80px)', background: 'rgba(0,0,0,0.05)' }} />}
          {(isDark && !t.glass) && corner}
          {t.glow && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 40%, ${t.accent}0F, transparent 60%)`, pointerEvents: 'none' }} />}
          <div style={{ position: 'absolute', inset: 0, padding: '70px 24px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }}>
            <div style={al} /><div style={ey}>{eyebrow}</div><div style={hl}>{renderHeadline()}</div><div style={bd}>{bodyText}</div>
          </div>{footer}</div>);
      case 'split':
        return (<div style={{ background: bg, width: W, height: H, position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '42% 1fr' }}>
          <div style={{ background: t.alwaysDark ? bg : '#1A1A1A', position: 'relative', overflow: 'hidden' }}>
            {image ? <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}><img src={image} alt="" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', minWidth: '100%', minHeight: '100%', width: 'auto', height: '100%', filter: 'grayscale(100%)', opacity: 0.8 }} /></div>
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #111, #333)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: t.uiFont, fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bild</span></div>}
          </div>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={logo}>S&I.</div>
            <div style={{ ...ey, marginTop: 30 }}>{eyebrow}</div><div style={{ ...hl, fontSize: '1.2rem' }}>{renderHeadline()}</div><div style={al} /><div style={bd}>{bodyText}</div>
          </div>{footer}</div>);
      case 'list': {
        const items = bodyText.split('\n').filter(Boolean);
        return (<div style={{ background: bg, width: W, height: H, position: 'relative', overflow: 'hidden', padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ ...logo, position: 'relative', top: 0, left: 0, marginBottom: 14, alignSelf: 'flex-start' }}>S&I.</div>
          <div style={ey}>{eyebrow}</div><div style={{ ...hl, fontSize: '1.25rem' }}>{renderHeadline()}</div>
          {t.scriptFont && <div style={{ fontFamily: t.scriptFont, fontSize: '0.8rem', color: t.accent, marginBottom: 12 }}>{accentWord || ''}</div>}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {items.map((item, i) => { const [title, desc] = item.split('|'); return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` }}>
                <div style={{ width: 14, height: 1.5, background: t.accent, marginTop: 6, flexShrink: 0, boxShadow: t.glow ? `0 0 6px ${t.accent}` : 'none' }} />
                <div><div style={{ fontFamily: t.bodyFont, fontSize: '0.46rem', fontWeight: 600, color: textColor }}>{title}</div>
                  {desc && <div style={{ fontFamily: t.bodyFont, fontSize: '0.36rem', fontWeight: 300, color: t.muted }}>{desc}</div>}</div>
              </div>); })}</div>{footer}</div>); }
      case 'dark':
        return (<div style={{ background: t.bgDark || t.bg, width: W, height: H, position: 'relative', overflow: 'hidden' }}>
          <div style={{ ...logo, ...(t.logoDarkStyle) }}>S&I.</div>{corner}
          {t.glow && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 70% 60%, ${t.secondary || t.accent}0F, transparent 60%)`, pointerEvents: 'none' }} />}
          {t.brutal ? <div style={{ position: 'absolute', inset: 20, background: t.accent, border: '3px solid #0D0D0D', boxShadow: `6px 6px 0 ${t.tertiary || '#FFE66D'}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '50px 20px 20px' }}>
            <div style={{ ...hl, color: '#fff' }}>{renderHeadline()}</div><div style={{ ...bd, color: 'rgba(255,255,255,0.8)' }}>{bodyText}</div></div>
          : <div style={{ position: 'absolute', inset: 0, padding: '70px 24px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }}>
              <div style={{ ...ey, color: t.accent }}>{eyebrow}</div><div style={al} /><div style={{ ...hl, color: t.textDark || '#fff' }}>{renderHeadline()}</div><div style={bd}>{bodyText}</div></div>}
          {footer}</div>);
      case 'fullbleed':
        return (<div style={{ background: '#1A1A1A', width: W, height: H, position: 'relative', overflow: 'hidden' }}>
          <div style={{ ...logo, ...(t.logoDarkStyle) }}>S&I.</div>
          {image ? <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}><img src={image} alt="" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', minWidth: '100%', minHeight: '100%', width: 'auto', height: '100%', filter: 'grayscale(100%)', opacity: 0.5 }} /></div>
            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a1a, #333)' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(26,26,26,0.85) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, zIndex: 5 }}>
            <div style={al} /><div style={{ ...hl, fontSize: '1.3rem', color: '#FDFCFA' }}>{renderHeadline()}</div>
            <div style={{ ...bd, color: 'rgba(253,252,250,0.6)', marginBottom: 8 }}>{bodyText}</div>
            <div style={{ fontFamily: t.uiFont, fontSize: '0.35rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: t.accent, opacity: 0.7 }}>siwedding.com</div>
          </div></div>);
      default: return null;
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      <Grid>
        {/* LEFT: Controls */}
        <div>
          {/* Theme + Layout Selection */}
          <Panel>
            <SectionLabel>Theme</SectionLabel>
            <ChipRow>
              {Object.entries(THEMES).map(([id, th]) => (
                <Chip key={id} $active={theme === id} onClick={() => setTheme(id)}>{th.name}</Chip>
              ))}
            </ChipRow>

            <SectionLabel>Layout</SectionLabel>
            <ChipRow>
              {Object.entries(LAYOUTS).map(([id, l]) => (
                <Chip key={id} $active={layout === id} onClick={() => setLayout(id)}>
                  {l.name}
                </Chip>
              ))}
            </ChipRow>
          </Panel>

          {/* Tabs: Edit / AI */}
          <Panel style={{ marginTop: '0.75rem' }}>
            <TabBar>
              <Tab $active={tab === 'edit'} onClick={() => setTab('edit')}>✏️ Text bearbeiten</Tab>
              <Tab $active={tab === 'ai'} onClick={() => setTab('ai')}>🤖 KI-Textvorschläge</Tab>
            </TabBar>

            {tab === 'edit' ? (
              <>
                <FieldRow>
                  <Field><Label>Eyebrow</Label><Input value={eyebrow} onChange={e => setEyebrow(e.target.value)} /></Field>
                  <Field><Label>Akzent-Wort</Label><Input value={accentWord} onChange={e => setAccentWord(e.target.value)} /></Field>
                </FieldRow>
                <Field><Label>Headline</Label><Textarea value={headline} onChange={e => setHeadline(e.target.value)} rows={2} /></Field>
                <Field>
                  <Label>Body {layout === 'list' && '(Zeile pro Item, | für Beschreibung)'}</Label>
                  <Textarea value={bodyText} onChange={e => setBodyText(e.target.value)} rows={layout === 'list' ? 6 : 2} />
                </Field>
                <Field>
                  <Label>Bild</Label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <FileLabel>
                      📷 Bild wählen...
                      <input type="file" accept="image/*" onChange={handleImage} />
                    </FileLabel>
                    {image && <>
                      <ImagePreview src={image} alt="" />
                      <RemoveBtn onClick={() => setImage(null)}>✕</RemoveBtn>
                    </>}
                  </div>
                </Field>
                <Field>
                  <Label>Seitenzahl</Label>
                  <Input value={pageNum} onChange={e => setPageNum(e.target.value)} placeholder="z.B. 1/4" style={{ maxWidth: 120 }} />
                </Field>
                {caption && (
                  <CaptionBox>
                    <Label>Caption + Hashtags</Label>
                    <Textarea value={caption} onChange={e => setCaption(e.target.value)} rows={8} style={{ fontSize: '0.8rem', lineHeight: 1.6 }} />
                    <CopyButton onClick={copyCaption}>
                      {captionCopied ? '✓ Kopiert!' : '📋 Caption kopieren'}
                    </CopyButton>
                  </CaptionBox>
                )}
              </>
            ) : (
              <>
                <SectionLabel>Kategorie</SectionLabel>
                <CategoryGrid>
                  {CATEGORIES.map(cat => (
                    <CategoryBtn key={cat.id} $active={aiCategory === cat.id} onClick={() => setAiCategory(cat.id)}>
                      <span className="icon">{cat.icon}</span> {cat.label}
                      <span className="desc">{cat.desc}</span>
                    </CategoryBtn>
                  ))}
                </CategoryGrid>

                {aiCategory === 'custom' && (
                  <Field><Label>Thema beschreiben</Label>
                    <Textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} rows={2} placeholder="z.B. Warum Passwortschutz wichtig ist..." />
                  </Field>
                )}

                <PrimaryButton $loading={aiLoading} onClick={generateSuggestions}>
                  {aiLoading ? <><Spinner /> Generiere...</> : '🤖 3 Vorschläge generieren'}
                </PrimaryButton>

                {suggestions.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <SectionLabel>Klick zum Übernehmen</SectionLabel>
                    {suggestions.map((s, i) => (
                      <SuggestionCard key={i} onClick={() => applySuggestion(s)}>
                        <SuggestionEyebrow>{s.eyebrow}</SuggestionEyebrow>
                        <SuggestionHeadline>
                          {s.headline.includes(s.accentWord) ? (
                            <>{s.headline.split(s.accentWord)[0]}<span style={{ color: colors.red, fontStyle: 'italic' }}>{s.accentWord}</span>{s.headline.split(s.accentWord).slice(1).join(s.accentWord)}</>
                          ) : s.headline}
                        </SuggestionHeadline>
                        <SuggestionBody>{s.body.length > 100 ? s.body.substring(0, 100) + '…' : s.body}</SuggestionBody>
                        {s.caption && <SuggestionCaption>📝 {s.caption.length > 80 ? s.caption.substring(0, 80) + '…' : s.caption}</SuggestionCaption>}
                        {s.hashtags && <SuggestionHashtags>{s.hashtags.substring(0, 60)}…</SuggestionHashtags>}
                        <ApplyLabel>→ Übernehmen (Post + Caption + Hashtags)</ApplyLabel>
                      </SuggestionCard>
                    ))}
                  </div>
                )}
              </>
            )}
          </Panel>

          {/* Download + Instagram */}
          <ActionBar>
            <SecondaryButton onClick={downloadPNG}>⬇ PNG Download (1080×1350)</SecondaryButton>
            <InstagramButton onClick={prepareForInstagram}>
              📱 Für Instagram vorbereiten
            </InstagramButton>
          </ActionBar>
          {igReady && (
            <IgReadyBox>
              <IgReadySteps>
                <IgStep $done={true}>✅ Bild heruntergeladen {isMobile ? '(in Fotos/Galerie)' : ''}</IgStep>
                <IgStep $done={true}>✅ Caption in Zwischenablage kopiert</IgStep>
                <IgStep $done={false}>{isMobile
                  ? '📱 Instagram öffnen → + → Post → Bild aus Galerie wählen → Caption einfügen (lange drücken → Einsetzen)'
                  : '📱 Instagram öffnen → + → Post → Bild einfügen → Caption einfügen (Strg+V)'
                }</IgStep>
              </IgReadySteps>
              <IgOpenLink href={igLink} target="_blank" rel="noopener noreferrer">
                Instagram öffnen →
              </IgOpenLink>
            </IgReadyBox>
          )}
          <Hint>Tipp: Bei Bildern im Post ggf. Screenshot als Alternative (⌘+Shift+4 / Win+Shift+S)</Hint>
        </div>

        {/* RIGHT: Preview */}
        <PreviewSticky>
          <PreviewLabel>Live Preview</PreviewLabel>
          <div ref={postRef} style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {renderPost()}
          </div>
        </PreviewSticky>
      </Grid>
    </>
  );
}
