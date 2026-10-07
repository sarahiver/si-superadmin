// src/lib/postCanvas.js
// Gemeinsamer Renderer für Instagram-Posts UND Pinterest-Pins.
//
// Vorher gab es zwei Implementierungen: die React-Variante in InstagramPage
// und einen eigenen HTML-String-Renderer im Pin-Generator. Letzterer kannte
// nur Farben und Schriften — Glasrahmen, Brutal-Kasten, Glow, Gradient und
// die Split-Spalte fehlten. Deshalb sahen Pins nie aus wie die Posts,
// obwohl beide dasselbe Theme meinten.
//
// Dieser Code stammt unverändert aus InstagramPage; die Seite nutzt ihn
// jetzt ebenfalls, damit es nur noch eine Quelle gibt.
import React from 'react';
import { THEMES } from './reelThemes';

// Bilder werden als background-image mit cover gesetzt, nicht als <img> mit
// transform-Zentrierung: html2canvas setzt transform auf Bildern nicht
// zuverlässig um — im Browser sah es richtig aus, im Export war es verzerrt.

/**
 * Listenpunkte aus dem Body-Text.
 * Format: eine Zeile pro Punkt, optional "Titel | Beschreibung".
 * Kommt nur ein Satz (Standard der KI-Copy), wird er an Satzzeichen geteilt,
 * damit das Layout nicht mit einem einzigen Riesenpunkt dasteht.
 * Maximal 5 Punkte — mehr passt nicht lesbar auf einen Pin.
 */
export function listItems(bodyText = '') {
  let lines = String(bodyText).split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    lines = String(bodyText)
      .split(/(?<=[.!?;])\s+|\s+[–—·•]\s+/)
      .map(l => l.replace(/[.;]$/, '').trim())
      .filter(Boolean);
  }
  return lines.slice(0, 5).map(line => {
    const [title, ...rest] = line.split('|');
    const t = title.trim();
    return { title: t.charAt(0).toUpperCase() + t.slice(1), desc: rest.join('|').trim() };
  });
}

/**
 * @param {object} p
 * @param {string} p.theme      classic | editorial | ... (siehe reelThemes)
 * @param {string} p.layout     statement | split | list | dark | fullbleed
 * @param {number} p.W,p.H      Zielmaße in Pixeln (Pin: 1080×1620)
 */
