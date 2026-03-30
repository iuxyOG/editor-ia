'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useUIStore } from '@/hooks/useUIStore';
import { useEditorStore } from '@/hooks/useEditorStore';
import type { Illustration, TranscriptionWord, SubtitleStyle, SubtitlePreset } from '@/types';

const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!);
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Pré-carregar ilustrações
function preloadIllustrations(illustrations: Illustration[]) {
  illustrations.forEach((ill) => {
    if (ill.imageUrl && !imageCache.has(ill.imageUrl)) {
      loadImage(ill.imageUrl).catch(() => {});
    }
  });
}

interface CanvasPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function CanvasPreview({ videoRef }: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const { currentTime, isPlaying } = useUIStore();
  const { illustrations, transcription, subtitlesEnabled, subtitleStyle } = useEditorStore();

  useEffect(() => {
    preloadIllustrations(illustrations);
  }, [illustrations]);

  // Encontrar palavras ativas para o tempo atual
  const getActiveSubtitleBlock = useCallback((time: number): TranscriptionWord[] | null => {
    if (!transcription?.words || !subtitlesEnabled) return null;
    const blockSize = subtitleStyle.preset === 'hormozi' ? 3 : 6;
    const words = transcription.words;
    for (let i = 0; i < words.length; i += blockSize) {
      const block = words.slice(i, i + blockSize);
      const start = block[0].start;
      const end = block[block.length - 1].end;
      if (time >= start && time <= end) return block;
    }
    return null;
  }, [transcription, subtitlesEnabled, subtitleStyle.preset]);

  // Encontrar ilustrações ativas
  const getActiveIllustrations = useCallback((time: number): Illustration[] => {
    return illustrations.filter((ill) => time >= ill.start && time <= ill.end);
  }, [illustrations]);

  // Renderizar frame
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Layer 1: Video frame
    if (video.readyState >= 2) {
      // Calcular dimensões para manter aspect ratio
      const videoRatio = video.videoWidth / video.videoHeight;
      const canvasRatio = w / h;
      let drawW = w, drawH = h, drawX = 0, drawY = 0;

      if (videoRatio > canvasRatio) {
        drawH = w / videoRatio;
        drawY = (h - drawH) / 2;
      } else {
        drawW = h * videoRatio;
        drawX = (w - drawW) / 2;
      }

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(video, drawX, drawY, drawW, drawH);
    }

    const time = video.currentTime;

    // Layer 2: Ilustrações
    const activeIlls = getActiveIllustrations(time);
    for (const ill of activeIlls) {
      const img = imageCache.get(ill.imageUrl);
      if (!img) continue;

      // Fade in nos primeiros 0.5s
      const fadeIn = Math.min(1, (time - ill.start) / 0.5);
      // Fade out nos últimos 0.3s
      const fadeOut = Math.min(1, (ill.end - time) / 0.3);
      ctx.globalAlpha = Math.min(fadeIn, fadeOut);

      const imgSize = ill.position === 'full' ? { w, h: h } : { w: w * 0.25, h: w * 0.2 };
      const pos = getIllustrationPosition(ill.position, w, h, imgSize.w, imgSize.h);

      if (ill.position !== 'full') {
        // Sombra sutil
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
      }

      ctx.drawImage(img, pos.x, pos.y, imgSize.w, imgSize.h);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Layer 3: Legendas
    const activeWords = getActiveSubtitleBlock(time);
    if (activeWords) {
      renderSubtitles(ctx, activeWords, time, subtitleStyle, w, h);
    }
  }, [videoRef, getActiveIllustrations, getActiveSubtitleBlock, subtitleStyle]);

  // Timestamp-based animation loop — synced directly to video element
  useEffect(() => {
    const video = videoRef.current;

    const animate = () => {
      renderFrame();
      animFrameRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
    } else {
      renderFrame();
    }

    // Listen to seek events on the video element for immediate re-render
    const handleSeeked = () => {
      if (!isPlaying) renderFrame();
    };

    video?.addEventListener('seeked', handleSeeked);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      video?.removeEventListener('seeked', handleSeeked);
    };
  }, [isPlaying, renderFrame, videoRef]);

  // Re-render when store currentTime changes (from timeline click, keyboard shortcuts)
  useEffect(() => {
    if (!isPlaying) {
      // Sync the video element to the store time, then re-render
      const v = videoRef.current;
      if (v && Math.abs(v.currentTime - currentTime) > 0.1) {
        v.currentTime = currentTime;
      }
      renderFrame();
    }
  }, [currentTime, isPlaying, renderFrame, videoRef]);

  // Ajustar tamanho do canvas ao container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        renderFrame();
      }
    });

    resizeObserver.observe(canvas.parentElement!);
    return () => resizeObserver.disconnect();
  }, [renderFrame]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  );
}

