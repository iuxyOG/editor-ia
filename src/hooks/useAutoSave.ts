'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorStore } from '@/hooks/useEditorStore';
import { usePipelineStore } from '@/hooks/usePipelineStore';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(projectId: string | null) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  const {
    segments, illustrations, subtitleStyle, subtitlesEnabled,
    illustrationStyle, customPrompt, promptHistory, transcription,
    analysis,
  } = useEditorStore();
  const { pipeline } = usePipelineStore();

  const save = useCallback(async () => {
    if (!projectId) return;

    // Build payload of saveable fields
    const payload: Record<string, unknown> = {
      segments,
      illustrations,
      subtitleStyle,
      subtitlesEnabled,
      illustrationStyle,
      customPrompt,
      promptHistory,
    };

    if (transcription) payload.transcription = transcription;
    if (analysis) payload.analysis = analysis;
    if (pipeline.isComplete) payload.status = 'ready';

    // Skip if nothing changed
    const hash = JSON.stringify(payload);
    if (hash === lastSavedRef.current) return;

    setStatus('saving');
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        lastSavedRef.current = hash;
        setStatus('saved');
        // Reset to idle after 2s
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }, [
    projectId, segments, illustrations, subtitleStyle, subtitlesEnabled,
    illustrationStyle, customPrompt, promptHistory, transcription, analysis, pipeline,
  ]);

  // Debounced auto-save: trigger 2s after any change
  useEffect(() => {
    if (!projectId) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [save, projectId]);

  return status;
}
