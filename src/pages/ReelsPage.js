// src/pages/ReelsPage.js
// S&I. Reels Editor — Slide-basiert mit Canvas-Preview + MP4 Export
// Features: KI-Textgenerierung, globaler Bild/Video-Hintergrund, Theme-Slides
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { THEMES, loadThemeFontsForCanvas } from '../lib/reelThemes';
import { adminFetch } from '../lib/apiClient';
import { renderFrame, getTotalDuration, getSlideAtTime, renderThumbnail, W, H } from '../lib/reelRenderer';
import { TEMPLATES } from '../lib/reelTemplates';
import { exportReelMP4 } from '../lib/reelExporter';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5', green: '#10B981' };

// ============================================
// STYLED COMPONENTS
// ============================================
const PageHeader = styled.div`margin-bottom: 2rem; h1 { font-family: 'Oswald', sans-serif; font-size: 2rem; font-weight: 700; text-transform: uppercase; color: ${colors.black}; margin-bottom: 0.25rem; } p { font-family: 'Source Serif 4', serif; font-style: italic; color: ${colors.gray}; font-size: 1rem; }`;
const Grid = styled.div`display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: start; @media (max-width: 1024px) { grid-template-columns: 1fr; }`;
const Panel = styled.div`background: #fff; border: 1px solid ${colors.lightGray}; padding: 1.5rem; margin-bottom: 0.75rem;`;
const SectionLabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.gray}; margin-bottom: 0.75rem;`;
const ChipRow = styled.div`display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1.25rem;`;
const Chip = styled.button`font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: ${p => p.$active ? 600 : 400}; padding: 0.5rem 0.85rem; cursor: pointer; transition: all 0.15s; border: 1px solid ${p => p.$active ? colors.black : colors.lightGray}; background: ${p => p.$active ? colors.black : '#fff'}; color: ${p => p.$active ? '#fff' : colors.black}; &:hover { border-color: ${colors.black}; }`;
const Label = styled.label`font-family: 'Inter', sans-serif; font-size: 0.6rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: ${colors.gray}; display: block; margin-bottom: 0.2rem;`;
const Input = styled.input`width: 100%; padding: 0.55rem 0.65rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.8rem; background: #fff; outline: none; box-sizing: border-box; &:focus { border-color: ${colors.red}; }`;
const Textarea = styled.textarea`width: 100%; padding: 0.55rem 0.65rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.8rem; background: #fff; resize: vertical; outline: none; box-sizing: border-box; &:focus { border-color: ${colors.red}; }`;
const SmallInput = styled.input`width: 65px; padding: 0.4rem 0.5rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.75rem; background: #fff; outline: none; text-align: center; box-sizing: border-box; &:focus { border-color: ${colors.red}; }`;
const Select = styled.select`padding: 0.4rem 0.5rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.7rem; background: #fff; outline: none;`;
const Field = styled.div`margin-bottom: 0.5rem;`;
const SmallBtn = styled.button`font-family: 'Inter', sans-serif; font-size: 0.6rem; padding: 0.3rem 0.6rem; cursor: pointer; border: 1px solid ${colors.lightGray}; background: #fff; color: ${colors.black}; &:hover { border-color: ${colors.black}; }`;
const DangerBtn = styled.button`font-family: 'Inter', sans-serif; font-size: 0.55rem; padding: 0.25rem 0.5rem; cursor: pointer; border: 1px solid ${colors.red}; background: transparent; color: ${colors.red}; &:hover { background: ${colors.red}; color: #fff; }`;
const GenButton = styled.button`font-family: 'Oswald', sans-serif; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.9rem 2rem; cursor: pointer; border: none; width: 100%; background: ${p => p.disabled ? colors.gray : colors.red}; color: #fff; transition: all 0.2s; &:hover { opacity: 0.9; }`;
const SecBtn = styled.button`font-family: 'Oswald', sans-serif; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.65rem 1.25rem; cursor: pointer; border: 2px solid ${colors.black}; background: transparent; color: ${colors.black}; transition: all 0.2s; &:hover { background: ${colors.black}; color: #fff; }`;
const PreviewSticky = styled.div`position: sticky; top: 80px; @media (max-width: 1024px) { position: static; order: -1; }`;
const PreviewLabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; color: ${colors.gray}; text-align: center; margin-bottom: 0.5rem;`;
const ProgressBar = styled.div`height: 3px; background: ${colors.lightGray}; margin-top: 0.5rem; overflow: hidden; div { height: 100%; background: ${colors.red}; transition: width 0.05s linear; }`;
const StatusMsg = styled.div`font-family: 'Inter', sans-serif; font-size: 0.75rem; color: ${p => p.$error ? colors.red : colors.green}; margin-top: 0.5rem; font-weight: 500;`;
const Hint = styled.p`font-size: 0.6rem; color: ${colors.gray}; margin-top: 0.35rem; line-height: 1.5;`;

const CaptionArea = styled.textarea`width: 100%; padding: 0.75rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.8rem; line-height: 1.6; background: #F9F9F7; resize: vertical; outline: none; box-sizing: border-box; &:focus { border-color: ${colors.red}; }`;
const CopyBtn = styled.button`font-family: 'Oswald', sans-serif; font-size: 0.7rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.6rem 1.25rem; cursor: pointer; border: 2px solid ${colors.red}; background: transparent; color: ${colors.red}; transition: all 0.2s; &:hover { background: ${colors.red}; color: #fff; }`;

