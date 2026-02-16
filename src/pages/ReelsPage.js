/* global VideoEncoder VideoFrame */
// src/pages/ReelsPage.js
// S&I. Reels Editor — Video + Text-Overlay Timeline + Export
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Layout from '../components/Layout';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5', green: '#10B981' };
const W = 1080, H = 1920; // 9:16 output

// ============================================
// TEXT LAYER PRESETS
// ============================================
const LAYER_PRESETS = {
  eyebrow: { label: 'Eyebrow', font: "600 14px 'Inter', sans-serif", color: 'rgba(255,255,255,0.5)', letterSpacing: 3, uppercase: true, yPercent: 0.35 },
  headline: { label: 'Headline', font: "300 64px 'Cormorant Garamond', serif", color: '#ffffff', yPercent: 0.42 },
  script: { label: 'Script Akzent', font: "400 68px 'Mrs Saint Delafield', cursive", color: 'rgba(255,255,255,0.75)', yPercent: 0.52 },
  body: { label: 'Body Text', font: "300 16px 'Josefin Sans', sans-serif", color: 'rgba(255,255,255,0.5)', yPercent: 0.62 },
  logo: { label: 'S&I. Logo', font: "600 18px 'Josefin Sans', sans-serif", color: '#ffffff', yPercent: 0.04, isLogo: true },
  url: { label: 'URL', font: "400 12px 'Josefin Sans', sans-serif", color: 'rgba(255,255,255,0.3)', letterSpacing: 2, uppercase: true, yPercent: 0.96 },
};

const ANIMATIONS = {
  fadeUp: { label: 'Fade Up', draw: (ctx, p, x, y) => ({ alpha: easeOut(p), y: y + lerp(40, 0, p) }) },
  fadeIn: { label: 'Fade In', draw: (ctx, p, x, y) => ({ alpha: easeOut(p), y }) },
  slideRight: { label: 'Slide Right', draw: (ctx, p, x, y) => ({ alpha: easeOut(p), x: x + lerp(-50, 0, p), y }) },
  scaleIn: { label: 'Scale In', draw: (ctx, p, x, y) => ({ alpha: easeOut(p), scale: lerp(0.7, 1, p), y }) },
  typewriter: { label: 'Typewriter', draw: (ctx, p, x, y) => ({ alpha: 1, y, charLimit: p }) },
  none: { label: 'Keine', draw: (ctx, p, x, y) => ({ alpha: 1, y }) },
};

function easeOut(t) { return 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3); }
function lerp(a, b, t) { return a + (b - a) * easeOut(t); }

function createDefaultLayers() {
  return [
    { id: 1, type: 'logo', text: 'S&I.', startTime: 0.3, endTime: null, fadeInDur: 0.4, fadeOutDur: 0.3, animation: 'fadeIn', x: 72, yPercent: 0.04 },
    { id: 2, type: 'eyebrow', text: 'S&I. WEDDING', startTime: 0.8, endTime: null, fadeInDur: 0.5, fadeOutDur: 0.3, animation: 'fadeUp', x: 72, yPercent: 0.38 },
    { id: 3, type: 'headline', text: 'Eure Hochzeit verdient mehr als ein Template.', startTime: 1.5, endTime: null, fadeInDur: 0.7, fadeOutDur: 0.3, animation: 'fadeUp', x: 72, yPercent: 0.44 },
    { id: 4, type: 'script', text: 'Hochzeit', startTime: 2.5, endTime: null, fadeInDur: 0.5, fadeOutDur: 0.3, animation: 'fadeUp', x: 72, yPercent: 0.58 },
    { id: 5, type: 'body', text: 'Handgemachte Websites aus Hamburg.', startTime: 3.5, endTime: null, fadeInDur: 0.5, fadeOutDur: 0.3, animation: 'fadeUp', x: 72, yPercent: 0.66 },
    { id: 6, type: 'url', text: 'SIWEDDING.COM', startTime: 4, endTime: null, fadeInDur: 0.5, fadeOutDur: 0.3, animation: 'fadeIn', x: 72, yPercent: 0.96 },
  ];
}

