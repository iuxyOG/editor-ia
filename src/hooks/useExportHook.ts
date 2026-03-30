'use client';

import { useState, useCallback, useRef } from 'react';
import * as api from '@/lib/api';
import type { RenderInput } from '@/lib/schemas';
import type { SSEEvent } from '@/types/api';

interface ExportState {
  isRendering: boolean;
  progress: number;
  message: string;
  downloadUrl: string | null;
  error: string | null;
}

const initialState: ExportState = {
  isRendering: false,
  progress: 0,
  message: '',
  downloadUrl: null,
  error: null,
};

export function useExportHook() {
  const [state, setState] = useState<ExportState>(initialState);
  const unsubRef = useRef<(() => void) | null>(null);

  const startExport = useCallback(async (config: RenderInput) => {
    setState({ ...initialState, isRendering: true, message: 'Iniciando renderização...' });

    try {
      const { jobId } = await api.startRender(config);

      unsubRef.current = api.subscribePipeline(jobId, (event: SSEEvent) => {
        setState((s) => ({
          ...s,
          progress: event.progress,
          message: event.message,
        }));

        if (event.error) {
          setState((s) => ({ ...s, error: event.error!, isRendering: false }));
          return;
        }

        if (event.done) {
          const outputUrl = (event.results?.outputUrl as string) || config.videoUrl;
          setState((s) => ({ ...s, downloadUrl: outputUrl, isRendering: false }));
        }
      }, () => {
        setState((s) => ({
          ...s,
          downloadUrl: s.downloadUrl || config.videoUrl,
          isRendering: false,
        }));
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        isRendering: false,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    unsubRef.current?.();
    setState(initialState);
  }, []);

  return { ...state, startExport, reset };
}
