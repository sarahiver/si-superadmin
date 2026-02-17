// src/lib/reelRenderer.js
// Canvas 2D Rendering Engine for Reels — slide-based, animated, theme-aware
// Renders 1080x1920 (9:16) frames for preview and export

import { THEMES } from './reelThemes';

const W = 1080, H = 1920;

// ============================================
// EASING & MATH
// ============================================
function easeOut(t) { return 1 - Math.pow(1 - clamp01(t), 3); }
function easeInOut(t) { const c = clamp01(t); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; }
function clamp01(t) { return Math.min(Math.max(t, 0), 1); }
function lerp(a, b, t) { return a + (b - a) * t; }

// ============================================
// COVER-FIT IMAGE DRAWING (no distortion)
// ============================================
function drawImageCover(ctx, source, dx, dy, dw, dh) {
  const sw = source.videoWidth || source.naturalWidth || source.width || dw;
  const sh = source.videoHeight || source.naturalHeight || source.height || dh;
  if (!sw || !sh) { ctx.drawImage(source, dx, dy, dw, dh); return; }

  const srcRatio = sw / sh;
  const dstRatio = dw / dh;
  let sx, sy, cropW, cropH;

  if (srcRatio > dstRatio) {
    cropH = sh;
    cropW = sh * dstRatio;
    sx = (sw - cropW) / 2;
    sy = 0;
  } else {
    cropW = sw;
    cropH = sw / dstRatio;
    sx = 0;
    sy = (sh - cropH) / 2;
  }

  ctx.drawImage(source, sx, sy, cropW, cropH, dx, dy, dw, dh);
}

// ============================================
// ANIMATION FUNCTIONS
// ============================================
const ANIMATIONS = {
  fadeUp: (progress) => ({ alpha: easeOut(progress), offsetX: 0, offsetY: lerp(60, 0, easeOut(progress)), scale: 1 }),
  fadeIn: (progress) => ({ alpha: easeOut(progress), offsetX: 0, offsetY: 0, scale: 1 }),
  slideRight: (progress) => ({ alpha: easeOut(progress), offsetX: lerp(-80, 0, easeOut(progress)), offsetY: 0, scale: 1 }),
  scaleIn: (progress) => ({ alpha: easeOut(progress), offsetX: 0, offsetY: 0, scale: lerp(0.7, 1, easeOut(progress)) }),
};

// ============================================
// ROUNDED RECT HELPER
// ============================================
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ============================================
// TEXT BACKGROUND BOX (for readability on images)
// ============================================
function drawTextBg(ctx, x, y, textWidth, fontSize, pad = 20) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.50)';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  roundRect(ctx, x - pad, y - fontSize * 0.88 - pad * 0.3, textWidth + pad * 2, fontSize * 1.15 + pad * 0.6, 10);
  ctx.fill();
  ctx.restore();
}

function drawMultilineBg(ctx, x, y, lines, lineHeight, fontSize, pad = 22) {
  if (!lines.length) return;
  const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
  const totalH = lines.length * lineHeight;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.50)';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  roundRect(ctx, x - pad, y - fontSize * 0.88 - pad * 0.3, maxW + pad * 2, totalH + pad * 0.6, 10);
  ctx.fill();
  ctx.restore();
}

// ============================================
// TEXT WRAPPING (with newline + word-wrap)
// ============================================
function getWrappedLines(ctx, text, maxWidth) {
  const paragraphs = text.split('\n');
  const allLines = [];
  paragraphs.forEach(para => {
    if (!para.trim()) { allLines.push(''); return; }
    const words = para.split(' ');
    let line = '';
    words.forEach(word => {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxWidth && line) {
        allLines.push(line.trim());
        line = word + ' ';
      } else {
        line = test;
      }
    });
    allLines.push(line.trim());
  });
  return allLines;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, opts = {}) {
  const lines = getWrappedLines(ctx, text, maxWidth);
  const fontSize = opts.fontSize || lineHeight * 0.7;

  if (opts.drawBg && lines.length > 0) {
    drawMultilineBg(ctx, x, y, lines, lineHeight, fontSize);
  }

  lines.forEach((line, i) => {
    if (line) ctx.fillText(line, x, y + i * lineHeight);
  });

  return lines.length * lineHeight;
}