const SlideRow = styled.div`display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 1rem; &::-webkit-scrollbar { height: 4px; } &::-webkit-scrollbar-thumb { background: ${colors.lightGray}; }`;
const SlideThumb = styled.div`flex-shrink: 0; width: 60px; height: 107px; border: 2px solid ${p => p.$active ? colors.red : colors.lightGray}; cursor: pointer; position: relative; overflow: hidden; background: #000; transition: border-color 0.15s; &:hover { border-color: ${p => p.$active ? colors.red : colors.black}; } img { width: 100%; height: 100%; object-fit: cover; }`;
const SlideNum = styled.div`position: absolute; bottom: 2px; right: 3px; font-family: 'Inter', sans-serif; font-size: 0.45rem; font-weight: 600; color: #fff; background: rgba(0,0,0,0.6); padding: 1px 4px; border-radius: 2px;`;
const AddSlideBtn = styled.button`flex-shrink: 0; width: 60px; height: 107px; border: 2px dashed ${colors.lightGray}; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: ${colors.gray}; &:hover { border-color: ${colors.red}; color: ${colors.red}; }`;

const ElementCard = styled.div`background: ${p => p.$active ? '#f9f8f6' : '#fff'}; border: 1px solid ${p => p.$active ? colors.red : colors.lightGray}; padding: 0.5rem; margin-bottom: 0.3rem; cursor: pointer; transition: all 0.1s; &:hover { border-color: ${colors.black}; }`;
const ElementHeader = styled.div`display: flex; justify-content: space-between; align-items: center;`;
const ElementType = styled.span`font-family: 'Inter', sans-serif; font-size: 0.55rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${colors.red};`;
const ElementText = styled.div`font-family: 'Inter', sans-serif; font-size: 0.7rem; color: ${colors.black}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;`;

const DotRow = styled.div`display: flex; justify-content: center; gap: 4px; margin-top: 0.5rem;`;
const Dot = styled.div`width: 6px; height: 6px; border-radius: 50%; background: ${p => p.$active ? colors.red : colors.lightGray}; transition: background 0.2s;`;

const BgPreview = styled.div`
  width: 80px; height: 142px; border: 1px solid ${colors.lightGray}; overflow: hidden; flex-shrink: 0; background: #000;
  img, video { width: 100%; height: 100%; object-fit: cover; }
`;

const FileLabel = styled.label`
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem;
  border: 2px dashed ${colors.lightGray}; cursor: pointer; font-family: 'Inter', sans-serif;
  font-size: 0.75rem; width: 100%; justify-content: center; transition: all 0.15s;
  &:hover { border-color: ${colors.red}; } input { display: none; }
`;