// ============================================
// DRAW TEXT LAYER ON CANVAS
// ============================================
function drawTextLayer(ctx, layer, currentTime, videoDuration) {
  const preset = LAYER_PRESETS[layer.type] || LAYER_PRESETS.body;
  const endTime = layer.endTime || videoDuration;
  
  if (currentTime < layer.startTime || currentTime > endTime) return;

  const timeSinceStart = currentTime - layer.startTime;
  const timeUntilEnd = endTime - currentTime;
  const fadeInP = Math.min(timeSinceStart / (layer.fadeInDur || 0.5), 1);
  const fadeOutP = layer.fadeOutDur > 0 ? Math.min(timeUntilEnd / layer.fadeOutDur, 1) : 1;

  const anim = ANIMATIONS[layer.animation] || ANIMATIONS.fadeIn;
  const x = layer.x || 72;
  const y = (layer.yPercent || preset.yPercent) * H;
  const result = anim.draw(ctx, fadeInP, x, y);

  ctx.save();
  ctx.globalAlpha = (result.alpha || 1) * fadeOutP;

  // Custom color overrides preset
  ctx.fillStyle = layer.color || preset.color;

  // Custom font size: replace size in preset font string
  let font = preset.font;
  if (layer.fontSize) {
    font = font.replace(/\d+px/, layer.fontSize + 'px');
  }
  ctx.font = font;

  const drawX = result.x || x;
  const drawY = result.y || y;

  if (result.scale) {
    ctx.translate(drawX, drawY);
    ctx.scale(result.scale, result.scale);
    ctx.translate(-drawX, -drawY);
  }

  // Logo special rendering
  if (preset.isLogo) {
    const logoBg = layer.bgColor || 'rgba(255,255,255,0.1)';
    const logoBorder = layer.bgColor ? 'transparent' : 'rgba(255,255,255,0.15)';
    ctx.fillStyle = logoBg;
    ctx.fillRect(drawX - 15, drawY - 2, 82, 36);
    if (logoBorder !== 'transparent') {
      ctx.strokeStyle = logoBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX - 15, drawY - 2, 82, 36);
    }
    ctx.fillStyle = layer.color || '#fff';
    ctx.font = font;
    ctx.fillText(layer.text, drawX, drawY + 22);
    ctx.restore();
    return;
  }

  let text = (preset.uppercase && !layer.disableUppercase) ? layer.text.toUpperCase() : layer.text;

  if (result.charLimit !== undefined) {
    text = text.substring(0, Math.floor(text.length * result.charLimit));
  }

  // Measure text for background box
  const measureAndDraw = (textToDraw, tx, ty) => {
    if (layer.bgColor) {
      const metrics = ctx.measureText(textToDraw);
      const textH = layer.fontSize || parseInt(font.match(/\d+px/)?.[0]) || 20;
      const padX = 16, padY = 10;
      ctx.save();
      ctx.fillStyle = layer.bgColor;
      ctx.globalAlpha = (result.alpha || 1) * fadeOutP * (layer.bgOpacity !== undefined ? layer.bgOpacity : 0.8);
      ctx.fillRect(tx - padX, ty - textH - padY + 4, metrics.width + padX * 2, textH + padY * 2);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = (result.alpha || 1) * fadeOutP;
      ctx.fillStyle = layer.color || preset.color;
      ctx.font = font;
    }
    ctx.fillText(textToDraw, tx, ty);
    if (layer.bgColor) ctx.restore();
  };

  // Word wrap for longer text
  if (layer.type === 'headline' || layer.type === 'body') {
    const maxW = W - 144;
    const words = text.split(' ');
    let line = '';
    let lineY = drawY;
    const baseSize = layer.fontSize || parseInt(font.match(/\d+px/)?.[0]) || 20;
    const lineH = layer.type === 'headline' ? baseSize * 1.2 : baseSize * 1.5;
    words.forEach(word => {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        measureAndDraw(line.trim(), drawX, lineY);
        line = word + ' ';
        lineY += lineH;
      } else {
        line = test;
      }
    });
    measureAndDraw(line.trim(), drawX, lineY);
  } else {
    measureAndDraw(text, drawX, drawY);
  }

  ctx.restore();
}