// ============================================
// APPLY IMAGE-BG TEXT STYLE (shadow + light color)
// ============================================
function applyImageBgShadow(ctx) {
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
}

// ============================================
// THEME-SPECIFIC DECORATIONS
// ============================================
function drawDecorations(ctx, t) {
  if (!t.brutal && !t.glass) {
    ctx.save();
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(W - 100, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 100);
    ctx.stroke();
    ctx.restore();
  }
  if (t.glow) {
    ctx.save();
    const grad = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.8);
    grad.addColorStop(0, (t.accent || '#00ffff') + '18');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (t.glass) {
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, 'rgba(45,90,60,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// ============================================
// DRAW LOGO
// ============================================
function drawLogo(ctx, t, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const logoX = 72, logoY = 80;
  const text = 'S&I.';
  const style = t.logoDarkStyle || t.logoStyle;

  ctx.font = `600 42px ${t.uiFont}`;
  const metrics = ctx.measureText(text);
  const padX = 22, padY = 14;
  const boxW = metrics.width + padX * 2;
  const boxH = 42 + padY * 2;

  if (style.background && style.background !== 'transparent') {
    ctx.fillStyle = style.background;
    if (style.borderRadius) {
      roundRect(ctx, logoX - padX, logoY - padY - 6, boxW, boxH, parseInt(style.borderRadius) || 0);
      ctx.fill();
    } else {
      ctx.fillRect(logoX - padX, logoY - padY - 6, boxW, boxH);
    }
  }
  if (style.border) {
    const borderMatch = style.border.match(/(\d+)px\s+solid\s+(.+)/);
    if (borderMatch) {
      ctx.strokeStyle = borderMatch[2];
      ctx.lineWidth = parseInt(borderMatch[1]);
      if (style.borderRadius) {
        roundRect(ctx, logoX - padX, logoY - padY - 6, boxW, boxH, parseInt(style.borderRadius) || 0);
        ctx.stroke();
      } else {
        ctx.strokeRect(logoX - padX, logoY - padY - 6, boxW, boxH);
      }
    }
  }
  ctx.fillStyle = style.color || '#fff';
  ctx.font = `600 42px ${t.uiFont}`;
  ctx.fillText(text, logoX, logoY + 26);
  ctx.restore();
}

// ============================================
// DRAW DIVIDER LINE
// ============================================
function drawDivider(ctx, t, x, y, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = t.accent;
  ctx.fillRect(x, y, 70, 4);
  if (t.glow) {
    ctx.shadowColor = t.accent;
    ctx.shadowBlur = 12;
    ctx.fillRect(x, y, 70, 4);
  }
  ctx.restore();
}

// ============================================
// DRAW FOOTER
// ============================================
function drawFooter(ctx, t, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.4;
  ctx.fillStyle = t.alwaysDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  ctx.fillRect(0, H - 90, W, 1);
  ctx.font = `400 26px ${t.uiFont}`;
  ctx.fillStyle = t.accent;
  ctx.globalAlpha = alpha * 0.5;
  ctx.fillText('siwedding.com', 72, H - 40);
  ctx.restore();
}

// ============================================
// DRAW A SINGLE ELEMENT
// ============================================
function drawElement(ctx, element, t, slideLocalTime, opts = {}) {
  const delay = element.delay || 0;
  const animDur = element.animDuration || 0.5;
  const elapsed = slideLocalTime - delay;
  if (elapsed < 0) return;

  const progress = clamp01(elapsed / animDur);
  const animFn = ANIMATIONS[element.animation || 'fadeUp'] || ANIMATIONS.fadeUp;
  const anim = animFn(progress);

  const x = (element.xPercent || 0.067) * W;
  const y = (element.yPercent || 0.5) * H;

  ctx.save();
  ctx.globalAlpha = anim.alpha;

  const drawX = x + anim.offsetX;
  const drawY = y + anim.offsetY;
  const ib = opts.hasImageBg; // shorthand

  if (anim.scale !== 1) {
    ctx.translate(drawX, drawY);
    ctx.scale(anim.scale, anim.scale);
    ctx.translate(-drawX, -drawY);
  }

  switch (element.type) {
    case 'logo':
      drawLogo(ctx, t, anim.alpha);
      break;

    case 'divider':
      drawDivider(ctx, t, drawX, drawY, anim.alpha);
      break;

    case 'footer':
      drawFooter(ctx, t, anim.alpha);
      break;

    case 'eyebrow': {
      const size = 34;
      ctx.font = `${t.brutal ? 700 : 600} ${size}px ${t.uiFont}`;
      const text = (element.text || '').toUpperCase();

      if (ib) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        const m = ctx.measureText(text);
        drawTextBg(ctx, drawX, drawY, m.width, size);
        applyImageBgShadow(ctx);
        ctx.font = `${t.brutal ? 700 : 600} ${size}px ${t.uiFont}`;
      } else {
        ctx.fillStyle = t.accent;
        if (t.glow) { ctx.shadowColor = t.accent; ctx.shadowBlur = 15; }
      }
      ctx.fillText(text, drawX, drawY);
      break;
    }

    case 'headline': {
      const size = element.fontSize || 120;
      ctx.font = `${t.headlineWeight} ${size}px ${t.headlineFont}`;
      if (t.headlineStyle) ctx.font = `${t.headlineStyle} ${ctx.font}`;
      const rawText = element.text || '';
      const text = t.headlineTransform === 'uppercase' ? rawText.toUpperCase() : rawText;
      const maxW = W - 144;

      if (ib) {
        ctx.fillStyle = '#ffffff';
        // Pre-calculate lines for bg box
        const lines = getWrappedLines(ctx, text, maxW);
        drawMultilineBg(ctx, drawX, drawY, lines, size * 1.15, size);
        applyImageBgShadow(ctx);
        ctx.font = `${t.headlineWeight} ${size}px ${t.headlineFont}`;
        if (t.headlineStyle) ctx.font = `${t.headlineStyle} ${ctx.font}`;
      } else {
        ctx.fillStyle = t.textDark || t.text;
      }
      drawWrappedText(ctx, text, drawX, drawY, maxW, size * 1.15, { fontSize: size });
      break;
    }

    case 'accentWord': {
      const size = element.fontSize || 130;
      const font = t.scriptFont || t.headlineFont;
      const style = t.scriptStyle || 'normal';
      ctx.font = `${style} 400 ${size}px ${font}`;
      const text = element.text || '';

      if (ib) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        const m = ctx.measureText(text);
        drawTextBg(ctx, drawX, drawY, m.width, size);
        applyImageBgShadow(ctx);
        ctx.font = `${style} 400 ${size}px ${font}`;
      } else {
        ctx.fillStyle = t.accent;
        if (t.glow) { ctx.shadowColor = t.secondary || t.accent; ctx.shadowBlur = 20; }
      }
      ctx.fillText(text, drawX, drawY);
      break;
    }

    case 'body': {
      const size = element.fontSize || 38;
      ctx.font = `${t.bodyWeight} ${size}px ${t.bodyFont}`;
      if (t.bodyStyle) ctx.font = `${t.bodyStyle} ${ctx.font}`;
      const text = element.text || '';
      const maxW = W - 144;

      if (ib) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        const lines = getWrappedLines(ctx, text, maxW);
        drawMultilineBg(ctx, drawX, drawY, lines, size * 1.7, size);
        applyImageBgShadow(ctx);
        ctx.font = `${t.bodyWeight} ${size}px ${t.bodyFont}`;
        if (t.bodyStyle) ctx.font = `${t.bodyStyle} ${ctx.font}`;
      } else {
        ctx.fillStyle = t.body;
      }
      drawWrappedText(ctx, text, drawX, drawY, maxW, size * 1.7, { fontSize: size });
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

// ============================================
// DRAW A FULL SLIDE
// ============================================
function drawSlide(ctx, slide, t, slideLocalTime, alpha, opts = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // Determine if there's an image background (global or per-slide)
  const hasImageBg = (slide.backgroundType === 'image' && slide._bgImage) || opts.hasGlobalBg;

  // Background: per-slide image > global bg (already drawn) > solid theme color
  if (slide.backgroundType === 'image' && slide._bgImage) {
    drawImageCover(ctx, slide._bgImage, 0, 0, W, H);
    ctx.fillStyle = `rgba(0,0,0,${slide.backgroundDarken || 0.4})`;
    ctx.fillRect(0, 0, W, H);
  } else if (opts.hasGlobalBg) {
    ctx.fillStyle = `rgba(0,0,0,${slide.backgroundDarken ?? opts.globalBgDarken ?? 0.4})`;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = t.bgDark || t.bg;
    ctx.fillRect(0, 0, W, H);
  }

  drawDecorations(ctx, t);

  (slide.elements || []).forEach(el => {
    drawElement(ctx, el, t, slideLocalTime, { hasImageBg });
  });

  ctx.restore();
}

// ============================================
// MAIN RENDER FUNCTION
// ============================================
export function renderFrame(ctx, reelData, globalTime) {
  const t = THEMES[reelData.themeId] || THEMES.classic;

  let accTime = 0;
  let currentSlideIdx = -1;
  let slideLocalTime = 0;
  let transitionProgress = -1;

  for (let i = 0; i < reelData.slides.length; i++) {
    const slide = reelData.slides[i];
    const dur = slide.duration || 4;
    const transDur = slide.transitionDuration || 0.5;
    if (globalTime >= accTime && globalTime < accTime + dur) {
      currentSlideIdx = i;
      slideLocalTime = globalTime - accTime;
      if (i > 0 && slide.transitionIn !== 'none' && slideLocalTime < transDur) {
        transitionProgress = slideLocalTime / transDur;
      }
      break;
    }
    accTime += dur;
  }

  if (currentSlideIdx === -1) {
    currentSlideIdx = reelData.slides.length - 1;
    const lastSlide = reelData.slides[currentSlideIdx];
    slideLocalTime = (lastSlide && lastSlide.duration) || 4;
  }

  ctx.clearRect(0, 0, W, H);

  // Draw global background (cover-fit, no distortion)
  const globalBgEl = reelData.globalBgElement;
  const hasGlobalBg = !!globalBgEl;
  if (globalBgEl) {
    try { drawImageCover(ctx, globalBgEl, 0, 0, W, H); } catch (e) { /* not ready */ }
  }

  const slideOpts = { hasGlobalBg, globalBgDarken: reelData.globalBgDarken };
  const currentSlide = reelData.slides[currentSlideIdx];
  if (!currentSlide) return;

  if (transitionProgress >= 0 && currentSlideIdx > 0) {
    const prevSlide = reelData.slides[currentSlideIdx - 1];
    const prevDur = prevSlide.duration || 4;
    const alpha = easeInOut(transitionProgress);
    drawSlide(ctx, prevSlide, t, prevDur, 1 - alpha, slideOpts);
    drawSlide(ctx, currentSlide, t, slideLocalTime, alpha, slideOpts);
  } else {
    drawSlide(ctx, currentSlide, t, slideLocalTime, 1, slideOpts);
  }
}

export function getTotalDuration(slides) {
  return slides.reduce((acc, s) => acc + (s.duration || 4), 0);
}

export function getSlideAtTime(slides, globalTime) {
  let accTime = 0;
  for (let i = 0; i < slides.length; i++) {
    const dur = slides[i].duration || 4;
    if (globalTime < accTime + dur) {
      return { index: i, localTime: globalTime - accTime };
    }
    accTime += dur;
  }
  return { index: slides.length - 1, localTime: 0 };
}

export function renderThumbnail(slide, themeId, width, height, opts = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const t = THEMES[themeId] || THEMES.classic;

  const hasGlobalBg = !!opts.globalBgElement;
  if (opts.globalBgElement) {
    try { drawImageCover(ctx, opts.globalBgElement, 0, 0, W, H); } catch (e) { /* not ready */ }
  }

  drawSlide(ctx, slide, t, 2.0, 1, { hasGlobalBg, globalBgDarken: opts.globalBgDarken });

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = width;
  thumbCanvas.height = height;
  const thumbCtx = thumbCanvas.getContext('2d');
  thumbCtx.drawImage(canvas, 0, 0, width, height);
  return thumbCanvas.toDataURL('image/png', 0.6);
}

export { W, H };