export default function PostCanvas({
  theme = 'classic', layout = 'statement',
  W = 1080, H = 1620,
  eyebrow = '', headline = '', accentWord = '', bodyText = '',
  image = null, pageNum = '',
}) {
  const t = THEMES[theme] || THEMES.classic;
  const isDark = layout === 'dark' || layout === 'fullbleed' || t.alwaysDark;
  const bg = isDark ? (t.bgDark || t.bg) : t.bg;
  const textColor = isDark ? (t.textDark || t.text) : t.text;
  const logoSt = isDark ? t.logoDarkStyle : t.logoStyle;

  const renderHeadline = () => {
    if (!accentWord || !headline.includes(accentWord)) return headline;
    const parts = headline.split(accentWord);
    const accentColor = isDark ? (t.accentDark || t.accent) : t.accent;
    return (<>{parts[0]}<span style={{ fontFamily: t.scriptFont || t.headlineFont, fontStyle: t.scriptStyle || 'normal', color: accentColor, fontWeight: t.scriptFont ? 400 : t.headlineWeight, textTransform: 'none', textShadow: t.glow ? `0 0 15px ${t.secondary || t.accent}` : 'none', display: 'inline' }}>{accentWord}</span>{parts.slice(1).join(accentWord)}</>);
  };

  // ==========================================
  // POST RENDERER
  // ==========================================
  const logo = { position: 'absolute', top: 24, left: 24, zIndex: 5, fontFamily: t.uiFont, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '-0.04em', padding: '4px 10px', lineHeight: 1, ...logoSt };
  const ey = { fontFamily: t.uiFont, fontSize: '0.5rem', fontWeight: t.brutal ? 700 : 600, letterSpacing: t.brutal ? '0.1em' : '0.25em', textTransform: 'uppercase', color: isDark ? t.accent : t.muted, marginBottom: 10, textShadow: t.glow ? `0 0 10px ${t.accent}` : 'none' };
  const hl = { fontFamily: t.headlineFont, fontSize: layout === 'split' ? '1.5rem' : (t.headlineSize || '2.2rem'), fontWeight: t.headlineWeight, fontStyle: t.headlineStyle || 'normal', textTransform: t.headlineTransform || 'none', lineHeight: 1.15, color: textColor, marginBottom: 12 };
  const bd = { fontFamily: t.bodyFont, fontSize: t.bodySize || '0.65rem', fontWeight: t.bodyWeight, fontStyle: t.bodyStyle || 'normal', lineHeight: 1.75, color: isDark ? (t.body || 'rgba(255,255,255,0.6)') : (t.body || '#555') };
  const al = { width: 28, height: 2, marginBottom: 14, background: t.accent, boxShadow: t.glow ? `0 0 8px ${t.accent}` : 'none' };
  const ft = { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', zIndex: 5, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` };
  const ftx = { fontFamily: t.uiFont, fontSize: t.footerSize || '0.42rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.25)' : t.muted };
  const corner = t.brutal
    ? <div style={{ position: 'absolute', top: 0, right: 0, width: 70, height: 70, background: t.tertiary || t.accent, opacity: 0.15 }} />
    : <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderRight: `1.5px solid ${t.accent}`, borderTop: `1.5px solid ${t.accent}`, opacity: 0.3 }} />;
  const footer = <div style={ft}><span style={{ ...ftx, color: t.accent, opacity: isDark ? 0.5 : 1 }}>sarahiver.com</span><span style={ftx}>{pageNum}</span></div>;

  const renderPost = () => {
    switch (layout) {
      case 'statement':
        return (<div style={{ background: t.gradient || bg, width: W, height: H, position: 'relative', overflow: 'hidden' }}>
          <div style={logo}>S&I.</div>
          {!t.alwaysDark && !t.brutal && <div style={{ position: 'absolute', top: 24, right: 24, width: 1, height: 'calc(100% - 80px)', background: 'rgba(0,0,0,0.05)' }} />}
          {(isDark && !t.glass && !t.brutal) && corner}
          {t.glow && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 40%, ${t.accent}15, transparent 55%), radial-gradient(ellipse at 70% 70%, ${t.secondary || t.accent}10, transparent 50%)`, pointerEvents: 'none' }} />}
          {t.cardStyle === 'luxe' && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 0%, rgba(201,169,98,0.06), transparent 60%)`, pointerEvents: 'none' }} />}
          {t.glass ? (
            <div style={{ position: 'absolute', inset: '60px 20px 50px', ...t.glassStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '28px', zIndex: 2 }}>
              <div style={al} /><div style={ey}>{eyebrow}</div><div style={hl}>{renderHeadline()}</div><div style={bd}>{bodyText}</div>
            </div>
          ) : t.brutal ? (
            <div style={{ position: 'absolute', inset: '55px 18px 45px', background: '#fff', border: t.brutalBorder, boxShadow: t.brutalShadow, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px', zIndex: 2 }}>
              <div style={{ ...al, background: t.accent }} /><div style={{ ...ey, color: t.accent }}>{eyebrow}</div><div style={{ ...hl, color: t.text }}>{renderHeadline()}</div><div style={{ ...bd, color: t.body }}>{bodyText}</div>
            </div>
          ) : (
            <div style={{ position: 'absolute', inset: 0, padding: '70px 24px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }}>
              <div style={al} /><div style={ey}>{eyebrow}</div><div style={hl}>{renderHeadline()}</div><div style={bd}>{bodyText}</div>
            </div>
          )}{footer}</div>);
      case 'split':
        return (<div style={{ background: bg, width: W, height: H, position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '42% 1fr' }}>
          <div style={{ background: t.alwaysDark ? bg : '#1A1A1A', position: 'relative', overflow: 'hidden' }}>
            {image ? <div style={{ width: '100%', height: '100%', backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', filter: 'grayscale(100%)', opacity: 0.8 }} />
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #111, #333)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: t.uiFont, fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bild</span></div>}
          </div>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={logo}>S&I.</div>
            <div style={{ ...ey, marginTop: 30 }}>{eyebrow}</div><div style={{ ...hl, fontSize: '1.5rem' }}>{renderHeadline()}</div><div style={al} /><div style={bd}>{bodyText}</div>
          </div>{footer}</div>);
      case 'list': {
        // Vorher: padding auf einem Container mit fester Breite/Höhe ohne
        // border-box → 48 px breiter und höher als die Fläche. html2canvas hat
        // rechts abgeschnitten, der Footer lag außerhalb, das accentWord stand
        // doppelt da, und die Liste klebte oben an der Headline.
        const items = listItems(bodyText);
        return (<div style={{ background: t.gradient || bg, width: W, height: H, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
          <div style={logo}>S&I.</div>
          {t.glow && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 30%, ${t.accent}12, transparent 55%)`, pointerEvents: 'none' }} />}
          <div style={{ position: 'absolute', inset: 0, boxSizing: 'border-box', padding: '64px 24px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }}>
            <div style={al} />
            <div style={ey}>{eyebrow}</div>
            <div style={{ ...hl, fontSize: '1.45rem', marginBottom: 18, overflowWrap: 'break-word' }}>{renderHeadline()}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}` }}>
                  <div style={{ fontFamily: t.uiFont, fontSize: '0.5rem', fontWeight: 700, color: t.accent, minWidth: 16, lineHeight: '1.5', textShadow: t.glow ? `0 0 6px ${t.accent}` : 'none' }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: t.bodyFont, fontSize: '0.72rem', fontWeight: 600, lineHeight: 1.35, color: textColor }}>{item.title}</div>
                    {item.desc && <div style={{ fontFamily: t.bodyFont, fontSize: '0.56rem', fontWeight: 400, lineHeight: 1.45, color: isDark ? 'rgba(255,255,255,0.55)' : t.muted, marginTop: 2 }}>{item.desc}</div>}
                  </div>
                </div>))}
            </div>
          </div>{footer}</div>); }
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
          {image ? <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', filter: 'grayscale(100%)', opacity: 0.5 }} />
            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a1a, #333)' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(26,26,26,0.85) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, zIndex: 5 }}>
            <div style={al} /><div style={{ ...hl, fontSize: '1.6rem', color: '#FDFCFA' }}>{renderHeadline()}</div>
            <div style={{ ...bd, color: 'rgba(253,252,250,0.6)', marginBottom: 10 }}>{bodyText}</div>
            <div style={{ fontFamily: t.uiFont, fontSize: '0.42rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: t.accent, opacity: 0.7 }}>sarahiver.com</div>
          </div></div>);
      default: return null;
    }
  };
  return renderPost();
}
