// src/pages/ReelsPage.js
// S&I. Instagram Reels Generator — Animierte Templates für Screen Recording
import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import Layout from '../components/Layout';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };

// ============================================
// REEL TEMPLATES
// ============================================
const TEMPLATES = {
  themeReveal: { name: 'Theme Reveal', desc: 'Theme-Name fliegt ein + Vorschau', duration: 6, icon: '🎨' },
  featureList: { name: 'Feature Reveal', desc: 'Features nacheinander', duration: 8, icon: '⚡' },
  vorstellung: { name: 'Vorstellung', desc: 'Wer sind wir — mit Foto', duration: 7, icon: '👋' },
  textStatement: { name: 'Text Statement', desc: 'Wort-für-Wort Animation', duration: 5, icon: '💬' },
  countdown: { name: 'Countdown Reveal', desc: '3...2...1... + Reveal', duration: 6, icon: '🔥' },
  beforeAfter: { name: 'Vorher / Nachher', desc: 'Template vs S&I.', duration: 7, icon: '✨' },
};

// ============================================
// ANIMATIONS
// ============================================
const countPop = keyframes`
  0% { opacity: 0; transform: scale(3); }
  30% { opacity: 1; transform: scale(1); }
  80% { opacity: 1; }
  100% { opacity: 0; transform: scale(0.5); }
`;

// ============================================
// STYLED COMPONENTS
// ============================================
const PageHeader = styled.div`
  margin-bottom: 2rem;
  h1 { font-family: 'Oswald', sans-serif; font-size: 2rem; font-weight: 700; text-transform: uppercase; color: ${colors.black}; margin-bottom: 0.25rem; }
  p { font-family: 'Source Serif 4', serif; font-style: italic; color: ${colors.gray}; font-size: 1rem; }
`;
const Grid = styled.div`display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: start; @media (max-width: 1024px) { grid-template-columns: 1fr; }`;
const Panel = styled.div`background: #fff; border: 1px solid ${colors.lightGray}; padding: 1.5rem; margin-bottom: 0.75rem;`;
const SectionLabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.gray}; margin-bottom: 0.75rem;`;
const Label = styled.label`font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: ${colors.gray}; display: block; margin-bottom: 0.25rem;`;
const Input = styled.input`width: 100%; padding: 0.65rem 0.75rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.85rem; background: #fff; outline: none; &:focus { border-color: ${colors.red}; }`;
const Textarea = styled.textarea`width: 100%; padding: 0.65rem 0.75rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.85rem; background: #fff; resize: vertical; outline: none; &:focus { border-color: ${colors.red}; }`;
const Field = styled.div`margin-bottom: 0.75rem;`;
const TemplateGrid = styled.div`display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 1rem;`;
const TemplateBtn = styled.button`
  font-family: 'Inter', sans-serif; font-size: 0.7rem; padding: 0.75rem; cursor: pointer; text-align: left;
  border: 1px solid ${p => p.$active ? colors.black : colors.lightGray};
  background: ${p => p.$active ? colors.black : '#fff'};
  color: ${p => p.$active ? '#fff' : colors.black};
  transition: all 0.15s; &:hover { border-color: ${colors.black}; }
  .name { font-weight: 600; display: block; }
  .desc { font-size: 0.55rem; opacity: 0.6; margin-top: 2px; display: block; }
`;
const PlayBtn = styled.button`
  font-family: 'Oswald', sans-serif; font-size: 0.9rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 1rem 2rem; cursor: pointer; border: none; width: 100%;
  background: ${p => p.$active ? '#10B981' : colors.red}; color: #fff; transition: all 0.2s;
  &:hover { opacity: 0.9; }
`;
const PreviewSticky = styled.div`position: sticky; top: 80px; @media (max-width: 1024px) { position: static; order: -1; }`;
const PreviewLabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; color: ${colors.gray}; text-align: center; margin-bottom: 0.5rem;`;
const ProgressBar = styled.div`height: 3px; background: ${colors.lightGray}; margin-top: 0.5rem; overflow: hidden; border-radius: 2px; div { height: 100%; background: ${colors.red}; transition: width 0.05s linear; }`;
const Hint = styled.p`font-size: 0.65rem; color: ${colors.gray}; margin-top: 0.75rem; line-height: 1.6;`;
const FileLabel = styled.label`display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid ${colors.lightGray}; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 0.75rem; &:hover { border-color: ${colors.black}; } input { display: none; }`;
const StepBox = styled.div`
  background: #F9F9F7; border: 1px solid ${colors.lightGray}; padding: 1rem; margin-top: 0.75rem;
  h3 { font-family: 'Oswald', sans-serif; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem; }
  ol { font-size: 0.75rem; line-height: 2; color: ${colors.gray}; padding-left: 1.25rem; }
  ol li strong { color: ${colors.black}; }
