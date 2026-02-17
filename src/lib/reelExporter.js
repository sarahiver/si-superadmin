/* global VideoEncoder VideoFrame */
// src/lib/reelExporter.js
// MP4 Export Pipeline for Reels — VideoEncoder + mp4-muxer, WebM fallback

import { renderFrame, getTotalDuration, W, H } from './reelRenderer';

// Load mp4-muxer from CDN
async function loadMuxer() {
  if (window.Mp4Muxer) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Export reel as MP4 (or WebM fallback)
// reelData = { themeId, slides }
// onProgress = (0..1) => void
// onStatus = (string) => void
// Returns: void (triggers download)
export async function exportReelMP4(reelData, { onProgress, onStatus } = {}) {
  const fps = 30;
  const totalDuration = getTotalDuration(reelData.slides);
  const totalFrames = Math.ceil(totalDuration * fps);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  onStatus?.('Encoder laden...');
  await loadMuxer();

  // Try VideoEncoder + mp4-muxer
  if (typeof VideoEncoder !== 'undefined' && window.Mp4Muxer) {
    try {
      onStatus?.('MP4 wird generiert...');

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

      for (let frame = 0; frame < totalFrames; frame++) {
        const t = (frame / totalFrames) * totalDuration;

        // Render frame
        renderFrame(ctx, reelData, t);

        const vf = new VideoFrame(canvas, {
          timestamp: frame * (1_000_000 / fps),
          duration: 1_000_000 / fps,
        });
        const isKeyFrame = frame % (fps * 2) === 0;
        encoder.encode(vf, { keyFrame: isKeyFrame });
        vf.close();

        onProgress?.(frame / totalFrames);

        // Yield to UI thread every 5 frames
        if (frame % 5 === 0) {
          await new Promise(r => setTimeout(r, 0));
        }
      }

      await encoder.flush();
      encoder.close();
      muxer.finalize();

      const { buffer } = muxer.target;
      const blob = new Blob([buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `si-reel-${reelData.themeId}.mp4`;
      a.click();
      URL.revokeObjectURL(url);

      onProgress?.(1);
      onStatus?.('MP4 heruntergeladen!');
      return;
    } catch (e) {
      console.warn('MP4 encoder failed, using WebM fallback:', e);
    }
  }

  // Fallback: MediaRecorder → WebM
  onStatus?.('Fallback: WebM wird generiert...');
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9' : 'video/webm';
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks = [];

  return new Promise((resolve) => {
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `si-reel-${reelData.themeId}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      onProgress?.(1);
      onStatus?.('WebM heruntergeladen (auf cloudconvert.com → MP4 konvertieren)');
      resolve();
    };
    recorder.start();

    let frame = 0;
    const renderNext = () => {
      if (frame >= totalFrames) { recorder.stop(); return; }
      const t = (frame / totalFrames) * totalDuration;
      renderFrame(ctx, reelData, t);
      onProgress?.(frame / totalFrames);
      frame++;
      setTimeout(renderNext, 1000 / fps);
    };
    renderNext();
  });
}