const Spinner = styled.span`
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.8s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const ELEMENT_TYPES = [
  { type: 'logo', label: 'Logo' },
  { type: 'eyebrow', label: 'Eyebrow' },
  { type: 'headline', label: 'Headline' },
  { type: 'accentWord', label: 'Akzent' },
  { type: 'body', label: 'Body' },
  { type: 'divider', label: 'Divider' },
  { type: 'footer', label: 'Footer' },
];

const ANIM_OPTIONS = [
  { id: 'fadeUp', label: 'Fade Up' },
  { id: 'fadeIn', label: 'Fade In' },
  { id: 'slideRight', label: 'Slide Right' },
  { id: 'scaleIn', label: 'Scale In' },
];

// ============================================
// MAIN COMPONENT
// ============================================
export default function ReelsPage() {
  const [themeId, setThemeId] = useState('classic');
  const [templateId, setTemplateId] = useState(null);
  const [slides, setSlides] = useState(() => TEMPLATES.themeVorstellung.create());
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [caption, setCaption] = useState('');
  const [captionCopied, setCaptionCopied] = useState(false);
  const [captionLoading, setCaptionLoading] = useState(false);
  const [thumbCache, setThumbCache] = useState({});
  const [nextId, setNextId] = useState(100);

  // Global background
  const [globalBgType, setGlobalBgType] = useState('none'); // 'none' | 'image' | 'video'
  const [globalBgSrc, setGlobalBgSrc] = useState(null);
  const [globalBgDarken, setGlobalBgDarken] = useState(0.4);
  const [globalBgElement, setGlobalBgElement] = useState(null); // Image element (for images)
  const globalBgVideoRef = useRef(null);

  // AI content generation
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSlidesLoading, setAiSlidesLoading] = useState(false);

  // Music suggestions
  const [musicSuggestions, setMusicSuggestions] = useState([]);
  const [musicLoading, setMusicLoading] = useState(false);

  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // Load fonts when theme changes
  useEffect(() => {
    loadThemeFontsForCanvas(themeId).then(() => {
      drawPreview(currentTime);
      invalidateThumbs();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId]);

  const totalDuration = getTotalDuration(slides);

  // Build reelData object for renderer
  const getReelData = useCallback(() => {
    let bgEl = null;
    if (globalBgType === 'image' && globalBgElement) {
      bgEl = globalBgElement;
    } else if (globalBgType === 'video' && globalBgVideoRef.current) {
      bgEl = globalBgVideoRef.current;
    }
    return { themeId, slides, globalBgElement: bgEl, globalBgDarken };
  }, [themeId, slides, globalBgType, globalBgElement, globalBgDarken]);

  // ==========================================
  // PREVIEW RENDERING
  // ==========================================
  const drawPreview = useCallback((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    renderFrame(ctx, getReelData(), time);
  }, [getReelData]);

  // Redraw on data changes
  useEffect(() => {
    const t = setTimeout(() => drawPreview(currentTime), 50);
    return () => clearTimeout(t);
  }, [slides, themeId, drawPreview, currentTime, globalBgType, globalBgElement, globalBgDarken]);

  // Playback
  const startPreview = useCallback(() => {
    // Start video bg if present
    if (globalBgType === 'video' && globalBgVideoRef.current) {
      globalBgVideoRef.current.currentTime = 0;
      globalBgVideoRef.current.play();
    }

    setPlaying(true);
    setCurrentTime(0);
    const start = Date.now();
    const dur = getTotalDuration(slides);

    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const t = Math.min(elapsed, dur);
      setCurrentTime(t);
      drawPreview(t);
      if (elapsed < dur) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
        if (globalBgVideoRef.current) globalBgVideoRef.current.pause();
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, [slides, drawPreview, globalBgType]);

  const stopPreview = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setPlaying(false);
    if (globalBgVideoRef.current) globalBgVideoRef.current.pause();
  }, []);

  // Scrub
  const handleScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = p * totalDuration;
    setCurrentTime(t);

    // Sync video bg
    if (globalBgType === 'video' && globalBgVideoRef.current) {
      const vid = globalBgVideoRef.current;
      vid.currentTime = t % (vid.duration || 1);
    }

    setTimeout(() => drawPreview(t), 50);
  };

  // Cleanup
  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // ==========================================
  // THUMBNAIL CACHE
  // ==========================================
  const invalidateThumbs = useCallback(() => {
    setThumbCache({});
  }, []);

  const getThumb = useCallback((slide, idx) => {
    const bgKey = globalBgType === 'image' ? 'img' : globalBgType === 'video' ? 'vid' : 'none';
    const key = `${idx}-${slide.id}-${themeId}-${bgKey}`;
    if (thumbCache[key]) return thumbCache[key];
    const thumbOpts = {};
    if (globalBgType === 'image' && globalBgElement) {
      thumbOpts.globalBgElement = globalBgElement;
      thumbOpts.globalBgDarken = globalBgDarken;
    }
    const thumb = renderThumbnail(slide, themeId, 60, 107, thumbOpts);
    setThumbCache(prev => ({ ...prev, [key]: thumb }));
    return thumb;
  }, [themeId, thumbCache, globalBgType, globalBgElement, globalBgDarken]);

  // ==========================================
  // GLOBAL BACKGROUND
  // ==========================================
  const handleGlobalBg = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setGlobalBgType('video');
      setGlobalBgSrc(url);
      setGlobalBgElement(null);
      invalidateThumbs();
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setGlobalBgType('image');
        setGlobalBgSrc(ev.target.result);
        const img = new Image();
        img.onload = () => {
          setGlobalBgElement(img);
          invalidateThumbs();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeGlobalBg = () => {
    if (globalBgSrc && globalBgType === 'video') {
      URL.revokeObjectURL(globalBgSrc);
    }
    setGlobalBgType('none');
    setGlobalBgSrc(null);
    setGlobalBgElement(null);
    invalidateThumbs();
  };

  // ==========================================
  // TEMPLATE SELECTION
  // ==========================================
  const applyTemplate = (tplId) => {
    const tpl = TEMPLATES[tplId];
    if (!tpl) return;
    setTemplateId(tplId);
    const newSlides = tpl.create();
    setSlides(newSlides);
    setSelectedSlideIdx(0);
    setSelectedElementId(null);
    setCurrentTime(0);
    invalidateThumbs();
  };

  // ==========================================
  // AI SLIDE CONTENT GENERATION
  // ==========================================
  const uid = () => { const id = nextId; setNextId(n => n + 1); return id; };

  const generateAISlides = async () => {
    if (!aiPrompt.trim()) return;
    setAiSlidesLoading(true);
    const themeName = THEMES[themeId]?.name || themeId;

    const prompt = `Du bist Content Creator für S&I. Wedding (sarahiver.com) — Premium-Hochzeitswebsites aus Hamburg von Sarah & Iver.

Kontext:
- S&I. bietet handgemachte Hochzeitswebsites mit eigener Domain ab 1.290€
- 7 Design-Themes: Classic, Editorial, Botanical, Contemporary, Luxe, Neon, Video
- Features: RSVP, Gästeliste, Love Story, Countdown, Foto-Upload, Musik-Wünsche, Passwortschutz, Admin-Dashboard
- Pakete: Starter (1.290€/6Mo), Standard (1.490€/8Mo), Premium (1.990€/12Mo)
- Tonalität: Warm aber selbstbewusst, nie billig oder kitschig, leicht editorial

