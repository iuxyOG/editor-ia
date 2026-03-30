'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useVideoStore } from '@/hooks/useVideoStore';
import { useUIStore } from '@/hooks/useUIStore';

/**
 * Renders an audio waveform using Web Audio API + Canvas 2D.
 * Lightweight — no external dependencies.
 */
export function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformDataRef = useRef<Float32Array | null>(null);
  const { video } = useVideoStore();
  const { currentTime, setCurrentTime } = useUIStore();
  const [isLoaded, setIsLoaded] = useState(false);

  const duration = video?.duration || 0;

  // Extract waveform data from video URL using Web Audio API
  useEffect(() => {
    if (!video?.url) return;

    const extractWaveform = async () => {
      try {
        const audioCtx = new AudioContext();
        const response = await fetch(video.url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        // Downsample to ~2000 points for the waveform
        const rawData = audioBuffer.getChannelData(0);
        const samples = 2000;
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
          const start = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[start + j] || 0);
          }
          filteredData[i] = sum / blockSize;
        }

        // Normalize
        const max = Math.max(...filteredData) || 1;
        for (let i = 0; i < filteredData.length; i++) {
          filteredData[i] /= max;
        }

        waveformDataRef.current = filteredData;
        setIsLoaded(true);
        audioCtx.close();
      } catch (err) {
        console.warn('Could not extract waveform:', err);
      }
    };

    extractWaveform();
  }, [video?.url]);

  // Render waveform
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const data = waveformDataRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const barWidth = w / data.length;
    const playedPct = duration > 0 ? currentTime / duration : 0;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < data.length; i++) {
      const x = i * barWidth;
      const barHeight = Math.max(1, data[i] * h * 0.8);
      const y = (h - barHeight) / 2;

      const pct = i / data.length;
      if (pct <= playedPct) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'; // brand-blue/50
      } else {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'; // brand-blue/15
      }

      ctx.fillRect(x, y, Math.max(1, barWidth - 0.5), barHeight);
    }
  }, [currentTime, duration]);

  useEffect(() => {
    if (isLoaded) render();
  }, [isLoaded, render, currentTime]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => render());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [render]);

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;
    const rect = canvas.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setCurrentTime(Math.max(0, Math.min(duration, pct * duration)));
  };

  if (!video?.url) return null;

  return (
    <div className="border-t border-border/50 bg-bg-tertiary/50">
      <canvas
        ref={canvasRef}
        className="w-full h-12 cursor-pointer"
        onClick={handleClick}
      />
    </div>
  );
}