function getIllustrationPosition(
  position: string, canvasW: number, canvasH: number, imgW: number, imgH: number
): { x: number; y: number } {
  const margin = canvasW * 0.03;
  switch (position) {
    case 'top-left': return { x: margin, y: margin };
    case 'top-right': return { x: canvasW - imgW - margin, y: margin };
    case 'bottom-left': return { x: margin, y: canvasH - imgH - margin * 3 };
    case 'bottom-right': return { x: canvasW - imgW - margin, y: canvasH - imgH - margin * 3 };
    case 'center': return { x: (canvasW - imgW) / 2, y: (canvasH - imgH) / 2 };
    case 'full': return { x: 0, y: 0 };
    default: return { x: canvasW - imgW - margin, y: margin };
  }
}

function renderSubtitles(
  ctx: CanvasRenderingContext2D,
  words: TranscriptionWord[],
  currentTime: number,
  style: SubtitleStyle,
  canvasW: number,
  canvasH: number,
) {
  const fontSize = style.fontSize * (canvasW / 1920); // Escalar fonte
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Posição Y
  let y: number;
  switch (style.position) {
    case 'top': y = canvasH * 0.12; break;
    case 'center': y = canvasH * 0.5; break;
    case 'bottom': default: y = canvasH * 0.85; break;
  }

  const text = words.map((w) => w.text).join(' ');

  // Background
  if (style.background !== 'none') {
    ctx.font = `800 ${fontSize}px ${style.fontFamily}, sans-serif`;
    const textWidth = ctx.measureText(text).width;
    const padX = fontSize * 0.6;
    const padY = fontSize * 0.3;

    if (style.background === 'solid') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    }

    const bgX = (canvasW - textWidth) / 2 - padX;
    const bgY = y - fontSize / 2 - padY;
    const bgW = textWidth + padX * 2;
    const bgH = fontSize + padY * 2;

    ctx.beginPath();
    ctx.roundRect(bgX, bgY, bgW, bgH, 8);
    ctx.fill();
  }

  // Renderizar palavras com estilo
  const renderPreset = SUBTITLE_RENDERERS[style.preset] || SUBTITLE_RENDERERS.clean;
  renderPreset(ctx, words, currentTime, style, fontSize, canvasW, y);
}

type SubtitleRenderer = (
  ctx: CanvasRenderingContext2D,
  words: TranscriptionWord[],
  time: number,
  style: SubtitleStyle,
  fontSize: number,
  canvasW: number,
  y: number
) => void;

