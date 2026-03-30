'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize, Eye, Layers, Columns,
} from 'lucide-react';
import { useVideoStore } from '@/hooks/useVideoStore';
import { useUIStore } from '@/hooks/useUIStore';
import { formatTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import { CanvasPreview } from './CanvasPreview';

type ViewMode = 'original' | 'edited' | 'sidebyside';

export function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Segundo ref para side-by-side (mesmo src, sincronizado)
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const { video } = useVideoStore();
  const { currentTime, setCurrentTime, isPlaying, setIsPlaying } = useUIStore();
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('edited');

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleTimeUpdate = () => setCurrentTime(v.currentTime);
    const handleLoadedMetadata = () => setDuration(v.duration);
    const handleEnded = () => setIsPlaying(false);

    v.addEventListener('timeupdate', handleTimeUpdate);
    v.addEventListener('loadedmetadata', handleLoadedMetadata);
    v.addEventListener('ended', handleEnded);

    return () => {
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.removeEventListener('loadedmetadata', handleLoadedMetadata);
      v.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setIsPlaying]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  const seek = useCallback((time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(time, duration));
    setCurrentTime(v.currentTime);
  }, [duration, setCurrentTime]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seek(pct * duration);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* View mode toggle */}
      <div className="flex items-center justify-center gap-1 p-2">
        <button
          onClick={() => setViewMode('original')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium transition-all',
            viewMode === 'original'
              ? 'bg-brand-blue text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
          )}
        >
          <Eye className="w-3.5 h-3.5" /> Original
        </button>
        <button
          onClick={() => setViewMode('edited')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium transition-all',
            viewMode === 'edited'
              ? 'bg-brand-blue text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
          )}
        >
          <Layers className="w-3.5 h-3.5" /> Editado
        </button>
        <button
          onClick={() => setViewMode('sidebyside')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium transition-all',
            viewMode === 'sidebyside'
              ? 'bg-brand-blue text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
          )}
        >
          <Columns className="w-3.5 h-3.5" /> Comparar
        </button>
      </div>

      {/* Video area */}
      <div className={cn(
        'relative flex-1 bg-black rounded-btn overflow-hidden mx-2',
        viewMode === 'sidebyside' && 'flex'
      )}>
        {/* Original video (always present, hidden when not needed visually) */}
        <div className={cn(
          'relative',
          viewMode === 'original' && 'w-full h-full',
          viewMode === 'edited' && 'w-full h-full',
          viewMode === 'sidebyside' && 'w-1/2 h-full border-r border-border/50'
        )}>
          <video
            ref={videoRef}
            src={video?.url || undefined}
            className={cn(
              'w-full h-full object-contain',
              viewMode === 'edited' && 'invisible absolute inset-0'
            )}
            playsInline
            preload="metadata"
          />

          {/* Canvas overlay para modo "Editado" */}
          {viewMode === 'edited' && (
            <div className="absolute inset-0">
              <CanvasPreview videoRef={videoRef} />
            </div>
          )}

          {/* Label para side-by-side */}
          {viewMode === 'sidebyside' && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium bg-black/50 text-white/80 backdrop-blur-sm">
              Original
            </div>
          )}
        </div>

        {/* Side-by-side: painel editado */}
        {viewMode === 'sidebyside' && (
          <div className="relative w-1/2 h-full">
            <CanvasPreview videoRef={videoRef} />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium bg-brand-blue/50 text-white/80 backdrop-blur-sm">
              Editado
            </div>
          </div>
        )}

        {/* Click to play overlay */}
        {viewMode !== 'sidebyside' && (
          <div className="absolute inset-0 cursor-pointer" onClick={togglePlay} />
        )}

        {!isPlaying && viewMode !== 'sidebyside' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="p-4 rounded-full bg-black/50 backdrop-blur-sm">
              <Play className="w-10 h-10 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="mx-2 mt-2 h-1.5 bg-bg-tertiary rounded-full cursor-pointer group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-brand-blue rounded-full relative transition-all group-hover:h-2.5 group-hover:-mt-0.5"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => seek(currentTime - 5)}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
            title="Voltar 5s (←)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="p-2 bg-brand-blue rounded-full text-white hover:bg-brand-glow transition-colors"
            title="Play/Pause (Espaço)"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => seek(currentTime + 5)}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
            title="Avançar 5s (→)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <span className="text-xs text-text-secondary font-mono ml-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="p-1.5 text-text-secondary hover:text-text-primary transition-colors">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-bg-tertiary rounded-full accent-brand-blue"
          />
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
            title="Tela cheia"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
