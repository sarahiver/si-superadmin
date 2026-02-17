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
// ANIMATION FUNCTIONS
// Returns { alpha, offsetX, offsetY, scale }
// ============================================
const ANIMATIONS = {
  fadeUp: (progress) => ({
    alpha: easeOut(progress),
    offsetX: 0,
    offsetY: lerp(60, 0, easeOut(progress)),
    scale: 1,
  }),
  fadeIn: (progress) => ({
    alpha: easeOut(progress),
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  }),
  slideRight: (progress) => ({
    alpha: easeOut(progress),
    offsetX: lerp(-80, 0, easeOut(progress)),
    offsetY: 0,
    scale: 1,
  }),
  scaleIn: (progress) => ({
    alpha: easeOut(progress),
    offsetX: 0,
    offsetY: 0,
    scale: lerp(0.7, 1, easeOut(progress)),
  }),
};

// ============================================
// TEXT WRAPPING
// ============================================
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  const lines = [];

  words.forEach(word => {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push({ text: line.trim(), y: currentY });
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = test;
    }
  });
  lines.push({ text: line.trim(), y: currentY });

  lines.forEach(l => {
    ctx.fillText(l.text, x, l.y);
  });

  return lines.length * lineHeight;
}

// ============================================
// THEME-SPECIFIC DECORATIONS
// ============================================
function drawDecorations(ctx, theme, t) {
  // Corner accent (luxe, editorial, classic dark)
  if (!t.brutal && !t.glass) {
    ctx.save();
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.25;
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(W - 100, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 100);
    ctx.stroke();
    ctx.restore();
  }

  // Glow effect (neon)
  if (t.glow) {
    ctx.save();
    const grad = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.8);
    grad.addColorStop(0, (t.accent || '#00ffff') + '18');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Glass subtle gradient (botanical)
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

  const logoX = 72;
  const logoY = 72;
  const text = 'S&I.';
  const style = t.logoDarkStyle || t.logoStyle;

  // Logo background
  ctx.font = `600 32px ${t.uiFont}`;
  const metrics = ctx.measureText(text);
  const padX = 20, padY = 12;
  const boxW = metrics.width + padX * 2;
  const boxH = 32 + padY * 2;

  if (style.background && style.background !== 'transparent') {
    ctx.fillStyle = style.background;
    if (style.borderRadius) {
      roundRect(ctx, logoX - padX, logoY - padY - 4, boxW, boxH, parseInt(style.borderRadius) || 0);
      ctx.fill();
    } else {
      ctx.fillRect(logoX - padX, logoY - padY - 4, boxW, boxH);
    }
  }

  if (style.border) {
    const borderMatch = style.border.match(/(\d+)px\s+solid\s+(.+)/);
    if (borderMatch) {
      ctx.strokeStyle = borderMatch[2];
      ctx.lineWidth = parseInt(borderMatch[1]);
      if (style.borderRadius) {
        roundRect(ctx, logoX - padX, logoY - padY - 4, boxW, boxH, parseInt(style.borderRadius) || 0);
        ctx.stroke();
      } else {
        ctx.strokeRect(logoX - padX, logoY - padY - 4, boxW, boxH);
      }
    }
  }

  ctx.fillStyle = style.color || '#fff';
  ctx.font = `600 32px ${t.uiFont}`;
  ctx.fillText(text, logoX, logoY + 20);

  ctx.restore();
}

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
// DRAW DIVIDER LINE
// ============================================
function drawDivider(ctx, t, x, y, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = t.accent;
  ctx.fillRect(x, y, 60, 3);
  if (t.glow) {
    ctx.shadowColor = t.accent;
    ctx.shadowBlur = 12;
    ctx.fillRect(x, y, 60, 3);
  }
  ctx.restore();
}

// ============================================
// DRAW FOOTER
// ============================================
function drawFooter(ctx, t, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.4;

  // Top border
  ctx.fillStyle = t.alwaysDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  ctx.fillRect(0, H - 80, W, 1);

  // URL left
  ctx.font = `400 22px ${t.uiFont}`;
  ctx.letterSpacing = '3px';
  ctx.fillStyle = t.accent;
  ctx.globalAlpha = alpha * 0.5;
  ctx.fillText('siwedding.com', 72, H - 36);

  ctx.restore();
}