Thema/Anweisung: "${aiPrompt}"
Gewähltes Theme: "${themeName}"

Erstelle 3-5 Slides für ein Instagram Reel (9:16, je ca. 3-5 Sekunden).
Jeder Slide braucht:
- eyebrow: Kurzer Overline-Text (2-4 Wörter, z.B. "Neues Theme", "Die Lösung", "Tipp 1")
- headline: Haupttext (max 8 Wörter, emotional, knapp — wird groß animiert eingeblendet)
- body: Beschreibung (1-3 kurze Sätze, max 25 Wörter — kann auch "" sein falls nicht nötig)
- accentWord: Ein einzelnes Wort in Schreibschrift hervorgehoben (kann "" sein)

Wichtig:
- Slide 1 = Hook/Intro (fesselnder Einstieg)
- Letzter Slide = CTA (z.B. "Link in Bio", "sarahiver.com")
- Dazwischen: Inhalt, Tipps, Features, Argumente
- Texte kurz! Reels = schnell, knackig, visuell

Antworte NUR mit validem JSON Array, kein Markdown:
[{"eyebrow":"...","headline":"...","body":"...","accentWord":"..."},...]`;

    try {
      const response = await adminFetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      const text = (data.content || []).filter(i => i.type === 'text').map(i => i.text || '').join('\n');
      const clean = text.replace(/```json|```/g, '').trim();
      const jsonMatch = clean.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const newSlides = parsed.map((item, i) => {
          const elements = [
            { id: uid(), type: 'logo', text: 'S&I.', animation: 'fadeIn', delay: 0.2, animDuration: 0.5, xPercent: 0.067, yPercent: 0.04 },
          ];
          if (item.eyebrow) {
            elements.push({ id: uid(), type: 'eyebrow', text: item.eyebrow, animation: 'fadeUp', delay: 0.4, animDuration: 0.5, xPercent: 0.067, yPercent: 0.35 });
          }
          elements.push({ id: uid(), type: 'divider', text: '', animation: 'fadeUp', delay: 0.6, animDuration: 0.4, xPercent: 0.067, yPercent: 0.39 });
          elements.push({ id: uid(), type: 'headline', text: item.headline || 'Headline', animation: 'fadeUp', delay: 0.7, animDuration: 0.6, xPercent: 0.067, yPercent: 0.42, fontSize: 80 });
          if (item.accentWord) {
            elements.push({ id: uid(), type: 'accentWord', text: item.accentWord, animation: 'fadeUp', delay: 1.2, animDuration: 0.5, xPercent: 0.067, yPercent: 0.60 });
          }
          if (item.body) {
            elements.push({ id: uid(), type: 'body', text: item.body, animation: 'fadeUp', delay: 1.3, animDuration: 0.5, xPercent: 0.067, yPercent: item.accentWord ? 0.68 : 0.60 });
          }
          elements.push({ id: uid(), type: 'footer', text: '', animation: 'fadeIn', delay: 1.5, animDuration: 0.5, xPercent: 0.067, yPercent: 0.96 });

          return {
            id: uid(),
            duration: 4,
            transitionIn: i === 0 ? 'none' : 'crossfade',
            transitionDuration: 0.5,
            backgroundType: 'solid',
            backgroundImage: null,
            backgroundDarken: 0.4,
            elements,
          };
        });
        setSlides(newSlides);
        setSelectedSlideIdx(0);
        setSelectedElementId(null);
        setCurrentTime(0);
        setTemplateId(null);
        invalidateThumbs();
      }
    } catch (err) {
      console.error('AI slides error:', err);
    }
    setAiSlidesLoading(false);
  };

  // ==========================================
  // SLIDE MANAGEMENT
  // ==========================================
  const currentSlide = slides[selectedSlideIdx];
  const selectedElement = currentSlide?.elements?.find(el => el.id === selectedElementId);

  const updateSlide = (idx, updates) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
    invalidateThumbs();
  };

  const addSlide = () => {
    const newSlide = {
      id: uid(),
      duration: 4,
      transitionIn: 'crossfade',
      transitionDuration: 0.5,
      backgroundType: 'solid',
      backgroundImage: null,
      backgroundDarken: 0.4,
      elements: [
        { id: uid(), type: 'logo', text: 'S&I.', animation: 'fadeIn', delay: 0.2, animDuration: 0.5, xPercent: 0.067, yPercent: 0.04 },
        { id: uid(), type: 'headline', text: 'Neuer Slide', animation: 'fadeUp', delay: 0.5, animDuration: 0.5, xPercent: 0.067, yPercent: 0.42, fontSize: 80 },
        { id: uid(), type: 'footer', text: '', animation: 'fadeIn', delay: 1.0, animDuration: 0.5, xPercent: 0.067, yPercent: 0.96 },
      ],
    };
    setSlides(prev => [...prev, newSlide]);
    setSelectedSlideIdx(slides.length);
    invalidateThumbs();
  };

  const duplicateSlide = (idx) => {
    const src = slides[idx];
    const dup = {
      ...JSON.parse(JSON.stringify(src)),
      id: uid(),
      elements: src.elements.map(el => ({ ...el, id: uid() })),
    };
    const newSlides = [...slides];
    newSlides.splice(idx + 1, 0, dup);
    setSlides(newSlides);
    setSelectedSlideIdx(idx + 1);
    invalidateThumbs();
  };

  const removeSlide = (idx) => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== idx));
    if (selectedSlideIdx >= slides.length - 1) setSelectedSlideIdx(Math.max(0, slides.length - 2));
    invalidateThumbs();
  };

  // ==========================================
  // ELEMENT MANAGEMENT
  // ==========================================
  const addElement = (type) => {
    const newEl = {
      id: uid(),
      type,
      text: type === 'logo' ? 'S&I.' : type === 'divider' || type === 'footer' ? '' : 'Neuer Text',
      animation: 'fadeUp',
      delay: 0.5,
      animDuration: 0.5,
      xPercent: 0.067,
      yPercent: type === 'logo' ? 0.04 : type === 'footer' ? 0.96 : 0.5,
    };
    const updated = { ...currentSlide, elements: [...currentSlide.elements, newEl] };
    updateSlide(selectedSlideIdx, updated);
    setSelectedElementId(newEl.id);
  };

  const updateElement = (elId, updates) => {
    const newElements = currentSlide.elements.map(el =>
      el.id === elId ? { ...el, ...updates } : el
    );
    updateSlide(selectedSlideIdx, { elements: newElements });
  };

  const removeElement = (elId) => {
    const newElements = currentSlide.elements.filter(el => el.id !== elId);
    updateSlide(selectedSlideIdx, { elements: newElements });
    if (selectedElementId === elId) setSelectedElementId(null);
  };

  // ==========================================
  // BACKGROUND IMAGE UPLOAD (per-slide)
  // ==========================================
  const handleBgImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateSlide(selectedSlideIdx, {
        backgroundType: 'image',
        backgroundImage: ev.target.result,
      });
      const img = new Image();
      img.onload = () => {
        setSlides(prev => prev.map((s, i) => i === selectedSlideIdx ? { ...s, _bgImage: img } : s));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // EXPORT
  // ==========================================
  const handleExport = async () => {
    setGenerating(true);
    setProgress(0);
    setStatus('');
    try {
      await exportReelMP4(
        getReelData(),
        {
          onProgress: setProgress,
          onStatus: setStatus,
        }
      );
    } catch (err) {
      console.error('Export error:', err);
      setStatus('Export fehlgeschlagen: ' + err.message);
    }
    setGenerating(false);
  };

  // ==========================================
  // AI CAPTION
  // ==========================================
  const generateCaption = async () => {
    setCaptionLoading(true);
    const allTexts = slides.flatMap(s => s.elements.filter(e => e.text).map(e => e.text)).join(' | ');
    const themeName = THEMES[themeId]?.name || themeId;

    const prompt = `Du bist Social Media Manager für S&I. Wedding (sarahiver.com) — ein Premium-Hochzeitswebsite-Service aus Hamburg von Sarah & Iver.

