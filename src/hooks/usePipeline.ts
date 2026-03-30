'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import * as api from '@/lib/api';
import { useEditorStore } from './useEditorStore';
import { usePipelineStore } from './usePipelineStore';
import type { PipelineStep, Transcription, ContentAnalysis, VideoSegment, Illustration } from '@/types';
import type { SSEEvent } from '@/types/api';

const stepOrder: PipelineStep[] = ['transcription', 'analysis', 'illustrations', 'rendering'];

export function usePipeline(videoId: string | null, videoUrl: string | null) {
  const [completedSteps, setCompletedSteps] = useState<Set<PipelineStep>>(new Set());
  const [currentStep, setCurrentStep] = useState<PipelineStep>('transcription');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Iniciando pipeline...');
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const { setTranscription, setAnalysis, setSegments, setIllustrations } = useEditorStore();
  const { setPipelineStep, setPipelineComplete, setPipelineError } = usePipelineStore();

  const start = useCallback(async () => {
    if (!videoId || !videoUrl || hasStarted.current) return;
    hasStarted.current = true;
    setError(null);

    try {
      const { jobId } = await api.startPipeline({ videoId, videoUrl });

      let previousStep: PipelineStep | null = null;

      unsubRef.current = api.subscribePipeline(jobId, (event: SSEEvent) => {
        if (previousStep && event.step !== previousStep) {
          setCompletedSteps((prev) => new Set([...prev, previousStep!]));
        }
        previousStep = event.step;

        setCurrentStep(event.step);
        setProgress(event.progress);
        setMessage(event.message);
        setPipelineStep(event.step, event.progress, event.message);

        if (event.error) {
          setError(event.error);
          setPipelineError(event.error);
          return;
        }

        if (event.results) {
          const r = event.results as Record<string, unknown>;
          if (r.transcription) setTranscription(r.transcription as Transcription);
          if (r.analysis) setAnalysis(r.analysis as ContentAnalysis);
          if (r.segments) setSegments(r.segments as VideoSegment[]);
          if (r.illustrations) setIllustrations(r.illustrations as Illustration[]);
        }

        if (event.done && !event.error) {
          setCompletedSteps(new Set(stepOrder));
          setPipelineComplete();
        }
      }, () => {
        if (!completedSteps.has('rendering')) {
          setError('Conexão perdida. Tente novamente.');
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      hasStarted.current = false;
    }
  }, [videoId, videoUrl, completedSteps, setTranscription, setAnalysis, setSegments, setIllustrations, setPipelineStep, setPipelineComplete, setPipelineError]);

  const retry = useCallback(() => {
    hasStarted.current = false;
    unsubRef.current?.();
    setError(null);
    setCompletedSteps(new Set());
    setProgress(0);
    setMessage('Reiniciando...');
    start();
  }, [start]);

  useEffect(() => {
    return () => { unsubRef.current?.(); };
  }, []);

  return {
    completedSteps,
    currentStep,
    progress,
    message,
    error,
    start,
    retry,
    stepOrder,
  };
}