const SUBTITLE_RENDERERS: Record<SubtitlePreset, SubtitleRenderer> = {
  hormozi: (ctx, words, time, style, fontSize, canvasW, y) => {
    ctx.font = `800 ${fontSize}px ${style.fontFamily}, sans-serif`;
    const totalWidth = words.reduce((sum, w) => sum + ctx.measureText(w.text + ' ').width, 0);
    let x = (canvasW - totalWidth) / 2;

    for (const word of words) {
      const isActive = time >= word.start && time <= word.end;
      const wordWidth = ctx.measureText(word.text + ' ').width;

      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;

      if (isActive) {
        ctx.fillStyle = style.highlightColor;
        const scale = 1.15;
        ctx.save();
        ctx.translate(x + wordWidth / 2, y);
        ctx.scale(scale, scale);
        ctx.fillText(word.text, 0, 0);
        ctx.restore();
      } else {
        ctx.fillStyle = style.textColor;
        ctx.fillText(word.text, x + wordWidth / 2, y);
      }

      ctx.shadowBlur = 0;
      x += wordWidth;
    }
  },

  clean: (ctx, words, _time, style, fontSize, canvasW, y) => {
    ctx.font = `600 ${fontSize}px ${style.fontFamily}, sans-serif`;
    ctx.fillStyle = style.textColor;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(words.map((w) => w.text).join(' '), canvasW / 2, y);
    ctx.shadowBlur = 0;
  },

  karaoke: (ctx, words, time, style, fontSize, canvasW, y) => {
    ctx.font = `700 ${fontSize}px ${style.fontFamily}, sans-serif`;
    const text = words.map((w) => w.text).join(' ');
    const totalWidth = ctx.measureText(text).width;
    let x = (canvasW - totalWidth) / 2;

    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;

    for (const word of words) {
      const wordWidth = ctx.measureText(word.text + ' ').width;
      const progress = time >= word.end ? 1 : time <= word.start ? 0 :
        (time - word.start) / (word.end - word.start);

      // Texto base (dim)
      ctx.fillStyle = style.textColor;
      ctx.globalAlpha = 0.4;
      ctx.fillText(word.text, x + wordWidth / 2, y);

      // Highlight progressivo
      if (progress > 0) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = style.highlightColor;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - wordWidth / 2, y - fontSize, wordWidth * progress, fontSize * 2);
        ctx.clip();
        ctx.fillText(word.text, x + wordWidth / 2, y);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      x += wordWidth;
    }
    ctx.shadowBlur = 0;
  },

  typewriter: (ctx, words, time, style, fontSize, canvasW, y) => {
    ctx.font = `600 ${fontSize}px ${style.fontFamily}, monospace`;
    ctx.fillStyle = style.textColor;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;

    let visibleText = '';
    for (const word of words) {
      if (time >= word.start) {
        // Efeito de digitação: revelar caracteres progressivamente
        const wordProgress = Math.min(1, (time - word.start) / (word.end - word.start));
        const visibleChars = Math.ceil(word.text.length * wordProgress);
        visibleText += word.text.slice(0, visibleChars) + ' ';
      }
    }

    ctx.fillText(visibleText.trim(), canvasW / 2, y);

    // Cursor piscante
    if (visibleText.length > 0) {
      const cursorVisible = Math.floor(time * 4) % 2 === 0;
      if (cursorVisible) {
        const textWidth = ctx.measureText(visibleText.trim()).width;
        ctx.fillStyle = style.highlightColor;
        ctx.fillRect(canvasW / 2 + textWidth / 2 + 4, y - fontSize * 0.4, 3, fontSize * 0.8);
      }
    }
    ctx.shadowBlur = 0;
  },

  pop: (ctx, words, time, style, fontSize, canvasW, y) => {
    ctx.font = `800 ${fontSize}px ${style.fontFamily}, sans-serif`;
    const totalWidth = words.reduce((sum, w) => sum + ctx.measureText(w.text + ' ').width, 0);
    let x = (canvasW - totalWidth) / 2;

    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;

    for (const word of words) {
      const isActive = time >= word.start && time <= word.end;
      const wordWidth = ctx.measureText(word.text + ' ').width;

      if (isActive) {
        // Bounce animation
        const progress = (time - word.start) / (word.end - word.start);
        const bounce = progress < 0.3
          ? 0.5 + (progress / 0.3) * 0.8 // Scale up
          : progress < 0.5
          ? 1.3 - ((progress - 0.3) / 0.2) * 0.3 // Settle
          : 1.0;

        ctx.fillStyle = style.highlightColor;
        ctx.save();
        ctx.translate(x + wordWidth / 2, y);
        ctx.scale(bounce, bounce);
        ctx.fillText(word.text, 0, 0);
        ctx.restore();
      } else if (time >= word.start) {
        ctx.fillStyle = style.textColor;
        ctx.fillText(word.text, x + wordWidth / 2, y);
      } else {
        ctx.globalAlpha = 0;
        ctx.fillText(word.text, x + wordWidth / 2, y);
        ctx.globalAlpha = 1;
      }

      x += wordWidth;
    }
    ctx.shadowBlur = 0;
  },
};