// ============================================
// DRAW A SINGLE ELEMENT
// ============================================
function drawElement(ctx, element, t, slideLocalTime) {
  const delay = element.delay || 0;
  const animDur = element.animDuration || 0.5;
  const elapsed = slideLocalTime - delay;

  if (elapsed < 0) return; // Not yet visible

  const progress = clamp01(elapsed / animDur);
  const animFn = ANIMATIONS[element.animation || 'fadeUp'] || ANIMATIONS.fadeUp;
  const anim = animFn(progress);

  const x = (element.xPercent || 0.067) * W; // default ~72px
  const y = (element.yPercent || 0.5) * H;

  ctx.save();
  ctx.globalAlpha = anim.alpha;

  const drawX = x + anim.offsetX;
  const drawY = y + anim.offsetY;

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
      ctx.font = `${t.brutal ? 700 : 600} 26px ${t.uiFont}`;
      ctx.fillStyle = t.accent;
      const text = (element.text || '').toUpperCase();
      if (t.glow) {
        ctx.shadowColor = t.accent;
        ctx.shadowBlur = 15;
      }
      ctx.fillText(text, drawX, drawY);
      break;
    }

    case 'headline': {
      const size = element.fontSize || 90;
      ctx.font = `${t.headlineWeight} ${size}px ${t.headlineFont}`;
      ctx.fillStyle = t.textDark || t.text;
      if (t.headlineStyle) ctx.font = `${t.headlineStyle} ${ctx.font}`;
      if (t.headlineTransform === 'uppercase') {
        drawWrappedText(ctx, (element.text || '').toUpperCase(), drawX, drawY, W - 144, size * 1.15);
      } else {
        drawWrappedText(ctx, element.text || '', drawX, drawY, W - 144, size * 1.15);
      }
      break;
    }

    case 'accentWord': {
      const size = element.fontSize || 100;
      const font = t.scriptFont || t.headlineFont;
      const style = t.scriptStyle || 'normal';
      ctx.font = `${style} 400 ${size}px ${font}`;
      ctx.fillStyle = t.accent;
      if (t.glow) {
        ctx.shadowColor = t.secondary || t.accent;
        ctx.shadowBlur = 20;
      }
      ctx.fillText(element.text || '', drawX, drawY);
      break;
    }

    case 'body': {
      const size = element.fontSize || 28;
      ctx.font = `${t.bodyWeight} ${size}px ${t.bodyFont}`;
      ctx.fillStyle = t.body;
      if (t.bodyStyle) ctx.font = `${t.bodyStyle} ${ctx.font}`;
      drawWrappedText(ctx, element.text || '', drawX, drawY, W - 144, size * 1.7);
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
function drawSlide(ctx, slide, t, slideLocalTime, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // Background
  if (slide.backgroundType === 'image' && slide._bgImage) {
    ctx.drawImage(slide._bgImage, 0, 0, W, H);
    // Darken overlay
    ctx.fillStyle = `rgba(0,0,0,${slide.backgroundDarken || 0.4})`;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = t.bgDark || t.bg;
    ctx.fillRect(0, 0, W, H);
  }

  // Theme decorations
  drawDecorations(ctx, null, t);

  // Elements
  (slide.elements || []).forEach(el => {
    drawElement(ctx, el, t, slideLocalTime);
  });

  ctx.restore();
}

// ============================================
// MAIN RENDER FUNCTION
// renderFrame(ctx, reelData, globalTime)
// reelData = { themeId, slides: [...] }
// ============================================
export function renderFrame(ctx, reelData, globalTime) {
  const t = THEMES[reelData.themeId] || THEMES.classic;

  // Calculate which slide(s) to show
  let accTime = 0;
  let currentSlideIdx = -1;
  let slideLocalTime = 0;
  let transitionProgress = -1; // -1 = no transition

  for (let i = 0; i < reelData.slides.length; i++) {
    const slide = reelData.slides[i];
    const dur = slide.duration || 4;
    const transDur = slide.transitionDuration || 0.5;

    if (globalTime >= accTime && globalTime < accTime + dur) {
      currentSlideIdx = i;
      slideLocalTime = globalTime - accTime;

      // Check if we're in the transition-IN zone of this slide
      if (i > 0 && slide.transitionIn !== 'none' && slideLocalTime < transDur) {
        transitionProgress = slideLocalTime / transDur;
      }
      break;
    }
    accTime += dur;
  }

  // If past all slides, show last slide statically
  if (currentSlideIdx === -1) {
    currentSlideIdx = reelData.slides.length - 1;
    const lastSlide = reelData.slides[currentSlideIdx];
    slideLocalTime = (lastSlide && lastSlide.duration) || 4;
  }

  // Clear canvas
  ctx.clearRect(0, 0, W, H);

  const currentSlide = reelData.slides[currentSlideIdx];
  if (!currentSlide) return;

  // Crossfade transition
  if (transitionProgress >= 0 && currentSlideIdx > 0) {
    const prevSlide = reelData.slides[currentSlideIdx - 1];
    const prevDur = prevSlide.duration || 4;
    const alpha = easeInOut(transitionProgress);

    // Draw previous slide (fading out)
    drawSlide(ctx, prevSlide, t, prevDur, 1 - alpha);
    // Draw current slide (fading in)
    drawSlide(ctx, currentSlide, t, slideLocalTime, alpha);
  } else {
    // No transition, just draw current slide
    drawSlide(ctx, currentSlide, t, slideLocalTime, 1);
  }
}

// Get total duration of all slides
export function getTotalDuration(slides) {
  return slides.reduce((acc, s) => acc + (s.duration || 4), 0);
}

// Get slide index and local time for a given global time
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

// Render a single slide thumbnail to a small canvas
export function renderThumbnail(slide, themeId, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const t = THEMES[themeId] || THEMES.classic;

  // Draw slide at t=2s (to show elements after animations)
  drawSlide(ctx, slide, t, 2.0, 1);

  // Scale down to thumbnail
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = width;
  thumbCanvas.height = height;
  const thumbCtx = thumbCanvas.getContext('2d');
  thumbCtx.drawImage(canvas, 0, 0, width, height);

  return thumbCanvas.toDataURL('image/png', 0.6);
}

export { W, H };
