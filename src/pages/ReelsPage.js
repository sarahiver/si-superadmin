// src/pages/ReelsPage.js
// S&I. Instagram Reels Generator — Canvas-basierte Video-Generierung
// Generiert MP4/WebM direkt zum Download, kein Screen Recording nötig
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Layout from '../components/Layout';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };

// ============================================
// REEL TEMPLATES
// ============================================
const TEMPLATES = {
  themeReveal: { name: 'Theme Reveal', desc: 'Theme-Name fliegt ein + Vorschau', duration: 6, icon: '🎨' },
  featureList: { name: 'Feature Reveal', desc: 'Features nacheinander', duration: 8, icon: '⚡' },
  vorstellung: { name: 'Vorstellung', desc: 'Wer sind wir — mit Foto', duration: 7, icon: '👋' },
  textStatement: { name: 'Text Statement', desc: 'Wort-für-Wort Animation (S/W)', duration: 5, icon: '💬' },
  countdown: { name: 'Countdown', desc: '3...2...1... + Reveal', duration: 6, icon: '🔥' },
  beforeAfter: { name: 'Vorher / Nachher', desc: 'Template vs S&I.', duration: 7, icon: '✨' },
};

// ============================================
// CANVAS REEL RENDERER
// Draws a single frame at time t (0 to duration)
// Canvas size: 1080×1920 (9:16)
// ============================================
const W = 1080;
const H = 1920;

function easeOut(t) { return 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3); }
function lerp(a, b, t) { return a + (b - a) * easeOut(t); }

