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
// ── Headline passend machen ──────────────────────────────────────
// Deutsche Komposita („HOCHZEITSWEBSITE", „VERSCHWEIGEN") sind in Versalien
// breiter als die Textspalte. Der Browser bricht sie nicht um, also lief der
// Text rechts aus dem Bild — besonders im schmalen Split-Layout.
// Lösung: Jedes Wort mit der echten Schrift ausmessen und die Schriftgröße so
// weit verkleinern, dass das längste Wort passt und die Headline nicht mehr
// als maxLines Zeilen braucht. html2canvas kann keine Silbentrennung, deshalb
// geht es nur über die Größe.
let measureCtx = null;
function textWidth(text, { family, weight = 400, style = 'normal', px }) {
  if (typeof document === 'undefined') return text.length * px * 0.6;
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = `${style} ${weight} ${px}px ${family}`;
  return measureCtx.measureText(text).width;
}

function remPx() {
  if (typeof document === 'undefined') return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

const toPx = (size) => {
  const v = parseFloat(size);
  if (!Number.isFinite(v)) return 2.2 * remPx();
  return /rem$/.test(String(size)) ? v * remPx() : v;
};

export function fitHeadlinePx({ headline, accentWord, t, basePx, maxWidth, maxLines, minFactor = 0.5 }) {
  if (!headline || maxWidth <= 0) return basePx;
  const upper = (t.headlineTransform || 'none') === 'uppercase';
  const words = String(headline).split(/\s+/).filter(Boolean);
  const accentSet = new Set(String(accentWord || '').split(/\s+/).filter(Boolean));
  const minPx = basePx * minFactor;

  for (let px = basePx; px >= minPx; px *= 0.94) {
    const widthOf = (w) => (accentSet.has(w) && t.scriptFont
      ? textWidth(w, { family: t.scriptFont, style: t.scriptStyle || 'normal', weight: t.scriptWeight || 400, px })
      : textWidth(upper ? w.toUpperCase() : w, {
        family: t.headlineFont, weight: t.headlineWeight || 400, style: t.headlineStyle || 'normal', px,
      }));
    const space = textWidth(' ', { family: t.headlineFont, px });
    const widths = words.map(widthOf);

    // 8 % Reserve: Canvas-Messung und html2canvas-Rendering weichen ab
    // Versalien laufen in html2canvas etwas breiter als gemessen
    const limit = maxWidth * (upper ? 0.86 : 0.92);
    if (Math.max(...widths) > limit) continue;

    // Zeilen wie der Browser umbrechen (gierig, an Leerzeichen)
    let lines = 1;
    let line = 0;
    widths.forEach((w) => {
      if (line === 0) { line = w; return; }
      if (line + space + w > limit) { lines++; line = w; } else { line += space + w; }
    });
    if (lines <= maxLines) return Math.round(px * 10) / 10;
  }
  return Math.round(minPx * 10) / 10;
}

// ── Kontrast fürs Akzentwort ────────────────────────────────────
// Manche Themes haben eine Akzentfarbe, die auf dunklem Grund verschwindet
// (Modern: Schwarz auf Schwarz, Contemporary-Kasten: Koralle auf Koralle,
// Botanical: Dunkelgrün auf Fast-Schwarz). Unter Kontrast 3:1 wird auf eine
// lesbare Alternative ausgewichen.
// Hex oder rgb()/rgba(); halbtransparente Farben werden auf den Grund gemischt
function parseColor(c, onBg) {
  const str = String(c || '').trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(str);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map(x => x + x).join('') : hex[1];
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  }
  const fn = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(str);
  if (!fn) return null;
  const rgb = fn.slice(1, 4).map(Number);
  const a = fn[4] == null ? 1 : Number(fn[4]);
  if (a >= 1 || !onBg) return rgb;
  const base = parseColor(onBg) || [0, 0, 0];
  return rgb.map((v, i) => v * a + base[i] * (1 - a));
}
function luminance(c, onBg) {
  const rgb = parseColor(c, onBg);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(v => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const la = luminance(a, b); const lb = luminance(b);
  if (la == null || lb == null) return null; // unbekanntes Format: nicht eingreifen
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function readableAccent(preferred, onBg, alternatives) {
  const c = contrast(preferred, onBg);
  if (c == null || c >= 3) return preferred;
  return alternatives.find(alt => (contrast(alt, onBg) ?? 0) >= 3) || preferred;
}

// Harter Versatz-Schatten als eigenes Element. html2canvas zeichnet
// box-shadow ohne Unschärfe über die Fläche statt dahinter — der weiße
// Brutal-Kasten kam dadurch schwarz im Export an, und die schwarze
// Headline war darauf unsichtbar.
function HardShadow({ top, right, bottom, left, offset = 6, color }) {
  return (
    <div style={{
      position: 'absolute',
      top: top + offset, right: right - offset, bottom: bottom - offset, left: left + offset,
      background: color, zIndex: 1,
    }} />
  );
}

const shadowColor = (shadow, fallback) => (String(shadow || '').match(/(#[0-9a-f]{3,8}|rgba?\([^)]*\))\s*$/i) || [])[1] || fallback;

export default function PostCanvas({
  theme = 'classic', layout = 'statement',
  W = 1080, H = 1620,
  eyebrow = '', headline = '', accentWord = '', bodyText = '',
  image = null, pageNum = '',
  // 'muted' = bisheriger Look (Foto stark abgedunkelt), 'bright' = Foto
  // sichtbar, Lesbarkeit nur über den Verlauf hinter dem Text.
  // Hinweis: html2canvas ignoriert CSS-filter — grayscale wirkt nur in der
  // Live-Vorschau, nicht im exportierten Bild. Abgedunkelt hat bisher allein
  // die opacity 0.5 auf dunklem Grund.
  imageTone = 'muted',
  // Pinterest-Modus: Pins werden im Feed nur ~170 px breit angezeigt.
  // Dafür größere, kräftigere Headline, Suchbegriff in Klartext statt
  // Schreibschrift, helleres Foto, lesbare Unterzeile, Abstand zu den
  // Pinterest-Icons unten. Instagram-Posts bleiben unverändert.
  pin = false,
}) {
  const t = THEMES[theme] || THEMES.classic;
  const isDark = layout === 'dark' || layout === 'fullbleed' || t.alwaysDark;
  const bg = isDark ? (t.bgDark || t.bg) : t.bg;
  const textColor = isDark ? (t.textDark || t.text) : t.text;
  // Pins: Logo immer als solides schwarzes Badge (auf Fotos sonst kaum sichtbar)
  const logoSt = pin
    ? { ...(t.logoStyle || {}), background: '#1A1A1A', color: '#fff', border: 'none', fontSize: '0.85rem' }
    : (isDark ? t.logoDarkStyle : t.logoStyle);
  // Dünne Display-Schriften (300) verschwinden im Feed → für Pins mind. 500
  const pinHeadWeight = Math.max(Number(t.headlineWeight) || 400, 500);
  const pinBoldWeight = Math.min(Math.max(pinHeadWeight + 100, 600), 700);

  // onBg: Farbe der Fläche direkt hinter der Headline
  const renderHeadline = (onBg = bg) => {
    if (!accentWord || !headline.includes(accentWord)) return headline;
    const parts = headline.split(accentWord);
    const accentColor = readableAccent(
      isDark ? (t.accentDark || t.accent) : t.accent,
      onBg,
      [t.accentDark, t.accentSolid, t.secondary, t.tertiary, isDark ? '#FFFFFF' : '#0D0D0D', '#FFFFFF', '#0D0D0D'].filter(Boolean),
    );
    if (pin) {
      // Das Schlüsselwort ist meist der Suchbegriff → muss am besten lesbar
      // sein: Headline-Schrift, kräftiger, gleiche Farbe wie die Headline.
      // Farbige Theme-Akzente (z. B. Editorial-Rot) bleiben, wenn sie auf dem
      // Grund gut lesbar sind; graue Akzente (Classic) würden das Wort nur
      // abschwächen → dann Headline-Farbe.
      const acc = isDark ? (t.accentDark || t.accent) : t.accent;
      const rgb = parseColor(acc, onBg);
      const colorful = rgb && (Math.max(...rgb) - Math.min(...rgb)) > 60;
      const keep = colorful && (contrast(acc, onBg) ?? 0) >= 4.5;
      return (<>{parts[0]}<span style={{ fontWeight: pinBoldWeight, fontStyle: 'normal', textTransform: 'none', ...(keep ? { color: acc } : {}) }}>{accentWord}</span>{parts.slice(1).join(accentWord)}</>);
    }
    return (<>{parts[0]}<span style={{ fontFamily: t.scriptFont || t.headlineFont, fontStyle: t.scriptStyle || 'normal', color: accentColor, fontWeight: t.scriptFont ? 400 : t.headlineWeight, textTransform: 'none', textShadow: t.glow ? `0 0 15px ${t.secondary || t.accent}` : 'none', display: 'inline' }}>{accentWord}</span>{parts.slice(1).join(accentWord)}</>);
  };

  // ==========================================
  // POST RENDERER
  // ==========================================
  const logo = { position: 'absolute', top: 24, left: 24, zIndex: 5, fontFamily: t.uiFont, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '-0.04em', padding: '4px 10px', lineHeight: 1, ...logoSt };
  const ey = { fontFamily: t.uiFont, fontSize: pin ? '0.6rem' : '0.5rem', fontWeight: t.brutal ? 700 : 600, letterSpacing: t.brutal ? '0.1em' : '0.25em', textTransform: 'uppercase', color: isDark ? t.accent : t.muted, marginBottom: 10, textShadow: t.glow ? `0 0 10px ${t.accent}` : 'none' };
  // Verfügbare Textbreite je Layout (Innenabstände aus dem Markup unten)
  const textArea = {
    statement: t.glass ? W - 40 - 56 : t.brutal ? W - 36 - 48 - 6 : W - (pin ? 64 : 48),
    // Pins: Split wird gestapelt (Foto oben, Text unten) → volle Breite
    split: pin ? W - 52 : W * 0.58 - 48,
    list: W - 48,
    dark: t.brutal ? W - 40 - 40 - 6 : W - 48,
    fullbleed: W - 48,
  };
  const baseHeadlineSize = { split: '1.5rem', list: '1.45rem', fullbleed: '1.6rem' }[layout] || t.headlineSize || '2.2rem';
  const pinBase = { fullbleed: '2.3rem', split: '2.1rem', list: '1.6rem' }[layout];
  const headlinePx = fitHeadlinePx({
    headline,
    accentWord,
    // Pins: Akzentwort wird fett in der Headline-Schrift und NICHT in
    // Versalien gesetzt (lange Komposita passen sonst nicht) → so messen
    t: pin ? { ...t, headlineWeight: pinHeadWeight, scriptFont: t.headlineFont, scriptStyle: 'normal', scriptWeight: pinBoldWeight } : t,
    minFactor: pin ? 0.4 : 0.5,
    basePx: toPx(pin && pinBase ? pinBase : baseHeadlineSize),
    maxWidth: textArea[layout] ?? W - 48,
    maxLines: layout === 'split' ? (pin ? 3 : 5) : layout === 'list' ? 3 : 4,
  });

  // overflowWrap als letztes Netz, falls eine Schrift beim Messen noch nicht geladen war
  const hl = { fontFamily: t.headlineFont, fontSize: headlinePx, fontWeight: pin ? pinHeadWeight : t.headlineWeight, fontStyle: t.headlineStyle || 'normal', textTransform: t.headlineTransform || 'none', lineHeight: 1.15, color: textColor, marginBottom: 12, overflowWrap: 'break-word' };
  // Pins: Fließtext muss lesbar sein (Classic hat #555 auch auf Dunkel)
  const bodyCol = isDark ? (t.body || 'rgba(255,255,255,0.6)') : (t.body || '#555');
  const pinBodyCol = (contrast(bodyCol, bg) ?? 5) < 4.5 ? (isDark ? 'rgba(255,255,255,0.8)' : '#444444') : bodyCol;
  const bd = { fontFamily: t.bodyFont, fontSize: (pin && toPx(t.bodySize || '0.65rem') < toPx('0.8rem')) ? '0.8rem' : (t.bodySize || '0.65rem'), fontWeight: pin ? Math.max(Number(t.bodyWeight) || 400, 400) : t.bodyWeight, fontStyle: t.bodyStyle || 'normal', lineHeight: 1.75, color: pin ? pinBodyCol : bodyCol };
  const al = { width: 28, height: 2, marginBottom: 14, background: t.accent, boxShadow: t.glow ? `0 0 8px ${t.accent}` : 'none' };
  const ft = { position: 'absolute', bottom: 0, left: 0, right: 0, padding: pin ? '12px 24px 22px' : '12px 24px', display: 'flex', justifyContent: 'space-between', zIndex: 5, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` };
  const ftx = pin
    ? { fontFamily: t.uiFont, fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.85)' : textColor }
    : { fontFamily: t.uiFont, fontSize: t.footerSize || '0.42rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.25)' : t.muted };
  const corner = t.brutal
    ? <div style={{ position: 'absolute', top: 0, right: 0, width: 70, height: 70, background: t.tertiary || t.accent, opacity: 0.15 }} />
    : <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderRight: `1.5px solid ${t.accent}`, borderTop: `1.5px solid ${t.accent}`, opacity: 0.3 }} />;
  const footer = <div style={ft}><span style={pin ? ftx : { ...ftx, color: t.accent, opacity: isDark ? 0.5 : 1 }}>sarahiver.com</span><span style={ftx}>{pageNum}</span></div>;

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
            <><HardShadow top={55} right={18} bottom={45} left={18} color={shadowColor(t.brutalShadow, '#0D0D0D')} />
            <div style={{ position: 'absolute', inset: '55px 18px 45px', background: '#fff', border: t.brutalBorder, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px', zIndex: 2 }}>
              <div style={{ ...al, background: t.accent }} /><div style={{ ...ey, color: t.accent }}>{eyebrow}</div><div style={{ ...hl, color: t.text }}>{renderHeadline('#FFFFFF')}</div><div style={{ ...bd, color: t.body }}>{bodyText}</div>
            </div></>
          ) : (
            <div style={{ position: 'absolute', inset: 0, padding: pin ? '70px 40px 40px 24px' : '70px 24px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }}>
              <div style={al} /><div style={ey}>{eyebrow}</div><div style={hl}>{renderHeadline()}</div><div style={bd}>{bodyText}</div>
            </div>
          )}{footer}</div>);
      case 'split':
        // Pins: Im Feed (~170 px) wäre die Textspalte nur ~100 px breit →
        // Foto oben, Text darunter über die volle Breite.
        if (pin) {
          return (<div style={{ background: bg, width: W, height: H, position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateRows: '50% minmax(0, 1fr)' }}>
            <div style={{ position: 'relative', overflow: 'hidden', background: '#1A1A1A' }}>
              {image ? <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: imageTone === 'bright' ? 1 : 0.92 }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #111, #333)' }} />}
              <div style={logo}>S&I.</div>
            </div>
            <div style={{ padding: '18px 26px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, overflowWrap: 'break-word', position: 'relative' }}>
              <div style={ey}>{eyebrow}</div><div style={hl}>{renderHeadline()}</div><div style={al} /><div style={bd}>{bodyText}</div>
            </div>
            <div style={{ ...ft, borderTop: 'none' }}><span style={{ ...ftx, fontSize: '0.55rem', fontWeight: 600, color: textColor }}>sarahiver.com</span><span style={ftx}>{pageNum}</span></div>
          </div>);
        }
        return (<div style={{ background: bg, width: W, height: H, position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '42% minmax(0, 1fr)' }}>
          <div style={{ background: t.alwaysDark ? bg : '#1A1A1A', position: 'relative', overflow: 'hidden' }}>
            {image ? <div style={{ width: '100%', height: '100%', backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', ...(imageTone === 'bright' ? { opacity: 1 } : { filter: 'grayscale(100%)', opacity: 0.8 }) }} />
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #111, #333)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: t.uiFont, fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bild</span></div>}
          </div>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, overflowWrap: 'break-word' }}>
            <div style={logo}>S&I.</div>
            <div style={{ ...ey, marginTop: 30 }}>{eyebrow}</div><div style={hl}>{renderHeadline()}</div><div style={al} /><div style={bd}>{bodyText}</div>
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
            <div style={{ ...hl, marginBottom: 18 }}>{renderHeadline()}</div>
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
          <div style={pin ? logo : { ...logo, ...(t.logoDarkStyle) }}>S&I.</div>{corner}
          {t.glow && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 70% 60%, ${t.secondary || t.accent}0F, transparent 60%)`, pointerEvents: 'none' }} />}
          {t.brutal ? <><HardShadow top={20} right={20} bottom={20} left={20} color={t.tertiary || '#FFE66D'} />
          <div style={{ position: 'absolute', inset: 20, background: t.accent, border: '3px solid #0D0D0D', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '50px 20px 20px', zIndex: 2 }}>
            <div style={{ ...hl, color: '#fff' }}>{renderHeadline(t.accent)}</div><div style={{ ...bd, color: 'rgba(255,255,255,0.8)' }}>{bodyText}</div></div></>
          : <div style={{ position: 'absolute', inset: 0, padding: '70px 24px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }}>
              <div style={{ ...ey, color: t.accent }}>{eyebrow}</div><div style={al} /><div style={{ ...hl, color: t.textDark || '#fff' }}>{renderHeadline()}</div><div style={bd}>{bodyText}</div></div>}
          {footer}</div>);
      case 'fullbleed': {
        // Pins: Foto in Farbe und hell, Verlauf nur hinter dem Text, Text
        // mit Abstand zum unteren Rand (dort liegen Pinterest-Icons).
        const imgStyle = pin
          ? { opacity: imageTone === 'bright' ? 1 : 0.88 }
          : (imageTone === 'bright' ? { opacity: 0.95 } : { filter: 'grayscale(100%)', opacity: 0.5 });
        const shade = pin
          ? 'linear-gradient(180deg, rgba(20,20,20,0.25) 0%, rgba(20,20,20,0) 18%, rgba(20,20,20,0) 38%, rgba(20,20,20,0.62) 58%, rgba(20,20,20,0.9) 100%)'
          : imageTone === 'bright'
            ? 'linear-gradient(180deg, rgba(26,26,26,0) 28%, rgba(26,26,26,0.7) 52%, rgba(26,26,26,0.92) 100%)'
            : 'linear-gradient(180deg, transparent 30%, rgba(26,26,26,0.85) 100%)';
        return (<div style={{ background: '#1A1A1A', width: W, height: H, position: 'relative', overflow: 'hidden' }}>
          <div style={{ ...logo, ...(pin ? {} : t.logoDarkStyle) }}>S&I.</div>
          {image ? <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', ...imgStyle }} />
            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a1a, #333)' }} />}
          <div style={{ position: 'absolute', inset: 0, background: shade }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: pin ? '24px 26px 44px' : 24, zIndex: 5 }}>
            <div style={pin ? { ...al, background: '#FDFCFA', width: 36 } : al} /><div style={{ ...hl, color: '#FDFCFA' }}>{renderHeadline('#1A1A1A')}</div>
            <div style={{ ...bd, color: pin ? 'rgba(253,252,250,0.88)' : 'rgba(253,252,250,0.6)', marginBottom: pin ? 14 : 10 }}>{bodyText}</div>
            <div style={pin
              ? { fontFamily: t.uiFont, fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FDFCFA' }
              : { fontFamily: t.uiFont, fontSize: '0.42rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: t.accent, opacity: 0.7 }}>sarahiver.com</div>
          </div></div>); }
      default: return null;
    }
  };
  return renderPost();
}
