'use client';

import { useState, useCallback } from 'react';
import * as api from '@/lib/api';
import { useVideoStore } from './useVideoStore';
import { usePipelineStore } from './usePipelineStore';

interface UploadState {
  progress: number;
  speed: number;
  eta: number;
  loaded: number;
  total: number;
  isUploading: boolean;
  error: string | null;
}

const initialState: UploadState = {
  progress: 0,
  speed: 0,
  eta: 0,
  loaded: 0,
  total: 0,
  isUploading: false,
  error: null,
};

export function useUpload() {
  const [state, setState] = useState<UploadState>(initialState);
  const { setVideo } = useVideoStore();
  const { setPipelineStep } = usePipelineStore();

  const upload = useCallback(async (
    file: File,
    meta: { duration: number; width: number; height: number }
  ): Promise<string | null> => {
    setState({ ...initialState, isUploading: true });

    try {
      const uploadRes = await api.uploadVideo(file, (pct, stats) => {
        setState((s) => ({ ...s, progress: pct, ...stats }));
      });

      const project = await api.createProject({
        name: file.name.replace(/\.[^.]+$/, ''),
        videoUrl: uploadRes.url,
        videoName: file.name,
        videoDuration: uploadRes.duration || meta.duration,
        videoWidth: uploadRes.width || meta.width,
        videoHeight: uploadRes.height || meta.height,
        thumbnailUrl: uploadRes.thumbnailUrl,
      });

      setVideo({
        id: project.id,
        name: file.name,
        size: file.size,
        duration: uploadRes.duration || meta.duration,
        width: uploadRes.width || meta.width,
        height: uploadRes.height || meta.height,
        url: uploadRes.url,
        thumbnailUrl: uploadRes.thumbnailUrl,
      });

      setPipelineStep('transcription', 0, 'Iniciando transcrição...');
      return project.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha no upload';
      setState((s) => ({ ...s, error: msg, isUploading: false }));
      return null;
    }
  }, [setVideo, setPipelineStep]);

  const reset = useCallback(() => setState(initialState), []);

  return { ...state, upload, reset };
}