`;
const ReelFrame = styled.div`
  width: 270px; height: 480px; position: relative; overflow: hidden;
  background: #000; box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 12px; margin: 0 auto;
`;

// ============================================
// ANIMATED REEL RENDERERS
// ============================================

function ThemeRevealReel({ phase, texts, image }) {
  return (
    <ReelFrame>
      {image && <div style={{ position: 'absolute', inset: 0, opacity: phase > 1.5 ? Math.min((phase - 1.5) * 0.3, 0.35) : 0, transition: 'opacity 0.6s' }}>
        <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }} />
      </div>}
      <Logo dark show={phase > 0.3} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', zIndex: 5 }}>
        <Eyebrow show={phase > 0.8}>{texts.eyebrow}</Eyebrow>
        <Headline show={phase > 1.2} size="2rem">{texts.line1}</Headline>
        <AccentText show={phase > 2}>{texts.accent}</AccentText>
        <Line show={phase > 3} />
        <Body show={phase > 3.5}>{texts.body}</Body>
      </div>
      <Url show={phase > 4.5} />
    </ReelFrame>
  );
}

function FeatureListReel({ phase, texts }) {
  const items = (texts.items || '').split('\n').filter(Boolean);
  return (
    <ReelFrame>
      <Logo dark show={phase > 0.3} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', zIndex: 5 }}>
        <Eyebrow show={phase > 0.5}>{texts.eyebrow}</Eyebrow>
        <Headline show={phase > 0.8} size="1.5rem">{texts.line1}</Headline>
        <div style={{ marginTop: 16 }}>
          {items.map((item, i) => {
            const at = 1.5 + i * 0.7;
            const [title, desc] = item.split('|');
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                opacity: phase > at ? 1 : 0, transform: `translateX(${phase > at ? 0 : -20}px)`, transition: 'all 0.5s ease-out',
              }}>
                <div style={{ width: 12, height: 1.5, background: 'rgba(255,255,255,0.3)', marginTop: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: '0.45rem', fontWeight: 600, color: '#fff' }}>{title}</div>
                  {desc && <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: '0.35rem', fontWeight: 300, color: 'rgba(255,255,255,0.4)' }}>{desc}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Url show={phase > 6} />
    </ReelFrame>
  );
}

function VorstellungReel({ phase, texts, image }) {
  return (
    <ReelFrame>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', overflow: 'hidden', opacity: phase > 0.5 ? 1 : 0, transition: 'opacity 0.8s' }}>
        {image ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #111, #333)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, #000 100%)' }} />
      </div>
      <div style={{ position: 'absolute', top: 24, left: 20, zIndex: 10, background: '#fff', color: '#000', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '0.55rem', padding: '4px 8px', letterSpacing: '-0.04em', opacity: phase > 0.3 ? 1 : 0, transition: 'opacity 0.4s' }}>S&I.</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', padding: '0 24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 5 }}>
        <Eyebrow show={phase > 1.5}>{texts.eyebrow}</Eyebrow>
        <Headline show={phase > 2} size="1.6rem">{texts.line1}</Headline>
        <AccentText show={phase > 2.8} size="1.8rem">{texts.accent}</AccentText>
        <Line show={phase > 3.5} />
        <Body show={phase > 4}>{texts.body}</Body>
      </div>
      <Url show={phase > 5.5} />
    </ReelFrame>
  );
}

function TextStatementReel({ phase, texts }) {
  const words = (texts.line1 || '').split(' ');
  return (
    <ReelFrame style={{ background: '#fff' }}>
      <div style={{ position: 'absolute', top: 24, left: 20, zIndex: 10, background: '#000', color: '#fff', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '0.55rem', padding: '4px 8px', letterSpacing: '-0.04em', opacity: phase > 0.2 ? 1 : 0, transition: 'opacity 0.3s' }}>S&I.</div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', zIndex: 5 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.2rem', fontWeight: 300, color: '#000', lineHeight: 1.2 }}>
          {words.map((word, i) => {
            const at = 0.5 + i * 0.35;
            const isAccent = word.replace(/[.,!?]/g, '') === texts.accent;
            return (
              <span key={i} style={{
                display: 'inline-block', marginRight: '0.3em',
                opacity: phase > at ? 1 : 0, transform: `translateY(${phase > at ? 0 : 20}px)`, transition: 'all 0.4s ease-out',
                ...(isAccent ? { fontFamily: "'Mrs Saint Delafield', cursive", fontSize: '2.6rem' } : {}),
              }}>{word}</span>
            );
          })}
        </div>
        <div style={{ width: phase > 3 ? 40 : 0, height: 2, background: '#000', transition: 'width 0.5s', margin: '20px 0' }} />
        <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: '0.45rem', fontWeight: 300, color: '#666', lineHeight: 1.8, opacity: phase > 3.5 ? 1 : 0, transition: 'all 0.5s' }}>{texts.body}</div>
      </div>
      <div style={{ position: 'absolute', bottom: 20, left: 20, fontFamily: "'Josefin Sans', sans-serif", fontSize: '0.3rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#bbb', opacity: phase > 4 ? 1 : 0, transition: 'opacity 0.5s', zIndex: 10 }}>siwedding.com</div>
    </ReelFrame>
  );
}

function CountdownReel({ phase, texts, image }) {
  const countNum = phase < 1 ? '3' : phase < 2 ? '2' : phase < 3 ? '1' : null;
  const revealed = phase >= 3;
  return (
    <ReelFrame>
      {countNum && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <div key={countNum} style={{ fontFamily: "'Oswald', sans-serif", fontSize: '5rem', fontWeight: 700, color: '#fff', animation: `${countPop} 1s ease-out forwards` }}>{countNum}</div>
        </div>
      )}
      {revealed && <>
        {image && <div style={{ position: 'absolute', inset: 0, opacity: Math.min((phase - 3) * 0.4, 0.3), transition: 'opacity 0.8s' }}>
          <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }} />
        </div>}
        <Logo dark show={phase > 3.3} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', zIndex: 5 }}>
          <Headline show={phase > 3.3} size="1.8rem">{texts.line1}</Headline>
          <AccentText show={phase > 3.8}>{texts.accent}</AccentText>
          <Line show={phase > 4.3} />
          <Body show={phase > 4.8}>{texts.body}</Body>
        </div>
        <Url show={phase > 5} />
      </>}
    </ReelFrame>
  );
}

function BeforeAfterReel({ phase, texts }) {
  const showAfter = phase >= 3.5;
  return (
    <ReelFrame style={{ background: showAfter ? '#000' : '#f0f0f0', transition: 'background 0.6s' }}>
      {/* BEFORE */}
      {!showAfter && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, opacity: phase > 0.3 ? 1 : 0, transition: 'opacity 0.5s' }}>
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '0.5rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Standard Website-Baukästen</div>
          <div style={{ width: 180, background: '#fff', border: '1px solid #ddd', padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ width: '100%', height: 50, background: '#eee', borderRadius: 4 }} />
            <div style={{ fontFamily: 'Arial', fontSize: '0.6rem', color: '#bbb', textAlign: 'center' }}>Template #47382</div>
            <div style={{ width: '80%', height: 5, background: '#eee', borderRadius: 3, margin: '0 auto' }} />
            <div style={{ width: '60%', height: 5, background: '#eee', borderRadius: 3, margin: '0 auto' }} />
            <div style={{ width: '50%', height: 18, background: '#ddd', borderRadius: 3, margin: '6px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.3rem', color: '#999' }}>RSVP?</div>
          </div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: '#aaa', marginTop: 16, opacity: phase > 1.5 ? 1 : 0, transition: 'opacity 0.5s' }}>Sieht aus wie alle anderen.</div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.7rem', color: colors.red, marginTop: 8, fontWeight: 600, opacity: phase > 2.5 ? 1 : 0, transition: 'opacity 0.5s' }}>ABER EURE LIEBE IST NICHT 08/15.</div>
        </div>
      )}
      {/* AFTER */}
      {showAfter && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', zIndex: 5 }}>
          <Logo dark show={phase > 3.8} />
          <Eyebrow show={phase > 4}>{texts.eyebrow}</Eyebrow>
          <Headline show={phase > 4.3} size="1.7rem">{texts.line1}</Headline>
          <AccentText show={phase > 4.8}>{texts.accent}</AccentText>
          <Line show={phase > 5.3} />
          <Body show={phase > 5.5}>{texts.body}</Body>
          <Url show={phase > 6} />
        </div>
      )}
    </ReelFrame>
  );
}

// ============================================
// SHARED REEL SUB-COMPONENTS
// ============================================
function Logo({ dark, show }) {
  return (
    <div style={{
      position: 'absolute', top: 24, left: 20, zIndex: 10,
      background: dark ? 'rgba(255,255,255,0.1)' : '#000',
      border: dark ? '1px solid rgba(255,255,255,0.15)' : 'none',
      color: dark ? '#fff' : '#fff',
      fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '0.55rem',
      padding: '4px 8px', letterSpacing: '-0.04em',
      opacity: show ? 1 : 0, transition: 'opacity 0.4s',
    }}>S&I.</div>
  );
}

function Eyebrow({ show, children }) {
  return (
    <div style={{
      fontFamily: "'Inter', sans-serif", fontSize: '0.35rem', fontWeight: 600,
      letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
      opacity: show ? 1 : 0, transform: `translateY(${show ? 0 : 12}px)`,
      transition: 'all 0.5s ease-out', marginBottom: 6,
    }}>{children}</div>
  );
}

function Headline({ show, size, children }) {
  return (
    <div style={{
      fontFamily: "'Cormorant Garamond', serif", fontSize: size || '1.8rem', fontWeight: 300,
      color: '#fff', lineHeight: 1.15,
      opacity: show ? 1 : 0, transform: `translateY(${show ? 0 : 25}px)`,
      transition: 'all 0.7s ease-out',
    }}>{children}</div>
  );
}

function AccentText({ show, size, children }) {
  return (
    <div style={{
      fontFamily: "'Mrs Saint Delafield', cursive", fontSize: size || '2rem',
      color: 'rgba(255,255,255,0.7)',
      opacity: show ? 1 : 0, transform: `translateY(${show ? 0 : 15}px)`,
      transition: 'all 0.5s ease-out',
    }}>{children}</div>
  );
}

function Line({ show }) {
  return <div style={{ width: show ? 30 : 0, height: 1, background: 'rgba(255,255,255,0.2)', transition: 'width 0.5s', margin: '12px 0' }} />;
}

function Body({ show, children }) {
  return (
    <div style={{
      fontFamily: "'Josefin Sans', sans-serif", fontSize: '0.42rem', fontWeight: 300,
      color: 'rgba(255,255,255,0.5)', lineHeight: 1.7,
      opacity: show ? 1 : 0, transform: `translateY(${show ? 0 : 10}px)`,
      transition: 'all 0.5s ease-out',
    }}>{children}</div>
  );
}

function Url({ show }) {
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 20, zIndex: 10,
      fontFamily: "'Josefin Sans', sans-serif", fontSize: '0.3rem',
      letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
      opacity: show ? 1 : 0, transition: 'opacity 0.5s',
    }}>siwedding.com</div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function ReelsPage() {
  const [template, setTemplate] = useState('themeReveal');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [image, setImage] = useState(null);
  const [texts, setTexts] = useState({
    eyebrow: 'S&I. Wedding',
    line1: 'Eure Hochzeit verdient mehr als ein Template.',
    accent: 'Hochzeit',
    body: 'Handgemachte Hochzeitswebsites aus Hamburg. Mit Liebe zum Detail.',
    items: 'Eigene Domain|yourwedding.com\nRSVP System|Zusagen & Absagen\nLove Story|Eure Geschichte\nFoto Upload|Gäste laden hoch\nCountdown|Bis zum großen Tag\nMusik-Wünsche|Für die Party',
  });

  const animRef = useRef(null);
  const startTimeRef = useRef(null);

  const tmpl = TEMPLATES[template];
  const duration = tmpl.duration;
  const phase = progress * duration;

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const startPlayback = () => {
    // 3-2-1 countdown, then play
    setCountdown(3);
    setProgress(0);
    setTimeout(() => setCountdown(2), 1000);
    setTimeout(() => setCountdown(1), 2000);
    setTimeout(() => {
      setCountdown(null);
      setPlaying(true);
      startTimeRef.current = Date.now();
      animRef.current = requestAnimationFrame(tick);
    }, 3000);
  };

  const tick = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const p = Math.min(elapsed / duration, 1);
    setProgress(p);
    if (p < 1) {
      animRef.current = requestAnimationFrame(tick);
    } else {
      setPlaying(false);
    }
  };

  const stopPlayback = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setPlaying(false);
    setCountdown(null);
    setProgress(0);
  };

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // Reset when template changes
  useEffect(() => {
    stopPlayback();
    setProgress(0);
  }, [template]);

  const renderReel = () => {
    const props = { phase, texts, image };
    switch (template) {
      case 'themeReveal': return <ThemeRevealReel {...props} />;
      case 'featureList': return <FeatureListReel {...props} />;
      case 'vorstellung': return <VorstellungReel {...props} />;
      case 'textStatement': return <TextStatementReel {...props} />;
      case 'countdown': return <CountdownReel {...props} />;
      case 'beforeAfter': return <BeforeAfterReel {...props} />;
      default: return <ThemeRevealReel {...props} />;
    }
  };

  return (
    <Layout>
      <PageHeader>
        <h1>Reels</h1>
        <p>Animierte Instagram Reels — Template wählen, abspielen, Screen Recording starten</p>
      </PageHeader>

      <Grid>
        <div>
          {/* Template Selection */}
          <Panel>
            <SectionLabel>Template</SectionLabel>
            <TemplateGrid>
              {Object.entries(TEMPLATES).map(([id, t]) => (
                <TemplateBtn key={id} $active={template === id} onClick={() => setTemplate(id)}>
                  <span className="name">{t.icon} {t.name}</span>
                  <span className="desc">{t.desc} · {t.duration}s</span>
                </TemplateBtn>
              ))}
            </TemplateGrid>
          </Panel>

          {/* Text inputs */}
          <Panel>
            <SectionLabel>Texte</SectionLabel>
            <Field><Label>Eyebrow</Label><Input value={texts.eyebrow} onChange={e => setTexts(p => ({ ...p, eyebrow: e.target.value }))} /></Field>
            <Field><Label>Headline</Label><Textarea value={texts.line1} onChange={e => setTexts(p => ({ ...p, line1: e.target.value }))} rows={2} /></Field>
            <Field><Label>Akzent-Wort (Script Font)</Label><Input value={texts.accent} onChange={e => setTexts(p => ({ ...p, accent: e.target.value }))} /></Field>
            <Field><Label>Body</Label><Textarea value={texts.body} onChange={e => setTexts(p => ({ ...p, body: e.target.value }))} rows={2} /></Field>
            {template === 'featureList' && (
              <Field><Label>Feature Items (Zeile pro Item, | für Beschreibung)</Label><Textarea value={texts.items} onChange={e => setTexts(p => ({ ...p, items: e.target.value }))} rows={6} /></Field>
            )}
            <Field>
              <Label>Bild (optional)</Label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <FileLabel>📷 Bild wählen...<input type="file" accept="image/*" onChange={handleImage} /></FileLabel>
                {image && <>
                  <img src={image} alt="" style={{ width: 32, height: 32, objectFit: 'cover', border: `1px solid ${colors.lightGray}` }} />
                  <button onClick={() => setImage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.red, fontSize: '0.8rem' }}>✕</button>
                </>}
              </div>
            </Field>
          </Panel>

          {/* Playback Controls */}
          <Panel>
            <SectionLabel>Abspielen & Aufnehmen</SectionLabel>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!playing && countdown === null ? (
                <PlayBtn onClick={startPlayback}>▶ Abspielen ({duration}s)</PlayBtn>
              ) : (
                <PlayBtn $active onClick={stopPlayback}>⏹ Stopp</PlayBtn>
              )}
            </div>
            <ProgressBar><div style={{ width: `${progress * 100}%` }} /></ProgressBar>
          </Panel>

          {/* Workflow Help */}
          <StepBox>
            <h3>So erstellst du ein Reel</h3>
            <ol>
              <li><strong>Template wählen</strong> & Texte anpassen</li>
              <li><strong>Screen Recording starten:</strong> iPhone → Kontrollzentrum → Aufnahme · Mac → ⌘+Shift+5 · Windows → Win+G</li>
              <li>Hier <strong>▶ Abspielen</strong> klicken (3s Countdown)</li>
              <li>Nach dem Abspielen <strong>Recording stoppen</strong></li>
              <li>Video in Instagram <strong>als Reel hochladen</strong></li>
            </ol>
          </StepBox>

          <Hint>Tipp: Für beste Qualität den Browser auf die Preview-Größe zoomen und nur den Reel-Bereich aufnehmen. Auf dem iPhone kannst du den Browser im Vollbild öffnen.</Hint>
        </div>

        {/* RIGHT: Preview */}
        <PreviewSticky>
          <PreviewLabel>{countdown !== null ? `Countdown: ${countdown}` : playing ? `▶ ${Math.ceil(phase)}s / ${duration}s` : 'Preview (9:16)'}</PreviewLabel>
          <div style={{ position: 'relative' }}>
            {renderReel()}
            {countdown !== null && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 50, borderRadius: 12,
              }}>
                <div key={countdown} style={{ fontFamily: "'Oswald', sans-serif", fontSize: '4rem', fontWeight: 700, color: '#fff', animation: `${countPop} 1s ease-out forwards` }}>{countdown}</div>
              </div>
            )}
          </div>
          <ProgressBar><div style={{ width: `${progress * 100}%` }} /></ProgressBar>
        </PreviewSticky>
      </Grid>
    </Layout>
  );
}