// Darken overlay for text readability
function drawOverlay(ctx, opacity) {
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${opacity})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ============================================
// STYLED COMPONENTS
// ============================================
const PageHeader = styled.div`margin-bottom: 2rem; h1 { font-family: 'Oswald', sans-serif; font-size: 2rem; font-weight: 700; text-transform: uppercase; color: ${colors.black}; margin-bottom: 0.25rem; } p { font-family: 'Source Serif 4', serif; font-style: italic; color: ${colors.gray}; font-size: 1rem; }`;
const Grid = styled.div`display: grid; grid-template-columns: 1fr 320px; gap: 2rem; align-items: start; @media (max-width: 1024px) { grid-template-columns: 1fr; }`;
const Panel = styled.div`background: #fff; border: 1px solid ${colors.lightGray}; padding: 1.5rem; margin-bottom: 0.75rem;`;
const SectionLabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.gray}; margin-bottom: 0.75rem;`;
const Label = styled.label`font-family: 'Inter', sans-serif; font-size: 0.6rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: ${colors.gray}; display: block; margin-bottom: 0.2rem;`;
const Input = styled.input`width: 100%; padding: 0.55rem 0.65rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.8rem; background: #fff; outline: none; &:focus { border-color: ${colors.red}; }`;
const SmallInput = styled.input`width: 65px; padding: 0.4rem 0.5rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.75rem; background: #fff; outline: none; text-align: center; &:focus { border-color: ${colors.red}; }`;
const Select = styled.select`padding: 0.4rem 0.5rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.7rem; background: #fff; outline: none;`;
const Field = styled.div`margin-bottom: 0.5rem;`;
const GenButton = styled.button`font-family: 'Oswald', sans-serif; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.9rem 2rem; cursor: pointer; border: none; width: 100%; background: ${p => p.disabled ? colors.gray : colors.red}; color: #fff; transition: all 0.2s; &:hover { opacity: 0.9; }`;
const SecBtn = styled.button`font-family: 'Oswald', sans-serif; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.65rem 1.25rem; cursor: pointer; border: 2px solid ${colors.black}; background: transparent; color: ${colors.black}; transition: all 0.2s; &:hover { background: ${colors.black}; color: #fff; }`;
const SmallBtn = styled.button`font-family: 'Inter', sans-serif; font-size: 0.6rem; padding: 0.3rem 0.6rem; cursor: pointer; border: 1px solid ${colors.lightGray}; background: #fff; color: ${colors.black}; &:hover { border-color: ${colors.black}; }`;
const DangerBtn = styled.button`font-family: 'Inter', sans-serif; font-size: 0.55rem; padding: 0.25rem 0.5rem; cursor: pointer; border: 1px solid ${colors.red}; background: transparent; color: ${colors.red}; &:hover { background: ${colors.red}; color: #fff; }`;
const PreviewSticky = styled.div`position: sticky; top: 80px; @media (max-width: 1024px) { position: static; order: -1; }`;
const PreviewLabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; color: ${colors.gray}; text-align: center; margin-bottom: 0.5rem;`;
const ProgressBar = styled.div`height: 3px; background: ${colors.lightGray}; margin-top: 0.5rem; overflow: hidden; div { height: 100%; background: ${colors.red}; transition: width 0.05s linear; }`;
const FileLabel = styled.label`display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border: 2px dashed ${colors.lightGray}; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 0.8rem; width: 100%; justify-content: center; &:hover { border-color: ${colors.red}; } input { display: none; }`;
const StatusMsg = styled.div`font-family: 'Inter', sans-serif; font-size: 0.75rem; color: ${p => p.$error ? colors.red : colors.green}; margin-top: 0.5rem; font-weight: 500;`;
const Hint = styled.p`font-size: 0.6rem; color: ${colors.gray}; margin-top: 0.35rem; line-height: 1.5;`;

const CaptionGenBtn = styled.button`
  font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 0.85rem 2rem; cursor: pointer; border: none; width: 100%;
  background: ${colors.red}; color: #fff; transition: all 0.2s;
  &:hover { opacity: 0.9; }
  &:disabled { background: ${colors.gray}; cursor: wait; }
`;
const CaptionArea = styled.textarea`
  width: 100%; padding: 0.75rem; border: 1px solid ${colors.lightGray}; font-family: 'Inter', sans-serif;
  font-size: 0.8rem; line-height: 1.6; background: #F9F9F7; resize: vertical; outline: none;
  &:focus { border-color: ${colors.red}; }