function loadFonts() {
  // Ensure Google Fonts are loaded for canvas
  const families = [
    'Cormorant+Garamond:wght@300;400',
    'Mrs+Saint+Delafield',
    'Josefin+Sans:wght@300;400;600',
    'Oswald:wght@400;600;700',
    'Inter:wght@300;400;500;600',
  ];
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`;
    link.rel = 'stylesheet';
    link.onload = () => setTimeout(resolve, 300); // give fonts time to render
    link.onerror = resolve;
    document.head.appendChild(link);
    setTimeout(resolve, 2000); // fallback timeout
  });
}

function drawFrame(ctx, t, template, texts, bgImage) {
  const dur = TEMPLATES[template].duration;
  const phase = t;
  ctx.clearRect(0, 0, W, H);

  switch (template) {
    case 'themeReveal': drawThemeReveal(ctx, phase, texts, bgImage); break;
    case 'featureList': drawFeatureList(ctx, phase, texts); break;
    case 'vorstellung': drawVorstellung(ctx, phase, texts, bgImage); break;
    case 'textStatement': drawTextStatement(ctx, phase, texts); break;
    case 'countdown': drawCountdown(ctx, phase, texts, bgImage); break;
    case 'beforeAfter': drawBeforeAfter(ctx, phase, texts); break;
    default: drawThemeReveal(ctx, phase, texts, bgImage);
  }
}

// --- SHARED DRAW HELPERS ---
function drawBg(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

function drawLogo(ctx, phase, showAt, style = 'dark') {
  if (phase < showAt) return;
  const alpha = Math.min((phase - showAt) * 2, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (style === 'dark') {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(55, 60, 82, 36);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(55, 60, 82, 36);
    ctx.fillStyle = '#fff';
  } else {
    ctx.fillStyle = '#000';
    ctx.fillRect(55, 60, 82, 36);
    ctx.fillStyle = '#fff';
  }
  ctx.font = "600 18px 'Josefin Sans', sans-serif";
  ctx.letterSpacing = '-0.04em';
  ctx.fillText('S&I.', 70, 85);
  ctx.restore();
}

function drawUrl(ctx, phase, showAt) {
  if (phase < showAt) return;
  const alpha = Math.min((phase - showAt) * 2, 1);
  ctx.save();
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = '#fff';
  ctx.font = "400 12px 'Josefin Sans', sans-serif";
  ctx.letterSpacing = '0.15em';
  ctx.fillText('SIWEDDING.COM', 60, H - 55);
  ctx.restore();
}

function drawEyebrow(ctx, phase, showAt, text, y, color) {
  if (phase < showAt) return;
  const p = Math.min((phase - showAt) * 2, 1);
  const offsetY = lerp(30, 0, p);
  ctx.save();
  ctx.globalAlpha = easeOut(p);
  ctx.fillStyle = color || 'rgba(255,255,255,0.5)';
  ctx.font = "600 14px 'Inter', sans-serif";
  ctx.letterSpacing = '0.3em';
  ctx.fillText(text.toUpperCase(), 72, y + offsetY);
  ctx.restore();
}

function drawHeadline(ctx, phase, showAt, text, y, size, color) {
  if (phase < showAt) return;
  const p = Math.min((phase - showAt) / 0.7, 1);
  const offsetY = lerp(50, 0, p);
  ctx.save();
  ctx.globalAlpha = easeOut(p);
  ctx.fillStyle = color || '#fff';
  ctx.font = `300 ${size || 68}px 'Cormorant Garamond', serif`;
  // Word wrap
  const words = text.split(' ');
  let line = '';
  let lineY = y + offsetY;
  const maxW = W - 144;
  words.forEach(word => {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), 72, lineY);
      line = word + ' ';
      lineY += size ? size * 1.2 : 82;
    } else {
      line = test;
    }
  });
  ctx.fillText(line.trim(), 72, lineY);
  ctx.restore();
  return lineY;
}

function drawAccent(ctx, phase, showAt, text, y) {
  if (phase < showAt) return;
  const p = Math.min((phase - showAt) / 0.5, 1);
  const offsetY = lerp(25, 0, p);
  ctx.save();
  ctx.globalAlpha = easeOut(p);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = "400 72px 'Mrs Saint Delafield', cursive";
  ctx.fillText(text, 72, y + offsetY);
  ctx.restore();
}

function drawLine(ctx, phase, showAt, y) {
  if (phase < showAt) return;
  const p = Math.min((phase - showAt) / 0.5, 1);
  const w = lerp(0, 90, p);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(72, y, w, 3);
  ctx.restore();
}

function drawBody(ctx, phase, showAt, text, y, color) {
  if (phase < showAt) return;
  const p = Math.min((phase - showAt) / 0.5, 1);
  const offsetY = lerp(20, 0, p);
  ctx.save();
  ctx.globalAlpha = easeOut(p);
  ctx.fillStyle = color || 'rgba(255,255,255,0.5)';
  ctx.font = "300 16px 'Josefin Sans', sans-serif";
  // Word wrap
  const words = text.split(' ');
  let line = '';
  let lineY = y + offsetY;
  words.forEach(word => {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > W - 180 && line) {
      ctx.fillText(line.trim(), 72, lineY);
      line = word + ' ';
      lineY += 28;
    } else {
      line = test;
    }
  });
  ctx.fillText(line.trim(), 72, lineY);
  ctx.restore();
}

// --- TEMPLATE RENDERERS ---
function drawThemeReveal(ctx, phase, texts, bgImage) {
  drawBg(ctx, '#000');
  if (bgImage && phase > 1.5) {
    ctx.save();
    ctx.globalAlpha = Math.min((phase - 1.5) * 0.15, 0.3);
    ctx.filter = 'grayscale(100%)';
    ctx.drawImage(bgImage, 0, 0, W, H);
    ctx.filter = 'none';
    ctx.restore();
  }
  drawLogo(ctx, phase, 0.3, 'dark');
  const cy = H * 0.42;
  drawEyebrow(ctx, phase, 0.8, texts.eyebrow, cy);
  const headEnd = drawHeadline(ctx, phase, 1.2, texts.line1, cy + 50, 68);
  drawAccent(ctx, phase, 2, texts.accent, (headEnd || cy + 130) + 40);
  drawLine(ctx, phase, 3, (headEnd || cy + 130) + 80);
  drawBody(ctx, phase, 3.5, texts.body, (headEnd || cy + 130) + 110);
  drawUrl(ctx, phase, 4.5);
}

function drawFeatureList(ctx, phase, texts) {
  drawBg(ctx, '#000');
  drawLogo(ctx, phase, 0.3, 'dark');
  drawEyebrow(ctx, phase, 0.5, texts.eyebrow, H * 0.3);
  drawHeadline(ctx, phase, 0.8, texts.line1, H * 0.3 + 50, 52);
  const items = (texts.items || '').split('\n').filter(Boolean);
  const startY = H * 0.3 + 180;
  items.forEach((item, i) => {
    const at = 1.5 + i * 0.7;
    if (phase < at) return;
    const p = Math.min((phase - at) / 0.5, 1);
    const offsetX = lerp(-40, 0, p);
    const [title, desc] = item.split('|');
    ctx.save();
    ctx.globalAlpha = easeOut(p);
    // Dash
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(72 + offsetX, startY + i * 70 + 8, 36, 3);
    // Title
    ctx.fillStyle = '#fff';
    ctx.font = "600 18px 'Josefin Sans', sans-serif";
    ctx.fillText(title, 120 + offsetX, startY + i * 70 + 14);
    // Desc
    if (desc) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = "300 14px 'Josefin Sans', sans-serif";
      ctx.fillText(desc, 120 + offsetX, startY + i * 70 + 38);
    }
    // Border
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(72, startY + i * 70 + 55, W - 144, 1);
    ctx.restore();
  });
  drawUrl(ctx, phase, 6);
}

function drawVorstellung(ctx, phase, texts, bgImage) {
  drawBg(ctx, '#000');
  // Top half: image
  if (phase > 0.5) {
    const alpha = Math.min((phase - 0.5) * 0.8, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (bgImage) {
      ctx.filter = 'grayscale(100%)';
      ctx.drawImage(bgImage, 0, 0, W, H * 0.5);
      ctx.filter = 'none';
    } else {
      const grd = ctx.createLinearGradient(0, 0, W, H * 0.5);
      grd.addColorStop(0, '#111'); grd.addColorStop(1, '#333');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H * 0.5);
    }
    // Gradient overlay
    const grad = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.5);
    grad.addColorStop(0, 'transparent'); grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H * 0.3, W, H * 0.2);
    ctx.restore();
  }
  // White logo on image
  if (phase > 0.3) {
    ctx.save();
    ctx.globalAlpha = Math.min((phase - 0.3) * 2, 1);
    ctx.fillStyle = '#fff';
    ctx.fillRect(55, 60, 82, 36);
    ctx.fillStyle = '#000';
    ctx.font = "600 18px 'Josefin Sans', sans-serif";
    ctx.fillText('S&I.', 70, 85);
    ctx.restore();
  }
  const by = H * 0.55;
  drawEyebrow(ctx, phase, 1.5, texts.eyebrow, by);
  const headEnd = drawHeadline(ctx, phase, 2, texts.line1, by + 45, 56);
  drawAccent(ctx, phase, 2.8, texts.accent, (headEnd || by + 120) + 35);
  drawLine(ctx, phase, 3.5, (headEnd || by + 120) + 75);
  drawBody(ctx, phase, 4, texts.body, (headEnd || by + 120) + 105);
  drawUrl(ctx, phase, 5.5);
}

function drawTextStatement(ctx, phase, texts) {
  drawBg(ctx, '#fff');
  // Black logo
  if (phase > 0.2) {
    ctx.save();
    ctx.globalAlpha = Math.min((phase - 0.2) * 3, 1);
    ctx.fillStyle = '#000';
    ctx.fillRect(55, 60, 82, 36);
    ctx.fillStyle = '#fff';
    ctx.font = "600 18px 'Josefin Sans', sans-serif";
    ctx.fillText('S&I.', 70, 85);
    ctx.restore();
  }
  // Word by word
  const words = (texts.line1 || '').split(' ');
  let x = 80;
  let y = H * 0.4;
  const maxW = W - 160;
  words.forEach((word, i) => {
    const at = 0.5 + i * 0.35;
    if (phase < at) return;
    const p = Math.min((phase - at) / 0.3, 1);
    const offsetY = lerp(30, 0, p);
    const isAccent = word.replace(/[.,!?]/g, '') === texts.accent;
    ctx.save();
    ctx.globalAlpha = easeOut(p);
    ctx.fillStyle = '#000';
    if (isAccent) {
      ctx.font = "400 88px 'Mrs Saint Delafield', cursive";
    } else {
      ctx.font = "300 72px 'Cormorant Garamond', serif";
    }
    const ww = ctx.measureText(word + ' ').width;
    if (x + ww > maxW + 80) {
      x = 80;
      y += isAccent ? 95 : 85;
    }
    ctx.fillText(word, x, y + offsetY);
    ctx.restore();
    x += ww;
  });
  // Line
  if (phase > 3) {
    const lw = lerp(0, 100, Math.min((phase - 3) / 0.4, 1));
    ctx.fillStyle = '#000';
    ctx.fillRect(80, y + 50, lw, 4);
  }
  // Body
  if (phase > 3.5) {
    drawBody(ctx, phase, 3.5, texts.body, y + 80, '#666');
  }
  // URL
  if (phase > 4) {
    ctx.save();
    ctx.globalAlpha = Math.min((phase - 4) * 2, 1) * 0.4;
    ctx.fillStyle = '#999';
    ctx.font = "400 12px 'Josefin Sans', sans-serif";
    ctx.fillText('SIWEDDING.COM', 60, H - 55);
    ctx.restore();
  }
}

function drawCountdown(ctx, phase, texts, bgImage) {
  drawBg(ctx, '#000');
  // Countdown numbers
  if (phase < 3) {
    const num = phase < 1 ? '3' : phase < 2 ? '2' : '1';
    const localPhase = phase % 1;
    const scale = localPhase < 0.2 ? lerp(3, 1, localPhase / 0.2) : 1;
    const alpha = localPhase < 0.2 ? lerp(0, 1, localPhase / 0.2) : localPhase > 0.8 ? lerp(1, 0, (localPhase - 0.8) / 0.2) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.font = "700 160px 'Oswald', sans-serif";
    ctx.textAlign = 'center';
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.fillText(num, 0, 50);
    ctx.restore();
  }
  // Reveal
  if (phase >= 3) {
    if (bgImage) {
      ctx.save();
      ctx.globalAlpha = Math.min((phase - 3) * 0.3, 0.25);
      ctx.filter = 'grayscale(100%)';
      ctx.drawImage(bgImage, 0, 0, W, H);
      ctx.filter = 'none';
      ctx.restore();
    }
    drawLogo(ctx, phase, 3.3, 'dark');
    const cy = H * 0.4;
    const headEnd = drawHeadline(ctx, phase, 3.3, texts.line1, cy, 64);
    drawAccent(ctx, phase, 3.8, texts.accent, (headEnd || cy + 80) + 35);
    drawLine(ctx, phase, 4.3, (headEnd || cy + 80) + 75);
    drawBody(ctx, phase, 4.8, texts.body, (headEnd || cy + 80) + 105);
    drawUrl(ctx, phase, 5);
  }
}

function drawBeforeAfter(ctx, phase, texts) {
  if (phase < 3.5) {
    // BEFORE: boring template
    drawBg(ctx, '#f0f0f0');
    const alpha = Math.min(phase * 2, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    // Label
    ctx.fillStyle = '#999';
    ctx.font = "400 16px Arial, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('STANDARD WEBSITE-BAUKÄSTEN', W / 2, H * 0.25);
    // Fake template card
    const cx = W / 2 - 150;
    const cy = H * 0.3;
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx, cy, 300, 400);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, cy, 300, 400);
    ctx.fillStyle = '#eee';
    ctx.fillRect(cx + 20, cy + 20, 260, 100);
    ctx.fillStyle = '#ccc';
    ctx.font = "400 18px Arial";
    ctx.fillText('Template #47382', W / 2, cy + 155);
    ctx.fillStyle = '#eee';
    ctx.fillRect(cx + 50, cy + 175, 200, 10);
    ctx.fillRect(cx + 70, cy + 200, 160, 10);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(cx + 90, cy + 240, 120, 35);
    ctx.fillStyle = '#bbb';
    ctx.font = "400 12px Arial";
    ctx.fillText('RSVP?', W / 2, cy + 263);
    ctx.restore();
    // Judgement text
    if (phase > 1.5) {
      ctx.save();
      ctx.globalAlpha = Math.min((phase - 1.5) * 2, 1);
      ctx.fillStyle = '#aaa';
      ctx.font = "700 42px 'Oswald', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('Sieht aus wie alle', W / 2, H * 0.7);
      ctx.fillText('anderen.', W / 2, H * 0.7 + 50);
      ctx.restore();
    }
    if (phase > 2.5) {
      ctx.save();
      ctx.globalAlpha = Math.min((phase - 2.5) * 2, 1);
      ctx.fillStyle = colors.red;
      ctx.font = "600 24px 'Oswald', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('ABER EURE LIEBE IST NICHT 08/15.', W / 2, H * 0.82);
      ctx.restore();
    }
    ctx.textAlign = 'start';
  } else {
    // AFTER: S&I style
    drawBg(ctx, '#000');
    drawLogo(ctx, phase, 3.8, 'dark');
    const cy = H * 0.38;
    drawEyebrow(ctx, phase, 4, texts.eyebrow, cy);
    const headEnd = drawHeadline(ctx, phase, 4.3, texts.line1, cy + 45, 60);
    drawAccent(ctx, phase, 4.8, texts.accent, (headEnd || cy + 120) + 35);
    drawLine(ctx, phase, 5.3, (headEnd || cy + 120) + 75);
    drawBody(ctx, phase, 5.5, texts.body, (headEnd || cy + 120) + 105);
    drawUrl(ctx, phase, 6);
  }
}

// ============================================
// STYLED COMPONENTS
// ============================================
const PageHeader = styled.div`margin-bottom: 2rem; h1 { font-family: 'Oswald', sans-serif; font-size: 2rem; font-weight: 700; text-transform: uppercase; color: ${colors.black}; margin-bottom: 0.25rem; } p { font-family: 'Source Serif 4', serif; font-style: italic; color: ${colors.gray}; font-size: 1rem; }`;
const Grid = styled.div`display: grid; grid-template-columns: 1fr 320px; gap: 2rem; align-items: start; @media (max-width: 1024px) { grid-template-columns: 1fr; }`;
const Panel = styled.div`background: #fff; border: 1px solid ${colors.lightGray}; padding: 1.5rem; margin-bottom: 0.75rem;`;
const SectionLabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.gray}; margin-bottom: 0.75rem;`;
const Label = styled.label`font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: ${colors.gray}; display: block; margin-bottom: 0.25rem;`;
const Input = styled.input`width: 100%; padding: 0.65rem 0.75rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.85rem; background: #fff; outline: none; &:focus { border-color: ${colors.red}; }`;
const Textarea = styled.textarea`width: 100%; padding: 0.65rem 0.75rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.85rem; background: #fff; resize: vertical; outline: none; &:focus { border-color: ${colors.red}; }`;
const Field = styled.div`margin-bottom: 0.75rem;`;
const TemplateGrid = styled.div`display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 1rem;`;
const TemplateBtn = styled.button`font-family: 'Inter', sans-serif; font-size: 0.7rem; padding: 0.75rem; cursor: pointer; text-align: left; border: 1px solid ${p => p.$active ? colors.black : colors.lightGray}; background: ${p => p.$active ? colors.black : '#fff'}; color: ${p => p.$active ? '#fff' : colors.black}; transition: all 0.15s; &:hover { border-color: ${colors.black}; } .name { font-weight: 600; display: block; } .desc { font-size: 0.55rem; opacity: 0.6; margin-top: 2px; display: block; }`;
const GenButton = styled.button`font-family: 'Oswald', sans-serif; font-size: 0.9rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 1rem 2rem; cursor: pointer; border: none; width: 100%; background: ${p => p.$active ? '#10B981' : colors.red}; color: #fff; transition: all 0.2s; &:hover { opacity: 0.9; } &:disabled { background: ${colors.gray}; cursor: wait; }`;
const PreviewBtn = styled.button`font-family: 'Oswald', sans-serif; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.7rem 1.5rem; cursor: pointer; border: 2px solid ${colors.black}; background: transparent; color: ${colors.black}; width: 100%; margin-bottom: 0.5rem; transition: all 0.2s; &:hover { background: ${colors.black}; color: #fff; }`;
const PreviewSticky = styled.div`position: sticky; top: 80px; @media (max-width: 1024px) { position: static; order: -1; }`;
const PreviewLabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; color: ${colors.gray}; text-align: center; margin-bottom: 0.5rem;`;
const ProgressBar = styled.div`height: 3px; background: ${colors.lightGray}; margin-top: 0.5rem; overflow: hidden; div { height: 100%; background: ${colors.red}; transition: width 0.05s linear; }`;
const Hint = styled.p`font-size: 0.65rem; color: ${colors.gray}; margin-top: 0.5rem; line-height: 1.6;`;
const FileLabel = styled.label`display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid ${colors.lightGray}; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 0.75rem; &:hover { border-color: ${colors.black}; } input { display: none; }`;
const StatusMsg = styled.div`font-family: 'Inter', sans-serif; font-size: 0.75rem; color: ${p => p.$error ? colors.red : '#10B981'}; margin-top: 0.5rem; font-weight: 500;`;

// ============================================
// MAIN COMPONENT
// ============================================
export default function ReelsPage() {
  const [template, setTemplate] = useState('themeReveal');
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [image, setImage] = useState(null);
  const [bgImage, setBgImage] = useState(null); // HTMLImageElement for canvas
  const [texts, setTexts] = useState({
    eyebrow: 'S&I. Wedding',
    line1: 'Eure Hochzeit verdient mehr als ein Template.',
    accent: 'Hochzeit',
    body: 'Handgemachte Hochzeitswebsites aus Hamburg. Mit Liebe zum Detail.',
    items: 'Eigene Domain|yourwedding.com\nRSVP System|Zusagen & Absagen\nLove Story|Eure Geschichte\nFoto Upload|Gäste laden hoch\nCountdown|Bis zum großen Tag\nMusik-Wünsche|Für die Party',
  });

  const previewCanvasRef = useRef(null);
  const animRef = useRef(null);

  const tmpl = TEMPLATES[template];
  const duration = tmpl.duration;

  // Load image for canvas
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target.result);
        const img = new Image();
        img.onload = () => setBgImage(img);
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Preview animation on small canvas
  const startPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    setPreviewing(true);
    setProgress(0);
    const start = Date.now();

    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const t = Math.min(elapsed, duration);
      setProgress(t / duration);
      drawFrame(ctx, t, template, texts, bgImage);
      if (elapsed < duration) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setPreviewing(false);
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, [template, texts, bgImage, duration]);

  // Stop preview
  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // Draw initial frame
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawFrame(ctx, 0.01, template, texts, bgImage);
  }, [template, texts, bgImage]);

  // Generate video file
  const generateVideo = useCallback(async () => {
    setGenerating(true);
    setStatus('Fonts laden...');
    await loadFonts();

    setStatus('Video generieren...');
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const fps = 30;
    const totalFrames = Math.ceil(duration * fps);

    // Check if MediaRecorder supports webm
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `si-reel-${template}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setGenerating(false);
      setStatus('✅ Video heruntergeladen!');
      setTimeout(() => setStatus(''), 5000);
    };

    recorder.start();

    // Render all frames
    let frame = 0;
    const renderNextFrame = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }
      const t = (frame / totalFrames) * duration;
      drawFrame(ctx, t, template, texts, bgImage);
      setProgress(frame / totalFrames);
      frame++;
      // Use setTimeout to not block the UI
      setTimeout(renderNextFrame, 1000 / fps);
    };

    renderNextFrame();
  }, [template, texts, bgImage, duration]);

  return (
    <Layout>
      <PageHeader>
        <h1>Reels</h1>
        <p>Animierte Instagram Reels — Template wählen, Video generieren, herunterladen</p>
      </PageHeader>

      <Grid>
        <div>
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
                  <button onClick={() => { setImage(null); setBgImage(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.red, fontSize: '0.8rem' }}>✕</button>
                </>}
              </div>
            </Field>
          </Panel>

          <Panel>
            <SectionLabel>Generieren</SectionLabel>
            <PreviewBtn onClick={startPreview} disabled={previewing}>
              {previewing ? `▶ Läuft... ${Math.ceil(progress * duration)}s / ${duration}s` : `▶ Preview abspielen (${duration}s)`}
            </PreviewBtn>
            <GenButton onClick={generateVideo} disabled={generating}>
              {generating ? `⏳ Generiere... ${Math.round(progress * 100)}%` : `⬇ Video generieren & downloaden`}
            </GenButton>
            <ProgressBar><div style={{ width: `${progress * 100}%` }} /></ProgressBar>
            {status && <StatusMsg $error={status.includes('Fehler')}>{status}</StatusMsg>}
          </Panel>

          <Hint>
            Das Video wird als WebM-Datei heruntergeladen (1080×1920, 9:16).
            Du kannst es direkt in Instagram als Reel hochladen.
            Falls Instagram WebM nicht akzeptiert, konvertiere es kostenlos auf cloudconvert.com zu MP4.
          </Hint>
        </div>

        <PreviewSticky>
          <PreviewLabel>Preview (9:16)</PreviewLabel>
          <canvas
            ref={previewCanvasRef}
            width={W}
            height={H}
            style={{ width: 270, height: 480, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
          />
          <ProgressBar><div style={{ width: `${progress * 100}%` }} /></ProgressBar>
        </PreviewSticky>
      </Grid>
    </Layout>
  );
}
