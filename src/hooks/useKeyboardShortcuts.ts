'use client';

import { useEffect, useCallback } from 'react';
import { useUIStore } from '@/hooks/useUIStore';
import { useVideoStore } from '@/hooks/useVideoStore';
import { useExportStore } from '@/hooks/useExportStore';
import { useTemporalStore } from '@/hooks/useEditorStore';

export function useKeyboardShortcuts() {
  const { isPlaying, setIsPlaying, currentTime, setCurrentTime } = useUIStore();
  const { video } = useVideoStore();
  const { setShowExportModal } = useExportStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const isCtrl = e.ctrlKey || e.metaKey;

      switch (e.key) {
        case ' ': // Espaço = play/pause
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;

        case 'ArrowLeft': // ← = voltar 5s
          e.preventDefault();
          setCurrentTime(Math.max(0, currentTime - 5));
          break;

        case 'ArrowRight': // → = avançar 5s
          e.preventDefault();
          setCurrentTime(Math.min(video?.duration || 0, currentTime + 5));
          break;

        case 'j':
        case 'J':
          setCurrentTime(Math.max(0, currentTime - 10));
          break;

        case 'l':
        case 'L':
          setCurrentTime(Math.min(video?.duration || 0, currentTime + 10));
          break;

        case 'k':
        case 'K':
          setIsPlaying(!isPlaying);
          break;

        case 'z':
        case 'Z':
          if (isCtrl) {
            e.preventDefault();
            if (e.shiftKey) {
              // Ctrl+Shift+Z = Redo
              useTemporalStore().getState().redo();
            } else {
              // Ctrl+Z = Undo
              useTemporalStore().getState().undo();
            }
          }
          break;

        case 'y':
        case 'Y':
          if (isCtrl) {
            e.preventDefault();
            useTemporalStore().getState().redo();
          }
          break;

        case 'e':
        case 'E':
          if (isCtrl) {
            e.preventDefault();
            setShowExportModal(true);
          }
          break;

        case 'Home':
          setCurrentTime(0);
          break;

        case 'End':
          setCurrentTime(video?.duration || 0);
          break;
      }
    },
    [isPlaying, currentTime, setIsPlaying, setCurrentTime, setShowExportModal, video]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