`;
const CopyBtn = styled.button`
  font-family: 'Oswald', sans-serif; font-size: 0.7rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 0.6rem 1.25rem; cursor: pointer; border: 2px solid ${colors.red}; background: transparent; color: ${colors.red};
  transition: all 0.2s; &:hover { background: ${colors.red}; color: #fff; }
`;
const IgBtn = styled.button`
  font-family: 'Oswald', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 0.6rem 1.25rem; cursor: pointer; border: none;
  background: linear-gradient(135deg, #833AB4, #E1306C, #F77737); color: #fff;
  transition: all 0.2s; &:hover { opacity: 0.9; }
`;
const IgReadyBox = styled.div`
  margin-top: 0.75rem; background: #fff; border: 2px solid ${colors.green}; padding: 1rem;
`;
const IgStep = styled.div`
  font-family: 'Inter', sans-serif; font-size: 0.75rem; color: ${colors.black}; margin-bottom: 0.4rem; line-height: 1.5;
`;
const IgLink = styled.a`
  display: inline-block; font-family: 'Oswald', sans-serif; font-size: 0.75rem; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase; padding: 0.6rem 1.5rem; margin-top: 0.5rem;
  background: linear-gradient(135deg, #833AB4, #E1306C, #F77737); color: #fff; text-decoration: none;
  transition: all 0.2s; &:hover { opacity: 0.9; }
`;

const LayerCard = styled.div`
  background: ${p => p.$active ? '#f9f8f6' : '#fff'}; 
  border: 1px solid ${p => p.$active ? colors.red : colors.lightGray};
  padding: 0.65rem; margin-bottom: 0.4rem; cursor: pointer; transition: all 0.1s;
  &:hover { border-color: ${colors.black}; }
`;
const LayerHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;`;
const LayerType = styled.span`font-family: 'Inter', sans-serif; font-size: 0.6rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${colors.red};`;
const LayerTime = styled.span`font-family: 'Inter', sans-serif; font-size: 0.55rem; color: ${colors.gray};`;
const LayerText = styled.div`font-family: 'Inter', sans-serif; font-size: 0.75rem; color: ${colors.black}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;

const TimelineBar = styled.div`
  position: relative; height: 20px; background: ${colors.lightGray}; margin: 0.75rem 0 0.25rem; cursor: pointer; overflow: hidden;
`;
const TimelineBlock = styled.div`
  position: absolute; top: 2px; bottom: 2px; background: ${p => p.$color || colors.red}; opacity: 0.7; border-radius: 2px;
  font-size: 0.4rem; color: #fff; display: flex; align-items: center; padding: 0 3px; overflow: hidden; white-space: nowrap;
`;
const Playhead = styled.div`
  position: absolute; top: 0; bottom: 0; width: 2px; background: ${colors.black}; z-index: 5;
`;

const LAYER_COLORS = { logo: '#333', eyebrow: '#888', headline: colors.red, script: '#C4A87C', body: '#666', url: '#aaa' };

// ============================================
// MAIN COMPONENT
// ============================================
export default function ReelsPage() {
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoDuration, setVideoDuration] = useState(10);
  const [layers, setLayers] = useState(createDefaultLayers());
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [nextId, setNextId] = useState(7);
  const [caption, setCaption] = useState('');
  const [captionCopied, setCaptionCopied] = useState(false);
  const [captionLoading, setCaptionLoading] = useState(false);
  const [igReady, setIgReady] = useState(false);

  const videoRef = useRef(null);
  const hiddenVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // Load video
  const handleVideo = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      const v = document.createElement('video');
      v.onloadedmetadata = () => {
        setVideoDuration(v.duration);
        // Update layers that have no endTime to use video duration
      };
      v.src = url;
    }
  };

  // Draw current frame to preview canvas
  const drawPreview = useCallback((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // Draw video frame
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      if (!videoSrc) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = "400 20px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('Video hier hochladen', W / 2, H / 2 - 10);
        ctx.fillText('↑', W / 2, H / 2 - 40);
        ctx.textAlign = 'start';
      }
    }

    // Darken overlay
    drawOverlay(ctx, overlayOpacity);

    // Draw all text layers
    layers.forEach(layer => {
      drawTextLayer(ctx, layer, time, videoDuration);
    });
  }, [layers, videoSrc, videoDuration, overlayOpacity]);

  // Preview playback
  const startPreview = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play();
    }
    setPlaying(true);
    setCurrentTime(0);
    const start = Date.now();

    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const t = Math.min(elapsed, videoDuration);
      setCurrentTime(t);
      drawPreview(t);
      if (elapsed < videoDuration) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
        if (video) video.pause();
      }
    };
    animRef.current = requestAnimationFrame(tick);
  };

  const stopPreview = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setPlaying(false);
    const video = videoRef.current;
    if (video) video.pause();
  };

  // Scrub timeline
  const scrubTimeline = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = p * videoDuration;
    setCurrentTime(t);
    const video = videoRef.current;
    if (video) video.currentTime = t;
    setTimeout(() => drawPreview(t), 50);
  };

  // Draw initial frame
  useEffect(() => {
    const t = setTimeout(() => drawPreview(currentTime), 100);
    return () => clearTimeout(t);
  }, [layers, overlayOpacity, drawPreview, currentTime]);

  // Cleanup
  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // Layer management
  const addLayer = (type) => {
    const preset = LAYER_PRESETS[type];
    setLayers(prev => [...prev, {
      id: nextId, type, text: type === 'logo' ? 'S&I.' : type === 'url' ? 'SIWEDDING.COM' : 'Neuer Text',
      startTime: currentTime, endTime: null, fadeInDur: 0.5, fadeOutDur: 0.3,
      animation: 'fadeUp', x: 72, yPercent: preset.yPercent,
    }]);
    setSelectedLayer(nextId);
    setNextId(n => n + 1);
  };

  const updateLayer = (id, updates) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLayer = (id) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayer === id) setSelectedLayer(null);
  };

  // Generate video as MP4
  const generateVideo = useCallback(async () => {
    if (!videoSrc) { setStatus('Bitte zuerst ein Video hochladen'); return; }
    setGenerating(true);
    setProgress(0);
    setStatus('Encoder laden...');

    // Load mp4-muxer from CDN (still works fine, just deprecated in favor of mediabunny)
    if (!window.Mp4Muxer) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    setStatus('Video wird generiert...');
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const fps = 30;

    const vid = document.createElement('video');
    vid.src = videoSrc;
    vid.muted = true;
    vid.preload = 'auto';
    await new Promise(r => { vid.onloadeddata = r; vid.load(); });

    const totalFrames = Math.ceil(videoDuration * fps);

    // Try VideoEncoder + mp4-muxer for real MP4
    if (typeof VideoEncoder !== 'undefined' && window.Mp4Muxer) {
      try {
        const muxer = new window.Mp4Muxer.Muxer({
          target: new window.Mp4Muxer.ArrayBufferTarget(),
          video: { codec: 'avc', width: W, height: H },
          fastStart: 'in-memory',
        });

        const encoder = new VideoEncoder({
          output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
          error: (e) => console.error('Encode error:', e),
        });

        encoder.configure({
          codec: 'avc1.640033',
          width: W,
          height: H,
          bitrate: 8_000_000,
          framerate: fps,
        });

        let frame = 0;
        const processFrame = () => {
          return new Promise((resolve) => {
            const next = () => {
              if (frame >= totalFrames) { resolve(); return; }
              const t = (frame / totalFrames) * videoDuration;
              vid.currentTime = t;

              const onSeeked = () => {
                vid.removeEventListener('seeked', onSeeked);
                ctx.clearRect(0, 0, W, H);
                ctx.drawImage(vid, 0, 0, W, H);
                drawOverlay(ctx, overlayOpacity);
                layers.forEach(layer => drawTextLayer(ctx, layer, t, videoDuration));

                const vf = new VideoFrame(canvas, {
                  timestamp: frame * (1_000_000 / fps),
                  duration: 1_000_000 / fps,
                });
                const isKeyFrame = frame % (fps * 2) === 0;
                encoder.encode(vf, { keyFrame: isKeyFrame });
                vf.close();

                setProgress(frame / totalFrames);
                frame++;
                setTimeout(next, 5);
              };
              vid.addEventListener('seeked', onSeeked);
            };
            next();
          });
        };

        await processFrame();
        await encoder.flush();
        encoder.close();
        muxer.finalize();

        const { buffer } = muxer.target;
        const blob = new Blob([buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'si-reel.mp4';
        a.click();
        URL.revokeObjectURL(url);
        setGenerating(false);
        setStatus('✅ MP4 heruntergeladen!');
        setProgress(1);
        return;
      } catch (e) {
        console.warn('MP4 encoder failed, using fallback:', e);
      }
    }

    // Fallback: MediaRecorder → WebM (if VideoEncoder not available)
    setStatus('Fallback: Video wird als WebM generiert...');
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9' : 'video/webm';
    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'si-reel.webm';
      a.click();
      URL.revokeObjectURL(url);
      setGenerating(false);
      setStatus('✅ Video heruntergeladen (WebM — auf cloudconvert.com → MP4 konvertieren)');
      setProgress(1);
    };
    recorder.start();
    let frame = 0;
    const renderFrame = () => {
      if (frame >= totalFrames) { recorder.stop(); return; }
      const t = (frame / totalFrames) * videoDuration;
      vid.currentTime = t;
      const onSeeked = () => {
        vid.removeEventListener('seeked', onSeeked);
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(vid, 0, 0, W, H);
        drawOverlay(ctx, overlayOpacity);
        layers.forEach(layer => drawTextLayer(ctx, layer, t, videoDuration));
        setProgress(frame / totalFrames);
        frame++;
        setTimeout(renderFrame, 10);
      };
      vid.addEventListener('seeked', onSeeked);
    };
    vid.currentTime = 0;
    vid.addEventListener('seeked', function first() {
      vid.removeEventListener('seeked', first);
      renderFrame();
    });
  }, [videoSrc, videoDuration, layers, overlayOpacity]);

  // ==========================================
  // AI CAPTION + HASHTAG GENERATION
  // ==========================================
  const generateCaption = async () => {
    setCaptionLoading(true);
    const layerTexts = layers.map(l => l.text).join(' | ');
    const prompt = `Du bist Social Media Manager für S&I. Wedding (siwedding.com) — ein Premium-Hochzeitswebsite-Service aus Hamburg von Sarah & Iver.

Kontext:
- S&I. bietet handgemachte Hochzeitswebsites mit eigener Domain ab 1.290€
- 7 Design-Themes: Classic, Editorial, Botanical, Contemporary, Luxe, Neon, Video
- Features: RSVP, Gästeliste, Love Story, Countdown, Foto-Upload, Musik-Wünsche, Passwortschutz
- Pakete: Starter (1.290€/6Mo), Standard (1.490€/8Mo), Premium (1.990€/12Mo)
- Zielgruppe: Verlobte Paare, 25-40 Jahre, DACH-Raum
- Tonalität: Warm aber selbstbewusst, nie billig oder kitschig, leicht editorial

Das Reel zeigt folgende Texte: "${layerTexts}"

Schreibe eine Instagram Reel Caption:
1. Hook-Satz (erste Zeile, die zum Weiterlesen animiert — z.B. eine Frage oder provokante Aussage)
2. 3-5 Sätze Haupttext (warm, persönlich, mit Emoji, Mehrwert bieten)
3. Call-to-Action (z.B. "Link in Bio", "Schreibt uns eine DM", "Speichert euch das Reel")
4. 15-20 relevante Hashtags (Mix: 5 große #hochzeit #wedding, 5 mittlere #hochzeitsplanung, 5 nischige #hochzeitswebsite, plus thematisch passende)

Antworte NUR mit JSON:
{"caption":"...","hashtags":"#tag1 #tag2 ..."}`;

    try {
      const response = await fetch('/api/ai-suggest', {
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
      setCaption('⚠️ Caption konnte nicht generiert werden. Bitte nochmal versuchen.');
    }
    setCaptionLoading(false);
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption).then(() => {
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    });
  };

  const prepareForInstagram = async () => {
    if (caption) await navigator.clipboard.writeText(caption);
    setIgReady(true);
    setTimeout(() => setIgReady(false), 30000);
  };

  const sel = layers.find(l => l.id === selectedLayer);

  return (
    <Layout>
      <PageHeader>
        <h1>Reels</h1>
        <p>Video hochladen — Text-Overlay mit Timeline platzieren — als Reel exportieren</p>
      </PageHeader>

      <Grid>
        <div>
          {/* Video Upload */}
          <Panel>
            <SectionLabel>Hintergrund-Video</SectionLabel>
            {!videoSrc ? (
              <FileLabel>
                🎬 Video hochladen (MP4, MOV, WebM)
                <input type="file" accept="video/*" onChange={handleVideo} />
              </FileLabel>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <video ref={videoRef} src={videoSrc} style={{ width: 80, height: 142, objectFit: 'cover', border: `1px solid ${colors.lightGray}` }} muted />
                <div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', fontWeight: 500 }}>Video geladen</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', color: colors.gray }}>{videoDuration.toFixed(1)}s Dauer</div>
                  <SmallBtn onClick={() => { setVideoSrc(null); }} style={{ marginTop: 4 }}>Anderes Video</SmallBtn>
                </div>
              </div>
            )}
            <Field style={{ marginTop: '0.75rem' }}>
              <Label>Overlay Abdunklung: {Math.round(overlayOpacity * 100)}%</Label>
              <input type="range" min="0" max="80" value={overlayOpacity * 100} onChange={e => setOverlayOpacity(e.target.value / 100)} style={{ width: '100%' }} />
            </Field>
          </Panel>

          {/* Timeline */}
          <Panel>
            <SectionLabel>Timeline ({videoDuration.toFixed(1)}s)</SectionLabel>
            <TimelineBar onClick={scrubTimeline}>
              {layers.map(l => {
                const start = (l.startTime / videoDuration) * 100;
                const end = ((l.endTime || videoDuration) / videoDuration) * 100;
                return (
                  <TimelineBlock key={l.id} $color={LAYER_COLORS[l.type]} style={{ left: `${start}%`, width: `${end - start}%` }} onClick={(e) => { e.stopPropagation(); setSelectedLayer(l.id); }}>
                    {l.text.substring(0, 12)}
                  </TimelineBlock>
                );
              })}
              <Playhead style={{ left: `${(currentTime / videoDuration) * 100}%` }} />
            </TimelineBar>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', color: colors.gray }}>
              <span>0:00</span>
              <span style={{ fontWeight: 600, color: colors.black }}>{currentTime.toFixed(1)}s</span>
              <span>{videoDuration.toFixed(1)}s</span>
            </div>
          </Panel>

          {/* Text Layers */}
          <Panel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <SectionLabel style={{ margin: 0 }}>Text-Layer</SectionLabel>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {Object.entries(LAYER_PRESETS).map(([type, p]) => (
                  <SmallBtn key={type} onClick={() => addLayer(type)}>+ {p.label}</SmallBtn>
                ))}
              </div>
            </div>

            {layers.map(l => (
              <LayerCard key={l.id} $active={selectedLayer === l.id} onClick={() => setSelectedLayer(l.id)}>
                <LayerHeader>
                  <LayerType>{LAYER_PRESETS[l.type]?.label || l.type}</LayerType>
                  <LayerTime>{l.startTime.toFixed(1)}s → {(l.endTime || videoDuration).toFixed(1)}s</LayerTime>
                </LayerHeader>
                <LayerText>{l.text}</LayerText>
              </LayerCard>
            ))}
          </Panel>

          {/* Selected Layer Editor */}
          {sel && (
            <Panel>
              <SectionLabel>{LAYER_PRESETS[sel.type]?.label} bearbeiten</SectionLabel>
              <Field>
                <Label>Text</Label>
                <Input value={sel.text} onChange={e => updateLayer(sel.id, { text: e.target.value })} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.4rem' }}>
                <Field>
                  <Label>Start (s)</Label>
                  <SmallInput type="number" step="0.1" min="0" value={sel.startTime} onChange={e => updateLayer(sel.id, { startTime: parseFloat(e.target.value) || 0 })} />
                </Field>
                <Field>
                  <Label>Ende (s)</Label>
                  <SmallInput type="number" step="0.1" min="0" value={sel.endTime || ''} placeholder="∞" onChange={e => updateLayer(sel.id, { endTime: e.target.value ? parseFloat(e.target.value) : null })} />
                </Field>
                <Field>
                  <Label>Fade In</Label>
                  <SmallInput type="number" step="0.1" min="0" value={sel.fadeInDur} onChange={e => updateLayer(sel.id, { fadeInDur: parseFloat(e.target.value) || 0.3 })} />
                </Field>
                <Field>
                  <Label>Fade Out</Label>
                  <SmallInput type="number" step="0.1" min="0" value={sel.fadeOutDur} onChange={e => updateLayer(sel.id, { fadeOutDur: parseFloat(e.target.value) || 0 })} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <Field>
                  <Label>Animation</Label>
                  <Select value={sel.animation} onChange={e => updateLayer(sel.id, { animation: e.target.value })}>
                    {Object.entries(ANIMATIONS).map(([id, a]) => <option key={id} value={id}>{a.label}</option>)}
                  </Select>
                </Field>
                <Field>
                  <Label>Y-Position (%)</Label>
                  <SmallInput type="number" step="1" min="0" max="100" value={Math.round((sel.yPercent || 0.5) * 100)} onChange={e => updateLayer(sel.id, { yPercent: (parseInt(e.target.value) || 50) / 100 })} />
                </Field>
              </div>

              {/* Farbe & Größe */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginTop: '0.25rem' }}>
                <Field>
                  <Label>Textfarbe</Label>
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <input type="color" value={sel.color || LAYER_PRESETS[sel.type]?.color?.replace(/rgba?\([^)]+\)/, '#ffffff') || '#ffffff'} onChange={e => updateLayer(sel.id, { color: e.target.value })} style={{ width: 28, height: 28, border: `1px solid ${colors.lightGray}`, cursor: 'pointer', padding: 0 }} />
                    {sel.color && <SmallBtn onClick={() => updateLayer(sel.id, { color: null })} style={{ fontSize: '0.5rem', padding: '2px 4px' }}>Reset</SmallBtn>}
                  </div>
                </Field>
                <Field>
                  <Label>Schriftgröße</Label>
                  <SmallInput type="number" step="1" min="8" max="200" value={sel.fontSize || parseInt(LAYER_PRESETS[sel.type]?.font?.match(/\d+px/)?.[0]) || 20} onChange={e => updateLayer(sel.id, { fontSize: parseInt(e.target.value) || null })} />
                </Field>
                <Field>
                  <Label>Opacity (%)</Label>
                  <SmallInput type="number" step="5" min="0" max="100" value={sel.opacity !== undefined ? sel.opacity : 100} onChange={e => updateLayer(sel.id, { opacity: parseInt(e.target.value) })} />
                </Field>
              </div>

              {/* Text-Hintergrund */}
              <div style={{ borderTop: `1px solid ${colors.lightGray}`, paddingTop: '0.5rem', marginTop: '0.4rem' }}>
                <Label>Text-Hintergrund</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '0.4rem', alignItems: 'center' }}>
                  <input type="color" value={sel.bgColor || '#000000'} onChange={e => updateLayer(sel.id, { bgColor: e.target.value })} style={{ width: 28, height: 28, border: `1px solid ${colors.lightGray}`, cursor: 'pointer', padding: 0 }} />
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: colors.gray }}>
                    {sel.bgColor ? sel.bgColor : 'Kein Hintergrund'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Label style={{ margin: 0, whiteSpace: 'nowrap' }}>Opacity</Label>
                    <SmallInput type="number" step="5" min="0" max="100" value={Math.round((sel.bgOpacity !== undefined ? sel.bgOpacity : 0.8) * 100)} onChange={e => updateLayer(sel.id, { bgOpacity: (parseInt(e.target.value) || 0) / 100 })} disabled={!sel.bgColor} />
                  </div>
                  {sel.bgColor && <SmallBtn onClick={() => updateLayer(sel.id, { bgColor: null })}>✕</SmallBtn>}
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Schwarz', color: '#000000', opacity: 0.7 },
                    { label: 'Weiß', color: '#ffffff', opacity: 0.85 },
                    { label: 'Rot (S&I)', color: '#C41E3A', opacity: 0.9 },
                    { label: 'Gold', color: '#C4A87C', opacity: 0.9 },
                    { label: 'Blur Dark', color: '#1a1a1a', opacity: 0.6 },
                  ].map(preset => (
                    <SmallBtn key={preset.label} onClick={() => updateLayer(sel.id, { bgColor: preset.color, bgOpacity: preset.opacity })}>{preset.label}</SmallBtn>
                  ))}
                  <SmallBtn onClick={() => updateLayer(sel.id, { bgColor: null, bgOpacity: 0.8 })}>Kein BG</SmallBtn>
                </div>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <DangerBtn onClick={() => removeLayer(sel.id)}>✕ Layer entfernen</DangerBtn>
              </div>
            </Panel>
          )}

          {/* Playback + Export */}
          <Panel>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {!playing ? (
                <SecBtn onClick={startPreview} style={{ flex: 1 }}>▶ Preview</SecBtn>
              ) : (
                <SecBtn onClick={stopPreview} style={{ flex: 1 }}>⏹ Stopp</SecBtn>
              )}
            </div>
            <GenButton onClick={generateVideo} disabled={generating || !videoSrc}>
              {generating ? `⏳ Generiere... ${Math.round(progress * 100)}%` : '⬇ Video exportieren (MP4)'}
            </GenButton>
            <ProgressBar><div style={{ width: `${progress * 100}%` }} /></ProgressBar>
            {status && <StatusMsg $error={status.includes('Bitte')}>{status}</StatusMsg>}
            <Hint>Exportiert als 1080×1920 MP4. Direkt als Instagram Reel hochladbar.</Hint>
          </Panel>

          {/* Caption + Hashtags */}
          <Panel>
            <SectionLabel>Caption + Hashtags</SectionLabel>
            <CaptionGenBtn onClick={generateCaption} disabled={captionLoading}>
              {captionLoading ? '⏳ Generiere Caption...' : '🤖 KI-Caption generieren'}
            </CaptionGenBtn>
            <Hint style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>Generiert eine Instagram-Caption mit Hook, Beschreibung, CTA und trendenden Hashtags basierend auf deinen Reel-Texten.</Hint>

            {caption && (
              <>
                <CaptionArea value={caption} onChange={e => setCaption(e.target.value)} rows={10} />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <CopyBtn onClick={copyCaption}>
                    {captionCopied ? '✓ Kopiert!' : '📋 Caption kopieren'}
                  </CopyBtn>
                  <IgBtn onClick={prepareForInstagram}>
                    📱 Für Instagram vorbereiten
                  </IgBtn>
                </div>
                {igReady && (
                  <IgReadyBox>
                    <IgStep>✅ Caption in Zwischenablage kopiert</IgStep>
                    <IgStep>📱 Öffne Instagram → Neues Reel → Video auswählen → Caption einfügen (Strg+V)</IgStep>
                    <IgLink href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
                      Instagram öffnen →
                    </IgLink>
                  </IgReadyBox>
                )}
              </>
            )}
          </Panel>
        </div>

        {/* RIGHT: Preview */}
        <PreviewSticky>
          <PreviewLabel>{playing ? `▶ ${currentTime.toFixed(1)}s / ${videoDuration.toFixed(1)}s` : 'Preview (9:16)'}</PreviewLabel>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ width: 270, height: 480, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', background: '#000' }}
          />
          <ProgressBar><div style={{ width: `${(currentTime / videoDuration) * 100}%` }} /></ProgressBar>
        </PreviewSticky>
      </Grid>
    </Layout>
  );
}