Kontext:
- S&I. bietet handgemachte Hochzeitswebsites mit eigener Domain ab 1.290€
- 7 Design-Themes: Classic, Editorial, Botanical, Contemporary, Luxe, Neon, Video
- Features: RSVP, Gästeliste, Love Story, Countdown, Foto-Upload, Musik-Wünsche, Passwortschutz
- Pakete: Starter (1.290€/6Mo), Standard (1.490€/8Mo), Premium (1.990€/12Mo)
- Zielgruppe: Verlobte Paare, 25-40 Jahre, DACH-Raum
- Tonalität: Warm aber selbstbewusst, nie billig oder kitschig, leicht editorial

Das Reel im "${themeName}" Theme zeigt folgende Texte: "${allTexts}"

Schreibe eine Instagram Reel Caption:
1. Hook-Satz (erste Zeile, die zum Weiterlesen animiert)
2. 3-5 Sätze Haupttext (warm, persönlich, mit Emoji, Mehrwert)
3. Call-to-Action (z.B. "Link in Bio", "Schreibt uns eine DM")
4. Genau 5 Hashtags — die mit der höchsten Reichweite für Hochzeitswebsites (z.B. #hochzeit #wedding #hochzeitswebsite #braut2026 #hochzeitsplanung)

Antworte NUR mit JSON:
{"caption":"...","hashtags":"#tag1 #tag2 #tag3 #tag4 #tag5"}`;

    try {
      const response = await adminFetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      const text = (data.content || []).filter(i => i.type === 'text').map(i => i.text || '').join('\n');
      const clean = text.replace(/```json|```/g, '').trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        setCaption((result.caption || '') + '\n\n' + (result.hashtags || ''));
      }
    } catch (err) {
      console.error('Caption generation error:', err);
      setCaption('Caption konnte nicht generiert werden. Bitte nochmal versuchen.');
    }
    setCaptionLoading(false);
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption).then(() => {
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    });
  };

  // ==========================================
  // MUSIC SUGGESTIONS
  // ==========================================
  const generateMusic = async () => {
    setMusicLoading(true);
    setMusicSuggestions([]);
    const allTexts = slides.flatMap(s => s.elements.filter(e => e.text).map(e => e.text)).join(' | ');
    const themeName = THEMES[themeId]?.name || themeId;

    const prompt = `Du bist Musik-Kurator für Instagram Reels im Bereich Hochzeit & Premium Lifestyle.

Reel-Inhalt: "${allTexts}"
Stimmung: ${themeName} Theme, premium, hochzeitlich, emotional

Schlage 3 Songs vor die:
1. Aktuell auf Instagram Reels trenden oder gut funktionieren
2. Zur Stimmung passen (warm, elegant, emotional, modern)
3. Als 15-30s Hintergrundmusik funktionieren
4. Auf Instagram verfügbar sind (keine lizenzgeschützten Songs die entfernt werden)

Für jeden Song:
- song: Songname
- artist: Künstler
- why: Warum er passt (1 Satz)
- search: Exakter Suchbegriff für Instagram Musik-Suche

Antworte NUR mit JSON Array:
[{"song":"...","artist":"...","why":"...","search":"..."}]`;

    try {
      const response = await adminFetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      const text = (data.content || []).filter(i => i.type === 'text').map(i => i.text || '').join('\n');
      const clean = text.replace(/```json|```/g, '').trim();
      const jsonMatch = clean.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        setMusicSuggestions(JSON.parse(jsonMatch[0]));
      }
    } catch (err) {
      console.error('Music suggestion error:', err);
    }
    setMusicLoading(false);
  };

  // Current slide indicator
  const { index: playingSlideIdx } = getSlideAtTime(slides, currentTime);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      {/* Hidden video element for video bg */}
      {globalBgType === 'video' && globalBgSrc && (
        <video
          ref={globalBgVideoRef}
          src={globalBgSrc}
          muted
          loop
          playsInline
          style={{ position: 'fixed', left: -9999, top: 0, width: 1, height: 1 }}
          onLoadedData={() => { invalidateThumbs(); drawPreview(currentTime); }}
        />
      )}

      <Grid>
        <div>
          {/* Theme + Template Selection */}
          <Panel>
            <SectionLabel>Theme</SectionLabel>
            <ChipRow>
              {Object.entries(THEMES).map(([id, th]) => (
                <Chip key={id} $active={themeId === id} onClick={() => setThemeId(id)}>{th.name}</Chip>
              ))}
            </ChipRow>

            <SectionLabel>Vorlage</SectionLabel>
            <ChipRow>
              {Object.entries(TEMPLATES).map(([id, tpl]) => (
                <Chip key={id} $active={templateId === id} onClick={() => applyTemplate(id)}>
                  {tpl.icon} {tpl.name}
                </Chip>
              ))}
            </ChipRow>
          </Panel>

          {/* AI Content Generation */}
          <Panel>
            <SectionLabel>KI-Inhalt generieren</SectionLabel>
            <Field>
              <Label>Was soll das Reel zeigen?</Label>
              <Textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                rows={2}
                placeholder="z.B. Unser Botanical Theme vorstellen mit den besten Features..."
              />
            </Field>
            <GenButton onClick={generateAISlides} disabled={aiSlidesLoading || !aiPrompt.trim()}>
              {aiSlidesLoading ? <><Spinner /> Generiere Slides...</> : 'KI-Texte generieren (3-5 Slides)'}
            </GenButton>
            <Hint>Beschreibe kurz das Thema — KI erstellt automatisch 3-5 Slides mit allen Texten.</Hint>
          </Panel>

          {/* Global Background */}
          <Panel>
            <SectionLabel>Globaler Hintergrund</SectionLabel>
            {globalBgType === 'none' ? (
              <FileLabel>
                Bild oder Video hochladen (alle Slides)
                <input type="file" accept="image/*,video/*" onChange={handleGlobalBg} />
              </FileLabel>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <BgPreview>
                  {globalBgType === 'image' && globalBgSrc && <img src={globalBgSrc} alt="Background" />}
                  {globalBgType === 'video' && globalBgSrc && <video src={globalBgSrc} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </BgPreview>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                    {globalBgType === 'image' ? 'Bild' : 'Video'} geladen
                  </div>
                  <Field>
                    <Label>Abdunklung: {Math.round(globalBgDarken * 100)}%</Label>
                    <input type="range" min="0" max="90" value={globalBgDarken * 100}
                      onChange={e => { setGlobalBgDarken(parseInt(e.target.value) / 100); invalidateThumbs(); }}
                      style={{ width: '100%' }} />
                  </Field>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.6rem', cursor: 'pointer', color: colors.red, fontFamily: "'Inter', sans-serif" }}>
                      Anderes Bild/Video
                      <input type="file" accept="image/*,video/*" onChange={handleGlobalBg} style={{ display: 'none' }} />
                    </label>
                    <DangerBtn onClick={removeGlobalBg}>Entfernen</DangerBtn>
                  </div>
                </div>
              </div>
            )}
            <Hint>Bild/Video wird hinter allen Slides als Hintergrund angezeigt (wie Hero-Sections).</Hint>
          </Panel>

          {/* Slide Row */}
          <Panel>
            <SectionLabel>Slides ({slides.length}) — {totalDuration.toFixed(1)}s gesamt</SectionLabel>
            <SlideRow>
              {slides.map((slide, idx) => (
                <SlideThumb key={slide.id} $active={selectedSlideIdx === idx} onClick={() => { setSelectedSlideIdx(idx); setSelectedElementId(null); setCurrentTime(slides.slice(0, idx).reduce((a, s) => a + (s.duration || 4), 0)); }}>
                  <img src={getThumb(slide, idx)} alt={`Slide ${idx + 1}`} />
                  <SlideNum>{idx + 1}</SlideNum>
                </SlideThumb>
              ))}
              <AddSlideBtn onClick={addSlide}>+</AddSlideBtn>
            </SlideRow>

            {currentSlide && (
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <SmallBtn onClick={() => duplicateSlide(selectedSlideIdx)}>Duplizieren</SmallBtn>
                <DangerBtn onClick={() => removeSlide(selectedSlideIdx)} style={{ opacity: slides.length <= 1 ? 0.3 : 1 }}>Löschen</DangerBtn>
              </div>
            )}
          </Panel>

          {/* Slide Editor */}
          {currentSlide && (
            <Panel>
              <SectionLabel>Slide {selectedSlideIdx + 1} Einstellungen</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <Field>
                  <Label>Dauer (s)</Label>
                  <SmallInput type="number" step="0.5" min="1" max="30" value={currentSlide.duration || 4} onChange={e => updateSlide(selectedSlideIdx, { duration: parseFloat(e.target.value) || 4 })} />
                </Field>
                <Field>
                  <Label>Übergang</Label>
                  <Select value={currentSlide.transitionIn || 'crossfade'} onChange={e => updateSlide(selectedSlideIdx, { transitionIn: e.target.value })}>
                    <option value="crossfade">Crossfade</option>
                    <option value="none">Keiner</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Übergangs-Dauer</Label>
                  <SmallInput type="number" step="0.1" min="0.1" max="2" value={currentSlide.transitionDuration || 0.5} onChange={e => updateSlide(selectedSlideIdx, { transitionDuration: parseFloat(e.target.value) || 0.5 })} />
                </Field>
              </div>

              {/* Per-Slide Background Override */}
              <div style={{ marginTop: '0.5rem' }}>
                <Label>Slide-Hintergrund (überschreibt global)</Label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Select value={currentSlide.backgroundType || 'solid'} onChange={e => updateSlide(selectedSlideIdx, { backgroundType: e.target.value })}>
                    <option value="solid">{globalBgType !== 'none' ? 'Global (Standard)' : 'Farbe (Theme)'}</option>
                    <option value="image">Eigenes Bild</option>
                  </Select>
                  {currentSlide.backgroundType === 'image' && (
                    <label style={{ fontSize: '0.65rem', cursor: 'pointer', color: colors.red, fontFamily: "'Inter', sans-serif" }}>
                      Bild wählen...
                      <input type="file" accept="image/*" onChange={handleBgImage} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
                {currentSlide.backgroundType === 'image' && (
                  <Field style={{ marginTop: '0.4rem' }}>
                    <Label>Abdunklung: {Math.round((currentSlide.backgroundDarken || 0.4) * 100)}%</Label>
                    <input type="range" min="0" max="90" value={(currentSlide.backgroundDarken || 0.4) * 100} onChange={e => updateSlide(selectedSlideIdx, { backgroundDarken: parseInt(e.target.value) / 100 })} style={{ width: '100%' }} />
                  </Field>
                )}
              </div>
            </Panel>
          )}

          {/* Element List */}
          {currentSlide && (
            <Panel>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <SectionLabel style={{ margin: 0 }}>Elemente ({currentSlide.elements.length})</SectionLabel>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {ELEMENT_TYPES.map(et => (
                    <SmallBtn key={et.type} onClick={() => addElement(et.type)}>+ {et.label}</SmallBtn>
                  ))}
                </div>
              </div>

              {currentSlide.elements.map(el => (
                <ElementCard key={el.id} $active={selectedElementId === el.id} onClick={() => setSelectedElementId(el.id)}>
                  <ElementHeader>
                    <ElementType>{el.type}</ElementType>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.5rem', color: colors.gray }}>
                      delay: {el.delay || 0}s
                    </span>
                  </ElementHeader>
                  {el.text && <ElementText>{el.text}</ElementText>}
                </ElementCard>
              ))}
            </Panel>
          )}

          {/* Element Editor */}
          {selectedElement && (
            <Panel>
              <SectionLabel>{selectedElement.type} bearbeiten</SectionLabel>
              {selectedElement.type !== 'divider' && selectedElement.type !== 'footer' && selectedElement.type !== 'logo' && (
                <Field>
                  <Label>Text</Label>
                  {selectedElement.type === 'body' ? (
                    <Textarea value={selectedElement.text} onChange={e => updateElement(selectedElement.id, { text: e.target.value })} rows={3} />
                  ) : (
                    <Input value={selectedElement.text} onChange={e => updateElement(selectedElement.id, { text: e.target.value })} />
                  )}
                </Field>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                <Field>
                  <Label>Animation</Label>
                  <Select value={selectedElement.animation || 'fadeUp'} onChange={e => updateElement(selectedElement.id, { animation: e.target.value })}>
                    {ANIM_OPTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </Select>
                </Field>
                <Field>
                  <Label>Delay (s)</Label>
                  <SmallInput type="number" step="0.1" min="0" value={selectedElement.delay || 0} onChange={e => updateElement(selectedElement.id, { delay: parseFloat(e.target.value) || 0 })} />
                </Field>
                <Field>
                  <Label>Anim-Dauer</Label>
                  <SmallInput type="number" step="0.1" min="0.1" value={selectedElement.animDuration || 0.5} onChange={e => updateElement(selectedElement.id, { animDuration: parseFloat(e.target.value) || 0.5 })} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <Field>
                  <Label>Y-Position (%)</Label>
                  <SmallInput type="number" step="1" min="0" max="100" value={Math.round((selectedElement.yPercent || 0.5) * 100)} onChange={e => updateElement(selectedElement.id, { yPercent: (parseInt(e.target.value) || 50) / 100 })} />
                </Field>
                {(selectedElement.type === 'headline' || selectedElement.type === 'accentWord' || selectedElement.type === 'body') && (
                  <Field>
                    <Label>Schriftgröße</Label>
                    <SmallInput type="number" step="2" min="16" max="200" value={selectedElement.fontSize || (selectedElement.type === 'headline' ? 80 : selectedElement.type === 'accentWord' ? 100 : 28)} onChange={e => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || null })} />
                  </Field>
                )}
              </div>

              <div style={{ marginTop: '0.4rem' }}>
                <DangerBtn onClick={() => removeElement(selectedElement.id)}>Element entfernen</DangerBtn>
              </div>
            </Panel>
          )}

          {/* Playback + Export */}
          <Panel>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {!playing ? (
                <SecBtn onClick={startPreview} style={{ flex: 1 }}>Preview abspielen</SecBtn>
              ) : (
                <SecBtn onClick={stopPreview} style={{ flex: 1 }}>Stopp</SecBtn>
              )}
            </div>
            <GenButton onClick={handleExport} disabled={generating}>
              {generating ? `Generiere... ${Math.round(progress * 100)}%` : 'MP4 Export'}
            </GenButton>
            <ProgressBar><div style={{ width: `${progress * 100}%` }} /></ProgressBar>
            {status && <StatusMsg $error={status.includes('fehlgeschlagen')}>{status}</StatusMsg>}
            <Hint>Exportiert als 1080x1920 MP4 (9:16). Direkt als Instagram Reel hochladbar.</Hint>
          </Panel>

          {/* Music Suggestion */}
          <Panel>
            <SectionLabel>Musikvorschlag</SectionLabel>
            <SecBtn onClick={generateMusic} disabled={musicLoading} style={{ width: '100%', marginBottom: '0.5rem' }}>
              {musicLoading ? 'Suche Songs...' : 'Musik vorschlagen lassen'}
            </SecBtn>
            {musicSuggestions.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                {musicSuggestions.map((m, i) => (
                  <div key={i} style={{ padding: '0.6rem', border: `1px solid ${colors.lightGray}`, marginBottom: '0.35rem', background: '#fafafa' }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: colors.black }}>
                      {m.song} <span style={{ fontWeight: 400, color: colors.gray }}>— {m.artist}</span>
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', color: colors.gray, marginTop: '0.2rem' }}>{m.why}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: colors.red, marginTop: '0.25rem', cursor: 'pointer' }}
                      onClick={() => { navigator.clipboard.writeText(m.search); }}>
                      Suche: "{m.search}" (klick zum kopieren)
                    </div>
                  </div>
                ))}
                <Hint>Song in der Instagram Musik-Suche eingeben beim Reel-Upload.</Hint>
              </div>
            )}
          </Panel>

          {/* Caption */}
          <Panel>
            <SectionLabel>Caption + Hashtags</SectionLabel>
            <GenButton onClick={generateCaption} disabled={captionLoading} style={{ marginBottom: '0.5rem' }}>
              {captionLoading ? 'Generiere Caption...' : 'KI-Caption generieren'}
            </GenButton>
            <Hint style={{ marginBottom: '0.5rem' }}>Generiert Caption mit Hook, CTA und Hashtags basierend auf euren Reel-Texten.</Hint>

            {caption && (
              <>
                <CaptionArea value={caption} onChange={e => setCaption(e.target.value)} rows={10} />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <CopyBtn onClick={copyCaption}>
                    {captionCopied ? 'Kopiert!' : 'Caption kopieren'}
                  </CopyBtn>
                </div>
              </>
            )}
          </Panel>
        </div>

        {/* RIGHT: Preview */}
        <PreviewSticky>
          <PreviewLabel>
            {playing ? `${currentTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s` : `Preview — Slide ${playingSlideIdx + 1}/${slides.length}`}
          </PreviewLabel>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onClick={handleScrub}
            style={{ width: 270, height: 480, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', background: '#000', cursor: 'pointer' }}
          />
          <ProgressBar><div style={{ width: `${(currentTime / totalDuration) * 100}%` }} /></ProgressBar>
          <DotRow>
            {slides.map((_, i) => <Dot key={i} $active={playingSlideIdx === i} />)}
          </DotRow>
        </PreviewSticky>
      </Grid>
    </>
  );
}
